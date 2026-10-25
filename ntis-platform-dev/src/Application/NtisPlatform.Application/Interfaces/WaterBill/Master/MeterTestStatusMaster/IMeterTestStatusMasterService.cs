using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.MeterTestStatusMaster;

public interface IMeterTestStatusMasterService
    : ICommonCrudService<MeterTestStatusMasterEntity, MeterTestStatusMasterDto, CreateMeterTestStatusMasterDto, UpdateMeterTestStatusMasterDto, MeterTestStatusMasterQueryParameters, int>
{
}
