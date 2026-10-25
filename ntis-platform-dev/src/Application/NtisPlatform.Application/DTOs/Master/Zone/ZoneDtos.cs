using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs;

public class ZoneDto : BaseDtos
{
    public int Id { get; set; }
    public string ZoneNo { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? DescriptionEnglish { get; set; }    
    public int? SequenceNo { get; set; }  
}

public class CreateZoneDto : CreateBaseDtos
{
    [Required(ErrorMessage = "Zone_ZoneNo_Required")]  
    [StringLength(10, ErrorMessage = "Zone_ZoneNo_MaxLen_10")]
    public string ZoneNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Zone_Description_Required")]
    [StringLength(100, ErrorMessage = "Zone_Description_MaxLen_100")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Zone_DescriptionEnglish_Required")]
    [StringLength(100, ErrorMessage = "Zone_DescriptionEnglish_MaxLen_100")]
    public string DescriptionEnglish { get; set; } = string.Empty;

    [Range(1, 999, ErrorMessage = "Zone_SequenceNo_MaxValue")]
    public int? SequenceNo { get; set; }
}

public class UpdateZoneDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Zone_ZoneNo_Required")]
    [StringLength(10, ErrorMessage = "Zone_ZoneNo_MaxLen_10")]
    public string ZoneNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Zone_Description_Required")]
    [StringLength(100, ErrorMessage = "Zone_Description_MaxLen_100")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Zone_DescriptionEnglish_Required")]
    [StringLength(100, ErrorMessage = "Zone_DescriptionEnglish_MaxLen_100")]
    public string DescriptionEnglish { get; set; } = string.Empty;

    [Range(1, 999, ErrorMessage = "Zone_SequenceNo_MaxValue")]
    public int? SequenceNo { get; set; }
}