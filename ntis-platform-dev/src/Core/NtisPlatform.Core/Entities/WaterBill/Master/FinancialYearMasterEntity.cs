namespace NtisPlatform.Core.Entities.WaterBill.Master;

public class FinancialYearMasterEntity : BaseEntity
{
    public string FinancialYearCode { get; set; } = string.Empty;
    public string FinancialYear { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
