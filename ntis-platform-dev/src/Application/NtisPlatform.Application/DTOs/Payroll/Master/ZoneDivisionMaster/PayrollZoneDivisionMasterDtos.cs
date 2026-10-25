using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;

/// <summary>
/// Response DTO for Municipal Payroll Zone Division Master
/// </summary>
public class PayrollZoneDivisionMasterDto : BaseDtos
{
    public string ZoneDivisionCode { get; set; } = string.Empty;
    public string ZoneDivisionName { get; set; } = string.Empty;
    public string? ZoneDivisionNameRegional { get; set; }
    public string? Address { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Zone Division Master
/// </summary>
public class CreatePayrollZoneDivisionMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "ZoneDivisionCode is required")]
    [MaxLength(30, ErrorMessage = "ZoneDivisionCode cannot exceed 30 characters")]
    public string ZoneDivisionCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "ZoneDivisionName is required")]
    [MaxLength(150, ErrorMessage = "ZoneDivisionName cannot exceed 150 characters")]
    public string ZoneDivisionName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "ZoneDivisionNameRegional cannot exceed 150 characters")]
    public string? ZoneDivisionNameRegional { get; set; }

    [MaxLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? Address { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Zone Division Master
/// </summary>
public class UpdatePayrollZoneDivisionMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "ZoneDivisionCode is required")]
    [MaxLength(30, ErrorMessage = "ZoneDivisionCode cannot exceed 30 characters")]
    public string ZoneDivisionCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "ZoneDivisionName is required")]
    [MaxLength(150, ErrorMessage = "ZoneDivisionName cannot exceed 150 characters")]
    public string ZoneDivisionName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "ZoneDivisionNameRegional cannot exceed 150 characters")]
    public string? ZoneDivisionNameRegional { get; set; }

    [MaxLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? Address { get; set; }
}
