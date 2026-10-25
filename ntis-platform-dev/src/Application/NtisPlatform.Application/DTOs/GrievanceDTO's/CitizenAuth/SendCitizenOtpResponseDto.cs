namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;

/// <summary>
/// Response returned after successfully issuing an OTP challenge
/// </summary>
public class SendCitizenOtpResponseDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "OTP has been sent to your registered mobile number.";
    public string MaskedMobileNo { get; set; } = string.Empty;

    /// <summary>
    /// Total validity duration of the OTP in seconds (e.g. 600 seconds for 10 minutes)
    /// </summary>
    public int ExpiresInSeconds { get; set; } = 600;

    /// <summary>
    /// Total validity duration of the OTP in minutes (10 minutes)
    /// </summary>
    public int OtpExpiryMinutes { get; set; } = 10;

    /// <summary>
    /// Cooldown duration in seconds before requesting a resend OTP (30 seconds)
    /// </summary>
    public int ResendInSeconds { get; set; } = 30;

    public bool IsRegisteredCitizen { get; set; }
    public string? DebugOtp { get; set; }
}
