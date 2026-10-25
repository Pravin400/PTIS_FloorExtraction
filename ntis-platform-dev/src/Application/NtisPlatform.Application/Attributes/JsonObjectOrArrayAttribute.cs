using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace NtisPlatform.Application.Attributes;

/// <summary>
/// Accepts null, blank, or a JSON object / array — the values SQL Server's <c>ISJSON(value) = 1</c> accepts —
/// so a value that passes here cannot trip a <c>CHECK ([Column] IS NULL OR ISJSON([Column]) = 1)</c> constraint.
/// Rejected like ISJSON: scalars (<c>1</c>, <c>"text"</c>, <c>true</c>, <c>null</c>), comments, trailing commas,
/// single-quoted strings and more than one root value. Blank is accepted because the mapping layer stores it as NULL.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class JsonObjectOrArrayAttribute : ValidationAttribute
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
            return document.RootElement.ValueKind is JsonValueKind.Object or JsonValueKind.Array;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
