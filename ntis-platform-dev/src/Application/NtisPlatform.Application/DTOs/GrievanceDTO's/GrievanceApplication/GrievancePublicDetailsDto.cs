using System;
using System.Collections.Generic;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;

/// <summary>
/// Comprehensive public DTO for citizen viewing grievance details, current progress, timeline, and associated photos/images
/// </summary>
public class GrievancePublicDetailsDto
{
    public int Id { get; set; }
    public string GrievanceNo { get; set; } = string.Empty;
    public int CitizenId { get; set; }
    public string? CitizenName { get; set; }
    public string? MaskedMobileNo { get; set; }
    public int GrievanceDepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? DepartmentNameLocal { get; set; }
    public int GrievanceTypeId { get; set; }
    public string? GrievanceType { get; set; }
    public string? RoadLandmark { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Description { get; set; }
    public int WorkflowId { get; set; }
    public string? WorkflowName { get; set; }
    public int CurrentStateId { get; set; }
    public string? CurrentStateName { get; set; }
    public string? CurrentAssignedToUserName { get; set; }
    public int? WardId { get; set; }
    public string? WardNo { get; set; }
    public string? WardName { get; set; }
    public int? ZoneId { get; set; }
    public string? ZoneNo { get; set; }
    public string? ZoneName { get; set; }
    public DateTime SubmittedDate { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public int ProgressPercentage { get; set; }
    public int DaysOpen { get; set; }
    public bool IsResolved { get; set; }
    public bool IsClosed { get; set; }

    /// <summary>
    /// Associated photos / images for the grievance, with direct URLs to view photos via GrievancePhotoController.ViewPhoto
    /// </summary>
    public List<GrievancePublicPhotoDto> Photos { get; set; } = new();

    /// <summary>
    /// Step-by-step progress timeline of the grievance lifecycle
    /// </summary>
    public List<GrievanceTimelineItemDto> Timeline { get; set; } = new();
}

/// <summary>
/// Public representation of a photo attached to a grievance, including the endpoint URL to view the image
/// </summary>
public class GrievancePublicPhotoDto
{
    public int Id { get; set; }
    public int GrievanceApplicationId { get; set; }
    public int PhotoTypeId { get; set; }
    public string PhotoTypeName { get; set; } = string.Empty;
    public string PhotoTypeCode { get; set; } = string.Empty;
    public int? DocumentBindingId { get; set; }
    public bool IsLatest { get; set; }
    public string? Remarks { get; set; }
    public string? FileName { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileExtension { get; set; }
    public string? MimeType { get; set; }

    /// <summary>
    /// Direct endpoint URL to stream/view the photo via GrievancePhotoController (GET /api/grievance-photos/{id}/view)
    /// </summary>
    public string ViewPhotoUrl { get; set; } = string.Empty;
}
