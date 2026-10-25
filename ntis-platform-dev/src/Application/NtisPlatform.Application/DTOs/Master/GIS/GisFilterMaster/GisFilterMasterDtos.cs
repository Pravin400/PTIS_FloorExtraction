using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs;

public class GisFilterMasterDto : BaseDtos
{
    public string FilterKey { get; set; } = null!;
    public string FilterLabel { get; set; } = null!;
    public string ControlType { get; set; } = null!;
    public string? ApiSourceUrl { get; set; }
}

public class CreateGisFilterMasterDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisFilterMaster_FilterKey_Required")]
    [StringLength(100, ErrorMessage = "GisFilterMaster_FilterKey_MaxLen_100")]
    public string FilterKey { get; set; } = null!;

    [Required(ErrorMessage = "GisFilterMaster_FilterLabel_Required")]
    [StringLength(150, ErrorMessage = "GisFilterMaster_FilterLabel_MaxLen_150")]
    public string FilterLabel { get; set; } = null!;

    [Required(ErrorMessage = "GisFilterMaster_ControlType_Required")]
    [StringLength(50, ErrorMessage = "GisFilterMaster_ControlType_MaxLen_50")]
    public string ControlType { get; set; } = "DROPDOWN";

    [StringLength(500, ErrorMessage = "GisFilterMaster_ApiSourceUrl_MaxLen_500")]
    public string? ApiSourceUrl { get; set; }
}

public class UpdateGisFilterMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "GisFilterMaster_FilterLabel_Required")]
    [StringLength(150, ErrorMessage = "GisFilterMaster_FilterLabel_MaxLen_150")]
    public string FilterLabel { get; set; } = null!;

    [Required(ErrorMessage = "GisFilterMaster_ControlType_Required")]
    [StringLength(50, ErrorMessage = "GisFilterMaster_ControlType_MaxLen_50")]
    public string ControlType { get; set; } = null!;

    [StringLength(500, ErrorMessage = "GisFilterMaster_ApiSourceUrl_MaxLen_500")]
    public string? ApiSourceUrl { get; set; }
}
