using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionRoomWiseMinusData - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionRoomWiseMinusDataEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionRoomWiseSubmissionId { get; set; }
    public int? SourceRoomWiseMinusDataId { get; set; }
    public double? LengthMtr { get; set; }
    public double? WidthMtr { get; set; }
    public double? AreaSqMtr { get; set; }
    public double? HeightMtr { get; set; }
    public double? Base1Mtr { get; set; }
    public double? Base2Mtr { get; set; }
    public string? Shape { get; set; }
    public bool IsOffset { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
