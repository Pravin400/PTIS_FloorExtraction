using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs;


public class FloorDto : BaseDtos
{

    public string FloorCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DescriptionEnglish { get; set; }
    public int? SequenceNo { get; set; }
    public int? MaxFloorNo { get; set; }
    public int? FloorGroupId { get; set; }
    public int FLatGenerationGroupId { get; set; }
    public int FLatGenerationSeq { get; set; }
}

public class CreateFloorDto : CreateBaseDtos
{
    [Required(AllowEmptyStrings = true, ErrorMessage = "Floor_FloorCode_Required")]
    [StringLength(5, ErrorMessage = "Floor_FloorCode_MaxLen_5")]
    public string FloorCode { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = true, ErrorMessage = "Floor_Description_Required")]
    [StringLength(100, ErrorMessage = "Floor_Description_MaxLen_100")]
    public string Description { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = true, ErrorMessage = "Floor_DescriptionEnglish_Required")]
    [StringLength(100, ErrorMessage = "Floor_DescriptionEnglish_MaxLen_100")]
    public string DescriptionEnglish { get; set; } = string.Empty;

    public int? SequenceNo { get; set; }
    public int? MaxFloorNo { get; set; }
    public int? FloorGroupId { get; set; }

    [Required(ErrorMessage = "Floor_FLatGenerationGroupId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Floor_FLatGenerationGroupId_Required")]
    public int FLatGenerationGroupId { get; set; }

    [Required(ErrorMessage = "Floor_FLatGenerationSeq_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Floor_FLatGenerationSeq_Required")]
    public int FLatGenerationSeq { get; set; }
}

public class UpdateFloorDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Floor_FloorCode_Required")]
    [StringLength(5, ErrorMessage = "Floor_FloorCode_MaxLen_5")]
    public string FloorCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Floor_Description_Required")]
    [StringLength(100, ErrorMessage = "Floor_Description_MaxLen_100")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Floor_DescriptionEnglish_Required")]
    [StringLength(100, ErrorMessage = "Floor_DescriptionEnglish_MaxLen_100")]
    public string DescriptionEnglish { get; set; } = string.Empty;

    public int? SequenceNo { get; set; }
    public int? MaxFloorNo { get; set; }
    public int? FloorGroupId { get; set; }

    [Required(ErrorMessage = "Floor_FLatGenerationGroupId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Floor_FLatGenerationGroupId_Required")]
    public int FLatGenerationGroupId { get; set; }

    [Required(ErrorMessage = "Floor_FLatGenerationSeq_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "Floor_FLatGenerationSeq_Required")]
    public int FLatGenerationSeq { get; set; }
}
