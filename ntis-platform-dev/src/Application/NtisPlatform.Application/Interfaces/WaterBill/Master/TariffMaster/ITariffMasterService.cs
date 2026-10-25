using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Master.WaterBill;

namespace NtisPlatform.Application.Interfaces.Master.WaterBill;

public interface ITariffMasterService
    : ICommonCrudService<TariffMasterEntity, TariffMasterDto, CreateTariffMasterDto, UpdateTariffMasterDto, TariffMasterQueryParameters, long>
{
}
