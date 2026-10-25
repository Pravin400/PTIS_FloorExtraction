using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs;

public class GisDepartmentKpiMappingDto : BaseDtos
{
    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int KpiMasterId { get; set; }
    public string? KpiCode { get; set; }
    public string? DefaultTitle { get; set; }
    public string? CustomTitle { get; set; }
    public string? CustomIcon { get; set; }
    public string? CustomColor { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateGisDepartmentKpiMappingDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisDepartmentKpiMapping_DepartmentId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisDepartmentKpiMapping_DepartmentId_Invalid")]
    public int DepartmentId { get; set; }

    [Required(ErrorMessage = "GisDepartmentKpiMapping_KpiMasterId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisDepartmentKpiMapping_KpiMasterId_Invalid")]
    public int KpiMasterId { get; set; }

    [StringLength(150, ErrorMessage = "GisDepartmentKpiMapping_CustomTitle_MaxLen_150")]
    public string? CustomTitle { get; set; }

    [StringLength(100, ErrorMessage = "GisDepartmentKpiMapping_CustomIcon_MaxLen_100")]
    public string? CustomIcon { get; set; }

    [StringLength(20, ErrorMessage = "GisDepartmentKpiMapping_CustomColor_MaxLen_20")]
    public string? CustomColor { get; set; }

    [Range(1, 1000, ErrorMessage = "GisDepartmentKpiMapping_DisplayOrder_Invalid")]
    public int DisplayOrder { get; set; } = 1;
}

public class UpdateGisDepartmentKpiMappingDto : UpdateBaseDtos
{
    [StringLength(150, ErrorMessage = "GisDepartmentKpiMapping_CustomTitle_MaxLen_150")]
    public string? CustomTitle { get; set; }

    [StringLength(100, ErrorMessage = "GisDepartmentKpiMapping_CustomIcon_MaxLen_100")]
    public string? CustomIcon { get; set; }

    [StringLength(20, ErrorMessage = "GisDepartmentKpiMapping_CustomColor_MaxLen_20")]
    public string? CustomColor { get; set; }

    [Range(1, 1000, ErrorMessage = "GisDepartmentKpiMapping_DisplayOrder_Invalid")]
    public int DisplayOrder { get; set; }
}
