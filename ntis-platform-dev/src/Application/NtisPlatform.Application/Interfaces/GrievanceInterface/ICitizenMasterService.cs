using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for CitizenMaster business operations
/// </summary>
public interface ICitizenMasterService : ICommonCrudService<CitizenMasterEntity, CitizenMasterDto, CreateCitizenMasterDto, UpdateCitizenMasterDto, CitizenMasterQueryParameters, int>
{
    Task<CitizenMasterDto?> GetByMobileNoAsync(string mobileNo, CancellationToken cancellationToken = default);
}
