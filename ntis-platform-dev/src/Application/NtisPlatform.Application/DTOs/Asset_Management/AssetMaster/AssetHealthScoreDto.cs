namespace NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;

/// <summary>
/// Real, backend-computed health score for one asset — used for batch lookups (e.g. child/
/// sub-unit rows in the Asset Register, which are full AssetMaster rows in their own right
/// but aren't included in a parent's paginated list response).
/// </summary>
public class AssetHealthScoreDto
{
    public int AssetId { get; set; }
    public decimal HealthScore { get; set; }
    public string HealthScoreRating { get; set; } = string.Empty;
}
public class HealthScoreResult
{
    public decimal ScoreOutOfSeven { get; set; }
    public decimal HealthPercentage { get; set; }
    public decimal StarRating { get; set; }
    public string RatingString { get; set; } = string.Empty;
}
