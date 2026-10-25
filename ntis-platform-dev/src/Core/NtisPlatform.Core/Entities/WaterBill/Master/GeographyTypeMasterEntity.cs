namespace NtisPlatform.Core.Entities.WaterBill.Master;

public class GeographyTypeMasterEntity : BaseEntity
{
    public string GeographyTypeCode { get; set; } = string.Empty;
    public string GeographyType { get; set; } = string.Empty;
    public int LevelNo { get; set; }
}
