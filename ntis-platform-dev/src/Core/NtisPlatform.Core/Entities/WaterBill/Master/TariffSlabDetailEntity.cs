using global::NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Core.Entities.Master.WaterBill;

public class TariffSlabDetailEntity : BaseEntity
{
    new public long Id { get; set; }
    public long TariffId { get; set; }
    public int? GeographyUnitId { get; set; }
    public decimal? FromUnit { get; set; }
    public decimal? ToUnit { get; set; }
    public decimal? UnitRate { get; set; }
    public decimal FixedCharge { get; set; } = 0;
    public decimal MinimumCharge { get; set; } = 0;
    public decimal? MaximumCharge { get; set; }
    public decimal? PerConnectionAmount { get; set; }
    public string? FormulaCode { get; set; }
    public int SortOrder { get; set; } = 1;

    public virtual TariffMasterEntity? Tariff { get; set; }
    public virtual GeographyUnitEntity? GeographyUnit { get; set; }
}
