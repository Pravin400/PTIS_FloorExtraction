using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Interfaces.WaterBill;

public interface IPortalContentService : ICommonCrudService<PortalContentEntity, PortalContentDto, CreatePortalContentDto, UpdatePortalContentDto, PortalContentQueryParameters, int>
{
    Task<IEnumerable<PortalContentDto>> GetActivePortalContentAsync(int? departmentId, string contentType, CancellationToken cancellationToken = default);
}
