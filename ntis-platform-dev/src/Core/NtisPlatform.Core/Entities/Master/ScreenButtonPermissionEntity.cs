namespace NtisPlatform.Core.Entities.Master;

public class ScreenButtonPermissionEntity : BaseEntity
{
    public int? UserRoleAllocationId { get; set; }
    public int ScreenId { get; set; }
    public int ScreenButtonId { get; set; }
    public bool? IsVisible { get; set; }
    public bool? IsEnabled { get; set; }

    // Navigation
    public UserRoleAllocationEntity? UserRoleAllocation { get; set; }
    public ScreenMasterEntity? ScreenMaster { get; set; }
    public ScreenButtonMasterEntity? ScreenButtonMaster { get; set; }
}
