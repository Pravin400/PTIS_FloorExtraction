namespace NtisPlatform.Core.Entities.WaterBill.Master;

public class BillingFrequencyMasterEntity : BaseEntity
{
    public string BillingFrequencyCode { get; set; } = string.Empty;
    public string BillingFrequency { get; set; } = string.Empty;
    public int PeriodsPerYear { get; set; }
    public int SequenceNo { get; set; }
    public string? Description { get; set; }
}
