using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Core.Entities.Master.WaterBill;

public class ConnectionCategoryMasterEntity : BaseEntity
{
    public string ConnectionCategoryCode { get; set; } = string.Empty;
    public string ConnectionCategory { get; set; } = string.Empty;
    public int? BillingFrequencyId { get; set; }
    public bool IsMetered { get; set; } = true;
    public string BillingMethod { get; set; } = "Metered";
    public string? Description { get; set; }

    [ForeignKey(nameof(BillingFrequencyId))]
    public virtual BillingFrequencyMasterEntity? BillingFrequency { get; set; }
}
