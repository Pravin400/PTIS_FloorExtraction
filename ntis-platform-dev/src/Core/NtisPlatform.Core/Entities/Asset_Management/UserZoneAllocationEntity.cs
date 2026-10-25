using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// Maps to [AMS].[UserZoneAllocation]. Scopes a CORE.UserMaster user to one PTIS.WardMaster row and the
/// PTIS.ZoneMaster row it belongs to; a user allocated a whole zone has one row per ward of that zone.
/// UQ_UserZoneAllocation_User_Zone_Ward allows one row per (UserId, ZoneId, WardId), inactive rows
/// included — a re-allocated ward re-uses its row.
/// </summary>
public class UserZoneAllocationEntity : BaseEntity, IHardDeletable
{
    public int UserId { get; set; }
    public int ZoneId { get; set; }
    public int WardId { get; set; }

    // IHardDeletable
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    // Plain, non-virtual nav prop (no EF attributes) - only needed so EF Core can fix up
    // UserId from a newly-created UserEntity whose Id isn't known until SaveChanges runs.
    public UserEntity? User { get; set; }
}
