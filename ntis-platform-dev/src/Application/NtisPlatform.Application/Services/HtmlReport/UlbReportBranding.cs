using System.Text.Json;
using System.Text.Json.Nodes;

namespace NtisPlatform.Application.Services.HtmlReport;

/// <summary>Uses the configured ULB logo for both branding images in the four Thane reports.</summary>
public static class UlbReportBranding
{
    public static bool AppliesTo(string? code) => NormalizeCode(code) is
        "KARAKARNI" or "KARAKARNIREPORT" or "THANEKARAKARNI"
        or "FRONTPAGETHANE" or "SIGNPAGETHANE" or "TSRSIGNREPORTAUTOMATION"
        or "SPECIALNOTICETHANE";

    public static string Normalize(string json, string? providerCode = null)
    {
        JsonDocument document;
        try { document = JsonDocument.Parse(json); }
        catch (JsonException) { return json; }
        using (document)
        {
            var root = document.RootElement;
            var code = root.ValueKind == JsonValueKind.Object && root.TryGetProperty("reportCode", out var reportCode)
                ? reportCode.ToString() : null;
            if (!AppliesTo(code) && !AppliesTo(providerCode)) return json;
            return Normalize(root, providerCode).GetRawText();
        }
    }

    public static JsonElement Normalize(JsonElement template, string? providerCode = null)
    {
        if (template.ValueKind != JsonValueKind.Object) return template;
        var code = template.TryGetProperty("reportCode", out var reportCode) ? reportCode.ToString() : null;
        if (!AppliesTo(code) && !AppliesTo(providerCode)) return template;

        var design = JsonNode.Parse(template.GetRawText())!.AsObject();
        if (!AppliesTo(code)) design["reportCode"] = providerCode;
        var page = design["page"] as JsonObject;
        var width = Number(page, "widthMm", 210);
        var height = Number(page, "heightMm", 297);
        if (page?["orientation"]?.ToString() == "landscape" && height > width)
            (width, height) = (height, width);

        JsonObject? watermark = null;
        var hasLogo = false;
        RewriteElements(design);
        design.Remove("watermark");
        if (design["elements"] is not JsonArray elements)
            design["elements"] = elements = new JsonArray();

        if (!hasLogo)
        {
            var logo = new JsonObject
            {
                ["id"] = "configured-ulb-logo", ["type"] = "image",
                ["x"] = 10, ["y"] = 10, ["w"] = 22, ["h"] = 22
            };
            BindLogo(logo);
            elements.Add(logo);
        }

        // A flat element is rendered on every page, behind the report's bands.
        watermark ??= new JsonObject
        {
            ["x"] = (width - Math.Min(90, width * .45)) / 2,
            ["y"] = (height - Math.Min(90, height * .45)) / 2,
            ["w"] = Math.Min(90, width * .45), ["h"] = Math.Min(90, height * .45)
        };
        watermark["id"] = "configured-ulb-watermark";
        watermark["type"] = "watermark";
        watermark["watermarkType"] = "image";
        BindLogo(watermark);
        if (watermark["style"] is not JsonObject watermarkStyle)
            watermark["style"] = watermarkStyle = new JsonObject();
        watermarkStyle["opacity"] = .12;
        watermarkStyle["zIndex"] = 0;
        elements.Insert(0, watermark);

        return JsonSerializer.SerializeToElement(design);

        void RewriteElements(JsonNode? node)
        {
            if (node is JsonArray array)
            {
                foreach (var child in array.ToArray())
                {
                    if (child is not JsonObject element) continue;
                    var type = element["type"]?.ToString();
                    var binding = Binding(element);
                    var id = element["id"]?.ToString() ?? string.Empty;
                    var isLogo = type == "image" && (IsLogo(binding)
                        || id.Contains("logo", StringComparison.OrdinalIgnoreCase)
                        || (binding.Length == 0 && element["src"] is not null
                            && !id.Contains("photo", StringComparison.OrdinalIgnoreCase)
                            && !id.Contains("plan", StringComparison.OrdinalIgnoreCase)));
                    var isWatermark = type == "watermark" || (type == "image"
                        && (id.Contains("watermark", StringComparison.OrdinalIgnoreCase)
                            || (isLogo && Number(element["style"] as JsonObject, "opacity", 1) < .5)));
                    if (isWatermark)
                    {
                        watermark ??= element.DeepClone().AsObject();
                        array.Remove(element);
                        continue;
                    }
                    else if (isLogo)
                    {
                        BindLogo(element);
                        hasLogo = true;
                    }
                    RewriteElements(element);
                }
                return;
            }
            if (node is not JsonObject item) return;
            foreach (var property in item.ToArray())
                if (property.Key is "elements" or "bands" or "children") RewriteElements(property.Value);
        }
    }

    private static void BindLogo(JsonObject element)
    {
        element["path"] = "ulbLogo";
        element.Remove("binding");
        element.Remove("fieldName");
        element.Remove("src");
        element.Remove("text");
    }

    private static bool IsLogo(string path) => path.Equals("ulbLogo", StringComparison.OrdinalIgnoreCase)
        || path.Equals("CouncilLogo", StringComparison.OrdinalIgnoreCase)
        || path.Equals("municipal_logo", StringComparison.OrdinalIgnoreCase)
        || path.Equals("logo", StringComparison.OrdinalIgnoreCase);

    private static string Binding(JsonObject element) =>
        (element["binding"] ?? element["path"] ?? element["fieldName"])?.ToString().Trim('{', '}').Trim() ?? string.Empty;

    private static double Number(JsonObject? node, string key, double fallback) =>
        node?[key] is JsonValue value && value.TryGetValue<double>(out var number) ? number : fallback;

    private static string NormalizeCode(string? code) => new((code ?? string.Empty)
        .Replace("DataProvider", "", StringComparison.OrdinalIgnoreCase)
        .Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());
}
