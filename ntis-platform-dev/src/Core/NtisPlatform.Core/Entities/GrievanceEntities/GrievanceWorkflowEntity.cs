namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Defines a named grievance workflow for a council.
/// Maps [GRV].[GrievanceWorkflow].
/// </summary>
public class GrievanceWorkflowEntity : BaseEntity
{
    public string WorkflowName { get; set; } = string.Empty;
    public string? WorkflowNameLocal { get; set; }
    public string? Description { get; set; }
    public bool IsDefault { get; set; }

    public virtual ICollection<GrievanceWorkflowStateEntity> States { get; set; } = new List<GrievanceWorkflowStateEntity>();
    public virtual ICollection<GrievanceWorkflowTransitionEntity> Transitions { get; set; } = new List<GrievanceWorkflowTransitionEntity>();
    public virtual ICollection<GrievanceApplicationEntity> GrievanceApplications { get; set; } = new List<GrievanceApplicationEntity>();
}
