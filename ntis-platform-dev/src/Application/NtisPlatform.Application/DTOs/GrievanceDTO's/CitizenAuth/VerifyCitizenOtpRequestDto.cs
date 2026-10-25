using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;

/// <summary>
/// Request payload to verify OTP and authenticate citizen
/// </summary>
public class VerifyCitizenOtpRequestDto
{
    [Required(ErrorMessage = "Mobile number is required")]
    [RegularExpression(@"^[0-9]{10,15}$", ErrorMessage = "Please enter a valid 10-15 digit mobile number")]
    public string MobileNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "OTP is required")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "OTP must be exactly 6 digits")]
    public string Otp { get; set; } = string.Empty;

    /// <summary>
    /// Optional citizen name if registering during first login
    /// </summary>
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters")]
    public string? Name { get; set; }

    /// <summary>
    /// Purpose binding e.g., 'LOGIN', 'SUBMIT_GRIEVANCE', 'RTS_APPLICATION'
    /// </summary>
    [StringLength(50, ErrorMessage = "Purpose cannot exceed 50 characters")]
    public string Purpose { get; set; } = "LOGIN";

    /// <summary>
    /// Originating module e.g., 'GRV', 'RTS', 'PTIS', 'WTIS'
    /// </summary>
    [StringLength(20, ErrorMessage = "Module code cannot exceed 20 characters")]
    public string? ModuleCode { get; set; }

    /// <summary>
    /// Optional target entity/transaction reference ID
    /// </summary>
    [StringLength(50, ErrorMessage = "ReferenceId cannot exceed 50 characters")]
    public string? ReferenceId { get; set; }
}
