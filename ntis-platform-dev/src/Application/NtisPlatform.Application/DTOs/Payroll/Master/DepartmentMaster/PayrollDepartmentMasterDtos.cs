using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.DepartmentMaster;

/// <summary>
/// Response DTO for Municipal Payroll Department Master
/// </summary>
public class PayrollDepartmentMasterDto : BaseDtos
{
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentNameMarathi { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Department Master
/// </summary>
public class CreatePayrollDepartmentMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "DepartmentCode is required")]
    [MaxLength(20, ErrorMessage = "DepartmentCode cannot exceed 20 characters")]
    public string DepartmentCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "DepartmentName is required")]
    [MaxLength(150, ErrorMessage = "DepartmentName cannot exceed 150 characters")]
    public string DepartmentName { get; set; } = string.Empty;

    [Required(ErrorMessage = "DepartmentNameMarathi is required")]
    [MaxLength(150, ErrorMessage = "DepartmentNameMarathi cannot exceed 150 characters")]
    public string DepartmentNameMarathi { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Department Master
/// </summary>
public class UpdatePayrollDepartmentMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "DepartmentCode is required")]
    [MaxLength(20, ErrorMessage = "DepartmentCode cannot exceed 20 characters")]
    public string DepartmentCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "DepartmentName is required")]
    [MaxLength(150, ErrorMessage = "DepartmentName cannot exceed 150 characters")]
    public string DepartmentName { get; set; } = string.Empty;

    [Required(ErrorMessage = "DepartmentNameMarathi is required")]
    [MaxLength(150, ErrorMessage = "DepartmentNameMarathi cannot exceed 150 characters")]
    public string DepartmentNameMarathi { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}
