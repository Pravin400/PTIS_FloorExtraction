namespace NtisPlatform.Application.DTOs.PropertyTaxOperations;

/// <summary>
/// Backs the Add Taxes screen's "master data changed" banner. Sourced from currently-unresolved
/// PTIS.PropertyTaxRecalcFlag rows for the given finance year — populated by the CDC-based
/// PTIS.usp_ProcessCdcChanges pipeline, not by this application directly.
/// </summary>
public class MasterDataChangeSummaryDto
{
    public int AffectedCount { get; set; }
    public string? RemarkSummary { get; set; }
    public DateTime? LatestChangedAtUtc { get; set; }
    public long? ActiveJobId { get; set; }
    public string? ActiveJobCode { get; set; }
    public string? ActiveJobStatus { get; set; }
}

/// <summary>
/// One row in the "View Properties" list/export backing a <see cref="MasterDataChangeSummaryDto"/>.
/// </summary>
public class MasterDataChangeAffectedPropertyDto
{
    public int PropertyId { get; set; }
    public string Zone { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string PropertyNo { get; set; } = string.Empty;
    public string PartitionNo { get; set; } = string.Empty;
    public string? UpicId { get; set; }
    public string Owner { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime FlaggedAt { get; set; }
}
