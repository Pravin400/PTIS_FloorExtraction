using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;

/// <summary>
/// Request payload to trigger an OTP for citizen login / registration or transaction authorization
/// </summary>
public class SendCitizenOtpRequestDto
{
    /// <summary>
    /// 10 to 15 digit mobile number
    /// </summary>
    [Required(ErrorMessage = "Mobile number is required")]
    [RegularExpression(@"^[0-9]{10,15}$", ErrorMessage = "Please enter a valid 10-15 digit mobile number")]
    public string MobileNo { get; set; } = string.Empty;

    /// <summary>
    /// Optional citizen name for first-time registration
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
