using System.Text.Json;
using System.Text.Json.Nodes;

namespace NtisPlatform.Application.Services.HtmlReport;

/// <summary>Filters Thane Karakarni report data and totals before rendering.</summary>
public static class ThaneKarakarniPresentationRules
{
    public static JsonElement BindUnitHolder(JsonElement template)
    {
        if (!AppliesTo(template) || !template.TryGetProperty("bands", out var bands)
            || bands.ValueKind != JsonValueKind.Array) return template;

        var design = JsonNode.Parse(template.GetRawText())!.AsObject();
        var changed = false;
        foreach (var band in design["bands"]!.AsArray())
        {
            if (band?["id"]?.GetValue<string>() != "thane_header"
                || band["elements"] is not JsonArray elements) continue;
            foreach (var element in elements)
            {
                // Rebind only the existing Unit Owner /Holder Name value in this report.
                if (element?["id"]?.GetValue<string>() != "thane_41"
                    || element["path"]?.GetValue<string>() != "ownerNameEnglish") continue;
                element["path"] = "occupierNameEnglish";
                changed = true;
            }
        }
        return changed ? JsonSerializer.SerializeToElement(design) : template;
    }

    private static readonly (string Total, string Detail)[] Totals =
    [
        ("totalCarpetAreaSqMeter", "carpetAreaSqMeter"),
        ("totalBuiltupAreaSqMeter", "builtupAreaSqMeter"),
        ("annualRentalValue", "annualRentalValue"),
        ("maintenance", "maintenance"),
        ("rateableValue", "rateableValue")
    ];

    /// <summary>Removes open plot rows from a report copy and totals the remaining rows.</summary>
    /// <param name="template">The template identifying the report.</param>
    /// <param name="data">The property's source report data, which is preserved.</param>
    /// <returns>Filtered report data, or the original data when no filtering is needed.</returns>
    public static JsonElement Apply(JsonElement template, JsonElement data)
    {
        if (!AppliesTo(template)
            || data.ValueKind != JsonValueKind.Object
            || !data.TryGetProperty("propertyDetails", out var details)
            || details.ValueKind != JsonValueKind.Array)
            return data;

        var visibleRows = details.EnumerateArray().Where(row =>
            !HasCode(row, "floorCode", "OP") && !HasCode(row, "typeOfUseCode", "OPC")).ToList();
        if (visibleRows.Count == details.GetArrayLength()) return data;

        // Change only this report's rendered copy. Provider data and tax calculations stay intact.
        var record = JsonNode.Parse(data.GetRawText())!.AsObject();
        record["propertyDetails"] = new JsonArray(visibleRows
            .Select(row => JsonNode.Parse(row.GetRawText())).ToArray());
        foreach (var (total, detail) in Totals)
        {
            var value = record["propertyDetails"]!.AsArray().Sum(row => row?[detail] is JsonValue amount
                && amount.TryGetValue<decimal>(out var number)
                    ? number : 0m);
            record[total] = value;
        }
        return JsonSerializer.SerializeToElement(record);
    }

    /// <summary>Checks whether the template belongs to the Thane Karakarni report.</summary>
    /// <param name="template">The report template to check.</param>
    /// <returns>Whether the template has the Thane Karakarni report code.</returns>
    public static bool AppliesTo(JsonElement template) =>
        template.TryGetProperty("reportCode", out var code) && code.ValueKind == JsonValueKind.String
        && string.Equals(code.GetString(), "THANE_KARAKARNI", StringComparison.OrdinalIgnoreCase);

    private static bool HasCode(JsonElement row, string field, string expected) =>
        row.ValueKind == JsonValueKind.Object && row.TryGetProperty(field, out var value)
        && value.ValueKind == JsonValueKind.String
        && string.Equals(value.GetString()?.Trim(), expected, StringComparison.OrdinalIgnoreCase);
}
