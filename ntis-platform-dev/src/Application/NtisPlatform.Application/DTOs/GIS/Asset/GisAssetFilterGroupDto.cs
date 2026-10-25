using System.Collections.Generic;

namespace NtisPlatform.Application.DTOs.GIS.Asset;

/// <summary>
/// Represents an individual option inside a dynamic GIS filter dropdown.
/// </summary>
public class GisAssetFilterOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public int? ParentId { get; set; }
    public int? AssetCount { get; set; }
    public string? ColorCode { get; set; }
    public string? BorderColor { get; set; }
    public string? AssetWardNo { get; set; }
}

/// <summary>
/// Represents a dynamic GIS filter group (e.g. Zone, Ward, Asset Category, Asset Type).
/// </summary>
public class GisAssetFilterGroupDto
{
    public string FilterKey { get; set; } = null!;
    public string FilterLabel { get; set; } = null!;
    public string ControlType { get; set; } = "DROPDOWN";
    public string? ApiSourceUrl { get; set; }
    public int DisplayOrder { get; set; } = 1;
    public List<GisAssetFilterOptionDto> Options { get; set; } = new();
}
