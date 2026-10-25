using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceTypeMaster;

public class GrievanceTypeDto : BaseDtos
{
    public int GrievanceDepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? GrievanceType { get; set; }
}

public class CreateGrievanceTypeDto : CreateBaseDtos
{
    [Required(ErrorMessage = "GrievanceDepartmentId_Required")]
    public int GrievanceDepartmentId { get; set; }

    [Required(ErrorMessage = "GrievanceType_Required")]
    [StringLength(150, ErrorMessage = "GrievanceType_MaxLen_150")]
    public string GrievanceType { get; set; } = string.Empty;
}

public class UpdateGrievanceTypeDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "GrievanceDepartmentId_Required")]
    public int GrievanceDepartmentId { get; set; }

    [Required(ErrorMessage = "GrievanceType_Required")]
    [StringLength(150, ErrorMessage = "GrievanceType_MaxLen_150")]
    public string GrievanceType { get; set; } = string.Empty;
}
