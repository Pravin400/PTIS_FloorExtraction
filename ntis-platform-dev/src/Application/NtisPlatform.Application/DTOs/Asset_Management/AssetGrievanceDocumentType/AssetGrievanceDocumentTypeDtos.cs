using System.ComponentModel.DataAnnotations;
using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocumentType;

public class AssetGrievanceDocumentTypeDto : BaseDtos
{
    public int GrievanceCategoryId { get; set; }
    public string DocumentTypeCode { get; set; } = null!;
    public string DocumentTypeName { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsRequired { get; set; }
    public int? DisplayOrder { get; set; }
}

public class CreateAssetGrievanceDocumentTypeDto
{
    [Range(1, int.MaxValue, ErrorMessage = "AssetGrievanceDocumentType_GrievanceCategoryId_Required")]
    public int GrievanceCategoryId { get; set; }

    [Required(ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeCode_Required")]
    [StringLength(50, ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeCode_MaxLen_50")]
    public string DocumentTypeCode { get; set; } = null!;

    [Required(ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeName_Required")]
    [StringLength(200, ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeName_MaxLen_200")]
    public string DocumentTypeName { get; set; } = null!;

    [StringLength(500, ErrorMessage = "AssetGrievanceDocumentType_Description_MaxLen_500")]
    public string? Description { get; set; }

    public bool IsRequired { get; set; }
    public int? DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateAssetGrievanceDocumentTypeDto
{
    [Range(1, int.MaxValue, ErrorMessage = "AssetGrievanceDocumentType_GrievanceCategoryId_Required")]
    public int GrievanceCategoryId { get; set; }

    [Required(ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeCode_Required")]
    [StringLength(50, ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeCode_MaxLen_50")]
    public string DocumentTypeCode { get; set; } = null!;

    [Required(ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeName_Required")]
    [StringLength(200, ErrorMessage = "AssetGrievanceDocumentType_DocumentTypeName_MaxLen_200")]
    public string DocumentTypeName { get; set; } = null!;

    [StringLength(500, ErrorMessage = "AssetGrievanceDocumentType_Description_MaxLen_500")]
    public string? Description { get; set; }

    public bool IsRequired { get; set; }
    public int? DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class AssetGrievanceDocumentTypeQueryParameters : BaseQueryParameters
{
    [Sortable]
    [Filterable(FilterOperator.Equals)]
    public int? GrievanceCategoryId { get; set; }

    [Searchable]
    [Sortable]
    [Filterable(FilterOperator.Equals)]
    public string? DocumentTypeCode { get; set; }

    [Searchable]
    [Sortable]
    [Filterable(FilterOperator.Contains)]
    public string? DocumentTypeName { get; set; }

    [Filterable(FilterOperator.Equals)]
    public bool? IsRequired { get; set; }

    [Sortable]
    public int? DisplayOrder { get; set; }
}
