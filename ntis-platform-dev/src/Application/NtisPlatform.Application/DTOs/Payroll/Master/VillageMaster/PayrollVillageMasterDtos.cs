using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;

/// <summary>
/// Response DTO for Municipal Payroll Village Master
/// </summary>
public class PayrollVillageMasterDto : BaseDtos
{
    public int TalukaId { get; set; }
    public string VillageCode { get; set; } = string.Empty;
    public string VillageName { get; set; } = string.Empty;
    public string? VillageNameRegional { get; set; }
    public string? PINCode { get; set; }
}

/// <summary>
/// DTO for creating a new Municipal Payroll Village Master
/// </summary>
public class CreatePayrollVillageMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "TalukaId is required")]
    public int TalukaId { get; set; }

    [Required(ErrorMessage = "VillageCode is required")]
    [MaxLength(30, ErrorMessage = "VillageCode cannot exceed 30 characters")]
    public string VillageCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "VillageName is required")]
    [MaxLength(120, ErrorMessage = "VillageName cannot exceed 120 characters")]
    public string VillageName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "VillageNameRegional cannot exceed 150 characters")]
    public string? VillageNameRegional { get; set; }

    [MaxLength(10, ErrorMessage = "PINCode cannot exceed 10 characters")]
    public string? PINCode { get; set; }
}

/// <summary>
/// DTO for updating an existing Municipal Payroll Village Master
/// </summary>
public class UpdatePayrollVillageMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "TalukaId is required")]
    public int TalukaId { get; set; }

    [Required(ErrorMessage = "VillageCode is required")]
    [MaxLength(30, ErrorMessage = "VillageCode cannot exceed 30 characters")]
    public string VillageCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "VillageName is required")]
    [MaxLength(120, ErrorMessage = "VillageName cannot exceed 120 characters")]
    public string VillageName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "VillageNameRegional cannot exceed 150 characters")]
    public string? VillageNameRegional { get; set; }

    [MaxLength(10, ErrorMessage = "PINCode cannot exceed 10 characters")]
    public string? PINCode { get; set; }
}
