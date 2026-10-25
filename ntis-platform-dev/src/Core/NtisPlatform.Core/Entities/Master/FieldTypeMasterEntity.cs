namespace NtisPlatform.Core.Entities.Master;

public class FieldTypeMasterEntity : BaseEntity
{
    public string FieldTypeName { get; set; } = string.Empty;

    // Navigation
    public ICollection<ScreenFieldMasterEntity> ScreenFields { get; set; } = new List<ScreenFieldMasterEntity>();
}
