using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Core.Entities.WaterBill.Master;

public class BillingPeriodEntity : BaseEntity
{
    public string BillingPeriodCode { get; set; } = string.Empty;
    public int FinancialYearId { get; set; }
    public int BillingFrequencyId { get; set; }
    public DateTime PeriodFromDate { get; set; }
    public DateTime PeriodToDate { get; set; }
    public DateTime? BillGenerationDate { get; set; }
    public DateTime? DueDate { get; set; }
    public int GraceDays { get; set; }
    public int SequenceNo { get; set; } = 1;
    public DateTime? CurrentPenaltyStartDate { get; set; }
    public DateTime? CurrentPenaltyEndDate { get; set; }
    public DateTime? PendingPenaltyStartDate { get; set; }
    public DateTime? PendingPenaltyEndDate { get; set; }

    [ForeignKey(nameof(FinancialYearId))]
    public virtual YearMasterEntity? FinancialYear { get; set; }

    [ForeignKey(nameof(BillingFrequencyId))]
    public virtual BillingFrequencyMasterEntity? BillingFrequency { get; set; }
}
