using NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.ChargeHeadMaster;

public interface IChargeHeadMasterService
    : ICommonCrudService<ChargeHeadMasterEntity, ChargeHeadMasterDto, CreateChargeHeadMasterDto, UpdateChargeHeadMasterDto, ChargeHeadMasterQueryParameters, int>
{
}
