using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for Ward Representative / Observer poke and grievance escalation operations
/// </summary>
public interface IGrievanceEscalationService : ICommonCrudService<
    GrievanceEscalationEntity,
    GrievanceEscalationDto,
    CreateGrievanceEscalationDto,
    RespondGrievanceEscalationDto,
    GrievanceEscalationQueryParameters,
    int>
{
    /// <summary>
    /// Creates a new observer poke / escalation for a grievance complaint with validation and activity logging
    /// </summary>
    Task<GrievanceEscalationDto> EscalateGrievanceAsync(
        CreateGrievanceEscalationDto dto,
        int escalatedByUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Staff or Department HOD responds to an observer poke with progress remarks and status update
    /// </summary>
    Task<GrievanceEscalationDto?> RespondToEscalationAsync(
        int escalationId,
        RespondGrievanceEscalationDto dto,
        int staffUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all escalations and pokes for a specific grievance ticket
    /// </summary>
    Task<List<GrievanceEscalationDto>> GetByGrievanceIdAsync(
        int grievanceApplicationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all escalations for a specific ward
    /// </summary>
    Task<PagedResult<GrievanceEscalationDto>> GetByWardIdAsync(
        int wardId,
        GrievanceEscalationQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all escalations for a specific zone (aggregating across all wards)
    /// </summary>
    Task<PagedResult<GrievanceEscalationDto>> GetByZoneIdAsync(
        int zoneId,
        GrievanceEscalationQueryParameters queryParameters,
        CancellationToken cancellationToken = default);
}
