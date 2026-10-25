using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.MeterTypeMaster;

public class MeterTypeMasterDto : BaseDtos
{
    public string MeterTypeCode { get; set; } = string.Empty;
    public string MeterType { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class CreateMeterTypeMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "Meter Type Code is required.")]
    [MaxLength(30, ErrorMessage = "Meter Type Code cannot exceed 30 characters.")]
    public string MeterTypeCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Meter Type is required.")]
    [MaxLength(100, ErrorMessage = "Meter Type cannot exceed 100 characters.")]
    public string MeterType { get; set; } = string.Empty;

    [MaxLength(300, ErrorMessage = "Description cannot exceed 300 characters.")]
    public string? Description { get; set; }

    public new bool IsActive { get; set; } = true;
}

public class UpdateMeterTypeMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Meter Type Code is required.")]
    [MaxLength(30, ErrorMessage = "Meter Type Code cannot exceed 30 characters.")]
    public string MeterTypeCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Meter Type is required.")]
    [MaxLength(100, ErrorMessage = "Meter Type cannot exceed 100 characters.")]
    public string MeterType { get; set; } = string.Empty;

    [MaxLength(300, ErrorMessage = "Description cannot exceed 300 characters.")]
    public string? Description { get; set; }
}
