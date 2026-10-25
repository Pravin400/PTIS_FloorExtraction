using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionRenterDetails - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionRenterDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionPropertyDetailsId { get; set; }
    public long? RevisionRenterMastId { get; set; }
    public int? SourceRenterDetailsId { get; set; }
    public string? AgreementId { get; set; }
    public string? IncrementFrequency { get; set; }
    public string? IncrementType { get; set; }
    public decimal? IncrementValue { get; set; }
    public string? IncrementMethod { get; set; }
    public DateTime? DurationFrom { get; set; }
    public DateTime? DurationTo { get; set; }
    public decimal? RentAmount { get; set; }
    public decimal? Increment { get; set; }
    public bool? IncrementStatus { get; set; }
    public decimal? RentMonthly { get; set; }
    public DateTime? CustomFromDate { get; set; }
    public DateTime? CustomToDate { get; set; }
    public string? CustomIncrementType { get; set; }
    public decimal? CustomIncrementValue { get; set; }
    public string? CustomMethod { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
