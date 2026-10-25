using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;

public class GeographyUnitDto : BaseDtos
{
    public int GeographyTypeId { get; set; }
    public string? GeographyTypeCode { get; set; }
    public string? GeographyType { get; set; }
    public int? ParentGeographyUnitId { get; set; }
    public string? ParentGeographyUnitName { get; set; }
    public string GeographyUnitCode { get; set; } = string.Empty;
    public string GeographyUnitName { get; set; } = string.Empty;
    public int? SearchSequence { get; set; }
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}

public class CreateGeographyUnitDto : CreateBaseDtos
{
    [Range(1, int.MaxValue, ErrorMessage = "Geography Type Id is required.")]
    public int GeographyTypeId { get; set; }

    public int? ParentGeographyUnitId { get; set; }

    [Required(ErrorMessage = "Geography Unit Code is required.")]
    [MaxLength(50, ErrorMessage = "Geography Unit Code cannot exceed 50 characters.")]
    public string GeographyUnitCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Geography Unit Name is required.")]
    [MaxLength(200, ErrorMessage = "Geography Unit Name cannot exceed 200 characters.")]
    public string GeographyUnitName { get; set; } = string.Empty;

    public int? SearchSequence { get; set; }

    public new bool IsActive { get; set; } = true;
}

public class UpdateGeographyUnitDto : UpdateBaseDtos
{
    [Range(1, int.MaxValue, ErrorMessage = "Geography Type Id is required.")]
    public int GeographyTypeId { get; set; }

    public int? ParentGeographyUnitId { get; set; }

    [Required(ErrorMessage = "Geography Unit Code is required.")]
    [MaxLength(50, ErrorMessage = "Geography Unit Code cannot exceed 50 characters.")]
    public string GeographyUnitCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Geography Unit Name is required.")]
    [MaxLength(200, ErrorMessage = "Geography Unit Name cannot exceed 200 characters.")]
    public string GeographyUnitName { get; set; } = string.Empty;

    public int? SearchSequence { get; set; }
}

/// <summary>
/// Lightweight shape for populating the ParentGeographyUnitId dropdown once a GeographyTypeId is
/// selected -- see <see cref="Interfaces.WaterBill.Master.GeographyUnit.IGeographyUnitService.GetParentCandidatesAsync"/>.
/// </summary>
public class GeographyUnitLookupDto
{
    public int Id { get; set; }
    public string GeographyUnitCode { get; set; } = string.Empty;
    public string GeographyUnitName { get; set; } = string.Empty;
}

/// <summary>
/// One node of the geography hierarchy tree -- see
/// <see cref="Interfaces.WaterBill.Master.GeographyUnit.IGeographyUnitService.GetHierarchyTreeAsync"/>.
/// <see cref="Children"/> holds the same shape recursively, so the frontend can render it as a
/// family-tree (parent branching into children, each child branching into its own children).
/// </summary>
public class GeographyUnitTreeNodeDto
{
    public int Id { get; set; }
    public string GeographyUnitCode { get; set; } = string.Empty;
    public string GeographyUnitName { get; set; } = string.Empty;
    public int GeographyTypeId { get; set; }
    public string GeographyTypeCode { get; set; } = string.Empty;
    public string GeographyType { get; set; } = string.Empty;
    public int LevelNo { get; set; }
    public int? ParentGeographyUnitId { get; set; }
    public List<GeographyUnitTreeNodeDto> Children { get; set; } = new();
}
