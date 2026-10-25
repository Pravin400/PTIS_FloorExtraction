using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Multi-department parallel sub-tasking for grievance tickets.
/// Maps [GRV].[GrievanceDeptForwarding].
/// </summary>
public class GrievanceDeptForwardingEntity : BaseEntity, IHardDeletable
{
    public int GrievanceApplicationId { get; set; }
    public long ActivityLogId { get; set; }
    public int ForwardedToDeptId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string ForwardingStatus { get; set; } = "PENDING";
    public string? Remark { get; set; }
    public DateTime ForwardedAt { get; set; } = DateTime.Now;
    public DateTime? ResolvedAt { get; set; }
    public bool MarkedForDeletion { get; set; } = false;
    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual GrievanceApplicationEntity? GrievanceApplication { get; set; }
    public virtual GrievanceActivityLogEntity? ActivityLog { get; set; }
    public virtual GrievanceDepartmentMasterEntity? ForwardedToDept { get; set; }
    public virtual UserEntity? AssignedToUser { get; set; }
}
