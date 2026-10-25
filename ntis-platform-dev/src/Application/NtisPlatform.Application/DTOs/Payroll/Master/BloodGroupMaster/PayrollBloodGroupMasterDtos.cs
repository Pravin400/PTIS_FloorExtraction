using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;

/// <summary>
/// Response DTO for Municipal Payroll Blood Group Master
/// </summary>
public class PayrollBloodGroupMasterDto : BaseDtos
{
    public string BloodGroupCode { get; set; } = string.Empty;
    public string BloodGroupName { get; set; } = string.Empty;
}

/// <summary>
/// DTO for creating a new Municipal Payroll Blood Group Master
/// </summary>
public class CreatePayrollBloodGroupMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "BloodGroupCode is required")]
    [MaxLength(20, ErrorMessage = "BloodGroupCode cannot exceed 20 characters")]
    public string BloodGroupCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "BloodGroupName is required")]
    [MaxLength(50, ErrorMessage = "BloodGroupName cannot exceed 50 characters")]
    public string BloodGroupName { get; set; } = string.Empty;
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Blood Group Master
/// </summary> 
public class UpdatePayrollBloodGroupMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "BloodGroupCode is required")]
    [MaxLength(20, ErrorMessage = "BloodGroupCode cannot exceed 20 characters")]
    public string BloodGroupCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "BloodGroupName is required")]
    [MaxLength(50, ErrorMessage = "BloodGroupName cannot exceed 50 characters")]
    public string BloodGroupName { get; set; } = string.Empty;
}
