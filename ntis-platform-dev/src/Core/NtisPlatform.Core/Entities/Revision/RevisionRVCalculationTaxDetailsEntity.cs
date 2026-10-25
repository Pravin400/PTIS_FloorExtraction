using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionRVCalculationTaxDetails - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionRVCalculationTaxDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionRVCalculationResultsId { get; set; }
    public int? SourceRVCalculationTaxDetailsId { get; set; }
    public int TaxId { get; set; }
    public decimal? TaxPercentage { get; set; }
    public decimal? TaxAmount { get; set; }
    public string ProrationMethod { get; set; } = "NO_PRORATION";
    public int? PeriodDays { get; set; }
    public int? YearDays { get; set; }
    public decimal ProrationFactor { get; set; } = 1m;
    public decimal? PeriodTaxAmount { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
