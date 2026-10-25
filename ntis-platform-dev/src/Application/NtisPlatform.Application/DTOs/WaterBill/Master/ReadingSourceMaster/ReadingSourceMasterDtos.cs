using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.ReadingSourceMaster;

public class ReadingSourceMasterDto : BaseDtos
{
    public string ReadingSourceCode { get; set; } = string.Empty;
    public string ReadingSource { get; set; } = string.Empty;
}

public class CreateReadingSourceMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "Reading Source Code is required.")]
    [MaxLength(30, ErrorMessage = "Reading Source Code cannot exceed 30 characters.")]
    public string ReadingSourceCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Reading Source is required.")]
    [MaxLength(100, ErrorMessage = "Reading Source cannot exceed 100 characters.")]
    public string ReadingSource { get; set; } = string.Empty;

    public new bool IsActive { get; set; } = true;
}

public class UpdateReadingSourceMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Reading Source Code is required.")]
    [MaxLength(30, ErrorMessage = "Reading Source Code cannot exceed 30 characters.")]
    public string ReadingSourceCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Reading Source is required.")]
    [MaxLength(100, ErrorMessage = "Reading Source cannot exceed 100 characters.")]
    public string ReadingSource { get; set; } = string.Empty;
}
