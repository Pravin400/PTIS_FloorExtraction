using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs;

public class GisKpiMasterDto : BaseDtos
{
    public string KpiCode { get; set; } = null!;
    public string DefaultTitle { get; set; } = null!;
    public string DefaultIcon { get; set; } = null!;
    public string DefaultColor { get; set; } = null!;
}

public class CreateGisKpiMasterDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisKpiMaster_KpiCode_Required")]
    [StringLength(100, ErrorMessage = "GisKpiMaster_KpiCode_MaxLen_100")]
    public string KpiCode { get; set; } = null!;

    [Required(ErrorMessage = "GisKpiMaster_DefaultTitle_Required")]
    [StringLength(150, ErrorMessage = "GisKpiMaster_DefaultTitle_MaxLen_150")]
    public string DefaultTitle { get; set; } = null!;

    [StringLength(100, ErrorMessage = "GisKpiMaster_DefaultIcon_MaxLen_100")]
    public string DefaultIcon { get; set; } = "fa-building";

    [StringLength(20, ErrorMessage = "GisKpiMaster_DefaultColor_MaxLen_20")]
    public string DefaultColor { get; set; } = "#0078FF";
}

public class UpdateGisKpiMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "GisKpiMaster_DefaultTitle_Required")]
    [StringLength(150, ErrorMessage = "GisKpiMaster_DefaultTitle_MaxLen_150")]
    public string DefaultTitle { get; set; } = null!;

    [StringLength(100, ErrorMessage = "GisKpiMaster_DefaultIcon_MaxLen_100")]
    public string DefaultIcon { get; set; } = null!;

    [StringLength(20, ErrorMessage = "GisKpiMaster_DefaultColor_MaxLen_20")]
    public string DefaultColor { get; set; } = null!;
}
