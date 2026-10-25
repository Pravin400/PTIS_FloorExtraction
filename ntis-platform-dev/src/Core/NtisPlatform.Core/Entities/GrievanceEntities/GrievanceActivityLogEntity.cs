using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Append-only audit trail and timeline log for grievance status transitions and actions.
/// Maps [GRV].[GrievanceActivityLog].
/// </summary>
public class GrievanceActivityLogEntity
{
    public long Id { get; set; }
    public int GrievanceApplicationId { get; set; }
    public int? FromStateId { get; set; }
    public int ToStateId { get; set; }
    public int? TransitionId { get; set; }
    public int? ActionByUserId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? Remark { get; set; }
    public DateTime ActionAt { get; set; } = DateTime.Now;


    public virtual GrievanceApplicationEntity? GrievanceApplication { get; set; }
    public virtual GrievanceWorkflowStateEntity? FromState { get; set; }
    public virtual GrievanceWorkflowStateEntity? ToState { get; set; }
    public virtual GrievanceWorkflowTransitionEntity? Transition { get; set; }
    public virtual UserEntity? ActionByUser { get; set; }
    public virtual UserEntity? AssignedToUser { get; set; }

    public virtual ICollection<GrievanceDeptForwardingEntity> DeptForwardings { get; set; } = new List<GrievanceDeptForwardingEntity>();
}
