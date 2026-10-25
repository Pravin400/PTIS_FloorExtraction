namespace NtisPlatform.Core.Entities.Master;

public class ButtonTypeMasterEntity : BaseEntity
{
    public string ButtonTypeName { get; set; } = string.Empty;

    // Navigation
    public ICollection<ScreenButtonMasterEntity> ScreenButtons { get; set; } = new List<ScreenButtonMasterEntity>();
}
