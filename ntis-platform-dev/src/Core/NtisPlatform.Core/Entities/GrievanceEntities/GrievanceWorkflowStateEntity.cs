namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Dynamic state within a grievance workflow.
/// Maps [GRV].[GrievanceWorkflowState].
/// </summary>
public class GrievanceWorkflowStateEntity : BaseEntity
{
    public int WorkflowId { get; set; }
    public string StateName { get; set; } = string.Empty;
    public string? StateNameLocal { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsInitial { get; set; }
    public bool IsFinal { get; set; }

    public virtual GrievanceWorkflowEntity? Workflow { get; set; }
    public virtual ICollection<GrievanceWorkflowTransitionEntity> OutgoingTransitions { get; set; } = new List<GrievanceWorkflowTransitionEntity>();
    public virtual ICollection<GrievanceWorkflowTransitionEntity> IncomingTransitions { get; set; } = new List<GrievanceWorkflowTransitionEntity>();
    public virtual ICollection<GrievanceApplicationEntity> GrievanceApplications { get; set; } = new List<GrievanceApplicationEntity>();
    public virtual ICollection<GrievanceActivityLogEntity> FromActivityLogs { get; set; } = new List<GrievanceActivityLogEntity>();
    public virtual ICollection<GrievanceActivityLogEntity> ToActivityLogs { get; set; } = new List<GrievanceActivityLogEntity>();
}
