namespace NtisPlatform.Core.Entities.Master.WaterBill;

public class TapSizeMasterEntity : BaseEntity
{
    public string TapSizeCode { get; set; } = string.Empty;
    public string TapSize { get; set; } = string.Empty;
    public decimal? NominalSizeValue { get; set; }
    public string? SizeUnit { get; set; }
}
