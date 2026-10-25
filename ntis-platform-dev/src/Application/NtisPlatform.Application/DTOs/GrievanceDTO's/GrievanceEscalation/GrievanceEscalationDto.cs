using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;

/// <summary>
/// Response DTO representing an observer poke or formal grievance escalation
/// </summary>
public class GrievanceEscalationDto : BaseDtos
{
    public int GrievanceApplicationId { get; set; }
    public string? GrievanceNo { get; set; }

    public int? WardId { get; set; }
    public string? WardNo { get; set; }
    public int? ZoneId { get; set; }
    public string? ZoneNo { get; set; }

    public int EscalatedByUserId { get; set; }
    public string? EscalatedByUserName { get; set; }
    public string? EscalatedByFullName { get; set; }

    public string Reason { get; set; } = string.Empty;
    public string Priority { get; set; } = "NORMAL";
    public string EscalationStatus { get; set; } = "PENDING";

    public int? TargetDepartmentId { get; set; }
    public string? TargetDepartmentName { get; set; }

    public int? TargetAssignedToUserId { get; set; }
    public string? TargetAssignedToUserName { get; set; }

    public string? StaffResponse { get; set; }
    public int? RespondedByUserId { get; set; }
    public string? RespondedByUserName { get; set; }
    public DateTime? RespondedAt { get; set; }
}

/// <summary>
/// Request DTO for a Ward / Zone Representative / Observer to poke or escalate a grievance
/// </summary>
public class CreateGrievanceEscalationDto : CreateBaseDtos
{
    [Required(ErrorMessage = "GrievanceApplicationId is required")]
    public int GrievanceApplicationId { get; set; }

    public int? WardId { get; set; }
    public int? ZoneId { get; set; }

    [Required(ErrorMessage = "Reason is required")]
    [StringLength(1000, ErrorMessage = "Reason cannot exceed 1000 characters")]
    public string Reason { get; set; } = string.Empty;

    [StringLength(20, ErrorMessage = "Priority cannot exceed 20 characters")]
    [RegularExpression(@"^(?i:NORMAL|HIGH|URGENT)$", ErrorMessage = "Priority must be NORMAL, HIGH, or URGENT")]
    public string Priority { get; set; } = "NORMAL"; // NORMAL, HIGH, URGENT
}

/// <summary>
/// Request DTO for staff or HOD to respond to an observer poke
/// </summary>
public class RespondGrievanceEscalationDto
{
    [Required(ErrorMessage = "StaffResponse is required")]
    [StringLength(2000, ErrorMessage = "StaffResponse cannot exceed 2000 characters")]
    public string StaffResponse { get; set; } = string.Empty;

    /// <summary>
    /// Target status after responding: ACKNOWLEDGED, RESOLVED, REJECTED, CLOSED
    /// </summary>
    [Required(ErrorMessage = "EscalationStatus is required")]
    [StringLength(30, ErrorMessage = "EscalationStatus cannot exceed 30 characters")]
    [RegularExpression(@"^(?i:ACKNOWLEDGED|RESOLVED|REJECTED|CLOSED)$", ErrorMessage = "EscalationStatus must be ACKNOWLEDGED, RESOLVED, REJECTED, or CLOSED")]
    public string EscalationStatus { get; set; } = "ACKNOWLEDGED";
}
