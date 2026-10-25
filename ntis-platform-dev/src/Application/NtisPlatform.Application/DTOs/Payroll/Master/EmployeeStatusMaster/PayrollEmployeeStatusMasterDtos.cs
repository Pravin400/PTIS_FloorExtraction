using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.EmployeeStatusMaster;

/// <summary>
/// Response DTO for Municipal Payroll Employee Status Master
/// </summary>
public class PayrollEmployeeStatusMasterDto : BaseDtos
{
    public string EmployeeStatusCode { get; set; } = string.Empty;
    public string EmployeeStatus { get; set; } = string.Empty;
    public string? EmployeeStatusMarathi { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Employee Status Master
/// </summary>
public class CreatePayrollEmployeeStatusMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "EmployeeStatusCode is required")]
    [MaxLength(50, ErrorMessage = "EmployeeStatusCode cannot exceed 50 characters")]
    public string EmployeeStatusCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "EmployeeStatus is required")]
    [MaxLength(100, ErrorMessage = "EmployeeStatus cannot exceed 100 characters")]
    public string EmployeeStatus { get; set; } = string.Empty;

    [MaxLength(200, ErrorMessage = "EmployeeStatusMarathi cannot exceed 200 characters")]
    public string? EmployeeStatusMarathi { get; set; }

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Employee Status Master
/// </summary>
public class UpdatePayrollEmployeeStatusMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "EmployeeStatusCode is required")]
    [MaxLength(50, ErrorMessage = "EmployeeStatusCode cannot exceed 50 characters")]
    public string EmployeeStatusCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "EmployeeStatus is required")]
    [MaxLength(100, ErrorMessage = "EmployeeStatus cannot exceed 100 characters")]
    public string EmployeeStatus { get; set; } = string.Empty;

    [MaxLength(200, ErrorMessage = "EmployeeStatusMarathi cannot exceed 200 characters")]
    public string? EmployeeStatusMarathi { get; set; }

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}
