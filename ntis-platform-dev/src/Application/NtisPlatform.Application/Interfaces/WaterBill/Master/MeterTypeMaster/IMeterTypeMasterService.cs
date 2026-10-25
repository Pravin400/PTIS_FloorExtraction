using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.MeterTypeMaster;

public interface IMeterTypeMasterService
    : ICommonCrudService<MeterTypeMasterEntity, MeterTypeMasterDto, CreateMeterTypeMasterDto, UpdateMeterTypeMasterDto, MeterTypeMasterQueryParameters, int>
{
}
