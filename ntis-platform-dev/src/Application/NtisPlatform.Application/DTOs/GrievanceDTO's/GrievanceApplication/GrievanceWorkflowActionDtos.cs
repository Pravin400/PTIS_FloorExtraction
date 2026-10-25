using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;

/// <summary>
/// Request DTO to assign a staff member / officer to a grievance ticket
/// </summary>
public class AssignGrievanceDto
{
    [Required(ErrorMessage = "AssignedToUserId is required")]
    public int AssignedToUserId { get; set; }

    [StringLength(2000, ErrorMessage = "Remark cannot exceed 2000 characters")]
    public string? Remark { get; set; }
}

/// <summary>
/// Request DTO to forward a grievance ticket to another department and/or officer
/// </summary>
public class ForwardGrievanceDto
{
    [Required(ErrorMessage = "ForwardedToDeptId is required")]
    public int ForwardedToDeptId { get; set; }

    public int? AssignedToUserId { get; set; }

    [StringLength(2000, ErrorMessage = "Remark cannot exceed 2000 characters")]
    public string? Remark { get; set; }

    /// <summary>
    /// If true, also changes the grievance's primary department to the target department
    /// </summary>
    public bool UpdatePrimaryDepartment { get; set; } = false;
}

/// <summary>
/// Request DTO to move a grievance ticket to a new workflow state (proceed/resolve/close)
/// </summary>
public class TransitionGrievanceStateDto
{
    [Required(ErrorMessage = "ToStateId is required")]
    public int ToStateId { get; set; }

    public int? AssignedToUserId { get; set; }

    public int? TransitionId { get; set; }

    [StringLength(2000, ErrorMessage = "Remark cannot exceed 2000 characters")]
    public string? Remark { get; set; }
}
