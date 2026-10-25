namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceAi;

/// <summary>
/// Request parameter for refining raw citizen-written text, correcting spelling/grammar, and translating into formal complaints
/// </summary>
public class RefineGrievanceDescriptionRequestDto
{
    /// <summary>
    /// The citizen's raw, unedited description (e.g. "i hhave sssseeen the paaaaking issue on main rd")
    /// </summary>
    public string RawDescription { get; set; } = string.Empty;
}
