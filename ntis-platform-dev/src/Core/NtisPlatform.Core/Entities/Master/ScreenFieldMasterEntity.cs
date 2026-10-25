namespace NtisPlatform.Core.Entities.Master;

public class ScreenFieldMasterEntity : BaseEntity
{
    public string FieldCode { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public int FieldTypeId { get; set; }
    public int? DefaultDisplayOrder { get; set; }

    // Navigation
    public FieldTypeMasterEntity? FieldType { get; set; }
    public ICollection<ScreenFieldValidationEntity> ScreenFieldValidations { get; set; } = new List<ScreenFieldValidationEntity>();
}
