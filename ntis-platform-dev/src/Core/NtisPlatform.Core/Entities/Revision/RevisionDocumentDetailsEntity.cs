using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionDocumentDetails - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionDocumentDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long? RevisionPropertyDetailsId { get; set; }
    public int DocumentBindingId { get; set; }
    public string DocumentTypeCode { get; set; } = string.Empty;
    public string? DocumentTitle { get; set; }
    public string DocumentStage { get; set; } = "SUPPORTING";
    public string? Remarks { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
