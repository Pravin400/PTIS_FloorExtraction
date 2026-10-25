using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionTransMast - revision snapshot of the live PTIS.TransMast (demand) rows for the
/// property + finance year, copied by the snapshot capture step. One row per source TransMast row
/// (per period for PERIOD_WISE revisions). The (RevisionMastId, PropertyId, FinanceYearId) triple
/// must match the revision header (composite FK in the database).
/// </summary>
public class RevisionTransMastEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }

    /// <summary>Trace-only reference to the live TransMast row this was copied from. Not an FK.</summary>
    public int? SourceTransMastId { get; set; }

    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }

    /// <summary>'RV' or 'CV'.</summary>
    public string CalculationType { get; set; } = string.Empty;

    public int PolicyCodeId { get; set; }
    public int TaxId { get; set; }
    public decimal? CalculationAnnualValue { get; set; }
    public decimal CalculationValue { get; set; }
    public decimal TaxAmount { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
