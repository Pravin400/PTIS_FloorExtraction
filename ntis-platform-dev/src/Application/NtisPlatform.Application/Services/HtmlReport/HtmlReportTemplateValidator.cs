using System.Text.Json;
using NtisPlatform.Application.DTOs.HtmlReport;
using NtisPlatform.Application.Interfaces.HtmlReport;

namespace NtisPlatform.Application.Services.HtmlReport;

public sealed class HtmlReportTemplateValidator : IHtmlReportTemplateValidator
{
    private static readonly HashSet<string> PageSizes = new(StringComparer.OrdinalIgnoreCase)
    {
        "A0", "A1", "A2", "A3", "A3 Extra", "A3 Plus", "A3 Rotated", "A3 Transverse",
        "A4", "A4 Extra", "A4 Plus", "A4 Rotated", "A4 Small", "A4 Transverse",
        "A5", "A5 Extra", "A5 Rotated", "A5 Transverse",
        "A6", "A7", "A8", "A9", "A10",
        "B0", "B1", "B2", "B3", "B4", "B5", "B6",
        "Letter", "Letter Extra", "Letter Plus", "Letter Rotated", "Letter Small",
        "Legal", "Legal Extra",
        "Tabloid", "Tabloid Extra", "Ledger", "Executive", "Statement", "Folio",
        "Custom"
    };
    private static readonly HashSet<string> BandTypes = ["pageHeader", "reportHeader", "groupHeader", "detail", "groupFooter", "reportFooter", "pageFooter", "subreport"];
    private static readonly HashSet<string> ElementTypes = ["text", "field", "image", "qr", "barcode", "line", "rectangle", "square", "circle", "table", "container", "signature", "watermark", "pageBreak"];
    private static readonly HashSet<string> Operators = ["equals", "notEquals", "greaterThan", "greaterThanOrEqual", "lessThan", "lessThanOrEqual", "and", "or", "not", "isNull", "isEmpty", "sum", "count", "min", "max", "add", "subtract", "multiply", "divide"];

    public HtmlReportValidationResult Validate(string templateJson)
    {
        var errors = new List<HtmlReportValidationIssue>();
        try
        {
            using var document = JsonDocument.Parse(templateJson, new JsonDocumentOptions { MaxDepth = 64 });
            var root = document.RootElement;
            var schemaVersion = root.TryGetProperty("schemaVersion", out var schema) && schema.TryGetInt32(out var value) ? value : 1;
            if (schemaVersion is < 1 or > 3) Error("schemaVersion", "Only schema versions 1, 2, and 3 are supported.", "$.schemaVersion");
            if (!root.TryGetProperty("page", out var page)) Error("page.required", "A page definition is required.", "$.page");
            else
            {
                var size = page.TryGetProperty("size", out var p) ? p.GetString() : null;
                if (string.IsNullOrWhiteSpace(size)) Error("page.size", "Page size is required.", "$.page.size");
                var orientation = page.TryGetProperty("orientation", out var o) ? o.GetString() : null;
                if (orientation is not ("portrait" or "landscape")) Error("page.orientation", "Orientation must be portrait or landscape.", "$.page.orientation");
            }

            var fragmentGraph = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            if (root.TryGetProperty("fragments", out var fragments) && fragments.ValueKind == JsonValueKind.Array)
                foreach (var fragment in fragments.EnumerateArray())
                {
                    var code = ReadCode(fragment, "code") ?? ReadCode(fragment, "fragmentCode");
                    if (code is not null) fragmentGraph[code] = CollectFragmentReferences(fragment);
                    ValidateBands(fragment, "$.fragments", errors);
                }
            ValidateBands(root, "$", errors);
            DetectCycles(fragmentGraph, errors);
            ValidateExpressions(root, "$", errors);
            return new(errors.Count == 0, schemaVersion, errors, []);
        }
        catch (JsonException ex)
        {
            errors.Add(new("json.invalid", ex.Message, "$"));
            return new(false, 0, errors, []);
        }

        void Error(string code, string message, string path) => errors.Add(new(code, message, path));
    }

    private static void ValidateBands(JsonElement owner, string path, List<HtmlReportValidationIssue> errors)
    {
        if (!owner.TryGetProperty("bands", out var bands)) return;
        if (bands.ValueKind != JsonValueKind.Array) { errors.Add(new("bands.type", "Bands must be an array.", path + ".bands")); return; }
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var index = 0;
        foreach (var band in bands.EnumerateArray())
        {
            var bandPath = $"{path}.bands[{index++}]";
            var id = ReadCode(band, "id");
            if (string.IsNullOrWhiteSpace(id) || !ids.Add(id)) errors.Add(new("band.id", "Band IDs are required and unique.", bandPath + ".id"));
            var type = ReadCode(band, "type");
            if (type is null || !BandTypes.Contains(type)) errors.Add(new("band.type", "Unsupported band type.", bandPath + ".type"));
            if (band.TryGetProperty("elements", out var elements) && elements.ValueKind == JsonValueKind.Array)
            {
                var elementIndex = 0;
                foreach (var element in elements.EnumerateArray()) ValidateElement(element, $"{bandPath}.elements[{elementIndex++}]", errors, 0);
            }
        }
    }

    private static void ValidateElement(JsonElement element, string path, List<HtmlReportValidationIssue> errors, int depth)
    {
        if (depth > 8) { errors.Add(new("element.depth", "Container nesting exceeds 8.", path)); return; }
        var type = ReadCode(element, "type");
        if (type is null || !ElementTypes.Contains(type)) errors.Add(new("element.type", "Unsupported element type.", path + ".type"));
        if (element.TryGetProperty("children", out var children) && children.ValueKind == JsonValueKind.Array)
        {
            var index = 0;
            foreach (var child in children.EnumerateArray()) ValidateElement(child, $"{path}.children[{index++}]", errors, depth + 1);
        }
    }

    private static void ValidateExpressions(JsonElement node, string path, List<HtmlReportValidationIssue> errors)
    {
        if (node.ValueKind == JsonValueKind.Object)
        {
            var isPathExpression = node.TryGetProperty("path", out _) &&
                !node.TryGetProperty("type", out _) && !node.TryGetProperty("id", out _);
            if (node.TryGetProperty("operator", out _) || node.TryGetProperty("literal", out _) || isPathExpression)
            {
                ValidateExpressionNode(node, path, 0, errors);
                return;
            }
            foreach (var property in node.EnumerateObject()) ValidateExpressions(property.Value, path + "." + property.Name, errors);
        }
        else if (node.ValueKind == JsonValueKind.Array)
            foreach (var child in node.EnumerateArray()) ValidateExpressions(child, path + "[]", errors);
        else if (node.ValueKind == JsonValueKind.String && node.GetString()!.Length > 100_000)
            errors.Add(new("string.length", "A template string exceeds 100,000 characters.", path));
    }

    private static void ValidateExpressionNode(JsonElement node, string path, int depth, List<HtmlReportValidationIssue> errors)
    {
        if (depth > 16) { errors.Add(new("expression.depth", "Expression depth exceeds 16.", path)); return; }
        if (node.ValueKind != JsonValueKind.Object) return;
        if (node.TryGetProperty("operator", out var op))
        {
            if (op.ValueKind != JsonValueKind.String || !Operators.Contains(op.GetString()!))
                errors.Add(new("expression.operator", "Unsupported expression operator.", path + ".operator"));
        }
        foreach (var property in node.EnumerateObject())
        {
            if (property.NameEquals("operator")) continue;
            if (property.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                ValidateExpressionChildren(property.Value, path + "." + property.Name, depth + 1, errors);
            else if (property.Value.ValueKind == JsonValueKind.String && property.Value.GetString()!.Length > 100_000)
                errors.Add(new("string.length", "An expression string exceeds 100,000 characters.", path + "." + property.Name));
        }
    }

    private static void ValidateExpressionChildren(JsonElement node, string path, int depth, List<HtmlReportValidationIssue> errors)
    {
        if (depth > 16) { errors.Add(new("expression.depth", "Expression depth exceeds 16.", path)); return; }
        if (node.ValueKind == JsonValueKind.Array)
        {
            var index = 0;
            foreach (var child in node.EnumerateArray()) ValidateExpressionChildren(child, $"{path}[{index++}]", depth + 1, errors);
            return;
        }
        if (node.ValueKind == JsonValueKind.Object) ValidateExpressionNode(node, path, depth, errors);
    }

    private static List<string> CollectFragmentReferences(JsonElement owner)
    {
        var result = new List<string>();
        if (owner.TryGetProperty("bands", out var bands) && bands.ValueKind == JsonValueKind.Array)
            foreach (var band in bands.EnumerateArray())
                if (ReadCode(band, "fragmentCode") is { } code) result.Add(code);
        return result;
    }

    private static void DetectCycles(Dictionary<string, List<string>> graph, List<HtmlReportValidationIssue> errors)
    {
        var visiting = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var node in graph.Keys) Visit(node, 0);
        void Visit(string node, int depth)
        {
            if (depth > 8) { errors.Add(new("fragment.depth", "Fragment nesting exceeds 8.", "$.fragments")); return; }
            if (visiting.Contains(node)) { errors.Add(new("fragment.cycle", $"Circular fragment reference detected at '{node}'.", "$.fragments")); return; }
            if (!visited.Add(node)) return;
            visiting.Add(node);
            if (graph.TryGetValue(node, out var children)) foreach (var child in children) Visit(child, depth + 1);
            visiting.Remove(node);
        }
    }

    private static string? ReadCode(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
}
