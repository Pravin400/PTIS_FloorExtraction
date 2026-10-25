using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDepartmentMaster;

public class GrievanceDepartmentDto : BaseDtos
{
    public string DepartmentName { get; set; } = string.Empty;
    public string? DepartmentNameLocal { get; set; }

    /// <summary>
    /// FK to CORE.DepartmentMaster — set when this grievance department is linked to a core module department.
    /// </summary>
    public int? CoreDepartmentId { get; set; }

    /// <summary>
    /// Core department details resolved from CORE.DepartmentMaster (read-only, populated on response).
    /// </summary>
    public CoreDepartmentInfoDto? CoreDepartment { get; set; }
}

/// <summary>
/// Lightweight projection of CORE.DepartmentMaster for use in grievance department responses.
/// </summary>
public class CoreDepartmentInfoDto
{
    public int Id { get; set; }
    public string? DepartmentCode { get; set; }
    public string? DepartmentName { get; set; }
    public string? DepartmentNameLocal { get; set; }
    public string? DepartmentIcon { get; set; }
}

public class CreateGrievanceDepartmentDto : CreateBaseDtos
{
    [Required(ErrorMessage = "DepartmentName_Required")]
    [StringLength(100, ErrorMessage = "DepartmentName_MaxLen_100")]
    public string DepartmentName { get; set; } = string.Empty;

    [StringLength(150, ErrorMessage = "DepartmentNameLocal_MaxLen_150")]
    public string? DepartmentNameLocal { get; set; }

    /// <summary>
    /// Optional: link this grievance department to an existing CORE.DepartmentMaster record.
    /// When provided, the grievance department inherits the core department's context for cross-module routing.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "CoreDepartmentId_MustBePositive")]
    public int? CoreDepartmentId { get; set; }
}

public class UpdateGrievanceDepartmentDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "DepartmentName_Required")]
    [StringLength(100, ErrorMessage = "DepartmentName_MaxLen_100")]
    public string DepartmentName { get; set; } = string.Empty;

    [StringLength(150, ErrorMessage = "DepartmentNameLocal_MaxLen_150")]
    public string? DepartmentNameLocal { get; set; }

    /// <summary>
    /// Optional: link or re-link this grievance department to a CORE.DepartmentMaster record.
    /// Set to null to remove the link (make it a standalone grievance department).
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "CoreDepartmentId_MustBePositive")]
    public int? CoreDepartmentId { get; set; }
}

/// <summary>
/// User / officer allocated to a grievance department (via CORE.UserDepartmentAllocation -> CORE.DepartmentMaster).
/// Used by forwarding, assignment, and escalation workflows.
/// </summary>
public class GrievanceDepartmentUserDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string FullName => string.Join(" ", new[] { FirstName, MiddleName, LastName }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim();
    public string? UserCode { get; set; }
    public string? Email { get; set; }
    public string? MobileNo { get; set; }
    public int? EmployeeTypeID { get; set; }
    public bool IsActive { get; set; }
}

