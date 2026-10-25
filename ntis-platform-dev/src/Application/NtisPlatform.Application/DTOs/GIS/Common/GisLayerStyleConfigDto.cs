using System.Collections.Generic;

namespace NtisPlatform.Application.DTOs.GIS;

/// <summary>
/// Dynamic GIS Layer and Feature Styling Configuration.
/// Configurable via GIS.GisLayerMaster.StyleConfigJson, appsettings.json, or request parameters.
/// </summary>
public class GisLayerStyleConfigDto
{
    public string DefaultColor { get; set; } = "#0078FF";
    public string? Color { get; set; }
    public string? FillColor { get; set; }
    public string? BoundaryColor { get; set; }

    public double DefaultOpacity { get; set; } = 0.6;
    public double? Opacity { get; set; }
    public double? FillOpacity { get; set; }

    public string DefaultStrokeColor { get; set; } = "#FFFFFF";
    public string? StrokeColor { get; set; }
    public string? BorderColor { get; set; }

    public double DefaultStrokeWidth { get; set; } = 1.5;
    public double? StrokeWidth { get; set; }
    public double? BorderWidth { get; set; }

    public bool IsExplicitlyConfigured { get; set; } = false;

    public Dictionary<string, string> StatusColors { get; set; } = new(System.StringComparer.OrdinalIgnoreCase);

    public Dictionary<int, string> CategoryColors { get; set; } = new();

    public List<GisStyleRuleDto> Rules { get; set; } = new();
}

/// <summary>
/// Dynamic style rule evaluated against feature/asset attributes.
/// </summary>
public class GisStyleRuleDto
{
    /// <summary>
    /// Attribute/Property name to check (e.g. "EncroachmentStatus", "OccupancyStatus", "OwnershipType", "AssetCategoryId")
    /// </summary>
    public string Field { get; set; } = string.Empty;

    /// <summary>
    /// Operator: "Equals", "Contains", "StartsWith", "In", "!=", "Empty", "NotEmpty"
    /// </summary>
    public string Operator { get; set; } = "Equals";

    /// <summary>
    /// Expected value to match
    /// </summary>
    public string? Value { get; set; }

    /// <summary>
    /// Hex color to apply if condition evaluates to true
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Optional opacity if condition evaluates to true
    /// </summary>
    public double? Opacity { get; set; }
}
