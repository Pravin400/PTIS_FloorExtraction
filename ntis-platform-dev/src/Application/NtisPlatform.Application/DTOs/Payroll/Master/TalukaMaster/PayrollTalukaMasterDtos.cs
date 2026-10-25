using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.TalukaMaster;

/// <summary>
/// Response DTO for Municipal Payroll Taluka Master
/// </summary>
public class PayrollTalukaMasterDto : BaseDtos
{
    public int DistrictId { get; set; }
    public string TalukaCode { get; set; } = string.Empty;
    public string TalukaName { get; set; } = string.Empty;
    public string? TalukaNameRegional { get; set; }
    public bool IsCity { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Taluka Master
/// </summary>
public class CreatePayrollTalukaMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "DistrictId is required")]
    public int DistrictId { get; set; }

    [Required(ErrorMessage = "TalukaCode is required")]
    [MaxLength(30, ErrorMessage = "TalukaCode cannot exceed 30 characters")]
    public string TalukaCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "TalukaName is required")]
    [MaxLength(100, ErrorMessage = "TalukaName cannot exceed 100 characters")]
    public string TalukaName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "TalukaNameRegional cannot exceed 150 characters")]
    public string? TalukaNameRegional { get; set; }

    public bool IsCity { get; set; } = false;
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Taluka Master
/// </summary>
public class UpdatePayrollTalukaMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "DistrictId is required")]
    public int DistrictId { get; set; }

    [Required(ErrorMessage = "TalukaCode is required")]
    [MaxLength(30, ErrorMessage = "TalukaCode cannot exceed 30 characters")]
    public string TalukaCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "TalukaName is required")]
    [MaxLength(100, ErrorMessage = "TalukaName cannot exceed 100 characters")]
    public string TalukaName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "TalukaNameRegional cannot exceed 150 characters")]
    public string? TalukaNameRegional { get; set; }

    public bool IsCity { get; set; } = false;
}
