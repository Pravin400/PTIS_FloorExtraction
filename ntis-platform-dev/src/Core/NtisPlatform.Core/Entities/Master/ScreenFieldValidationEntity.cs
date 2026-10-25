namespace NtisPlatform.Core.Entities.Master;

public class ScreenFieldValidationEntity : BaseEntity
{
    public int? UserRoleAllocationId { get; set; }
    public int ScreenId { get; set; }
    public int ScreenFieldId { get; set; }
    public bool? IsVisible { get; set; }
    public bool? IsMandatory { get; set; }
    public bool? IsReadonly { get; set; }
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }
    public string? ValidationExpression { get; set; }
    public string? ErrorMessage { get; set; }

    // Navigation
    public UserRoleAllocationEntity? UserRoleAllocation { get; set; }
    public ScreenMasterEntity? ScreenMaster { get; set; }
    public ScreenFieldMasterEntity? ScreenFieldMaster { get; set; }
}
