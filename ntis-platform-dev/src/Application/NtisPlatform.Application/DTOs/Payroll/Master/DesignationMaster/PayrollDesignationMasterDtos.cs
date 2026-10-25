using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.DesignationMaster;

/// <summary>
/// Response DTO for Municipal Payroll Designation Master
/// </summary>
public class PayrollDesignationMasterDto : BaseDtos
{
    public string DesignationCode { get; set; } = string.Empty;
    public string DesignationName { get; set; } = string.Empty;
    public string? DesignationNameMarathi { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Designation Master
/// </summary>
public class CreatePayrollDesignationMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "DesignationCode is required")]
    [MaxLength(30, ErrorMessage = "DesignationCode cannot exceed 30 characters")]
    public string DesignationCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "DesignationName is required")]
    [MaxLength(150, ErrorMessage = "DesignationName cannot exceed 150 characters")]
    public string DesignationName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "DesignationNameMarathi cannot exceed 150 characters")]
    public string? DesignationNameMarathi { get; set; }

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Designation Master
/// </summary>
public class UpdatePayrollDesignationMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "DesignationCode is required")]
    [MaxLength(30, ErrorMessage = "DesignationCode cannot exceed 30 characters")]
    public string DesignationCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "DesignationName is required")]
    [MaxLength(150, ErrorMessage = "DesignationName cannot exceed 150 characters")]
    public string DesignationName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "DesignationNameMarathi cannot exceed 150 characters")]
    public string? DesignationNameMarathi { get; set; }

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}
