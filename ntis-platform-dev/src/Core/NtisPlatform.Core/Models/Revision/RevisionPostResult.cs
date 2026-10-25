namespace NtisPlatform.Core.Models.Revision;

/// <summary>Single-row result of <c>PTIS.usp_Revision_Post</c>.</summary>
public class RevisionPostResult
{
    public long RevisionMastId { get; set; }
    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }
    public string CalculationScope { get; set; } = string.Empty;
    public string CalculationType { get; set; } = string.Empty;

    /// <summary>Always "POSTED" on success - the SP marks the revision POSTED and IsCurrent=1.</summary>
    public string RevisionStatus { get; set; } = string.Empty;
}
