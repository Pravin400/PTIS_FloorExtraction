namespace NtisPlatform.Core.Models.GIS;

/// <summary>
/// DTO representing dynamic database configuration for a department KPI Card.
/// Loaded directly from GIS.GisDepartmentKpiMapping and GIS.GisKpiMaster.
/// </summary>
public class GisDepartmentKpiConfigDto
{
    public string KpiCode { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Icon { get; set; } = "fa-building";
    public string Color { get; set; } = "#2563EB";
    public int DisplayOrder { get; set; } = 1;
}

/// <summary>
/// DTO representing dynamic database configuration for a department Filter.
/// Loaded directly from GIS.GisDepartmentFilterMapping and GIS.GisFilterMaster.
/// </summary>
public class GisDepartmentFilterConfigDto
{
    public string FilterKey { get; set; } = null!;
    public string FilterLabel { get; set; } = null!;
    public string ControlType { get; set; } = "DROPDOWN";
    public string? ApiSourceUrl { get; set; }
    public int DisplayOrder { get; set; } = 1;
}
