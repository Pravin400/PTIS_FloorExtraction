using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using System.Security.Claims;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Citizen Passwordless Mobile + OTP Authentication (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CitizenAuthController : ControllerBase
{
    private readonly ICitizenAuthService _citizenAuthService;
    private readonly ILogger<CitizenAuthController> _logger;

    public CitizenAuthController(
        ICitizenAuthService citizenAuthService,
        ILogger<CitizenAuthController> logger)
    {
        _citizenAuthService = citizenAuthService;
        _logger = logger;
    }

    /// <summary>
    /// Request an OTP challenge sent to a mobile number for login/registration
    /// </summary>
    [HttpPost("send-otp")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(SendCitizenOtpResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendOtp([FromBody] SendCitizenOtpRequestDto request, CancellationToken ct)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _citizenAuthService.SendOtpAsync(request, ipAddress, ct);
        return Ok(response);
    }

    /// <summary>
    /// Resend OTP challenge to a mobile number
    /// </summary>
    [HttpPost("resend-otp")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(SendCitizenOtpResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendOtp([FromBody] SendCitizenOtpRequestDto request, CancellationToken ct)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _citizenAuthService.SendOtpAsync(request, ipAddress, ct);
        return Ok(response);
    }

    /// <summary>
    /// Verify the OTP challenge and obtain an authenticated citizen session (JWT Token)
    /// </summary>
    [HttpPost("verify-otp")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(CitizenAuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyCitizenOtpRequestDto request, CancellationToken ct)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _citizenAuthService.VerifyOtpAsync(request, ipAddress, ct);
        return Ok(response);
    }

    /// <summary>
    /// Get the profile and grievance metrics of the currently logged-in citizen
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = "Citizen")]
    [ProducesResponseType(typeof(CitizenProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var citizenIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(citizenIdStr, out var citizenId))
        {
            return Unauthorized(new { message = "Invalid citizen token." });
        }

        var profile = await _citizenAuthService.GetProfileAsync(citizenId, ct);
        if (profile == null)
        {
            return NotFound(new { message = "Citizen profile not found." });
        }

        return Ok(profile);
    }

    /// <summary>
    /// Update the name of the currently logged-in citizen
    /// </summary>
    [HttpPut("profile")]
    [Authorize(Roles = "Citizen")]
    [ProducesResponseType(typeof(CitizenProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCitizenProfileRequestDto request, CancellationToken ct)
    {
        var citizenIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(citizenIdStr, out var citizenId))
        {
            return Unauthorized(new { message = "Invalid citizen token." });
        }

        var profile = await _citizenAuthService.UpdateProfileAsync(citizenId, request.Name, ct);
        if (profile == null)
        {
            return NotFound(new { message = "Citizen profile not found." });
        }

        return Ok(profile);
    }
}
