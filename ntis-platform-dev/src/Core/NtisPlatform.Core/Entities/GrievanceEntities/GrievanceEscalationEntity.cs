using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Represents an observer poke or formal grievance escalation issued by a Ward Representative / Area Observer.
/// Maps [GRV].[GrievanceEscalation].
/// </summary>
[Table("GrievanceEscalation", Schema = "GRV")]
public class GrievanceEscalationEntity : BaseEntity, IHardDeletable
{
    [Required]
    public int GrievanceApplicationId { get; set; }

    public int? WardId { get; set; }
    public int? ZoneId { get; set; }

    /// <summary>
    /// User ID of the Ward Representative / Observer who created the escalation
    /// </summary>
    [Required]
    public int EscalatedByUserId { get; set; }

    /// <summary>
    /// Reason or specific concern for the escalation
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Priority level: NORMAL, HIGH, URGENT
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Priority { get; set; } = "NORMAL";

    /// <summary>
    /// Current status: PENDING, ACKNOWLEDGED, RESOLVED, REJECTED, CLOSED
    /// </summary>
    [Required]
    [StringLength(30)]
    public string EscalationStatus { get; set; } = "PENDING";

    /// <summary>
    /// Department snapshot when escalated
    /// </summary>
    public int? TargetDepartmentId { get; set; }

    /// <summary>
    /// Assigned staff officer snapshot when escalated
    /// </summary>
    public int? TargetAssignedToUserId { get; set; }

    /// <summary>
    /// Official response or progress update provided by corporation staff
    /// </summary>
    [StringLength(2000)]
    public string? StaffResponse { get; set; }

    /// <summary>
    /// Staff User ID who responded to the escalation
    /// </summary>
    public int? RespondedByUserId { get; set; }

    /// <summary>
    /// Timestamp when staff responded
    /// </summary>
    public DateTime? RespondedAt { get; set; }

    public bool MarkedForDeletion { get; set; } = false;
    public DateTime? MarkedForDeletionDate { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(GrievanceApplicationId))]
    public virtual GrievanceApplicationEntity? GrievanceApplication { get; set; }

    [ForeignKey(nameof(WardId))]
    public virtual WardEntity? Ward { get; set; }

    [ForeignKey(nameof(ZoneId))]
    public virtual ZoneEntity? Zone { get; set; }

    [ForeignKey(nameof(EscalatedByUserId))]
    public virtual UserEntity? EscalatedByUser { get; set; }

    [ForeignKey(nameof(TargetDepartmentId))]
    public virtual GrievanceDepartmentMasterEntity? TargetDepartment { get; set; }

    [ForeignKey(nameof(TargetAssignedToUserId))]
    public virtual UserEntity? TargetAssignedToUser { get; set; }

    [ForeignKey(nameof(RespondedByUserId))]
    public virtual UserEntity? RespondedByUser { get; set; }
}
