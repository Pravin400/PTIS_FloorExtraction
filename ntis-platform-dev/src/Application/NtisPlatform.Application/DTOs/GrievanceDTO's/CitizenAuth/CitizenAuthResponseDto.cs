namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;

/// <summary>
/// Authenticated JWT token and citizen profile response
/// </summary>
public class CitizenAuthResponseDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Login successful";
    public string Token { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsNewUser { get; set; }
    public int CitizenId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string MobileNo { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
}
