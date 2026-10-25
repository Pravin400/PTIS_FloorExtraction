using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.propertywise;

public class PropertyWisePair
{
    public int ZoneId { get; set; }
    public int WardId { get; set; }
    public int? OldWardId { get; set; }
}

public class PropertyWiseDto : BaseDtos
{
    public int UserId { get; set; }
    public string? EmployeeName { get; set; }
    public string? EmpCode { get; set; }

    public int DepartmentId { get; set; }
    public string? DepartmentName { get; set; }

    public int ModuleId { get; set; }
    public string? ModuleName { get; set; }

    public int ZoneId { get; set; }
    public string? ZoneNo { get; set; }

    public int WardId { get; set; }
    public string? WardNo { get; set; }
    public int? OldZoneId { get; set; }
    public string? OldZoneNo { get; set; }
    public string? OldZoneName { get; set; }
    public int? OldWardId { get; set; }
    public string? OldWardNo { get; set; }
    public string? OldWardName { get; set; }
    public string? Description
    {
        get => OldWardName;
        set => OldWardName = value;
    }

    public string? FromPropertyNo { get; set; }
    public string? ToPropertyNo { get; set; }
}

/// <summary>
/// Summary DTO for list views containing raw IDs and property range boundaries.
/// </summary>
public class PropertyWiseListDto : BaseDtos
{
    public int UserId { get; set; }
    public int DepartmentId { get; set; }
    public int ModuleId { get; set; }
    public int ZoneId { get; set; }
    public int WardId { get; set; }
    public int? OldZoneId { get; set; }
    public int? OldWardId { get; set; }
    public string? FromPropertyNo { get; set; }
    public string? ToPropertyNo { get; set; }
}

/// <summary>
/// Detailed DTO for detail views containing resolved names, codes and descriptions.
/// </summary>
public class PropertyWiseDetailDto : PropertyWiseDto
{
}

public class PropertyWiseZoneWardDto
{
    [Required(ErrorMessage = "PropertyWise_ZoneId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyWise_ZoneId_Invalid")]
    public int ZoneId { get; set; }

    [Required(ErrorMessage = "PropertyWise_WardIds_Required")]
    [MinLength(1, ErrorMessage = "PropertyWise_WardIds_MinLength_1")]
    public List<int> WardIds { get; set; } = new();

    [Required(ErrorMessage = "PropertyWise_OldZoneId_Required")]
    [MinLength(1, ErrorMessage = "PropertyWise_OldZoneId_MinLength_1")]
    public List<int> OldZoneId { get; set; } = new();

    [Required(ErrorMessage = "PropertyWise_OldWardIds_Required")]
    [MinLength(1, ErrorMessage = "PropertyWise_OldWardIds_MinLength_1")]
    public List<int> OldWardIds { get; set; } = new();

    [StringLength(50, ErrorMessage = "PropertyWise_FromPropertyNo_MaxLength_50")]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]*$", ErrorMessage = "PropertyWise_FromPropertyNo_SpecialCharactersNotAllowed")]
    public string? FromPropertyNo { get; set; }

    [StringLength(50, ErrorMessage = "PropertyWise_ToPropertyNo_MaxLength_50")]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]*$", ErrorMessage = "PropertyWise_ToPropertyNo_SpecialCharactersNotAllowed")]
    public string? ToPropertyNo { get; set; }

    public bool? IsActive { get; set; }
}

public class CreatePropertyWiseDto : CreateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "PropertyWise_UserId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyWise_UserId_Invalid")]
    public int UserId { get; set; }

    [Required(ErrorMessage = "PropertyWise_DepartmentId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyWise_DepartmentId_Invalid")]
    public int DepartmentId { get; set; }

    [Required(ErrorMessage = "PropertyWise_ModuleId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyWise_ModuleId_Invalid")]
    public int ModuleId { get; set; }

    [Required(ErrorMessage = "PropertyWise_Allocations_Required")]
    [MinLength(1, ErrorMessage = "PropertyWise_Allocations_MinLength_1")]
    public List<PropertyWiseZoneWardDto> Allocations { get; set; } = new();

    /// <summary>
    /// Starting property number of sequential range (numeric e.g., "100" or alphanumeric e.g., "A01").
    /// Must be less than or equal to <see cref="ToPropertyNo"/>.
    /// </summary>
    [Required(ErrorMessage = "PropertyWise_FromPropertyNo_Required")]
    [StringLength(50, ErrorMessage = "PropertyWise_FromPropertyNo_MaxLength_50")]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]+$", ErrorMessage = "PropertyWise_FromPropertyNo_SpecialCharactersNotAllowed")]
    public string FromPropertyNo { get; set; } = string.Empty;

    /// <summary>
    /// Ending property number of sequential range (numeric e.g., "200" or alphanumeric e.g., "A99").
    /// Must be greater than or equal to <see cref="FromPropertyNo"/>.
    /// </summary>
    [Required(ErrorMessage = "PropertyWise_ToPropertyNo_Required")]
    [StringLength(50, ErrorMessage = "PropertyWise_ToPropertyNo_MaxLength_50")]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]+$", ErrorMessage = "PropertyWise_ToPropertyNo_SpecialCharactersNotAllowed")]
    public string ToPropertyNo { get; set; } = string.Empty;
}

public class UpdatePropertyWiseDto : UpdateBaseDtos
{
    public new bool IsActive { get; set; } = true;

    [Required(ErrorMessage = "PropertyWise_UserId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyWise_UserId_Invalid")]
    public int UserId { get; set; }

    [Required(ErrorMessage = "PropertyWise_DepartmentId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyWise_DepartmentId_Invalid")]
    public int DepartmentId { get; set; }

    [Required(ErrorMessage = "PropertyWise_ModuleId_Required")]
    [Range(1, int.MaxValue, ErrorMessage = "PropertyWise_ModuleId_Invalid")]
    public int ModuleId { get; set; }

    [Required(ErrorMessage = "PropertyWise_Allocations_Required")]
    [MinLength(1, ErrorMessage = "PropertyWise_Allocations_MinLength_1")]
    public List<PropertyWiseZoneWardDto> Allocations { get; set; } = new();

    /// <summary>
    /// Starting property number of sequential range (numeric or alphanumeric).
    /// Can be null during update to convert allocation to ward-wise.
    /// </summary>
    [StringLength(50, ErrorMessage = "PropertyWise_FromPropertyNo_MaxLength_50")]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]*$", ErrorMessage = "PropertyWise_FromPropertyNo_SpecialCharactersNotAllowed")]
    public string? FromPropertyNo { get; set; }

    /// <summary>
    /// Ending property number of sequential range (numeric or alphanumeric).
    /// </summary>
    [StringLength(50, ErrorMessage = "PropertyWise_ToPropertyNo_MaxLength_50")]
    [RegularExpression(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]*$", ErrorMessage = "PropertyWise_ToPropertyNo_SpecialCharactersNotAllowed")]
    public string? ToPropertyNo { get; set; }
}

public class WardAllocationConflictDto
{
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public int WardId { get; set; }
    public string? WardNo { get; set; }
}