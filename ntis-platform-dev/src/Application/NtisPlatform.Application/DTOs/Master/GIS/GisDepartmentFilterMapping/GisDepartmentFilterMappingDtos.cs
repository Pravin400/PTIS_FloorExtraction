using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs;

public class GisDepartmentFilterMappingDto : BaseDtos
{
    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int FilterMasterId { get; set; }
    public string? FilterKey { get; set; }
    public string? DefaultFilterLabel { get; set; }
    public string? CustomLabel { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateGisDepartmentFilterMappingDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisDepartmentFilterMapping_DepartmentId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisDepartmentFilterMapping_DepartmentId_Invalid")]
    public int DepartmentId { get; set; }

    [Required(ErrorMessage = "GisDepartmentFilterMapping_FilterMasterId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisDepartmentFilterMapping_FilterMasterId_Invalid")]
    public int FilterMasterId { get; set; }

    [StringLength(150, ErrorMessage = "GisDepartmentFilterMapping_CustomLabel_MaxLen_150")]
    public string? CustomLabel { get; set; }

    [Range(1, 1000, ErrorMessage = "GisDepartmentFilterMapping_DisplayOrder_Invalid")]
    public int DisplayOrder { get; set; } = 1;
}

public class UpdateGisDepartmentFilterMappingDto : UpdateBaseDtos
{
    [StringLength(150, ErrorMessage = "GisDepartmentFilterMapping_CustomLabel_MaxLen_150")]
    public string? CustomLabel { get; set; }

    [Range(1, 1000, ErrorMessage = "GisDepartmentFilterMapping_DisplayOrder_Invalid")]
    public int DisplayOrder { get; set; }
}
