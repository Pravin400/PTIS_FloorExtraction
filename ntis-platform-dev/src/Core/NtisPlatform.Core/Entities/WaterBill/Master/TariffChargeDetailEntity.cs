using global::NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Core.Entities.Master.WaterBill;

public class TariffChargeDetailEntity : BaseEntity
{
    new public long Id { get; set; }
    public long TariffId { get; set; }
    public int ChargeHeadId { get; set; }
    public int? GeographyUnitId { get; set; }
    public decimal Amount { get; set; }
    public bool IsDynamic { get; set; } = false;
    public bool IsMandatory { get; set; } = true;
    public int SequenceNo { get; set; } = 1;

    public virtual TariffMasterEntity? Tariff { get; set; }
    public virtual ChargeHeadMasterEntity? ChargeHead { get; set; }
    public virtual GeographyUnitEntity? GeographyUnit { get; set; }
}
