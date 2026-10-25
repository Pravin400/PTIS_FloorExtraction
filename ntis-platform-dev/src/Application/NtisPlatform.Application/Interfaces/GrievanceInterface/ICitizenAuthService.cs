using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Passwordless Mobile + OTP authentication service for Citizens (GRV Module)
/// </summary>
public interface ICitizenAuthService
{
    /// <summary>
    /// Generates and sends a 6-digit OTP to the given mobile number.
    /// </summary>
    Task<SendCitizenOtpResponseDto> SendOtpAsync(SendCitizenOtpRequestDto request, string? ipAddress, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifies the OTP, updates security counters, auto-registers citizen if new, and mints JWT token.
    /// </summary>
    Task<CitizenAuthResponseDto> VerifyOtpAsync(VerifyCitizenOtpRequestDto request, string? ipAddress, CancellationToken cancellationToken = default);

    /// <summary>
    /// Fetches the profile of the authenticated citizen.
    /// </summary>
    Task<CitizenProfileDto?> GetProfileAsync(int citizenId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates citizen profile details (such as Name).
    /// </summary>
    Task<CitizenProfileDto?> UpdateProfileAsync(int citizenId, string name, CancellationToken cancellationToken = default);
}
