using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs;

public class OldZoneMasterDto : BaseDtos
{
    public string? OldZoneNo { get; set; }
    public string OldZoneName { get; set; } = string.Empty;
    public string Description => OldZoneName;
    public int? SequenceNo { get; set; }
}

public class CreateOldZoneMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "OldZoneMaster_OldZoneNo_Required")]
    [StringLength(50, ErrorMessage = "OldZoneMaster_OldZoneNo_MaxLen_50")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-]+$", ErrorMessage = "Special characters are not allowed in Old Zone No.")]
    public string OldZoneNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "OldZoneMaster_Description_Required")]
    [StringLength(200, ErrorMessage = "OldZoneMaster_Description_MaxLen_200")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-/,\.]+$", ErrorMessage = "Special characters are not allowed in Old Zone Name.")]
    public string OldZoneName { get; set; } = string.Empty;

    public string? Description
    {
        get => OldZoneName;
        set => OldZoneName = value ?? string.Empty;
    }

    public int? SequenceNo { get; set; }
}

public class UpdateOldZoneMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "OldZoneMaster_OldZoneNo_Required")]
    [StringLength(50, ErrorMessage = "OldZoneMaster_OldZoneNo_MaxLen_50")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-]+$", ErrorMessage = "Special characters are not allowed in Old Zone No.")]
    public string OldZoneNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "OldZoneMaster_Description_Required")]
    [StringLength(200, ErrorMessage = "OldZoneMaster_Description_MaxLen_200")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-/,\.]+$", ErrorMessage = "Special characters are not allowed in Old Zone Name.")]
    public string OldZoneName { get; set; } = string.Empty;

    public string? Description
    {
        get => OldZoneName;
        set => OldZoneName = value ?? string.Empty;
    }

    public int? SequenceNo { get; set; }
}
