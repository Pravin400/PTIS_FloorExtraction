using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Asset_Management;

public class AssetGrievanceCategoryDto : BaseDtos
{
    public string GrievanceTypeCode { get; set; } = null!;
    public string GrievanceTypeName { get; set; } = null!;
    public string? GrievanceTypeNameLocal { get; set; }
    public string? Description { get; set; }
    public string? TargetTableName { get; set; }
    public int? SLADays { get; set; }
    public string CodeFormat { get; set; } = null!;
    public int DisplaySequence { get; set; }
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}

public class CreateAssetGrievanceCategoryDto : CreateBaseDtos
{
    [Required(ErrorMessage = "AssetGrievanceCategory_GrievanceTypeCode_Required")]
    [StringLength(50, ErrorMessage = "AssetGrievanceCategory_GrievanceTypeCode_MaxLen_50")]
    [RegularExpression(@"^[A-Za-z0-9_-]+$", ErrorMessage = "AssetGrievanceCategory_GrievanceTypeCode_Invalid")]
    public string GrievanceTypeCode { get; set; } = null!;

    [Required(ErrorMessage = "AssetGrievanceCategory_GrievanceTypeName_Required")]
    [StringLength(200, ErrorMessage = "AssetGrievanceCategory_GrievanceTypeName_MaxLen_200")]
    public string GrievanceTypeName { get; set; } = null!;

    [StringLength(200, ErrorMessage = "AssetGrievanceCategory_GrievanceTypeNameLocal_MaxLen_200")]
    public string? GrievanceTypeNameLocal { get; set; }

    [StringLength(500, ErrorMessage = "AssetGrievanceCategory_Description_MaxLen_500")]
    public string? Description { get; set; }

    [StringLength(200, ErrorMessage = "AssetGrievanceCategory_TargetTableName_MaxLen_200")]
    [RegularExpression(@"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$", ErrorMessage = "AssetGrievanceCategory_TargetTableName_Invalid")]
    public string? TargetTableName { get; set; }


    [Range(0, int.MaxValue, ErrorMessage = "AssetGrievanceCategory_SLADays_MustBeNonNegative")]
    public int? SLADays { get; set; }

    [Required(ErrorMessage = "AssetGrievanceCategory_CodeFormat_Required")]
    [StringLength(100, ErrorMessage = "AssetGrievanceCategory_CodeFormat_MaxLen_100")]
    [RegularExpression(@"^[A-Za-z0-9\-/_.{}#]+$", ErrorMessage = "AssetGrievanceCategory_CodeFormat_Invalid")]
    public string CodeFormat { get; set; } = null!;

    [Range(0, int.MaxValue, ErrorMessage = "AssetGrievanceCategory_DisplaySequence_Invalid")]
    public int DisplaySequence { get; set; }
}

public class UpdateAssetGrievanceCategoryDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "AssetGrievanceCategory_GrievanceTypeCode_Required")]
    [StringLength(50, ErrorMessage = "AssetGrievanceCategory_GrievanceTypeCode_MaxLen_50")]
    [RegularExpression(@"^[A-Za-z0-9_-]+$", ErrorMessage = "AssetGrievanceCategory_GrievanceTypeCode_Invalid")]
    public string GrievanceTypeCode { get; set; } = null!;

    [Required(ErrorMessage = "AssetGrievanceCategory_GrievanceTypeName_Required")]
    [StringLength(200, ErrorMessage = "AssetGrievanceCategory_GrievanceTypeName_MaxLen_200")]
    public string GrievanceTypeName { get; set; } = null!;

    [StringLength(200, ErrorMessage = "AssetGrievanceCategory_GrievanceTypeNameLocal_MaxLen_200")]
    public string? GrievanceTypeNameLocal { get; set; }

    [StringLength(500, ErrorMessage = "AssetGrievanceCategory_Description_MaxLen_500")]
    public string? Description { get; set; }

    [StringLength(200, ErrorMessage = "AssetGrievanceCategory_TargetTableName_MaxLen_200")]
    [RegularExpression(@"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$", ErrorMessage = "AssetGrievanceCategory_TargetTableName_Invalid")]
    public string? TargetTableName { get; set; }


    [Range(0, int.MaxValue, ErrorMessage = "AssetGrievanceCategory_SLADays_MustBeNonNegative")]
    public int? SLADays { get; set; }

    [Required(ErrorMessage = "AssetGrievanceCategory_CodeFormat_Required")]
    [StringLength(100, ErrorMessage = "AssetGrievanceCategory_CodeFormat_MaxLen_100")]
    [RegularExpression(@"^[A-Za-z0-9\-/_.{}#]+$", ErrorMessage = "AssetGrievanceCategory_CodeFormat_Invalid")]
    public string CodeFormat { get; set; } = null!;

    [Range(0, int.MaxValue, ErrorMessage = "AssetGrievanceCategory_DisplaySequence_Invalid")]
    public int DisplaySequence { get; set; }
}
