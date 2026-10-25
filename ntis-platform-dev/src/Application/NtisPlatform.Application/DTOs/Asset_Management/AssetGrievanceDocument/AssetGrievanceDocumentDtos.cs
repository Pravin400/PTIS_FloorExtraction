using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocument;

public class AssetGrievanceDocumentBulkSaveDto
{
    public int GrievanceDetailsId { get; set; }
    
    /// <summary>
    /// List of documents attached to the grievance.
    /// If DocumentBindingId is not yet available, pass null for it.
    /// The API will create the slots and return the IDs.
    /// </summary>
    public List<AssetGrievanceDocumentItemDto> Documents { get; set; } = new();
}

public class AssetGrievanceDocumentItemDto
{
    public int? Id { get; set; }
    public int DocumentTypeId { get; set; }
    public int? DisplayOrder { get; set; }
    public string? Remarks { get; set; }
    public bool IsEnabled { get; set; } = true;
}

public class AssetGrievanceDocumentBulkSaveResponseDto
{
    public int GrievanceDetailsId { get; set; }
    public int TotalProcessed { get; set; }
    public int EnabledCount { get; set; }
    public int DisabledCount { get; set; }
    public List<AssetGrievanceDocumentResponseDto> SavedDocuments { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public class AssetGrievanceDocumentResponseDto
{
    public int Id { get; set; }
    public int GrievanceDetailsId { get; set; }
    public int DocumentTypeId { get; set; }
    public int? DocumentBindingId { get; set; }
    public bool IsLatest { get; set; }
    public int? DisplayOrder { get; set; }
    public string? Remarks { get; set; }
    
    public string? DocumentTypeName { get; set; }
    public string? DocumentTypeCode { get; set; }
    
    // Flattened from DocumentBinding / Document
    public Guid? DocumentGuid { get; set; }
    public string? FileName { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileExtension { get; set; }
    public string? StoragePath { get; set; }
}
