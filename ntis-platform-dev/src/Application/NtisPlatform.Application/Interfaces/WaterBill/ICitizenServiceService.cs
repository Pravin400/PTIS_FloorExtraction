using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;

namespace NtisPlatform.Application.Interfaces.WaterBill;

public interface ICitizenServiceService : ICommonCrudService<CitizenServiceEntity, CitizenServiceDto, CreateCitizenServiceDto, UpdateCitizenServiceDto, CitizenServiceQueryParameters, int>
{
    Task<IEnumerable<CitizenServiceDto>> GetActiveCitizenServicesAsync(int? departmentId, CancellationToken cancellationToken = default);
}
