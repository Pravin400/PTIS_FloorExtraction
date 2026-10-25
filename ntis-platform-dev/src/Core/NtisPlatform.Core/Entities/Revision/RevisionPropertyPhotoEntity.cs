using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPropertyPhoto - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionPropertyPhotoEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int? SourcePropertyPhotoId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int? PropertyId { get; set; }
    public string? Type { get; set; }
    public int PhotoTypeId { get; set; }
    public int? DocumentBindingId { get; set; }
    public bool IsLatest { get; set; } = true;
    public int? DisplayOrder { get; set; }
    public string? Remarks { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
