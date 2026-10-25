using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for GrievanceApplication business operations
/// </summary>
public interface IGrievanceApplicationService : ICommonCrudService<GrievanceApplicationEntity, GrievanceApplicationDto, CreateGrievanceApplicationDto, UpdateGrievanceApplicationDto, GrievanceApplicationQueryParameters, int>
{
    Task<GrievanceApplicationDto?> GetByGrievanceNoAsync(string grievanceNo, CancellationToken cancellationToken = default);
    Task<PagedResult<GrievanceApplicationDto>> GetByCitizenIdAsync(int citizenId, GrievanceApplicationQueryParameters queryParams, CancellationToken cancellationToken = default);
    Task<GrievanceTrackingDetailsDto?> TrackGrievanceAsync(string grievanceNo, string? mobileNo = null, CancellationToken cancellationToken = default);
    Task<GrievancePublicDetailsDto?> GetPublicDetailsByGrievanceNoAsync(string grievanceNo, CancellationToken cancellationToken = default);
    Task<GrievancePublicDetailsDto?> GetPublicDetailsByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<GrievancePublicDetailsDto>> GetAllPublicDetailsAsync(CancellationToken cancellationToken = default);
    Task<GrievanceApplicationDto?> AssignOfficerAsync(int grievanceId, AssignGrievanceDto dto, int actionByUserId, CancellationToken cancellationToken = default);
    Task<GrievanceApplicationDto?> ForwardToDepartmentAsync(int grievanceId, ForwardGrievanceDto dto, int actionByUserId, CancellationToken cancellationToken = default);
    Task<GrievanceApplicationDto?> TransitionStateAsync(int grievanceId, TransitionGrievanceStateDto dto, int actionByUserId, CancellationToken cancellationToken = default);
    Task<List<GrievanceTimelineItemDto>> GetHistoryAsync(int grievanceId, CancellationToken cancellationToken = default);
}
