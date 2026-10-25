namespace NtisPlatform.Application.DTOs.Property;

/// <summary>
/// Response item DTO for GET /api/property/get-properties endpoint
/// </summary>
public class GetPropertiesItemDto
{
    public int PropertyId { get; set; }
    public int WardId { get; set; }
    public string? WardNo { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int? PropertyTypeId { get; set; }
    public string? UPICId { get; set; }
    public string? CSN { get; set; }
    public string? SubZoneNo { get; set; }
    public string? PlotNo { get; set; }
    public int? CategoryId { get; set; }
    public string? Type { get; set; }
    public string? PartType { get; set; }
    public string? OwnerTitle { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerTitleEnglish { get; set; }
    public string? OwnerNameEnglish { get; set; }
    public string? OccupierTitle { get; set; }
    public string? OccupierName { get; set; }
    public string? OccupierTitleEnglish { get; set; }
    public string? OccupierNameEnglish { get; set; }
    public string? Address { get; set; }
    public string? Location { get; set; }
    public string? AddressEnglish { get; set; }
    public string? LocationEnglish { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsMerged { get; set; }
    public int MapCount { get; set; }
    public string? CreatedBy { get; set; }

    // Additional Visit / Photo / Contact Fields
    public string? MobileNo { get; set; }
    public bool IsVisited { get; set; }

    public PropertyLatestVisitDto? LatestVisit { get; set; }
    public List<PropertyLatestVisitDto> Visits { get; set; } = new();
    public PropertyPhotoSummaryDto? Photo { get; set; }
}

public class PropertyLatestVisitDto
{
    public int VisitId { get; set; }
    public int PropertyWorkflowDetailsId { get; set; }
    public string? Status { get; set; }
    public bool? InternalSurveyVerified { get; set; }
    public int? RemarkId { get; set; }
    public string? RemarkText { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Location { get; set; }
    public DateTime? VisitDate { get; set; }
    public int WorkflowStageId { get; set; }
    public string? WorkflowStageName { get; set; }
    public string? WorkflowStageDescription { get; set; }
    public int? VisitedByUserId { get; set; }
    public string? VisitedByUserName { get; set; }
    public string? VisitedByFullName { get; set; }
}

public class PropertyPhotoSummaryDto
{
    public int PropertyPhotoId { get; set; }
    public int? PhotoTypeId { get; set; }
    public int? DocumentBindingId { get; set; }
    public int? DocumentId { get; set; }
    public Guid? DocumentGuid { get; set; }
    public string? FileName { get; set; }
    public string? OriginalFileName { get; set; }
    public string? MimeType { get; set; }
    public string? PhotoUrl { get; set; }
}

