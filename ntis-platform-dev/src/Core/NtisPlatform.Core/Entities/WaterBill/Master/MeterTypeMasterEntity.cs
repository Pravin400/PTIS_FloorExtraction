namespace NtisPlatform.Core.Entities.WaterBill.Master;

public class MeterTypeMasterEntity : BaseEntity
{
    public string MeterTypeCode { get; set; } = string.Empty;
    public string MeterType { get; set; } = string.Empty;
    public string? Description { get; set; }
}
