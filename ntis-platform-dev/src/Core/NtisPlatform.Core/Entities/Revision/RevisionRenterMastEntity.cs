using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionRenterMast - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionRenterMastEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionPropertyDetailsId { get; set; }
    public int? SourceRenterMastId { get; set; }
    public double? RentMonthly { get; set; }
    public double? FinalYearlyRent { get; set; }
    public string? FinancialYear { get; set; }
    public DateTime? DurationFrom { get; set; }
    public DateTime? DurationTo { get; set; }
    public string? TaxLiability { get; set; }
    public double? NonCalculateRentMonthly { get; set; }
    public string? RenterNameEnglish { get; set; }
    public string? RenterName { get; set; }
    public DateTime? AgreementDate { get; set; }
    public DateTime? AgreementFromDate { get; set; }
    public DateTime? AgreementToDate { get; set; }
    public int? DocumentBindingId { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
