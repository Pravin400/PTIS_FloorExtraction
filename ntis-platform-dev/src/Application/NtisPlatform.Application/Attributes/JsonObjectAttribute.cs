using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace NtisPlatform.Application.Attributes;

/// <summary>
/// Accepts null, blank, or a valid JSON object (starts with '{' and ends with '}').
/// Rejects JSON arrays, scalars, and malformed JSON.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class JsonObjectAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is null)
            return true;

        if (value is not string text)
            return false;

        if (string.IsNullOrWhiteSpace(text))
            return true;

        try
        {
            using var document = JsonDocument.Parse(text);
            return document.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
