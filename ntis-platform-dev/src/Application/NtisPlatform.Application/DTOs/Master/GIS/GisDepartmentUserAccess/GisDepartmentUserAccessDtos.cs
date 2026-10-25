using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.DTOs;

namespace NtisPlatform.Application.DTOs;

public class GisDepartmentUserAccessDto : BaseDtos
{
    public int UserId { get; set; }
    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int UlbId { get; set; }
    public int ZoneId { get; set; }
    public bool CanView { get; set; }
    public bool CanEdit { get; set; }
    public bool CanExport { get; set; }
}

public class CreateGisDepartmentUserAccessDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "GisDepartmentUserAccess_UserId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisDepartmentUserAccess_UserId_Invalid")]
    public int UserId { get; set; }

    [Required(ErrorMessage = "GisDepartmentUserAccess_DepartmentId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisDepartmentUserAccess_DepartmentId_Invalid")]
    public int DepartmentId { get; set; }

    [Required(ErrorMessage = "GisDepartmentUserAccess_UlbId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "GisDepartmentUserAccess_UlbId_Invalid")]
    public int UlbId { get; set; }

    public int ZoneId { get; set; }
    public bool CanView { get; set; } = true;
    public bool CanEdit { get; set; }
    public bool CanExport { get; set; }
}

public class UpdateGisDepartmentUserAccessDto : UpdateBaseDtos
{
    public bool CanView { get; set; }
    public bool CanEdit { get; set; }
    public bool CanExport { get; set; }
}
