using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;

public class CitizenMasterDto : BaseDtos
{
    public string Name { get; set; } = string.Empty;
    public string MobileNo { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public int FailedOtpCount { get; set; }
    public DateTime? LockedUntilAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class CreateCitizenMasterDto : CreateBaseDtos
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mobile number is required")]
    [StringLength(15, MinimumLength = 10, ErrorMessage = "Mobile number must be between 10 and 15 digits")]
    [RegularExpression(@"^[0-9+]+$", ErrorMessage = "Mobile number must contain valid digits")]
    public string MobileNo { get; set; } = string.Empty;
}

public class UpdateCitizenMasterDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mobile number is required")]
    [StringLength(15, MinimumLength = 10, ErrorMessage = "Mobile number must be between 10 and 15 digits")]
    [RegularExpression(@"^[0-9+]+$", ErrorMessage = "Mobile number must contain valid digits")]
    public string MobileNo { get; set; } = string.Empty;
}
