namespace NtisPlatform.Application.DTOs.Master.ScreenFieldValidation;

public class ScreenFieldValidationCustomDto
{
    public int ScreenId { get; set; }
    public string? ScreenName { get; set; }
    public string? ScreenNameLocal { get; set; }
    public List<FieldValidationDetailsDto> FieldValidationDetails { get; set; } = new List<FieldValidationDetailsDto>();
    public List<ButtonPermissionDetailsDto> ButtonPermissionDetails { get; set; } = new List<ButtonPermissionDetailsDto>();
}

public class FieldValidationDetailsDto
{
    public string FieldCode { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public string FieldTypeName { get; set; } = string.Empty;
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? ValidationExpression { get; set; }
    public string? ErrorMessage { get; set; }
    public bool? IsVisible { get; set; }
    public bool? IsMandatory { get; set; }
    public bool? IsReadonly { get; set; }
}
public class ButtonPermissionDetailsDto
{
    public string ButtonCode { get; set; } = string.Empty;
    public string ButtonName { get; set; } = string.Empty;
    public string ButtonTypeName { get; set; } = string.Empty;
    public bool IsVisible { get; set; }
    public bool IsEnabled { get; set; }
}
