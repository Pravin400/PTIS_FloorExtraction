namespace NtisPlatform.Application.DTOs.GIS.Asset;

/// <summary>
/// DTO representing a single dynamic GIS KPI Card for Asset Management.
/// </summary>
public class GisAssetKpiCardDto
{
    public string KpiCode { get; set; } = null!;
    public string Title { get; set; } = null!;
    public decimal RawValue { get; set; }
    public string FormattedValue { get; set; } = null!;
    public string Unit { get; set; } = string.Empty;
    public string Icon { get; set; } = "fa-building";
    public string Color { get; set; } = "#2563EB";
    public int DisplayOrder { get; set; } = 1;
    public string? FilterKey { get; set; }
    public string? FilterValue { get; set; }
    public bool IsSelected { get; set; }
}
