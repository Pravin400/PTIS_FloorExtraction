using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPropertyCertificates - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionPropertyCertificatesEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long? RevisionPropertyDetailsId { get; set; }
    public int? SourcePropertyCertificateId { get; set; }
    public int? SourcePropertyDetailsId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int? PropertyId { get; set; }
    public int CertificateTypeId { get; set; }
    public string? CertificateNo { get; set; }
    public DateTime? CertificateIssueDate { get; set; }
    public int? DocumentBindingId { get; set; }
    public bool TaxApplied { get; set; }
    public DateTime? TaxAppliedDate { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
