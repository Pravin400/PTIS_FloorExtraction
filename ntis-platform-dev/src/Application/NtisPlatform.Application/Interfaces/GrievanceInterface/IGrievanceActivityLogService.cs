using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceActivityLog;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for querying immutable Grievance Activity Logs
/// </summary>
public interface IGrievanceActivityLogService
{
    Task<PagedResult<GrievanceActivityLogDto>> GetAllAsync(GrievanceActivityLogQueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<GrievanceActivityLogDto?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<GrievanceActivityLogDto>> GetByGrievanceIdAsync(int grievanceId, CancellationToken cancellationToken = default);
}
