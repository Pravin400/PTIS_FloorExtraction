using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Entities.Master;
using Microsoft.Extensions.Logging;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public partial class GrievanceApplicationService
    : BaseCommonCrudService<GrievanceApplicationEntity, GrievanceApplicationDto, CreateGrievanceApplicationDto, UpdateGrievanceApplicationDto, GrievanceApplicationQueryParameters, int>,
      IGrievanceApplicationService
{
    private readonly IRepository<CitizenMasterEntity, int> _citizenRepository;
    private readonly IRepository<GrievanceDepartmentMasterEntity, int> _departmentRepository;
    private readonly IRepository<GrievanceTypeMasterEntity, int> _typeRepository;
    private readonly IRepository<GrievanceWorkflowEntity, int> _workflowRepository;
    private readonly IRepository<GrievanceWorkflowStateEntity, int> _workflowStateRepository;
    private readonly IRepository<GrievanceWorkflowTransitionEntity, int>? _workflowTransitionRepository;
    private readonly IRepository<GrievanceActivityLogEntity, long> _activityLogRepository;
    private readonly IRepository<GrievanceDeptForwardingEntity, int>? _deptForwardingRepository;
    private readonly IRepository<UserEntity, int>? _userRepository;
    private readonly IRepository<WardEntity, int>? _wardRepository;
    private readonly IRepository<ZoneEntity, int>? _zoneRepository;
    private readonly IGrievanceWhatsAppNotificationService? _whatsAppNotificationService;
    private readonly IRepository<GrievancePhotoEntity, int>? _photoRepository;
    private readonly IGrievancePhotoService? _photoService;
    private readonly ILogger<GrievanceApplicationService>? _logger;

    public GrievanceApplicationService(
        IRepository<GrievanceApplicationEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<CitizenMasterEntity, int> citizenRepository,
        IRepository<GrievanceDepartmentMasterEntity, int> departmentRepository,
        IRepository<GrievanceTypeMasterEntity, int> typeRepository,
        IRepository<GrievanceWorkflowEntity, int> workflowRepository,
        IRepository<GrievanceWorkflowStateEntity, int> workflowStateRepository,
        IRepository<GrievanceActivityLogEntity, long> activityLogRepository,
        IRepository<GrievanceDeptForwardingEntity, int>? deptForwardingRepository = null,
        IRepository<UserEntity, int>? userRepository = null,
        IRepository<GrievanceWorkflowTransitionEntity, int>? workflowTransitionRepository = null,
        IRepository<WardEntity, int>? wardRepository = null,
        IRepository<ZoneEntity, int>? zoneRepository = null,
        IGrievanceWhatsAppNotificationService? whatsAppNotificationService = null,
        IRepository<GrievancePhotoEntity, int>? photoRepository = null,
        IGrievancePhotoService? photoService = null,
        ILogger<GrievanceApplicationService>? logger = null)
        : base(repository, unitOfWork, mapper)
    {
        _citizenRepository = citizenRepository;
        _departmentRepository = departmentRepository;
        _typeRepository = typeRepository;
        _workflowRepository = workflowRepository;
        _workflowStateRepository = workflowStateRepository;
        _activityLogRepository = activityLogRepository;
        _deptForwardingRepository = deptForwardingRepository;
        _userRepository = userRepository;
        _workflowTransitionRepository = workflowTransitionRepository;
        _wardRepository = wardRepository;
        _zoneRepository = zoneRepository;
        _whatsAppNotificationService = whatsAppNotificationService;
        _photoRepository = photoRepository;
        _photoService = photoService;
        _logger = logger;
    }

    protected override IQueryable<GrievanceApplicationEntity> ApplyIncludes(IQueryable<GrievanceApplicationEntity> query)
    {
        return query
            .Include(x => x.Citizen)
            .Include(x => x.GrievanceDepartment)
            .Include(x => x.GrievanceType)
            .Include(x => x.Workflow)
            .Include(x => x.CurrentState)
            .Include(x => x.CurrentAssignedToUser)
            .Include(x => x.Ward)
                .ThenInclude(w => w!.Zone)
            .Include(x => x.Zone);
    }

    public override async Task<GrievanceApplicationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = ApplyIncludes(_repository.GetQueryable());
            var entity = query.Provider is IAsyncQueryProvider
                ? await query.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken)
                : query.AsNoTracking().FirstOrDefault(x => x.Id == id && x.IsActive);

            if (entity != null)
            {
                return _mapper.Map<GrievanceApplicationDto>(entity);
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to load GrievanceApplication {Id} with navigation includes, falling back to basic entity", id);
        }

        var fallbackEntity = await _repository.GetByIdAsync(id, cancellationToken);
        if (fallbackEntity == null || !fallbackEntity.IsActive)
            return null;

        return _mapper.Map<GrievanceApplicationDto>(fallbackEntity);
    }

    public override async Task<GrievanceApplicationDto> CreateAsync(CreateGrievanceApplicationDto createDto, CancellationToken cancellationToken = default)
    {
        // 1. Validate Citizen exists & is active
        var citizenQuery = _citizenRepository.GetQueryable();
        var citizenExists = citizenQuery.Provider is IAsyncQueryProvider
            ? await citizenQuery.AsNoTracking().AnyAsync(c => c.Id == createDto.CitizenId && c.IsActive, cancellationToken)
            : citizenQuery.Any(c => c.Id == createDto.CitizenId && c.IsActive);

        if (!citizenExists)
        {
            throw new ValidationException(nameof(createDto.CitizenId), "Active citizen does not exist.", OperationType.Create);
        }

        // 2. Validate Department exists & is active
        var deptQuery = _departmentRepository.GetQueryable();
        var deptExists = deptQuery.Provider is IAsyncQueryProvider
            ? await deptQuery.AsNoTracking().AnyAsync(d => d.Id == createDto.GrievanceDepartmentId && d.IsActive, cancellationToken)
            : deptQuery.Any(d => d.Id == createDto.GrievanceDepartmentId && d.IsActive);

        if (!deptExists)
        {
            throw new ValidationException(nameof(createDto.GrievanceDepartmentId), "Active department does not exist.", OperationType.Create);
        }

        // 3. Validate Type exists and belongs to the department
        var typeQuery = _typeRepository.GetQueryable();
        var typeExists = typeQuery.Provider is IAsyncQueryProvider
            ? await typeQuery.AsNoTracking().AnyAsync(t => t.Id == createDto.GrievanceTypeId && t.GrievanceDepartmentId == createDto.GrievanceDepartmentId && t.IsActive, cancellationToken)
            : typeQuery.Any(t => t.Id == createDto.GrievanceTypeId && t.GrievanceDepartmentId == createDto.GrievanceDepartmentId && t.IsActive);

        if (!typeExists)
        {
            throw new ValidationException(nameof(createDto.GrievanceTypeId), "Grievance type does not belong to the selected department or is inactive.", OperationType.Create);
        }

        // 4. Validate Zone and Ward references and relationship (Optional until GIS integration)
        if (createDto.ZoneId.HasValue && createDto.ZoneId.Value > 0 && _zoneRepository != null)
        {
            var zoneQuery = _zoneRepository.GetQueryable();
            var zoneExists = zoneQuery.Provider is IAsyncQueryProvider
                ? await zoneQuery.AsNoTracking().AnyAsync(z => z.Id == createDto.ZoneId.Value && z.IsActive, cancellationToken)
                : zoneQuery.Any(z => z.Id == createDto.ZoneId.Value && z.IsActive);

            if (!zoneExists)
            {
                _logger?.LogWarning("Active Zone with ID '{ZoneId}' does not exist. Clearing ZoneId until GIS integration.", createDto.ZoneId.Value);
                createDto.ZoneId = null;
            }
        }

        if (createDto.WardId.HasValue && createDto.WardId.Value > 0 && _wardRepository != null)
        {
            var wardQuery = _wardRepository.GetQueryable();
            var ward = wardQuery.Provider is IAsyncQueryProvider
                ? await wardQuery.AsNoTracking().FirstOrDefaultAsync(w => w.Id == createDto.WardId.Value && w.IsActive, cancellationToken)
                : wardQuery.FirstOrDefault(w => w.Id == createDto.WardId.Value && w.IsActive);

            if (ward == null)
            {
                _logger?.LogWarning("Active Ward with ID '{WardId}' does not exist. Clearing WardId until GIS integration.", createDto.WardId.Value);
                createDto.WardId = null;
            }
            else if (!createDto.ZoneId.HasValue || createDto.ZoneId.Value <= 0)
            {
                createDto.ZoneId = ward.ZoneId;
            }
        }

        // 5. Resolve and Validate Workflow
        int workflowId = createDto.WorkflowId ?? 0;
        var wfQuery = _workflowRepository.GetQueryable();

        if (workflowId > 0)
        {
            var wfExists = wfQuery.Provider is IAsyncQueryProvider
                ? await wfQuery.AsNoTracking().AnyAsync(w => w.Id == workflowId && w.IsActive, cancellationToken)
                : wfQuery.Any(w => w.Id == workflowId && w.IsActive);

            if (!wfExists)
            {
                throw new ValidationException(nameof(createDto.WorkflowId), "Active grievance workflow does not exist.", OperationType.Create);
            }
        }
        else
        {
            var defaultWf = wfQuery.Provider is IAsyncQueryProvider
                ? await wfQuery.AsNoTracking().FirstOrDefaultAsync(w => w.IsDefault && w.IsActive, cancellationToken)
                : wfQuery.FirstOrDefault(w => w.IsDefault && w.IsActive);

            if (defaultWf == null)
            {
                defaultWf = wfQuery.Provider is IAsyncQueryProvider
                    ? await wfQuery.AsNoTracking().FirstOrDefaultAsync(w => w.IsActive, cancellationToken)
                    : wfQuery.FirstOrDefault(w => w.IsActive);
            }

            if (defaultWf == null)
            {
                throw new ValidationException(nameof(createDto.WorkflowId), "No active grievance workflow found.", OperationType.Create);
            }

            workflowId = defaultWf.Id;
        }

        // 6. Resolve Initial State for the Workflow
        var stateQuery = _workflowStateRepository.GetQueryable();
        var initialState = stateQuery.Provider is IAsyncQueryProvider
            ? await stateQuery.AsNoTracking().FirstOrDefaultAsync(s => s.WorkflowId == workflowId && s.IsInitial && s.IsActive, cancellationToken)
            : stateQuery.FirstOrDefault(s => s.WorkflowId == workflowId && s.IsInitial && s.IsActive);

        if (initialState == null)
        {
            initialState = stateQuery.Provider is IAsyncQueryProvider
                ? await stateQuery.AsNoTracking().OrderBy(s => s.DisplayOrder).FirstOrDefaultAsync(s => s.WorkflowId == workflowId && s.IsActive, cancellationToken)
                : stateQuery.OrderBy(s => s.DisplayOrder).FirstOrDefault(s => s.WorkflowId == workflowId && s.IsActive);
        }

        if (initialState == null)
        {
            throw new ValidationException("WorkflowState", "No initial state configured for the selected workflow.", OperationType.Create);
        }

        // 7. Map and setup application entity
        var entity = _mapper.Map<GrievanceApplicationEntity>(createDto);
        entity.WardId = createDto.WardId.HasValue && createDto.WardId.Value > 0 ? createDto.WardId.Value : null;
        entity.ZoneId = createDto.ZoneId.HasValue && createDto.ZoneId.Value > 0 ? createDto.ZoneId.Value : null;
        entity.WorkflowId = workflowId;
        entity.CurrentStateId = initialState.Id;
        entity.SubmittedDate = DateTime.Now;

        // 8. Attach Initial Activity Log to the application entity in the same atomic transaction
        var initialLog = new GrievanceActivityLogEntity
        {
            FromStateId = null,
            ToStateId = initialState.Id,
            TransitionId = null,
            ActionByUserId = null,
            AssignedToUserId = null,
            Remark = "Grievance ticket submitted.",
            ActionAt = DateTime.Now
        };
        entity.ActivityLogs.Add(initialLog);

        const int maxRetries = 3;
        for (var attempt = 0; attempt < maxRetries; attempt++)
        {
            entity.GrievanceNo = await GenerateGrievanceNoAsync(cancellationToken, retryOffset: attempt);

            try
            {
                if (attempt == 0)
                {
                    await _repository.AddAsync(entity, cancellationToken);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
                break;
            }
            catch (DbUpdateException) when (attempt < maxRetries - 1)
            {
                // Unique constraint collision under heavy concurrent submissions, retry with incremented sequence
            }
        }

        // 9. Dispatch WhatsApp submission confirmation message (Fail-safe, non-blocking)
        if (_whatsAppNotificationService != null)
        {
            try
            {
                var query = ApplyIncludes(_repository.GetQueryable());
                var notificationEntity = query.Provider is IAsyncQueryProvider
                    ? await query.AsNoTracking().FirstOrDefaultAsync(x => x.Id == entity.Id, cancellationToken)
                    : query.AsNoTracking().FirstOrDefault(x => x.Id == entity.Id);

                await _whatsAppNotificationService.SendGrievanceSubmissionWhatsAppNotificationAsync(
                    notificationEntity ?? entity,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "[WhatsApp] Failed to dispatch submission notification for Grievance {GrievanceNo}", entity.GrievanceNo);
            }
        }

        try
        {
            return await GetByIdAsync(entity.Id, cancellationToken) ?? _mapper.Map<GrievanceApplicationDto>(entity);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "GetByIdAsync failed following CreateAsync for {Id}, returning mapped entity", entity.Id);
            return _mapper.Map<GrievanceApplicationDto>(entity);
        }
    }

    public override async Task<GrievanceApplicationDto?> UpdateAsync(int id, UpdateGrievanceApplicationDto updateDto, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return null;

        var targetDeptId = updateDto.GrievanceDepartmentId > 0 ? updateDto.GrievanceDepartmentId : entity.GrievanceDepartmentId;
        var targetTypeId = updateDto.GrievanceTypeId > 0 ? updateDto.GrievanceTypeId : entity.GrievanceTypeId;
        var targetWardId = updateDto.WardId ?? entity.WardId;
        var targetZoneId = updateDto.ZoneId ?? entity.ZoneId;

        // 1. Validate Department if specified
        if (updateDto.GrievanceDepartmentId > 0)
        {
            var deptQuery = _departmentRepository.GetQueryable();
            var deptExists = deptQuery.Provider is IAsyncQueryProvider
                ? await deptQuery.AsNoTracking().AnyAsync(d => d.Id == targetDeptId && d.IsActive, cancellationToken)
                : deptQuery.Any(d => d.Id == targetDeptId && d.IsActive);

            if (!deptExists)
            {
                throw new ValidationException(nameof(updateDto.GrievanceDepartmentId), "Active department does not exist.", OperationType.Update);
            }
        }

        // 2. Validate Grievance Type if specified or department changed
        if (updateDto.GrievanceTypeId > 0 || updateDto.GrievanceDepartmentId > 0)
        {
            var typeQuery = _typeRepository.GetQueryable();
            var typeExists = typeQuery.Provider is IAsyncQueryProvider
                ? await typeQuery.AsNoTracking().AnyAsync(t => t.Id == targetTypeId && t.GrievanceDepartmentId == targetDeptId && t.IsActive, cancellationToken)
                : typeQuery.Any(t => t.Id == targetTypeId && t.GrievanceDepartmentId == targetDeptId && t.IsActive);

            if (!typeExists)
            {
                throw new ValidationException(nameof(updateDto.GrievanceTypeId), "Grievance type does not belong to the selected department or is inactive.", OperationType.Update);
            }
        }

        // 3. Validate Zone and Ward references and relationship (Optional until GIS integration)
        if (updateDto.ZoneId.HasValue && updateDto.ZoneId.Value > 0 && _zoneRepository != null)
        {
            var zoneQuery = _zoneRepository.GetQueryable();
            var zoneExists = zoneQuery.Provider is IAsyncQueryProvider
                ? await zoneQuery.AsNoTracking().AnyAsync(z => z.Id == updateDto.ZoneId.Value && z.IsActive, cancellationToken)
                : zoneQuery.Any(z => z.Id == updateDto.ZoneId.Value && z.IsActive);

            if (!zoneExists)
            {
                _logger?.LogWarning("Active Zone with ID '{ZoneId}' does not exist. Retaining current ZoneId until GIS integration.", updateDto.ZoneId.Value);
                targetZoneId = entity.ZoneId;
            }
            else
            {
                targetZoneId = updateDto.ZoneId.Value;
            }
        }

        if (updateDto.WardId.HasValue && updateDto.WardId.Value > 0 && _wardRepository != null)
        {
            var wardQuery = _wardRepository.GetQueryable();
            var ward = wardQuery.Provider is IAsyncQueryProvider
                ? await wardQuery.AsNoTracking().FirstOrDefaultAsync(w => w.Id == updateDto.WardId.Value && w.IsActive, cancellationToken)
                : wardQuery.FirstOrDefault(w => w.Id == updateDto.WardId.Value && w.IsActive);

            if (ward == null)
            {
                _logger?.LogWarning("Active Ward with ID '{WardId}' does not exist. Retaining current WardId until GIS integration.", updateDto.WardId.Value);
                targetWardId = entity.WardId;
            }
            else
            {
                targetWardId = updateDto.WardId.Value;
                if (!targetZoneId.HasValue || targetZoneId.Value <= 0)
                {
                    targetZoneId = ward.ZoneId;
                }
            }
        }

        // 4. Map updates onto entity
        _mapper.Map(updateDto, entity);

        // Restore computed target IDs after mapping so partial updates do not overwrite valid FKs with 0
        entity.GrievanceDepartmentId = targetDeptId;
        entity.GrievanceTypeId = targetTypeId;
        entity.WardId = targetWardId.HasValue && targetWardId.Value > 0 ? targetWardId.Value : null;
        entity.ZoneId = targetZoneId.HasValue && targetZoneId.Value > 0 ? targetZoneId.Value : null;

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 4. Return enriched DTO
        try
        {
            return await GetByIdAsync(entity.Id, cancellationToken) ?? _mapper.Map<GrievanceApplicationDto>(entity);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "GetByIdAsync failed following UpdateAsync for {Id}, returning mapped entity", entity.Id);
            return _mapper.Map<GrievanceApplicationDto>(entity);
        }
    }

    public override async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return false;

        // 1. Delete all affected Department Forwardings (hard delete to avoid FK restrict on ActivityLog)
        if (_deptForwardingRepository != null)
        {
            var fwdQuery = _deptForwardingRepository.GetQueryable();
            var forwardings = fwdQuery.Provider is IAsyncQueryProvider
                ? await fwdQuery.Where(f => f.GrievanceApplicationId == id && f.IsActive).ToListAsync(cancellationToken)
                : fwdQuery.Where(f => f.GrievanceApplicationId == id && f.IsActive).ToList();

            foreach (var forwarding in forwardings)
            {
                await _deptForwardingRepository.HardDeleteAsync(forwarding, cancellationToken);
            }
        }

        // 2. Delete all affected Activity Logs
        var logQuery = _activityLogRepository.GetQueryable();
        var logs = logQuery.Provider is IAsyncQueryProvider
            ? await logQuery.Where(l => l.GrievanceApplicationId == id).ToListAsync(cancellationToken)
            : logQuery.Where(l => l.GrievanceApplicationId == id).ToList();

        foreach (var log in logs)
        {
            await _activityLogRepository.HardDeleteAsync(log, cancellationToken);
        }

        // 3. Delete the Grievance Application
        await _repository.DeleteAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<GrievanceApplicationDto?> GetByGrievanceNoAsync(string grievanceNo, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(grievanceNo))
            return null;

        var normalizedNo = grievanceNo.Trim();
        var queryable = ApplyIncludes(_repository.GetQueryable());

        var entity = queryable.Provider is IAsyncQueryProvider
            ? await queryable.AsNoTracking().FirstOrDefaultAsync(x => x.IsActive && x.GrievanceNo == normalizedNo, cancellationToken)
            : queryable.AsNoTracking().FirstOrDefault(x => x.IsActive && x.GrievanceNo == normalizedNo);

        return entity == null ? null : _mapper.Map<GrievanceApplicationDto>(entity);
    }

    public async Task<PagedResult<GrievanceApplicationDto>> GetByCitizenIdAsync(
        int citizenId, GrievanceApplicationQueryParameters queryParams, CancellationToken cancellationToken = default)
    {
        queryParams.CitizenId = citizenId;
        return await GetAllAsync(queryParams, cancellationToken);
    }

    private async Task<string> GenerateGrievanceNoAsync(CancellationToken cancellationToken, int retryOffset = 0)
    {
        var year = DateTime.Now.Year;
        var prefix = $"GRV-{year}-";

        var query = _repository.GetQueryable();
        var latestGrievanceNo = query.Provider is IAsyncQueryProvider
            ? await query.AsNoTracking()
                .Where(x => x.GrievanceNo.StartsWith(prefix))
                .OrderByDescending(x => x.GrievanceNo)
                .Select(x => x.GrievanceNo)
                .FirstOrDefaultAsync(cancellationToken)
            : query.AsNoTracking()
                .Where(x => x.GrievanceNo.StartsWith(prefix))
                .OrderByDescending(x => x.GrievanceNo)
                .Select(x => x.GrievanceNo)
                .FirstOrDefault();

        var nextSequence = 1;
        if (!string.IsNullOrEmpty(latestGrievanceNo) &&
            latestGrievanceNo.Length >= prefix.Length + 6 &&
            int.TryParse(latestGrievanceNo[prefix.Length..], out var lastSeq))
        {
            nextSequence = lastSeq + 1;
        }

        nextSequence += retryOffset;
        return $"{prefix}{nextSequence:D6}";
    }
}
