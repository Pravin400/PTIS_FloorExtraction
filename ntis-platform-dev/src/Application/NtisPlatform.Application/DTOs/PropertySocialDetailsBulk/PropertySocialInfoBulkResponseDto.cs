namespace NtisPlatform.Application.DTOs.PropertySocialDetailsBulk;

public class PropertySocialInfoBulkResponseDto
{
    public int? PropertyId { get; set; }
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public List<SocialAttributeHierarchyBulkDto> SocialAttributes { get; set; } = new();
}

public class SocialAttributeHierarchyBulkDto
{
    public int Id { get; set; }
    public string SocialAttributeCode { get; set; } = string.Empty;
    public string SocialAttributeName { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public int? DisplayOrder { get; set; }
    public int? ParentAttributeId { get; set; }
    public bool IsRequiredWhenParentTrue { get; set; }
    public bool IsDiscountApplicable { get; set; }

    // Current value from PropertySocialDetails
    public int? PropertySocialDetailId { get; set; }
    public bool? BitValue { get; set; }
    public int? IntValue { get; set; }
    public decimal? DecimalValue { get; set; }
    public string? TextValue { get; set; }
    public DateTime? DateValue { get; set; }
    public int? DocumentBindingId { get; set; }
    public int? PhotoTypeId { get; set; }
    public bool? IsDocumentRequired { get; set; }
    public bool? IsPhotoRequired { get; set; }
    public string? Remark { get; set; }

    // Fetched Document Info (matching documents for this attribute's PhotoTypeId)
    public List<SocialPropertyDocumentsDto> Documents { get; set; } = new();

    public List<SocialPropertyDocumentsDto> Photos { get; set; } = new();

    // Child attributes
    public List<SocialAttributeHierarchyBulkDto> Children { get; set; } = new();
}