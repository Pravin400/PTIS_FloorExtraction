namespace NtisPlatform.Core.Entities.Master.WaterBill;

public class ConnectionTypeMasterEntity : BaseEntity
{
    public string ConnectionTypeCode { get; set; } = string.Empty;
    public string ConnectionType { get; set; } = string.Empty;
    public string? Description { get; set; }
}
