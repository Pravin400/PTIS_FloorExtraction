namespace NtisPlatform.Core.Models.Section129;

/// <summary>
/// Read-side projection of a PropertySection129Schedule row, with its PolicyCodeMaster/YearMaster
/// lookups already flattened — the repository's read path returns this instead of the tracked
/// entity graph, so Application never depends on Infrastructure's Include() shape.
/// </summary>
public class Section129ScheduleRowProjection
{
    public int FinanceYearId { get; set; }
    public int FinanceYearValue { get; set; }
    /// <summary>The TaxMaster.Id this row was staged against (General Tax or Tax Total, whichever
    /// SECTION129_STAGE_BASE_TAXCODE resolved to when this row was written) — used to detect when
    /// that policy value has since changed, so an already-built schedule isn't silently continued
    /// under a different base tax than it was started with.</summary>
    public int TaxId { get; set; }
    public int PolicyCodeId { get; set; }
    public string PolicyCode { get; set; } = string.Empty;
    public string PolicyName { get; set; } = string.Empty;
    public bool IsFinalStage { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal OldTaxAmount { get; set; }
    public decimal FullBasisTaxAmount { get; set; }
    public decimal StageTaxAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsPropertyChangeDisqualified { get; set; }
}
