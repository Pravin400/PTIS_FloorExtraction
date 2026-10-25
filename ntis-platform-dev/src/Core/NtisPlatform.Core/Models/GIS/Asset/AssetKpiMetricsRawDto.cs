namespace NtisPlatform.Core.Models.GIS;

/// <summary>
/// Raw aggregated metrics returned by the repository for Asset GIS KPI cards calculation.
/// </summary>
public class AssetKpiMetricsRawDto
{
    public int TotalAssets { get; set; }
    public int FixedAssets { get; set; }
    public int MovableAssets { get; set; }
    public decimal TotalValue { get; set; }
    public decimal AnnualRevenue { get; set; }
    public int EncroachedAssets { get; set; }
}
