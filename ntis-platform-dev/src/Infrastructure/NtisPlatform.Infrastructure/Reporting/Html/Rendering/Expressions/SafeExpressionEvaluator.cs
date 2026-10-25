using System.Text.Json;

namespace Ntis.Reporting.Rendering.Html;

internal static class SafeExpressionEvaluator
{
    public static bool EvaluateBoolean(JsonElement expression, JsonElement data) => Convert.ToBoolean(Evaluate(expression, data, 0));

    private static object? Evaluate(JsonElement node, JsonElement data, int depth)
    {
        if (depth > 16) throw new InvalidOperationException("Expression depth exceeds 16.");
        if (node.ValueKind != JsonValueKind.Object) return Scalar(node);
        if (node.TryGetProperty("literal", out var literal)) return Scalar(literal);
        if (node.TryGetProperty("path", out var path)) return Resolve(data, path.GetString());
        var op = node.GetProperty("operator").GetString();
        var left = node.TryGetProperty("left", out var l) ? Evaluate(l, data, depth + 1) : null;
        var right = node.TryGetProperty("right", out var r) ? Evaluate(r, data, depth + 1) : null;
        return op switch
        {
            "equals" => Equals(left?.ToString(), right?.ToString()), "notEquals" => !Equals(left?.ToString(), right?.ToString()),
            "greaterThan" => Decimal(left) > Decimal(right), "greaterThanOrEqual" => Decimal(left) >= Decimal(right),
            "lessThan" => Decimal(left) < Decimal(right), "lessThanOrEqual" => Decimal(left) <= Decimal(right),
            "and" => Bool(left) && Bool(right), "or" => Bool(left) || Bool(right), "not" => !Bool(left),
            "isNull" => left is null, "isEmpty" => string.IsNullOrEmpty(left?.ToString()),
            "add" => Decimal(left) + Decimal(right), "subtract" => Decimal(left) - Decimal(right),
            "multiply" => Decimal(left) * Decimal(right), "divide" => Decimal(right) == 0 ? 0 : Decimal(left) / Decimal(right),
            "count" => left is JsonElement { ValueKind: JsonValueKind.Array } array ? Math.Min(array.GetArrayLength(), 10_000) : 0,
            "sum" => Aggregate(left, values => values.Sum()),
            "min" => Aggregate(left, values => values.Count == 0 ? 0 : values.Min()),
            "max" => Aggregate(left, values => values.Count == 0 ? 0 : values.Max()),
            _ => false
        };
    }
    private static object? Resolve(JsonElement data, string? path)
    {
        var current = data;
        foreach (var part in (path ?? "").Split('.', StringSplitOptions.RemoveEmptyEntries))
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(part, out current)) return null;
        if (current.ValueKind == JsonValueKind.String && (current.GetString()?.Length ?? 0) > 100_000)
            throw new InvalidOperationException("Expression string exceeds 100,000 characters.");
        return current.Clone();
    }
    private static object? Scalar(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.String && (value.GetString()?.Length ?? 0) > 100_000)
            throw new InvalidOperationException("Expression string exceeds 100,000 characters.");
        return value.ValueKind switch { JsonValueKind.String => value.GetString(), JsonValueKind.Number => value.GetDecimal(), JsonValueKind.True => true, JsonValueKind.False => false, JsonValueKind.Null => null, _ => value.Clone() };
    }
    private static decimal Aggregate(object? value, Func<List<decimal>, decimal> operation)
    {
        if (value is not JsonElement { ValueKind: JsonValueKind.Array } array) return 0;
        var values = array.EnumerateArray().Take(10_000).Select(x => Decimal(Scalar(x))).ToList();
        return operation(values);
    }
    private static decimal Decimal(object? value) => decimal.TryParse(value?.ToString(), out var number) ? number : 0;
    private static bool Bool(object? value) => value is bool boolean ? boolean : bool.TryParse(value?.ToString(), out var result) && result;
}
