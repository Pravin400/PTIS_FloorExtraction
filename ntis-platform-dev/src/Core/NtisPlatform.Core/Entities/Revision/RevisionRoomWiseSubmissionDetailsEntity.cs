using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Revision;

/// <summary>
/// PTIS.RevisionRoomWiseSubmissionDetails - revision snapshot table, mapped column-for-column against the authoritative CREATE TABLE script.
/// Written by the revision stored procedures; relationships to master tables are enforced in the database only.
/// </summary>
public class RevisionRoomWiseSubmissionDetailsEntity : LongBaseEntity, IHardDeletable
{
    public long RevisionMastId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public long RevisionPropertyMastId { get; set; }
    public long? RevisionPropertyDetailsId { get; set; }
    public int? SourceRoomWiseSubmissionDetailsId { get; set; }
    public double? LengthMtr { get; set; }
    public double? WidthMtr { get; set; }
    public double? AreaSqMtr { get; set; }
    public double? HeightMtr { get; set; }
    public double? Base1Mtr { get; set; }
    public double? Base2Mtr { get; set; }
    public int? NoOfRooms { get; set; }
    public double? TotalAreaSqMtr { get; set; }
    public string? Shape { get; set; }
    public string? RoomNo { get; set; }
    public bool OuterYesNo { get; set; }
    public int? RoomTypeId { get; set; }
    public string? SubmissionType { get; set; }
    public bool MinusYesNo { get; set; }

    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
