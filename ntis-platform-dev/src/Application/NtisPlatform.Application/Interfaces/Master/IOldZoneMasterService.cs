using NtisPlatform.Application.DTOs;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Interfaces;

public interface IOldZoneMasterService : ICommonCrudService<OldZoneMasterEntity, OldZoneMasterDto, CreateOldZoneMasterDto, UpdateOldZoneMasterDto, OldZoneMasterQueryParameters, int>
{
}
