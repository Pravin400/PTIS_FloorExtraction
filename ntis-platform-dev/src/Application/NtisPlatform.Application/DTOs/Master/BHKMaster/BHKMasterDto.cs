using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Master.BHKMaster;

public class BHKMasterDto : BaseDtos
{
    public int Id { get; set; }
    public string BHKCode { get; set; } = string.Empty;
    public string BHKName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public decimal? RoomCount { get; set; }
}

public class CreateBHKMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "BHKCode_Required")]
    [StringLength(20, ErrorMessage = "BHKCode_MaxLen_20")]
    public string BHKCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "BHKName_Required")]
    [StringLength(50, ErrorMessage = "BHKName_MaxLen_50")]
    public string BHKName { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "Description_MaxLen_200")]
    public string? Description { get; set; }

    public int? DisplayOrder { get; set; }

    [Range(typeof(decimal), "0.5", "99.9", ErrorMessage = "BHKRoomCount_Range")]
    public decimal? RoomCount { get; set; }
}

public class UpdateBHKMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "BHKCode_Required")]
    [StringLength(20, ErrorMessage = "BHKCode_MaxLen_20")]
    public string BHKCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "BHKName_Required")]
    [StringLength(50, ErrorMessage = "BHKName_MaxLen_50")]
    public string BHKName { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "Description_MaxLen_200")]
    public string? Description { get; set; }

    public int? DisplayOrder { get; set; }

    [Range(typeof(decimal), "0.5", "99.9", ErrorMessage = "BHKRoomCount_Range")]
    public decimal? RoomCount { get; set; }
}
