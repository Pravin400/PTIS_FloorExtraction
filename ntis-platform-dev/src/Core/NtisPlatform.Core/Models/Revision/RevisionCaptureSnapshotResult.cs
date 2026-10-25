namespace NtisPlatform.Core.Models.Revision;

/// <summary>Single-row result of <c>PTIS.usp_Revision_CaptureSnapshot</c>.</summary>
public class RevisionCaptureSnapshotResult
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int PropertyId { get; set; }
    public string CalculationScope { get; set; } = string.Empty;
    public string CalculationType { get; set; } = string.Empty;
    public int? PeriodDays { get; set; }
    public int? YearDays { get; set; }

    /// <summary>PeriodDays / YearDays; null/1.0 (NO_PRORATION) for HISTORY_ONLY.</summary>
    public decimal? ProrationFactor { get; set; }
}
