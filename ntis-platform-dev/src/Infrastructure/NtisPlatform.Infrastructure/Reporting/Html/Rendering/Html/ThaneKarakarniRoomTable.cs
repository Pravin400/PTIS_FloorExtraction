using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using NtisPlatform.Application.Services.HtmlReport;

namespace Ntis.Reporting.Rendering.Html;

internal static class ThaneKarakarniRoomTable
{
    private const string RowsBand = "thane_floor_rows";
    private const string TotalsBand = "thane_floor_totals";

    public static IEnumerable<(JsonElement Template, JsonElement Data)> Pages(
        JsonElement template, JsonElement data, double pageHeight)
    {
        if (!ThaneKarakarniPresentationRules.AppliesTo(template)
            || data.ValueKind != JsonValueKind.Object
            || !template.TryGetProperty("bands", out var bands)
            || bands.ValueKind != JsonValueKind.Array
            || !bands.EnumerateArray().Any(band => Text(band, "id") == RowsBand))
        {
            yield return (template, data);
            yield break;
        }

        data = ThaneKarakarniPresentationRules.Apply(template, data);
        if (!data.TryGetProperty("propertyDetails", out var details) || details.ValueKind != JsonValueKind.Array)
        {
            yield return (template, data);
            yield break;
        }

        var rooms = RoomRows(details);
        var record = JsonNode.Parse(data.GetRawText())!.AsObject();
        foreach (var floor in record["propertyDetails"]!.AsArray())
            (floor as JsonObject)?.Remove("rooms");
        record["roomTotalCarpetAreaSqMeter"] = rooms.Sum(row => Number(row!, "carpetAreaSqMeter") ?? 0m);
        record["roomTotalBuiltupAreaSqMeter"] = rooms.Sum(row => Number(row!, "builtupAreaSqMeter") ?? 0m);

        // Adapt only the two existing Thane bands; the stored design and assessment bindings stay intact.
        var design = JsonNode.Parse(template.GetRawText())!.AsObject();
        foreach (var band in design["bands"]!.AsArray())
        {
            if (band!["id"]?.GetValue<string>() == RowsBand) band["dataPath"] = "roomDetails";
            if (band["id"]?.GetValue<string>() is RowsBand or TotalsBand
                && band["elements"] is JsonArray areaElements)
            {
                foreach (var element in areaElements)
                    if (new[] { "path", "binding", "fieldName" }.Any(binding =>
                        element?[binding]?.GetValue<string>() is "carpetAreaSqMeter" or "builtupAreaSqMeter"
                            or "totalCarpetAreaSqMeter" or "totalBuiltupAreaSqMeter"))
                        element!["format"] = "0.##";
            }
            if (band["id"]?.GetValue<string>() != TotalsBand || band["elements"] is not JsonArray elements) continue;
            foreach (var element in elements)
                foreach (var binding in new[] { "path", "binding", "fieldName" })
                {
                    var asPath = element?[binding]?.GetValue<string>();
                    if (asPath is "totalCarpetAreaSqMeter" or "totalBuiltupAreaSqMeter")
                        element![binding] = "room" + char.ToUpperInvariant(asPath[0]) + asPath[1..];
                }
        }

        var rowHeight = bands.EnumerateArray().Where(band => Text(band, "id") == RowsBand)
            .Select(band => (double)(Number(band, "heightMm") ?? 6m)).First();
        var fixedHeight = bands.EnumerateArray().Where(band => Text(band, "id") != RowsBand)
            .Sum(band => (double)(Number(band, "heightMm") ?? 10m)
                * (Text(band, "dataPath") == "propertyDetails" ? details.GetArrayLength() : 1));
        var perPage = Math.Max(1, (int)Math.Floor((pageHeight - 10 - fixedHeight) / Math.Max(1, rowHeight)));
        var pageCount = Math.Max(1, (rooms.Count + perPage - 1) / perPage);
        for (var page = 0; page < pageCount; page++)
        {
            var pageRecord = record.DeepClone().AsObject();
            pageRecord["roomDetails"] = new JsonArray(rooms.Skip(page * perPage).Take(perPage)
                .Select(room => room!.DeepClone()).ToArray());
            var pageDesign = design.DeepClone().AsObject();
            if (page < pageCount - 1)
            {
                var pageBands = pageDesign["bands"]!.AsArray();
                var totals = pageBands.FirstOrDefault(band => band!["id"]?.GetValue<string>() == TotalsBand);
                if (totals is not null) pageBands.Remove(totals);
            }
            yield return (JsonSerializer.SerializeToElement(pageDesign), JsonSerializer.SerializeToElement(pageRecord));
        }
    }

    private static JsonArray RoomRows(JsonElement details)
    {
        var rows = new JsonArray();
        var seenRooms = new HashSet<decimal>();
        foreach (var floor in details.EnumerateArray())
        {
            if (!string.Equals(Text(floor, "typeOfUseCode")?.Trim(), "C", StringComparison.OrdinalIgnoreCase)
                || !floor.TryGetProperty("rooms", out var rooms) || rooms.ValueKind != JsonValueKind.Array
                || rooms.GetArrayLength() == 0)
            {
                rows.Add(JsonNode.Parse(floor.GetRawText()));
                continue;
            }
            var floorRow = JsonNode.Parse(floor.GetRawText())!.AsObject();
            floorRow.Remove("rooms");
            foreach (var room in rooms.EnumerateArray())
            {
                var id = Number(room, "roomId");
                if (id is > 0 && !seenRooms.Add(id.Value)) continue;
                var row = floorRow.DeepClone().AsObject();
                var length = Number(room, "lengthMtr");
                var width = Number(room, "widthMtr");
                var count = Math.Max(1m, Number(room, "noOfRooms") ?? 1m);
                // FloorSubmission saves net carpet area after any room offsets/outer adjustment.
                var carpet = Number(room, "totalAreaSqMtr") ?? (Number(room, "areaSqMtr") * count);
                var builtup = carpet * 1.20m;
                row["roomDimensions"] = length.HasValue && width.HasValue
                    ? $"{length.Value.ToString("0.##", CultureInfo.InvariantCulture)} x {width.Value.ToString("0.##", CultureInfo.InvariantCulture)}"
                    : null;
                row["roomType"] = Text(room, "roomType");
                row["carpetAreaSqMeter"] = carpet;
                row["builtupAreaSqMeter"] = builtup;
                rows.Add(row);
            }
        }
        return rows;
    }

    private static string? Text(JsonElement node, string name) =>
        node.ValueKind == JsonValueKind.Object && node.TryGetProperty(name, out var value)
        && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static decimal? Number(JsonElement node, string name) =>
        node.ValueKind == JsonValueKind.Object && node.TryGetProperty(name, out var value)
        && value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var number) ? number : null;

    private static decimal? Number(JsonNode node, string name) =>
        node[name] is JsonValue value && value.TryGetValue<decimal>(out var number) ? number : null;
}
