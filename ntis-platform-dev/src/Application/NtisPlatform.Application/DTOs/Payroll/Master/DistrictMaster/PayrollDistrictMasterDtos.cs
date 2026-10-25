using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.DistrictMaster;

/// <summary>
/// Response DTO for Municipal Payroll District Master
/// </summary>
public class PayrollDistrictMasterDto : BaseDtos
{
    public int StateId { get; set; }
    public string DistrictCode { get; set; } = string.Empty;
    public string DistrictName { get; set; } = string.Empty;
    public string? DistrictNameRegional { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll District Master
/// </summary>
public class CreatePayrollDistrictMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "StateId is required")]
    public int StateId { get; set; }

    [Required(ErrorMessage = "DistrictCode is required")]
    [MaxLength(30, ErrorMessage = "DistrictCode cannot exceed 30 characters")]
    public string DistrictCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "DistrictName is required")]
    [MaxLength(100, ErrorMessage = "DistrictName cannot exceed 100 characters")]
    public string DistrictName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "DistrictNameRegional cannot exceed 150 characters")]
    public string? DistrictNameRegional { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll District Master
/// </summary>
public class UpdatePayrollDistrictMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "StateId is required")]
    public int StateId { get; set; }

    [Required(ErrorMessage = "DistrictCode is required")]
    [MaxLength(30, ErrorMessage = "DistrictCode cannot exceed 30 characters")]
    public string DistrictCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "DistrictName is required")]
    [MaxLength(100, ErrorMessage = "DistrictName cannot exceed 100 characters")]
    public string DistrictName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "DistrictNameRegional cannot exceed 150 characters")]
    public string? DistrictNameRegional { get; set; }
}
