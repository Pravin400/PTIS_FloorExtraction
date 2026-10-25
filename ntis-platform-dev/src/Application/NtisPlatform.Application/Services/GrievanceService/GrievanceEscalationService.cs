using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceEscalationService
    : BaseCommonCrudService<
        GrievanceEscalationEntity,
        GrievanceEscalationDto,
        CreateGrievanceEscalationDto,
        RespondGrievanceEscalationDto,
        GrievanceEscalationQueryParameters,
        int>,
      IGrievanceEscalationService
{
    private readonly IRepository<GrievanceApplicationEntity, int> _applicationRepository;
    private readonly IRepository<GrievanceActivityLogEntity, long> _activityLogRepository;
    private readonly IRepository<UserEntity, int>? _userRepository;
    private readonly IRepository<WardEntity, int>? _wardRepository;
    private readonly IRepository<ZoneEntity, int>? _zoneRepository;

    public GrievanceEscalationService(
        IRepository<GrievanceEscalationEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<GrievanceApplicationEntity, int> applicationRepository,
        IRepository<GrievanceActivityLogEntity, long> activityLogRepository,
        IRepository<UserEntity, int>? userRepository = null,
        IRepository<WardEntity, int>? wardRepository = null,
        IRepository<ZoneEntity, int>? zoneRepository = null)
        : base(repository, unitOfWork, mapper)
    {
        _applicationRepository = applicationRepository;
        _activityLogRepository = activityLogRepository;
        _userRepository = userRepository;
        _wardRepository = wardRepository;
        _zoneRepository = zoneRepository;
    }

    protected override IQueryable<GrievanceEscalationEntity> ApplyIncludes(IQueryable<GrievanceEscalationEntity> query)
    {
        return query
            .Include(x => x.GrievanceApplication)
            .Include(x => x.Ward)
                .ThenInclude(w => w!.Zone)
            .Include(x => x.Zone)
            .Include(x => x.EscalatedByUser)
            .Include(x => x.TargetDepartment)
            .Include(x => x.TargetAssignedToUser)
            .Include(x => x.RespondedByUser);
    }

    public override async Task<GrievanceEscalationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable());
        var entity = query.Provider is IAsyncQueryProvider
            ? await query.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken)
            : query.AsNoTracking().FirstOrDefault(x => x.Id == id && x.IsActive);

        if (entity == null)
        {
            entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity == null || !entity.IsActive)
                return null;
        }

        return _mapper.Map<GrievanceEscalationDto>(entity);
    }

    public async Task<GrievanceEscalationDto> EscalateGrievanceAsync(
        CreateGrievanceEscalationDto dto,
        int escalatedByUserId,
        CancellationToken cancellationToken = default)
    {
        // 1. Validate observer / staff user exists and is active
        if (_userRepository != null)
        {
            var user = await _userRepository.GetByIdAsync(escalatedByUserId, cancellationToken);
            if (user == null || !user.IsActive)
            {
                throw new ValidationException(nameof(escalatedByUserId), "Active observer or staff user does not exist.", OperationType.Create);
            }
        }

        // 2. Validate grievance application exists & is active
        var appQuery = _applicationRepository.GetQueryable();
        var application = appQuery.Provider is IAsyncQueryProvider
            ? await appQuery.AsNoTracking().FirstOrDefaultAsync(a => a.Id == dto.GrievanceApplicationId && a.IsActive, cancellationToken)
            : appQuery.AsNoTracking().FirstOrDefault(a => a.Id == dto.GrievanceApplicationId && a.IsActive);

        if (application == null)
        {
            throw new ValidationException(nameof(dto.GrievanceApplicationId), $"Active Grievance application with ID '{dto.GrievanceApplicationId}' does not exist.", OperationType.Create);
        }

        // 3. Validate that the ticket is not already closed
        if (application.ClosedDate.HasValue)
        {
            throw new ValidationException(nameof(dto.GrievanceApplicationId), "Cannot escalate a grievance complaint that is already closed.", OperationType.Create);
        }

        // 4. Resolve and validate Ward and Zone references and relationship
        int? effectiveWardId;
        int? effectiveZoneId;

        if (dto.WardId.HasValue && dto.WardId.Value > 0)
        {
            if (_wardRepository == null)
            {
                effectiveWardId = dto.WardId.Value;
                effectiveZoneId = dto.ZoneId ?? application.ZoneId;
            }
            else
            {
                var wardQuery = _wardRepository.GetQueryable();
                var ward = wardQuery.Provider is IAsyncQueryProvider
                    ? await wardQuery.AsNoTracking().FirstOrDefaultAsync(w => w.Id == dto.WardId.Value && w.IsActive, cancellationToken)
                    : wardQuery.FirstOrDefault(w => w.Id == dto.WardId.Value && w.IsActive);

                if (ward == null)
                {
                    throw new ValidationException(nameof(dto.WardId), $"Active Ward with ID '{dto.WardId.Value}' does not exist.", OperationType.Create);
                }

                if (dto.ZoneId.HasValue && dto.ZoneId.Value > 0)
                {
                    if (_zoneRepository != null)
                    {
                        var zoneQuery = _zoneRepository.GetQueryable();
                        var zoneExists = zoneQuery.Provider is IAsyncQueryProvider
                            ? await zoneQuery.AsNoTracking().AnyAsync(z => z.Id == dto.ZoneId.Value && z.IsActive, cancellationToken)
                            : zoneQuery.Any(z => z.Id == dto.ZoneId.Value && z.IsActive);

                        if (!zoneExists)
                        {
                            throw new ValidationException(nameof(dto.ZoneId), $"Active Zone with ID '{dto.ZoneId.Value}' does not exist.", OperationType.Create);
                        }
                    }

                    if (ward.ZoneId != dto.ZoneId.Value)
                    {
                        throw new ValidationException(nameof(dto.WardId), $"Ward with ID '{dto.WardId.Value}' does not belong to Zone with ID '{dto.ZoneId.Value}'.", OperationType.Create);
                    }

                    effectiveZoneId = dto.ZoneId.Value;
                }
                else
                {
                    // Automatically resolve zone from effective ward
                    effectiveZoneId = ward.ZoneId;
                }

                effectiveWardId = dto.WardId.Value;
            }
        }
        else if (dto.ZoneId.HasValue && dto.ZoneId.Value > 0)
        {
            if (_zoneRepository != null)
            {
                var zoneQuery = _zoneRepository.GetQueryable();
                var zoneExists = zoneQuery.Provider is IAsyncQueryProvider
                    ? await zoneQuery.AsNoTracking().AnyAsync(z => z.Id == dto.ZoneId.Value && z.IsActive, cancellationToken)
                    : zoneQuery.Any(z => z.Id == dto.ZoneId.Value && z.IsActive);

                if (!zoneExists)
                {
                    throw new ValidationException(nameof(dto.ZoneId), $"Active Zone with ID '{dto.ZoneId.Value}' does not exist.", OperationType.Create);
                }
            }

            effectiveZoneId = dto.ZoneId.Value;

            // Retain application's ward only if it belongs to this zone
            if (application.WardId.HasValue && application.WardId.Value > 0 && _wardRepository != null)
            {
                var wardQuery = _wardRepository.GetQueryable();
                var appWard = wardQuery.Provider is IAsyncQueryProvider
                    ? await wardQuery.AsNoTracking().FirstOrDefaultAsync(w => w.Id == application.WardId.Value && w.IsActive, cancellationToken)
                    : wardQuery.FirstOrDefault(w => w.Id == application.WardId.Value && w.IsActive);

                effectiveWardId = (appWard != null && appWard.ZoneId == dto.ZoneId.Value) ? application.WardId : null;
            }
            else
            {
                effectiveWardId = null;
            }
        }
        else
        {
            // Fallback from application
            effectiveWardId = application.WardId;
            effectiveZoneId = application.ZoneId;

            // If application only had WardId and missing ZoneId, resolve ZoneId from the Ward
            if (!effectiveZoneId.HasValue && effectiveWardId.HasValue && effectiveWardId.Value > 0 && _wardRepository != null)
            {
                var wardQuery = _wardRepository.GetQueryable();
                var ward = wardQuery.Provider is IAsyncQueryProvider
                    ? await wardQuery.AsNoTracking().FirstOrDefaultAsync(w => w.Id == effectiveWardId.Value && w.IsActive, cancellationToken)
                    : wardQuery.FirstOrDefault(w => w.Id == effectiveWardId.Value && w.IsActive);

                if (ward != null)
                {
                    effectiveZoneId = ward.ZoneId;
                }
            }
        }

        // 5. Prevent duplicate active pending escalations for the same grievance by the same user
        var escQuery = _repository.GetQueryable();
        var hasPendingEscalation = escQuery.Provider is IAsyncQueryProvider
            ? await escQuery.AsNoTracking().AnyAsync(e => e.GrievanceApplicationId == dto.GrievanceApplicationId && e.EscalatedByUserId == escalatedByUserId && e.EscalationStatus == "PENDING" && e.IsActive, cancellationToken)
            : escQuery.Any(e => e.GrievanceApplicationId == dto.GrievanceApplicationId && e.EscalatedByUserId == escalatedByUserId && e.EscalationStatus == "PENDING" && e.IsActive);

        if (hasPendingEscalation)
        {
            throw new ValidationException("Escalation", "A pending poke/escalation for this grievance ticket is already active. Please wait for staff response before escalating again.", OperationType.Create);
        }

        // 6. Create Escalation Entity
        var escalation = _mapper.Map<GrievanceEscalationEntity>(dto);
        escalation.EscalatedByUserId = escalatedByUserId;
        escalation.CreatedBy = escalatedByUserId;
        escalation.CreatedDate = DateTime.Now;
        escalation.WardId = effectiveWardId;
        escalation.ZoneId = effectiveZoneId;
        escalation.TargetDepartmentId = application.GrievanceDepartmentId;
        escalation.TargetAssignedToUserId = application.CurrentAssignedToUserId;
        escalation.EscalationStatus = "PENDING";
        var priority = string.IsNullOrWhiteSpace(dto.Priority) ? "NORMAL" : dto.Priority.Trim().ToUpperInvariant();
        if (priority is not ("NORMAL" or "HIGH" or "URGENT"))
        {
            throw new ValidationException(nameof(dto.Priority), "Priority must be one of: NORMAL, HIGH, URGENT.", OperationType.Create);
        }
        escalation.Priority = priority;

        try
        {
            await _repository.AddAsync(escalation, cancellationToken);

            // 6. Append entry to Grievance Activity Log to preserve unbroken timeline
            var log = new GrievanceActivityLogEntity
            {
                GrievanceApplicationId = application.Id,
                FromStateId = application.CurrentStateId,
                ToStateId = application.CurrentStateId,
                ActionByUserId = escalatedByUserId,
                AssignedToUserId = application.CurrentAssignedToUserId,
                Remark = $"[OBSERVER POKE - {escalation.Priority}]: {dto.Reason.Trim()}",
                ActionAt = DateTime.Now
            };
            await _activityLogRepository.AddAsync(log, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsPendingEscalationConflict(ex))
        {
            throw new ValidationException("Escalation", "A pending poke/escalation for this grievance ticket is already active. Please wait for staff response before escalating again.", OperationType.Create);
        }

        return await GetByIdAsync(escalation.Id, cancellationToken) ?? _mapper.Map<GrievanceEscalationDto>(escalation);
    }

    public async Task<GrievanceEscalationDto?> RespondToEscalationAsync(
        int escalationId,
        RespondGrievanceEscalationDto dto,
        int staffUserId,
        CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(escalationId, cancellationToken);
        if (entity == null || !entity.IsActive)
            throw new KeyNotFoundException($"GrievanceEscalation with ID '{escalationId}' was not found.");

        if (_userRepository != null)
        {
            var user = await _userRepository.GetByIdAsync(staffUserId, cancellationToken);
            if (user == null || !user.IsActive)
            {
                throw new ValidationException(nameof(staffUserId), "Active staff user does not exist.", OperationType.Update);
            }
        }

        var status = string.IsNullOrWhiteSpace(dto.EscalationStatus)
            ? "ACKNOWLEDGED"
            : dto.EscalationStatus.Trim().ToUpperInvariant();

        if (status is not ("ACKNOWLEDGED" or "RESOLVED" or "REJECTED" or "CLOSED"))
        {
            throw new ValidationException(nameof(dto.EscalationStatus), "Escalation status must be ACKNOWLEDGED, RESOLVED, REJECTED, or CLOSED.", OperationType.Update);
        }

        entity.StaffResponse = dto.StaffResponse.Trim();
        entity.EscalationStatus = status;
        entity.RespondedByUserId = staffUserId;
        entity.RespondedAt = DateTime.Now;
        entity.UpdatedBy = staffUserId;
        entity.UpdatedDate = DateTime.Now;

        await _repository.UpdateAsync(entity, cancellationToken);

        // Append entry to Grievance Activity Log
        var app = await _applicationRepository.GetByIdAsync(entity.GrievanceApplicationId, cancellationToken);
        var log = new GrievanceActivityLogEntity
        {
            GrievanceApplicationId = entity.GrievanceApplicationId,
            FromStateId = app?.CurrentStateId,
            ToStateId = app?.CurrentStateId ?? 0,
            ActionByUserId = staffUserId,
            AssignedToUserId = entity.TargetAssignedToUserId,
            Remark = $"[STAFF RESPONSE TO OBSERVER ({entity.EscalationStatus})]: {dto.StaffResponse.Trim()}",
            ActionAt = DateTime.Now
        };
        await _activityLogRepository.AddAsync(log, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(escalationId, cancellationToken);
    }

    private static bool IsPendingEscalationConflict(DbUpdateException ex)
    {
        var message = ex.InnerException?.Message ?? ex.Message;
        return message.Contains("UQ_GrievanceEscalation_PendingActive", StringComparison.OrdinalIgnoreCase)
            || message.Contains("Cannot insert duplicate key", StringComparison.OrdinalIgnoreCase)
            || message.Contains("unique index", StringComparison.OrdinalIgnoreCase)
            || message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
            || message.Contains("UNIQUE constraint", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<List<GrievanceEscalationDto>> GetByGrievanceIdAsync(
        int grievanceApplicationId,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable());
        var escalations = query.Provider is IAsyncQueryProvider
            ? await query.AsNoTracking().Where(e => e.GrievanceApplicationId == grievanceApplicationId && e.IsActive).OrderByDescending(e => e.CreatedDate).ToListAsync(cancellationToken)
            : query.AsNoTracking().Where(e => e.GrievanceApplicationId == grievanceApplicationId && e.IsActive).OrderByDescending(e => e.CreatedDate).ToList();

        return _mapper.Map<List<GrievanceEscalationDto>>(escalations);
    }

    public async Task<PagedResult<GrievanceEscalationDto>> GetByWardIdAsync(
        int wardId,
        GrievanceEscalationQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        queryParameters.WardId = wardId;
        return await GetAllAsync(queryParameters, cancellationToken);
    }

    public async Task<PagedResult<GrievanceEscalationDto>> GetByZoneIdAsync(
        int zoneId,
        GrievanceEscalationQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        queryParameters.ZoneId = zoneId;
        return await GetAllAsync(queryParameters, cancellationToken);
    }
}
