using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.EmployeeTypeMaster;

/// <summary>
/// Response DTO for Municipal Payroll Employee Type Master
/// </summary>
public class PayrollEmployeeTypeMasterDto : BaseDtos
{
    public string EmployeeTypeCode { get; set; } = string.Empty;
    public string EmployeeTypeName { get; set; } = string.Empty;
    public string? EmployeeTypeNameMarathi { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Employee Type Master
/// </summary>
public class CreatePayrollEmployeeTypeMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "EmployeeTypeCode is required")]
    [MaxLength(30, ErrorMessage = "EmployeeTypeCode cannot exceed 30 characters")]
    public string EmployeeTypeCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "EmployeeTypeName is required")]
    [MaxLength(100, ErrorMessage = "EmployeeTypeName cannot exceed 100 characters")]
    public string EmployeeTypeName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "EmployeeTypeNameMarathi cannot exceed 150 characters")]
    public string? EmployeeTypeNameMarathi { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Employee Type Master
/// </summary>
public class UpdatePayrollEmployeeTypeMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "EmployeeTypeCode is required")]
    [MaxLength(30, ErrorMessage = "EmployeeTypeCode cannot exceed 30 characters")]
    public string EmployeeTypeCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "EmployeeTypeName is required")]
    [MaxLength(100, ErrorMessage = "EmployeeTypeName cannot exceed 100 characters")]
    public string EmployeeTypeName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "EmployeeTypeNameMarathi cannot exceed 150 characters")]
    public string? EmployeeTypeNameMarathi { get; set; }
}
