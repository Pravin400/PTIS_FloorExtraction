namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// State machine transition within a grievance workflow.
/// Maps [GRV].[GrievanceWorkflowTransition].
/// </summary>
public class GrievanceWorkflowTransitionEntity : BaseEntity
{
    public int WorkflowId { get; set; }
    public int FromStateId { get; set; }
    public int ToStateId { get; set; }
    public string TransitionName { get; set; } = string.Empty;
    public bool CanForwardToDept { get; set; }
    public bool RemarkRequired { get; set; }

    public virtual GrievanceWorkflowEntity? Workflow { get; set; }
    public virtual GrievanceWorkflowStateEntity? FromState { get; set; }
    public virtual GrievanceWorkflowStateEntity? ToState { get; set; }
    public virtual ICollection<GrievanceActivityLogEntity> ActivityLogs { get; set; } = new List<GrievanceActivityLogEntity>();
}
