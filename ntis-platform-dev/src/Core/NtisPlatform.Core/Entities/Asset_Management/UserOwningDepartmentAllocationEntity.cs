using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.Asset_Management;

/// <summary>
/// Maps to [AMS].[UserOwningDepartmentAllocation]. Scopes a CORE.UserMaster user to an AMS.OwningDepartmentMaster
/// row, optionally with the user's AMS.DesignationMaster post in that department.
/// UQ_UserOwningDepartmentAllocation_User_OwningDepartment allows one row per (UserId, OwningDepartmentId),
/// inactive rows included — a re-allocated department re-uses its row.
/// </summary>
public class UserOwningDepartmentAllocationEntity : BaseEntity, IHardDeletable
{
    public int UserId { get; set; }
    public int OwningDepartmentId { get; set; }
    public int? DesignationId { get; set; }

    // IHardDeletable
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }

    // Plain, non-virtual nav prop (no EF attributes) - only needed so EF Core can fix up
    // UserId from a newly-created UserEntity whose Id isn't known until SaveChanges runs.
    public UserEntity? User { get; set; }
}
