using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.StateMaster;

/// <summary>
/// Response DTO for Municipal Payroll State Master
/// </summary>
public class PayrollStateMasterDto : BaseDtos
{
    public string StateCode { get; set; } = string.Empty;
    public string StateName { get; set; } = string.Empty;
    public string? StateNameRegional { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll State Master
/// </summary>
public class CreatePayrollStateMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "StateCode is required")]
    [MaxLength(30, ErrorMessage = "StateCode cannot exceed 30 characters")]
    public string StateCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "StateName is required")]
    [MaxLength(100, ErrorMessage = "StateName cannot exceed 100 characters")]
    public string StateName { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "StateNameRegional cannot exceed 100 characters")]
    public string? StateNameRegional { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll State Master
/// </summary>
public class UpdatePayrollStateMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "StateCode is required")]
    [MaxLength(30, ErrorMessage = "StateCode cannot exceed 30 characters")]
    public string StateCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "StateName is required")]
    [MaxLength(100, ErrorMessage = "StateName cannot exceed 100 characters")]
    public string StateName { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "StateNameRegional cannot exceed 100 characters")]
    public string? StateNameRegional { get; set; }
}
