using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Services.Asset_Management;

public class PagedAssetMasterResult : PagedResult<AssetMasterDto>
{
    public decimal? TotalCapitalValue { get; set; }
    public decimal? TotalOutstanding { get; set; }
    public decimal? TotalAnnualRevenue { get; set; }
    public int? ActiveAssetsCount { get; set; }
    public int TotalSubUnits { get; set; }
    public int EncroachmentsCount { get; set; }
    /// <summary>Average HealthScore (0-100) across every asset matching the current filter,
    /// not just the current page — computed the same way each asset's own HealthScore is.</summary>
    public decimal? AvgHealthScore { get; set; }

    public PagedAssetMasterResult(IEnumerable<AssetMasterDto> items, int totalCount, int pageNumber, int pageSize)
        : base(items, totalCount, pageNumber, pageSize)
    {
    }
}
