using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenAuth;

/// <summary>
/// Payload to update authenticated citizen profile
/// </summary>
public class UpdateCitizenProfileRequestDto
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters")]
    public string Name { get; set; } = string.Empty;
}
