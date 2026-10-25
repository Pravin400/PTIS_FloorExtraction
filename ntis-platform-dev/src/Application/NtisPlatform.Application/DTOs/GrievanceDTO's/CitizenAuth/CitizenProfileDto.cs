namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;

/// <summary>
/// Authenticated citizen profile information
/// </summary>
public class CitizenProfileDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string MobileNo { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedDate { get; set; }
    public int ActiveGrievancesCount { get; set; }
    public int TotalGrievancesCount { get; set; }
}
