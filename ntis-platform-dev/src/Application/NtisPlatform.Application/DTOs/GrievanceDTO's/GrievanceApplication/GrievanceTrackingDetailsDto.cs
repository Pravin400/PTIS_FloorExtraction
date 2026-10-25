namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;

/// <summary>
/// Detailed DTO for tracking a grievance complaint and its complete activity timeline
/// </summary>
public class GrievanceTrackingDetailsDto
{
    public int Id { get; set; }
    public string GrievanceNo { get; set; } = string.Empty;
    public int CitizenId { get; set; }
    public string? CitizenName { get; set; }
    public string? MaskedMobileNo { get; set; }
    public int GrievanceDepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int GrievanceTypeId { get; set; }
    public string? GrievanceType { get; set; }
    public string? RoadLandmark { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Description { get; set; }
    public int CurrentStateId { get; set; }
    public string? CurrentStateName { get; set; }
    public string? CurrentAssignedToUserName { get; set; }
    public int? WardId { get; set; }
    public string? WardNo { get; set; }
    public int? ZoneId { get; set; }
    public string? ZoneNo { get; set; }
    public DateTime SubmittedDate { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public DateTime? ClosedDate { get; set; }
    public int ProgressPercentage { get; set; }
    public int DaysOpen { get; set; }
    public bool IsResolved { get; set; }
    public bool IsClosed { get; set; }
    public List<GrievanceTimelineItemDto> Timeline { get; set; } = new();
}

/// <summary>
/// Individual step / timeline event in a grievance's resolution journey
/// </summary>
public class GrievanceTimelineItemDto
{
    public long ActivityLogId { get; set; }
    public string? FromState { get; set; }
    public string ToState { get; set; } = string.Empty;
    public int? ActionByUserId { get; set; }
    public string? ActionBy { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedTo { get; set; }
    public string? Remark { get; set; }
    public DateTime ActionAt { get; set; }
    public int? ForwardedToDeptId { get; set; }
    public string? ForwardedToDepartment { get; set; }
    public string? ForwardingStatus { get; set; }
    public bool IsCurrentStep { get; set; }
}
