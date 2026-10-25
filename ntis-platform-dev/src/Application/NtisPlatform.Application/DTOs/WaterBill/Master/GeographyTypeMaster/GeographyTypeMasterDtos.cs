using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.GeographyTypeMaster;

public class GeographyTypeMasterDto : BaseDtos
{
    public string GeographyTypeCode { get; set; } = string.Empty;
    public string GeographyType { get; set; } = string.Empty;
    public int LevelNo { get; set; }
}

public class CreateGeographyTypeMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "Geography Type Code is required.")]
    [MaxLength(30, ErrorMessage = "Geography Type Code cannot exceed 30 characters.")]
    public string GeographyTypeCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Geography Type is required.")]
    [MaxLength(100, ErrorMessage = "Geography Type cannot exceed 100 characters.")]
    public string GeographyType { get; set; } = string.Empty;

    [Required(ErrorMessage = "Level No is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Level No must be greater than 0.")]
    public int LevelNo { get; set; }

    public new bool IsActive { get; set; } = true;
}

public class UpdateGeographyTypeMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Geography Type Code is required.")]
    [MaxLength(30, ErrorMessage = "Geography Type Code cannot exceed 30 characters.")]
    public string GeographyTypeCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Geography Type is required.")]
    [MaxLength(100, ErrorMessage = "Geography Type cannot exceed 100 characters.")]
    public string GeographyType { get; set; } = string.Empty;

    [Required(ErrorMessage = "Level No is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Level No must be greater than 0.")]
    public int LevelNo { get; set; }
}
