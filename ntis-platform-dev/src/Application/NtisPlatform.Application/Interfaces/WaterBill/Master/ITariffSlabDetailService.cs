using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Master.WaterBill;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master;

public interface ITariffSlabDetailService : ICommonCrudService<TariffSlabDetailEntity, TariffSlabDetailDto, CreateTariffSlabDetailDto, UpdateTariffSlabDetailDto, TariffSlabDetailQueryParameters, long>
{
    /// <summary>
    /// Calculates the billing amount for a tariff slab entity based on formula code and consumption / connection parameters.
    /// Evaluates legacy FLAT_RATE and canonical FIXED formula codes identically.
    /// </summary>
    decimal CalculateBillingAmount(TariffSlabDetailEntity slab, decimal consumptionUnits, int connectionCount = 1);

    /// <summary>
    /// Calculates the billing amount for a tariff slab DTO based on formula code and consumption / connection parameters.
    /// Evaluates legacy FLAT_RATE and canonical FIXED formula codes identically.
    /// </summary>
    decimal CalculateBillingAmount(TariffSlabDetailDto slab, decimal consumptionUnits, int connectionCount = 1);
}
