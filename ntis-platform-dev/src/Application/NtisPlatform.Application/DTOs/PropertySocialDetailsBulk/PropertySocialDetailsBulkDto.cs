namespace NtisPlatform.Application.DTOs.PropertySocialDetailsBulk;

public class PropertySocialDetailsBulkDto
{
    public int? Id { get; set; }
    public int? PropertyId { get; set; }
    public int? SocietyDetailId { get; set; }
    public int? WingDetailId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int SocialAttributeId { get; set; }
    public bool? BitValue { get; set; }
    public int? IntValue { get; set; }
    public decimal? DecimalValue { get; set; }
    public string? TextValue { get; set; }
    public DateTime? DateValue { get; set; }
    public int? DocumentBindingId { get; set; }
    public string? Remark { get; set; }
    public string? SocialAttributeCode { get; set; }
    public string? SocialAttributeName { get; set; }
    public int? PhotoTypeID { get; set; }
    public bool? IsDocumentRequired { get; set; }
    public bool? IsPhotoRequired { get; set; }
    public List<SocialPropertyDocumentsDto> Documents { get; set; } = new();
    public List<SocialPropertyDocumentsDto> Photos { get; set; } = new();
}

public class SocialPropertyDocumentsDto
{
    public int? PropertySocialDetailId { get; set; }
    public int SocialAttributeId { get; set; }
    public int PropertyPhotoId { get; set; }
    public int PropertyId { get; set; }
    public int PhotoTypeId { get; set; }
    public string? PhotoTypeCode { get; set; }
    public string? PhotoTypeName { get; set; }
    public int DocumentId { get; set; }
    public Guid DocumentGuid { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileName { get; set; }
    public string? MimeType { get; set; }
    public string? FileExtension { get; set; }
    public long FileSizeBytes { get; set; }
    public int? DocumentBindingId { get; set; }
    public bool IsPhoto { get; set; }
    public bool IsDocument { get; set; }
    public bool IsLatest { get; set; }
    public int? DisplayOrder { get; set; }
    public string? Remarks { get; set; }
    public string ViewUrl { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
    public DateTime? CreatedDate { get; set; }
}
