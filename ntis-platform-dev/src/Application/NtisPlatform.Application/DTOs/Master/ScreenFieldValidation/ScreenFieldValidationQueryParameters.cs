using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.Master.ScreenFieldValidation
{
    public class ScreenFieldValidationQueryParameters
    {
        [Required(ErrorMessage = "ScreenFieldValidation_DepartmentId_Required")]
        [Range(1, int.MaxValue, ErrorMessage = "ScreenFieldValidation_DepartmentId_Invalid")]
        public int DepartmentId { get; set; }

        [Required(ErrorMessage = "ScreenFieldValidation_ModuleId_Required")]
        [Range(1, int.MaxValue, ErrorMessage = "ScreenFieldValidation_ModuleId_Invalid")]
        public int ModuleId { get; set; }
        public int ScreenId { get; set; } = 0;
    }
}
