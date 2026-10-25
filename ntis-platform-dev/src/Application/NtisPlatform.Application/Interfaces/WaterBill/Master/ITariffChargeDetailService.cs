using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Master.WaterBill;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master;

public interface ITariffChargeDetailService : ICommonCrudService<TariffChargeDetailEntity, TariffChargeDetailDto, CreateTariffChargeDetailDto, UpdateTariffChargeDetailDto, TariffChargeDetailQueryParameters, long>
{
}
