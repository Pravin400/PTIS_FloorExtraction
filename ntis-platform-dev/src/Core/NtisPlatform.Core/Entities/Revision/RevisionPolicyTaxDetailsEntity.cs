using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPolicyTaxDetails - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionPolicyTaxDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int PropertyId { get; set; }
    public int? SourcePolicyTaxDetailsId { get; set; }
    public int PolicyCodeId { get; set; }
    public decimal? AnnualCalculationValue { get; set; }
    public decimal? CalculationValue { get; set; }
    public int TaxId { get; set; }
    public decimal? AnnualTaxAmount { get; set; }
    public decimal? TaxAmount { get; set; }
    public bool IsCurrent { get; set; } = true;

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
