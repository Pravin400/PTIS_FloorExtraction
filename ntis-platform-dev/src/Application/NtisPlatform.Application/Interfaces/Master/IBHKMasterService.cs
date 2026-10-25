using NtisPlatform.Application.DTOs.Master.BHKMaster;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Interfaces.Master;

public interface IBHKMasterService : ICommonCrudService<BHKMasterEntity, BHKMasterDto, CreateBHKMasterDto, UpdateBHKMasterDto, BHKMasterQueryParameters, int>
{

}
