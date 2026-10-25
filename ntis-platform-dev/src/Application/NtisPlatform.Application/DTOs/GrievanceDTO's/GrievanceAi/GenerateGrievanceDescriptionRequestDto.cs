namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;

/// <summary>
/// Request parameters for generating grievance description via Gemini AI using existing photo IDs
/// </summary>
public class GenerateGrievanceDescriptionRequestDto
{
    /// <summary>
    /// Single photo ID or multiple comma-separated photo IDs (e.g. "6" or "5,6")
    /// </summary>
    public string PhotoIds { get; set; } = string.Empty;

    /// <summary>
    /// Database IDs of the already uploaded GrievancePhoto records (e.g. [5, 6])
    /// </summary>
    public List<int> GrievancePhotoIds { get; set; } = new();
}
