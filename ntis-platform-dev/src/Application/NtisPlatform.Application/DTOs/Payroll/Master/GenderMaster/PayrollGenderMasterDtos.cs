using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.GenderMaster;

/// <summary>
/// Response DTO for Municipal Payroll Gender Master
/// </summary>
public class PayrollGenderMasterDto : BaseDtos
{
    public string GenderCode { get; set; } = string.Empty;
    public string GenderName { get; set; } = string.Empty;
    public string? GenderNameRegional { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Gender Master
/// </summary>
public class CreatePayrollGenderMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "GenderCode is required")]
    [MaxLength(20, ErrorMessage = "GenderCode cannot exceed 20 characters")]
    public string GenderCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "GenderName is required")]
    [MaxLength(50, ErrorMessage = "GenderName cannot exceed 50 characters")]
    public string GenderName { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "GenderNameRegional cannot exceed 100 characters")]
    public string? GenderNameRegional { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Gender Master
/// </summary>
public class UpdatePayrollGenderMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "GenderCode is required")]
    [MaxLength(20, ErrorMessage = "GenderCode cannot exceed 20 characters")]
    public string GenderCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "GenderName is required")]
    [MaxLength(50, ErrorMessage = "GenderName cannot exceed 50 characters")]
    public string GenderName { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "GenderNameRegional cannot exceed 100 characters")]
    public string? GenderNameRegional { get; set; }
}
