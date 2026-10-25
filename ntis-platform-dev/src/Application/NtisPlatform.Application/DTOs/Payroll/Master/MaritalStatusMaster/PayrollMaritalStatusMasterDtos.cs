using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.MaritalStatusMaster;

/// <summary>
/// Response DTO for Municipal Payroll Marital Status Master
/// </summary>
public class PayrollMaritalStatusMasterDto : BaseDtos
{
    public string MaritalStatusCode { get; set; } = string.Empty;
    public string MaritalStatusName { get; set; } = string.Empty;
    public string? MaritalStatusNameRegional { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Marital Status Master
/// </summary>
public class CreatePayrollMaritalStatusMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "MaritalStatusCode is required")]
    [MaxLength(20, ErrorMessage = "MaritalStatusCode cannot exceed 20 characters")]
    public string MaritalStatusCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "MaritalStatusName is required")]
    [MaxLength(100, ErrorMessage = "MaritalStatusName cannot exceed 100 characters")]
    public string MaritalStatusName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "MaritalStatusNameRegional cannot exceed 150 characters")]
    public string? MaritalStatusNameRegional { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Marital Status Master
/// </summary>
public class UpdatePayrollMaritalStatusMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "MaritalStatusCode is required")]
    [MaxLength(20, ErrorMessage = "MaritalStatusCode cannot exceed 20 characters")]
    public string MaritalStatusCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "MaritalStatusName is required")]
    [MaxLength(100, ErrorMessage = "MaritalStatusName cannot exceed 100 characters")]
    public string MaritalStatusName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "MaritalStatusNameRegional cannot exceed 150 characters")]
    public string? MaritalStatusNameRegional { get; set; }
}
