namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;

/// <summary>
/// AI categorization, validation guardrails, and suggested content for a grievance photo
/// </summary>
public class GrievanceAiAnalysisDto
{
    public bool IsValidCivicIssue { get; set; } = true;
    public bool IsExplicitOrInappropriate { get; set; } = false;
    public bool IsImageUnclear { get; set; } = false;
    public string? RejectionReason { get; set; }
    public string? RejectionReasonLocal { get; set; }
    public double? AccuracyPercentage { get; set; }

    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? DepartmentNameLocal { get; set; }
    public int? GrievanceTypeId { get; set; }
    public string? GrievanceTypeName { get; set; }
    public string? GrievanceTypeNameLocal { get; set; }
    public string? SuggestedTitle { get; set; }
    public string? SuggestedTitleLocal { get; set; }
    public string? SuggestedDescription { get; set; }
    public string? SuggestedDescriptionLocal { get; set; }
    public bool IsDepartmentVerified { get; set; } = true;
    public string? ModelUsed { get; set; }
    public List<int> ScannedPhotoIds { get; set; } = new();
}
