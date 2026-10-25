using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionPropertySocialDetails - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionPropertySocialDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int? SourcePropertySocialDetailsId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public int? PropertyId { get; set; }
    public int SocialAttributeId { get; set; }
    public bool? BitValue { get; set; }
    public int? IntValue { get; set; }
    public decimal? DecimalValue { get; set; }
    public string? TextValue { get; set; }
    public DateTime? DateValue { get; set; }
    public int? DocumentBindingId { get; set; }
    public string? Remark { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
