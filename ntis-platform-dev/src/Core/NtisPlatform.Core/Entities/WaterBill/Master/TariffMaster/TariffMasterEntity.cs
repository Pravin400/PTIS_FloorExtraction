using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Core.Entities.Master.WaterBill;

public class TariffMasterEntity : BaseEntity
{
    new public long Id { get; set; }
    public string TariffCode { get; set; } = string.Empty;
    public string TariffName { get; set; } = string.Empty;
    public int YearId { get; set; }
    public int ConnectionTypeId { get; set; }
    public int ConnectionCategoryId { get; set; }
    public int TapSizeId { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public string? Description { get; set; }

    public virtual YearMasterEntity? Year { get; set; }
    public virtual ConnectionTypeMasterEntity? ConnectionType { get; set; }
    public virtual ConnectionCategoryMasterEntity? ConnectionCategory { get; set; }
    public virtual TapSizeMasterEntity? TapSize { get; set; }
    public virtual ICollection<TariffSlabDetailEntity> Slabs { get; set; } = new List<TariffSlabDetailEntity>();
}
