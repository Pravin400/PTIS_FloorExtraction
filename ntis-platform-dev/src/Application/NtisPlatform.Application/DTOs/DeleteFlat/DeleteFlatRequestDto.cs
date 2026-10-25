using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.DeleteFlat;

public class DeleteFlatRequestDto
{
    [Required(ErrorMessage = "DeleteFlatRequest_FilterType_Required")]
    public string FilterType { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "DeleteFlatRequest_FilterValue")]
    public int FilterValue { get; set; }
}
