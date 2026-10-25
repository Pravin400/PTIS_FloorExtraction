using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPropertyTaxCalculationCVResults - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionPropertyTaxCalculationCVResultsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionPropertyDetailsId { get; set; }
    public int PropertyId { get; set; }
    public long? SourcePropertyTaxCalculationCVResultsId { get; set; }
    public int RateCVMasterId { get; set; }
    public int TaxId { get; set; }
    public double? BaseValue { get; set; }
    public int? FloorFactorCVId { get; set; }
    public int? AgeFactorCVId { get; set; }
    public int? NatureFactorCVId { get; set; }
    public int? UseFactorCVId { get; set; }
    public decimal? CapitalValue { get; set; }
    public decimal? TaxPercentage { get; set; }
    public decimal? TaxAmount { get; set; }
    public string? CVInputHash { get; set; }
    public string ProrationMethod { get; set; } = "NO_PRORATION";
    public int? PeriodDays { get; set; }
    public int? YearDays { get; set; }
    public decimal ProrationFactor { get; set; } = 1m;
    public decimal? PeriodCapitalValue { get; set; }
    public decimal? PeriodTaxAmount { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
