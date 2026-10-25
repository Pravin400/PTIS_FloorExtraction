using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Master.WaterBill;

namespace NtisPlatform.Application.Interfaces.Master.WaterBill;

public interface IConnectionCategoryMasterService
    : ICommonCrudService<ConnectionCategoryMasterEntity, ConnectionCategoryMasterDto, CreateConnectionCategoryMasterDto, UpdateConnectionCategoryMasterDto, ConnectionCategoryMasterQueryParameters, int>
{
}
