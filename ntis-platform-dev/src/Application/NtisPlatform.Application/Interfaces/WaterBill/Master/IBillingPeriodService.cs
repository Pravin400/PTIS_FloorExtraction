using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master;

public interface IBillingPeriodService
    : ICommonCrudService<BillingPeriodEntity, BillingPeriodDto, CreateBillingPeriodDto, UpdateBillingPeriodDto, BillingPeriodQueryParameters, int>
{
}
