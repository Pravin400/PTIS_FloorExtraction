using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.WaterBill.Master;

public class ChargeHeadMasterEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ChargeHeadNameLocal { get; set; }
    public string ChargeType { get; set; } = string.Empty;
    public bool IsRefundable { get; set; }
    public int SequenceNo { get; set; } = 1;
    public string? Description { get; set; }
    public bool IsRegularPay { get; set; }
}
