using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;

public class MeterTestStatusMasterDto : BaseDtos
{
    public string MeterTestStatusCode { get; set; } = string.Empty;
    public string MeterTestStatus { get; set; } = string.Empty;
}

public class CreateMeterTestStatusMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "Meter Test Status Code is required.")]
    [MaxLength(30, ErrorMessage = "Meter Test Status Code cannot exceed 30 characters.")]
    public string MeterTestStatusCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Meter Test Status is required.")]
    [MaxLength(100, ErrorMessage = "Meter Test Status cannot exceed 100 characters.")]
    public string MeterTestStatus { get; set; } = string.Empty;

    public new bool IsActive { get; set; } = true;
}

public class UpdateMeterTestStatusMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Meter Test Status Code is required.")]
    [MaxLength(30, ErrorMessage = "Meter Test Status Code cannot exceed 30 characters.")]
    public string MeterTestStatusCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Meter Test Status is required.")]
    [MaxLength(100, ErrorMessage = "Meter Test Status cannot exceed 100 characters.")]
    public string MeterTestStatus { get; set; } = string.Empty;
}
