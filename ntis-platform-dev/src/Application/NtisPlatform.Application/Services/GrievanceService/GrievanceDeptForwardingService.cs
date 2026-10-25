using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDeptForwarding;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceDeptForwardingService : BaseCommonCrudService<
    GrievanceDeptForwardingEntity,
    GrievanceDeptForwardingDto,
    CreateGrievanceDeptForwardingDto,
    UpdateGrievanceDeptForwardingDto,
    GrievanceDeptForwardingQueryParameters,
    int>, IGrievanceDeptForwardingService
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "PENDING", "IN_PROGRESS", "RESOLVED"
    };

    private readonly IRepository<GrievanceApplicationEntity, int> _grievanceRepository;
    private readonly IRepository<GrievanceDepartmentMasterEntity, int> _departmentRepository;
    private readonly IRepository<GrievanceActivityLogEntity, long> _activityLogRepository;
    private readonly IRepository<UserEntity, int>? _userRepository;
    private readonly ICurrentUserService? _currentUserService;

    public GrievanceDeptForwardingService(
        IRepository<GrievanceDeptForwardingEntity, int> repository,
        IRepository<GrievanceApplicationEntity, int> grievanceRepository,
        IRepository<GrievanceDepartmentMasterEntity, int> departmentRepository,
        IRepository<GrievanceActivityLogEntity, long> activityLogRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<UserEntity, int>? userRepository = null,
        ICurrentUserService? currentUserService = null)
        : base(repository, unitOfWork, mapper)
    {
        _grievanceRepository = grievanceRepository;
        _departmentRepository = departmentRepository;
        _activityLogRepository = activityLogRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    protected override IQueryable<GrievanceDeptForwardingEntity> ApplyIncludes(IQueryable<GrievanceDeptForwardingEntity> query)
    {
        return query
            .Include(x => x.GrievanceApplication)
            .Include(x => x.ForwardedToDept)
            .Include(x => x.AssignedToUser)
            .Include(x => x.ActivityLog);
    }

    public override async Task<GrievanceDeptForwardingDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable().AsNoTracking());
        var entity = query.Provider is IAsyncQueryProvider
            ? await query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            : query.FirstOrDefault(x => x.Id == id);
        return entity == null ? null : _mapper.Map<GrievanceDeptForwardingDto>(entity);
    }

    public async Task<List<GrievanceDeptForwardingDto>> GetByGrievanceIdAsync(int grievanceId, CancellationToken cancellationToken = default)
    {
        var query = ApplyIncludes(_repository.GetQueryable())
            .Where(x => x.GrievanceApplicationId == grievanceId && x.IsActive && !x.MarkedForDeletion)
            .OrderBy(x => x.ForwardedAt);

        var list = query.Provider is IAsyncQueryProvider
            ? await query.AsNoTracking().ToListAsync(cancellationToken)
            : query.AsNoTracking().ToList();

        return _mapper.Map<List<GrievanceDeptForwardingDto>>(list);
    }

    public async Task<PagedResult<GrievanceDeptForwardingDto>> GetByDepartmentIdAsync(
        int departmentId, GrievanceDeptForwardingQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        queryParameters.ForwardedToDeptId = departmentId;
        return await GetAllAsync(queryParameters, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GrievanceDeptForwardingEntity entity, CancellationToken cancellationToken = default)
    {
        var grievance = await _grievanceRepository.GetByIdAsync(entity.GrievanceApplicationId, cancellationToken);
        if (grievance == null || !grievance.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.GrievanceApplicationId), "Active Grievance application does not exist.");
        }

        var dept = await _departmentRepository.GetByIdAsync(entity.ForwardedToDeptId, cancellationToken);
        if (dept == null || !dept.IsActive)
        {
            return ValidationResult.Failure(nameof(entity.ForwardedToDeptId), "Active target department does not exist.");
        }

        if (entity.AssignedToUserId.HasValue && _userRepository != null)
        {
            var user = await _userRepository.GetByIdAsync(entity.AssignedToUserId.Value, cancellationToken);
            if (user == null || !user.IsActive)
            {
                return ValidationResult.Failure(nameof(entity.AssignedToUserId), "Assigned user does not exist or is inactive.");
            }
        }

        int? resolvedUserId = entity.CreatedBy;
        if (_currentUserService != null)
        {
            try
            {
                var currentUserId = _currentUserService.GetCurrentUserId();
                if (currentUserId > 0)
                {
                    resolvedUserId = currentUserId;
                    entity.CreatedBy = currentUserId;
                }
            }
            catch
            {
                // Fallback to entity.CreatedBy when unauthenticated context (e.g. tests)
            }
        }

        if (entity.ActivityLogId > 0)
        {
            var activityLog = await _activityLogRepository.GetByIdAsync(entity.ActivityLogId, cancellationToken);
            if (activityLog == null)
            {
                return ValidationResult.Failure(nameof(entity.ActivityLogId), "Specified Activity Log record does not exist.");
            }
            if (activityLog.GrievanceApplicationId != entity.GrievanceApplicationId)
            {
                return ValidationResult.Failure(nameof(entity.ActivityLogId), "Activity Log does not belong to the specified Grievance Application.");
            }
        }
        else
        {
            var activityLog = new GrievanceActivityLogEntity
            {
                GrievanceApplicationId = entity.GrievanceApplicationId,
                FromStateId = grievance.CurrentStateId,
                ToStateId = grievance.CurrentStateId,
                ActionByUserId = resolvedUserId,
                AssignedToUserId = entity.AssignedToUserId,
                Remark = string.IsNullOrWhiteSpace(entity.Remark) ? $"Grievance forwarded to {dept.DepartmentName}." : entity.Remark.Trim(),
                ActionAt = DateTime.Now
            };
            await _activityLogRepository.AddAsync(activityLog, cancellationToken);
            entity.ActivityLog = activityLog;
        }

        if (!string.IsNullOrWhiteSpace(entity.ForwardingStatus))
        {
            var trimmedStatus = entity.ForwardingStatus.Trim().ToUpperInvariant();
            if (!AllowedStatuses.Contains(trimmedStatus))
            {
                return ValidationResult.Failure(nameof(entity.ForwardingStatus), "ForwardingStatus must be one of: PENDING, IN_PROGRESS, RESOLVED.");
            }
            entity.ForwardingStatus = trimmedStatus;
            if (trimmedStatus == "RESOLVED" && entity.ResolvedAt == null)
            {
                entity.ResolvedAt = DateTime.Now;
            }
        }
        else
        {
            entity.ForwardingStatus = "PENDING";
        }

        entity.ForwardedAt = DateTime.Now;

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GrievanceDeptForwardingEntity currentEntity, GrievanceDeptForwardingEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (_currentUserService != null)
        {
            try
            {
                var currentUserId = _currentUserService.GetCurrentUserId();
                if (currentUserId > 0)
                {
                    updatedEntity.UpdatedBy = currentUserId;
                }
            }
            catch
            {
                // Fallback to updatedEntity.UpdatedBy when unauthenticated context (e.g. tests)
            }
        }

        if (updatedEntity.AssignedToUserId.HasValue && _userRepository != null)
        {
            var user = await _userRepository.GetByIdAsync(updatedEntity.AssignedToUserId.Value, cancellationToken);
            if (user == null || !user.IsActive)
            {
                return ValidationResult.Failure(nameof(updatedEntity.AssignedToUserId), "Assigned user does not exist or is inactive.");
            }
        }

        if (!string.IsNullOrWhiteSpace(updatedEntity.ForwardingStatus))
        {
            var trimmedStatus = updatedEntity.ForwardingStatus.Trim().ToUpperInvariant();
            if (!AllowedStatuses.Contains(trimmedStatus))
            {
                return ValidationResult.Failure(nameof(updatedEntity.ForwardingStatus), "ForwardingStatus must be one of: PENDING, IN_PROGRESS, RESOLVED.");
            }

            updatedEntity.ForwardingStatus = trimmedStatus;
            if (trimmedStatus == "RESOLVED" && updatedEntity.ResolvedAt == null)
            {
                updatedEntity.ResolvedAt = DateTime.Now;
            }
        }

        return ValidationResult.Success();
    }
}
