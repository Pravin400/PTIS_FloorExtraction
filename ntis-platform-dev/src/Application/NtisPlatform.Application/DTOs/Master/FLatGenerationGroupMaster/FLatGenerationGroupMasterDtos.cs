using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs;

/// <summary>
/// DTO for Flat Generation Group Master (PTIS.FLatGenerationGroupMaster)
/// </summary>
public class FLatGenerationGroupMasterDto : BaseDtos
{
    public string FLatGenerationGroup { get; set; } = string.Empty;
}

/// <summary>
/// DTO for creating a Flat Generation Group Master
/// </summary>
public class CreateFLatGenerationGroupMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "FLatGenerationGroup_Required")]
    [StringLength(100, ErrorMessage = "FLatGenerationGroup_MaxLen_100")]
    public string FLatGenerationGroup { get; set; } = string.Empty;
}

/// <summary>
/// DTO for updating a Flat Generation Group Master
/// </summary>
public class UpdateFLatGenerationGroupMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "FLatGenerationGroup_Required")]
    [StringLength(100, ErrorMessage = "FLatGenerationGroup_MaxLen_100")]
    public string FLatGenerationGroup { get; set; } = string.Empty;
}
