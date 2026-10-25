using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.QualificationMaster;

/// <summary>
/// Response DTO for Municipal Payroll Qualification Master
/// </summary>
public class PayrollQualificationMasterDto : BaseDtos
{
    public string QualificationCode { get; set; } = string.Empty;
    public string QualificationName { get; set; } = string.Empty;
    public string? QualificationNameRegional { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Qualification Master
/// </summary>
public class CreatePayrollQualificationMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "QualificationCode is required")]
    [MaxLength(30, ErrorMessage = "QualificationCode cannot exceed 30 characters")]
    public string QualificationCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "QualificationName is required")]
    [MaxLength(100, ErrorMessage = "QualificationName cannot exceed 100 characters")]
    public string QualificationName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "QualificationNameRegional cannot exceed 150 characters")]
    public string? QualificationNameRegional { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Qualification Master
/// </summary>
public class UpdatePayrollQualificationMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "QualificationCode is required")]
    [MaxLength(30, ErrorMessage = "QualificationCode cannot exceed 30 characters")]
    public string QualificationCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "QualificationName is required")]
    [MaxLength(100, ErrorMessage = "QualificationName cannot exceed 100 characters")]
    public string QualificationName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "QualificationNameRegional cannot exceed 150 characters")]
    public string? QualificationNameRegional { get; set; }
}
