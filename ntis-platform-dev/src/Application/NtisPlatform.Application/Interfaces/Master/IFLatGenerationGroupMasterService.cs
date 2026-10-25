using NtisPlatform.Application.DTOs;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Interfaces;

public interface IFLatGenerationGroupMasterService : ICommonCrudService<FLatGenerationGroupMasterEntity, FLatGenerationGroupMasterDto, CreateFLatGenerationGroupMasterDto, UpdateFLatGenerationGroupMasterDto, FLatGenerationGroupMasterQueryParameters, int>
{
}
