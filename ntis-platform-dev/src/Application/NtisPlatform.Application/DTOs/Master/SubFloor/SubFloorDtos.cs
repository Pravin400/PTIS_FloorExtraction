using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs;

public class SubFloorDto : BaseDtos
{
    public int Id { get; set; }
    public string SubFloorCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DescriptionEnglish { get; set; }
    public decimal? SubFloorPercentage { get; set; }
    public int? SequenceNo { get; set; }
}

public class CreateSubFloorDto : CreateBaseDtos
{
    [Required(ErrorMessage = "SubFloor_SubFloorCode_Required")]
    [StringLength(10, ErrorMessage = "SubFloor_SubFloorCode_MaxLen_10")]
    public string SubFloorCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "SubFloor_Description_Required")]
    [StringLength(200, ErrorMessage = "SubFloor_Description_MaxLen_200")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "SubFloor_DescriptionEnglish_Required")]
    [StringLength(100, ErrorMessage = "SubFloor_DescriptionEnglish_MaxLen_100")]
    public string DescriptionEnglish { get; set; } = string.Empty;

    public decimal? SubFloorPercentage { get; set; }
    public int? SequenceNo { get; set; }
}

public class UpdateSubFloorDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "SubFloor_SubFloorCode_Required")]
    [StringLength(10, ErrorMessage = "SubFloor_SubFloorCode_MaxLen_10")]
    public string SubFloorCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "SubFloor_Description_Required")]
    [StringLength(200, ErrorMessage = "SubFloor_Description_MaxLen_200")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "SubFloor_DescriptionEnglish_Required")]
    [StringLength(100, ErrorMessage = "SubFloor_DescriptionEnglish_MaxLen_100")]
    public string DescriptionEnglish { get; set; } = string.Empty;

    public decimal? SubFloorPercentage { get; set; }
    public int? SequenceNo { get; set; }
}
