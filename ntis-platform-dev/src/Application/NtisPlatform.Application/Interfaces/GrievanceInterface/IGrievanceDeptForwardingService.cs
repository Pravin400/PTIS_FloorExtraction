using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDeptForwarding;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for Grievance Department Forwarding operations
/// </summary>
public interface IGrievanceDeptForwardingService : ICommonCrudService<
    GrievanceDeptForwardingEntity,
    GrievanceDeptForwardingDto,
    CreateGrievanceDeptForwardingDto,
    UpdateGrievanceDeptForwardingDto,
    GrievanceDeptForwardingQueryParameters,
    int>
{
    Task<List<GrievanceDeptForwardingDto>> GetByGrievanceIdAsync(int grievanceId, CancellationToken cancellationToken = default);
    Task<PagedResult<GrievanceDeptForwardingDto>> GetByDepartmentIdAsync(int departmentId, GrievanceDeptForwardingQueryParameters queryParameters, CancellationToken cancellationToken = default);
}
