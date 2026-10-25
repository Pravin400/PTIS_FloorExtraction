namespace NtisPlatform.Core.Entities;

/// <summary>
/// Maps PTIS.PropertyTaxRecalcFlag — the per-property "needs recalculation" marker. Populated by
/// PTIS.usp_ProcessCdcChanges when a master-data change affects an already-taxed property; resolved
/// by the application (<see cref="ResolvedAt"/>/<see cref="ResolvedBy"/>) once that property is
/// successfully re-taxed. An unresolved row (ResolvedAt IS NULL) excludes the property from the
/// "Already Taxed" bucket in <c>PropertyTaxOperationsService</c> eligibility evaluation.
/// </summary>
public class PropertyTaxRecalcFlagEntity
{
    public long Id { get; set; }
    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }
    public long BatchId { get; set; }
    public string CalculationType { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime FlaggedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int? ResolvedBy { get; set; }
}
