using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionRVCalculationResults - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionRVCalculationResultsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int PropertyId { get; set; }
    public long RevisionPropertyDetailsId { get; set; }
    public int? SourceRVCalculationResultsId { get; set; }
    public double? MonthlyRate { get; set; }
    public double? YearlyRate { get; set; }
    public double? YearlyRent { get; set; }
    public string? AppliedOn { get; set; }
    public decimal? Depreciation { get; set; }
    public decimal? DepreciationPer { get; set; }
    public double? AnnualRentalValue { get; set; }
    public decimal? Maintenance { get; set; }
    public decimal? RateableValue { get; set; }
    public decimal? REducationTax { get; set; }
    public decimal? CEducationTax { get; set; }
    public decimal? CEmploymentTax { get; set; }
    public double? TotalAreaSqMtr { get; set; }
    public double? RAreaSqMtr { get; set; }
    public double? CAreaSqlMtr { get; set; }
    public decimal? ProrationFactor { get; set; }
    public decimal? PeriodAnnualRentalValue { get; set; }
    public decimal? PeriodRateableValue { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
