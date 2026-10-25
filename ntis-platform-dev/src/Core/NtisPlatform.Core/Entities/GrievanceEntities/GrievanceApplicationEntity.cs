using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;


namespace NtisPlatform.Core.Entities.GrievanceEntities;

[Table("GrievanceApplication", Schema = "GRV")]
public class GrievanceApplicationEntity : BaseEntity, IHardDeletable
{
    [Required]
    [StringLength(30)]
    public string GrievanceNo { get; set; } = string.Empty;

    [Required]
    public int CitizenId { get; set; }

    [Required]
    public int GrievanceDepartmentId { get; set; }

    [Required]
    public int GrievanceTypeId { get; set; }

    [StringLength(500)]
    public string? RoadLandmark { get; set; }

    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and +90 degrees.")]
    public decimal? Latitude { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and +180 degrees.")]
    public decimal? Longitude { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    public int WorkflowId { get; set; }

    [Required]
    public int CurrentStateId { get; set; }

    public int? CurrentAssignedToUserId { get; set; }

    [Required]
    public DateTime SubmittedDate { get; set; } = DateTime.Now;

    public DateTime? ResolvedDate { get; set; }

    public DateTime? ClosedDate { get; set; }

    public bool MarkedForDeletion { get; set; } = false;

    public DateTime? MarkedForDeletionDate { get; set; }

    [ForeignKey(nameof(CitizenId))]
    public virtual CitizenMasterEntity? Citizen { get; set; }

    [ForeignKey(nameof(GrievanceDepartmentId))]
    public virtual GrievanceDepartmentMasterEntity? GrievanceDepartment { get; set; }

    [ForeignKey(nameof(GrievanceTypeId))]
    public virtual GrievanceTypeMasterEntity? GrievanceType { get; set; }

    [ForeignKey(nameof(WorkflowId))]
    public virtual GrievanceWorkflowEntity? Workflow { get; set; }

    [ForeignKey(nameof(CurrentStateId))]
    public virtual GrievanceWorkflowStateEntity? CurrentState { get; set; }

    [ForeignKey(nameof(CurrentAssignedToUserId))]
    public virtual UserEntity? CurrentAssignedToUser { get; set; }

    public int? WardId { get; set; }

    [ForeignKey(nameof(WardId))]
    public virtual WardEntity? Ward { get; set; }

    public int? ZoneId { get; set; }

    [ForeignKey(nameof(ZoneId))]
    public virtual ZoneEntity? Zone { get; set; }

    public virtual ICollection<GrievanceActivityLogEntity> ActivityLogs { get; set; } = new List<GrievanceActivityLogEntity>();
    public virtual ICollection<GrievanceDeptForwardingEntity> DeptForwardings { get; set; } = new List<GrievanceDeptForwardingEntity>();
    public virtual ICollection<GrievanceEscalationEntity> Escalations { get; set; } = new List<GrievanceEscalationEntity>();
}
