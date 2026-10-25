using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs;

public class OldWardMasterDto : BaseDtos
{
    public string OldWardNo { get; set; } = string.Empty;
    public string OldWardName { get; set; } = string.Empty;
    public string Description => OldWardName;
    public int OldZoneId { get; set; }
    public int? SequenceNo { get; set; }
}

public class CreateOldWardMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "OldWardMaster_OldWardNo_Required")]
    [StringLength(20, ErrorMessage = "OldWardMaster_OldWardNo_MaxLen_20")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-]+$", ErrorMessage = "Special characters are not allowed in Old Ward No.")]
    public string OldWardNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "OldWardMaster_Description_Required")]
    [StringLength(100, ErrorMessage = "OldWardMaster_Description_MaxLen_100")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-/,\.]+$", ErrorMessage = "Special characters are not allowed in Old Ward Name.")]
    public string OldWardName { get; set; } = string.Empty;

    public string? Description
    {
        get => OldWardName;
        set => OldWardName = value ?? string.Empty;
    }

    [Required(ErrorMessage = "OldWardMaster_OldZoneId_Required")]
    public int OldZoneId { get; set; }

    public int? SequenceNo { get; set; }
}

public class UpdateOldWardMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "OldWardMaster_OldWardNo_Required")]
    [StringLength(20, ErrorMessage = "OldWardMaster_OldWardNo_MaxLen_20")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-]+$", ErrorMessage = "Special characters are not allowed in Old Ward No.")]
    public string OldWardNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "OldWardMaster_Description_Required")]
    [StringLength(100, ErrorMessage = "OldWardMaster_Description_MaxLen_100")]
    [RegularExpression(@"^(?=.*[\u0900-\u097fa-zA-Z0-9])[\u0900-\u097fa-zA-Z0-9\s\-/,\.]+$", ErrorMessage = "Special characters are not allowed in Old Ward Name.")]
    public string OldWardName { get; set; } = string.Empty;

    public string? Description
    {
        get => OldWardName;
        set => OldWardName = value ?? string.Empty;
    }

    [Required(ErrorMessage = "OldWardMaster_OldZoneId_Required")]
    public int OldZoneId { get; set; }

    public int? SequenceNo { get; set; }
}

