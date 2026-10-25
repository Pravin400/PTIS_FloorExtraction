namespace NtisPlatform.Core.Entities.Master;

public class ScreenButtonMasterEntity : BaseEntity
{
    public string ButtonCode { get; set; } = string.Empty;
    public string ButtonName { get; set; } = string.Empty;
    public int ButtonTypeId { get; set; }
    public int? DisplayOrder { get; set; }

    // Navigation
    public ButtonTypeMasterEntity? ButtonTypeMaster { get; set; }
    public ICollection<ScreenButtonPermissionEntity> ScreenButtonPermissions { get; set; } = new List<ScreenButtonPermissionEntity>();
}
