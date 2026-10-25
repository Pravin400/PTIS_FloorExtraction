namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Result of a RevisionPropertyMast PUT: the saved snapshot plus whether editing it reset a
/// CALCULATED revision back to DRAFT (REVISION LOGIC.txt section 19), so the caller can surface
/// that to the user instead of it happening silently.
/// </summary>
public class UpdateRevisionPropertyMastResultDto
{
    public required RevisionPropertyMastDto Property { get; set; }
    public bool ResetToDraft { get; set; }
}
