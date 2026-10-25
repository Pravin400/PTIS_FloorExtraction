using System.Text.Json;
using System.Text.Json.Nodes;
using NtisPlatform.Application.DTOs.HtmlReport;

namespace NtisPlatform.Application.Services.HtmlReport;

public static class ReportDesignerLogoField
{
    public static HtmlReportDataSourceFieldDto RepairSchemaField(HtmlReportDataSourceFieldDto field) =>
        IsLogo(field.Path) && NeedsRepair(field.Label)
            ? new(field.Path, "ULB Logo", "image", "ULB", field.ValueType)
            : field;

    public static string RepairCatalog(string templateJson)
    {
        JsonObject? template;
        try { template = JsonNode.Parse(templateJson) as JsonObject; }
        catch (JsonException) { return templateJson; }
        if (template?["fieldCatalog"] is not JsonArray catalog) return templateJson;

        var changed = false;
        foreach (var field in catalog.OfType<JsonObject>())
        {
            var path = (field["name"] ?? field["path"])?.ToString();
            if (!IsLogo(path) || !NeedsRepair(field["label"]?.ToString())) continue;
            field["label"] = "ULB Logo";
            field["elementType"] = "image";
            field["group"] = "ULB";
            changed = true;
        }

        return changed ? template.ToJsonString() : templateJson;
    }

    private static bool IsLogo(string? path) => string.Equals(path, "ulbLogo", StringComparison.OrdinalIgnoreCase);

    // Older catalogs contain Devanagari UTF-8 bytes decoded as a Western code page.
    private static bool NeedsRepair(string? label) => string.IsNullOrWhiteSpace(label)
        || label.Contains('\uFFFD')
        || label.Contains("\u00e0\u00a4", StringComparison.Ordinal)
        || label.Contains("\u00e0\u00a5", StringComparison.Ordinal);
}
