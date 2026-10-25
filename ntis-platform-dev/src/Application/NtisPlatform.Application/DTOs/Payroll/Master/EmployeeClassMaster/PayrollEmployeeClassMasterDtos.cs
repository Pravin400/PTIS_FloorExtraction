using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;

/// <summary>
/// Response DTO for Municipal Payroll Employee Class Master
/// </summary>
public class PayrollEmployeeClassMasterDto : BaseDtos
{
    public string ClassCode { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string? ClassNameMarathi { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Employee Class Master
/// </summary>
public class CreatePayrollEmployeeClassMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "ClassCode is required")]
    [MaxLength(20, ErrorMessage = "ClassCode cannot exceed 20 characters")]
    public string ClassCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "ClassName is required")]
    [MaxLength(100, ErrorMessage = "ClassName cannot exceed 100 characters")]
    public string ClassName { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "ClassNameMarathi cannot exceed 100 characters")]
    public string? ClassNameMarathi { get; set; }

    [MaxLength(250, ErrorMessage = "Description cannot exceed 250 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Employee Class Master
/// </summary>
public class UpdatePayrollEmployeeClassMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "ClassCode is required")]
    [MaxLength(20, ErrorMessage = "ClassCode cannot exceed 20 characters")]
    public string ClassCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "ClassName is required")]
    [MaxLength(100, ErrorMessage = "ClassName cannot exceed 100 characters")]
    public string ClassName { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "ClassNameMarathi cannot exceed 100 characters")]
    public string? ClassNameMarathi { get; set; }

    [MaxLength(250, ErrorMessage = "Description cannot exceed 250 characters")]
    public string? Description { get; set; }
}
