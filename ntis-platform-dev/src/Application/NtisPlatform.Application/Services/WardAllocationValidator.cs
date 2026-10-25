using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Handles domain and relationship validation for ward allocations with batch loading
/// </summary>
public class WardAllocationValidator : IWardAllocationValidator
{
    private static readonly string[] AdminRoleNames = RoleConstants.AdminRoleNames;

    private readonly IRepository<GlobalSurveyWardAllocationEntity, int> _repository;
    private readonly IRepository<UserEntity, int> _userRepository;
    private readonly IRepository<DepartmentMasterEntity, int> _departmentRepository;
    private readonly IRepository<ModuleMasterEntity, int> _moduleRepository;
    private readonly IRepository<UserDepartmentAllocationEntity, int> _userDepartmentAllocationRepository;
    private readonly IRepository<UserModuleAllocationEntity, int> _userModuleAllocationRepository;
    private readonly IRepository<UserRoleAllocationEntity, int> _userRoleAllocationRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<OldWardMasterEntity, int> _oldWardRepository;
    private readonly IReferenceValidationService _referenceValidator;
    private readonly ILogger<WardAllocationValidator> _logger;

    public WardAllocationValidator(
        IRepository<GlobalSurveyWardAllocationEntity, int> repository,
        IRepository<UserEntity, int> userRepository,
        IRepository<DepartmentMasterEntity, int> departmentRepository,
        IRepository<ModuleMasterEntity, int> moduleRepository,
        IRepository<UserDepartmentAllocationEntity, int> userDepartmentAllocationRepository,
        IRepository<UserModuleAllocationEntity, int> userModuleAllocationRepository,
        IRepository<UserRoleAllocationEntity, int> userRoleAllocationRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<OldWardMasterEntity, int> oldWardRepository,
        IReferenceValidationService referenceValidator,
        ILogger<WardAllocationValidator> logger)
    {
        _repository = repository;
        _userRepository = userRepository;
        _departmentRepository = departmentRepository;
        _moduleRepository = moduleRepository;
        _userDepartmentAllocationRepository = userDepartmentAllocationRepository;
        _userModuleAllocationRepository = userModuleAllocationRepository;
        _userRoleAllocationRepository = userRoleAllocationRepository;
        _wardRepository = wardRepository;
        _oldWardRepository = oldWardRepository;
        _referenceValidator = referenceValidator;
        _logger = logger;
    }

    public async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        GlobalSurveyWardAllocationEntity currentEntity,
        GlobalSurveyWardAllocationEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var result = await _referenceValidator.ValidateReferencesAsync<GlobalSurveyWardAllocationEntity>(id, cancellationToken);
            if (!result.IsValid)
            {
                var errorMessage = result.Errors.FirstOrDefault()?.ErrorMessage ?? "Cannot deactivate as this record is referenced by other entities.";
                _logger.LogWarning("Allocation validation failed for deactivation of ID {Id}: {Reason}", id, errorMessage);
                throw new ValidationException(errorMessage, result.ToDictionary(), OperationType.Update);
            }

            updatedEntity.MarkedForDeletion = true;
            updatedEntity.MarkedForDeletionDate ??= DateTime.Now;
        }

        return ValidationResult.Success();
    }

    public async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GlobalSurveyWardAllocationEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (!entity.IsActive || entity.MarkedForDeletion)
        {
            _logger.LogWarning("Allocation validation failed for delete of ID {Id}: Record is already inactive or marked for deletion", id);
            throw new ValidationException($"Ward allocation with ID {id} is already deleted.", OperationType.Delete);
        }

        var result = await _referenceValidator.ValidateReferencesAsync<GlobalSurveyWardAllocationEntity>(id, cancellationToken);
        if (!result.IsValid)
        {
            var errorMessage = result.Errors.FirstOrDefault()?.ErrorMessage ?? "Cannot delete as this record is referenced by other entities.";
            _logger.LogWarning("Allocation validation failed for delete of ID {Id}: {Reason}", id, errorMessage);
            throw new ValidationException(errorMessage, result.ToDictionary(), OperationType.Delete);
        }

        return ValidationResult.Success();
    }

    public async Task<WardAllocationValidationData> LoadValidationDataAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<int> zoneIds,
        List<int> wardIds,
        List<int> oldWardIds,
        CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        var dept = await _departmentRepository.GetByIdAsync(departmentId, cancellationToken);
        var module = await _moduleRepository.GetByIdAsync(moduleId, cancellationToken);

        var hasDept = await _userDepartmentAllocationRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.DepartmentId == departmentId && x.IsActive, cancellationToken);

        var hasModule = await _userModuleAllocationRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.DepartmentId == departmentId && x.ModuleId == moduleId && x.IsActive, cancellationToken);

        var isAdmin = await _userRoleAllocationRepository.GetQueryable().AsNoTracking()
            .Include(x => x.UserRole)
            .AnyAsync(x => x.UserId == userId && x.IsActive && x.UserRole != null && x.UserRole.IsActive && AdminRoleNames.Contains(x.UserRole.UserRoleName), cancellationToken);

        var wardZoneMap = await _wardRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.ZoneId, cancellationToken);

        var activeOldWardIds = oldWardIds.Count > 0
            ? (await _oldWardRepository.GetQueryable().AsNoTracking()
                .Where(x => oldWardIds.Contains(x.Id) && x.IsActive)
                .Select(x => x.Id)
                .ToListAsync(cancellationToken)).ToHashSet()
            : new HashSet<int>();

        return new WardAllocationValidationData
        {
            User = user,
            Department = dept,
            Module = module,
            HasDepartmentAllocation = hasDept,
            HasModuleAllocation = hasModule,
            IsAdmin = isAdmin,
            ValidWardZoneMap = wardZoneMap,
            ActiveOldWardIds = activeOldWardIds
        };
    }

    public async Task ValidateWardAllocationAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<ZoneWardAllocationDto> allocations,
        CancellationToken cancellationToken,
        int? excludeId = null)
    {
        var operationType = excludeId.HasValue ? OperationType.Update : OperationType.Create;

        ValidateAllocations(allocations, operationType);

        var zoneIds = allocations.Select(x => x.ZoneId).Distinct().ToList();
        var wardIds = allocations.SelectMany(x => x.WardIds).Distinct().ToList();
        var oldWardIds = allocations
            .SelectMany(x => x.OldWardIds != null && x.OldWardIds.Count > 0
                ? x.OldWardIds
                : (x.OldWardId.HasValue ? new List<int> { x.OldWardId.Value } : new List<int>()))
            .Distinct().ToList();

        var validationData = await LoadValidationDataAsync(userId, departmentId, moduleId, zoneIds, wardIds, oldWardIds, cancellationToken);

        ValidateUserDepartmentAndModule(userId, departmentId, moduleId, validationData, operationType);

        var isSingleWardModule = ValidateSingleWardRestriction(validationData, zoneIds, wardIds, operationType);

        await ValidateConflictsAsync(userId, departmentId, moduleId, zoneIds, wardIds, validationData.IsAdmin, isSingleWardModule, operationType, cancellationToken, excludeId);

        if (operationType == OperationType.Create && isSingleWardModule && !validationData.IsAdmin)
        {
            var existingAllocations = await _repository.GetQueryable().AsNoTracking()
                .Where(x => x.UserId == userId && x.DepartmentId == departmentId && x.ModuleId == moduleId && x.IsActive && !x.MarkedForDeletion)
                .Select(x => new { x.ZoneId, x.WardId })
                .Distinct()
                .ToListAsync(cancellationToken);

            if (existingAllocations.Count > 0)
            {
                var isMatchingExistingWard = existingAllocations.Any(e =>
                    zoneIds.All(z => z == e.ZoneId) && wardIds.All(w => w == e.WardId));

                if (!isMatchingExistingWard)
                {
                    var isGeoSeq = string.Equals(validationData.Module?.ModuleCode?.Trim(), ModuleConstants.GeoSequencing, StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(validationData.Module?.ModuleName?.Trim(), ModuleConstants.GeoSequencingName, StringComparison.OrdinalIgnoreCase);
                    var moduleName = validationData.Module?.ModuleName?.Trim() ?? validationData.Module?.ModuleCode?.Trim() ?? (isGeoSeq ? "Geosequencing" : "Survey");
                    var reason = $"{moduleName} user can be allocated to only one zone and one ward.";
                    _logger.LogWarning("Allocation validation failed: {Reason}", reason);
                    throw new ValidationException(reason, operationType);
                }
            }
        }

        ValidateWardZoneRelationships(allocations, validationData.ValidWardZoneMap, operationType);
        ValidateOldWards(oldWardIds, validationData.ActiveOldWardIds, operationType);
    }

    public void ValidateAllocations(List<ZoneWardAllocationDto> allocations, OperationType operationType)
    {
        if (allocations == null || allocations.Count == 0)
        {
            _logger.LogWarning("Allocation validation failed: {Reason}", "At least one allocation is required.");
            throw new ValidationException("At least one allocation is required.", operationType);
        }

        if (allocations.Any(a => a.ZoneId <= 0))
        {
            _logger.LogWarning("Allocation validation failed: {Reason}", "Zone is required.");
            throw new ValidationException("Zone is required.", operationType);
        }

        if (allocations.Any(a => a.WardIds == null || !a.WardIds.Any() || a.WardIds.Any(w => w <= 0)))
        {
            _logger.LogWarning("Allocation validation failed: {Reason}", "Ward is required.");
            throw new ValidationException("Ward is required.", operationType);
        }
    }

    private void ValidateUserDepartmentAndModule(
        int userId,
        int departmentId,
        int moduleId,
        WardAllocationValidationData data,
        OperationType operationType)
    {
        if (data.User == null || !data.User.IsActive || data.User.MarkedForDeletion)
        {
            var reason = $"User {userId} not found or inactive.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        if (data.Department == null || !data.Department.IsActive)
        {
            var reason = $"Department {departmentId} not found or inactive.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        if (data.Module == null || !data.Module.IsActive)
        {
            var reason = $"Module {moduleId} not found or inactive.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        if (!data.HasDepartmentAllocation)
        {
            var reason = $"User {userId} is not allocated to Department {departmentId}.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        if (!data.HasModuleAllocation)
        {
            var reason = $"User {userId} is not allocated to Module {moduleId} in Department {departmentId}.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }
    }

    public bool ValidateSingleWardRestriction(
        WardAllocationValidationData data,
        List<int> zoneIds,
        List<int> wardIds,
        OperationType operationType)
    {
        var module = data.Module;
        var isGeoSequencingModule = module != null && module.IsActive &&
            (string.Equals(module.ModuleCode?.Trim(), ModuleConstants.GeoSequencing, StringComparison.OrdinalIgnoreCase) ||
             string.Equals(module.ModuleName?.Trim(), ModuleConstants.GeoSequencingName, StringComparison.OrdinalIgnoreCase) ||
             string.Equals(module.ModuleName?.Trim(), "Geosequencing", StringComparison.OrdinalIgnoreCase));
        var isSurveyModule = module != null && module.IsActive &&
            (string.Equals(module.ModuleCode?.Trim(), ModuleConstants.Survey, StringComparison.OrdinalIgnoreCase) ||
             string.Equals(module.ModuleName?.Trim(), ModuleConstants.SurveyName, StringComparison.OrdinalIgnoreCase) ||
             string.Equals(module.ModuleName?.Trim(), "Survey", StringComparison.OrdinalIgnoreCase));
        var isSingleWardModule = isGeoSequencingModule || isSurveyModule;

        if (isSingleWardModule)
        {
            _logger.LogDebug("Single ward restriction applied for module: {ModuleCode}", module?.ModuleCode);

            if (!data.IsAdmin && (zoneIds.Count != 1 || wardIds.Count != 1))
            {
                var moduleName = module?.ModuleName?.Trim() ?? module?.ModuleCode?.Trim() ?? (isSurveyModule ? ModuleConstants.Survey : ModuleConstants.GeoSequencing);
                var reason = $"{moduleName} user can be allocated to only one zone and one ward.";
                _logger.LogWarning("Allocation validation failed: {Reason}", reason);
                throw new ValidationException(reason, operationType);
            }
        }

        return isSingleWardModule;
    }

    public async Task ValidateConflictsAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<int> zoneIds,
        List<int> wardIds,
        bool isAdmin,
        bool isSingleWardModule,
        OperationType operationType,
        CancellationToken cancellationToken,
        int? excludeId = null)
    {
        if (isAdmin)
        {
            _logger.LogDebug("User is admin; skipping conflict validation for UserId {UserId}", userId);
            return;
        }

        var conflictQuery = _repository.GetQueryable().AsNoTracking()
            .Include(x => x.Zone).Include(x => x.Ward)
            .Where(x => x.IsActive && !x.MarkedForDeletion &&
                x.UserId != userId && x.DepartmentId == departmentId && x.ModuleId == moduleId &&
                zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.WardId) &&
                (!excludeId.HasValue || x.Id != excludeId.Value) &&
                (x.User == null || (x.User.IsActive && !x.User.MarkedForDeletion)) && (x.Zone == null || x.Zone.IsActive) && (x.Ward == null || x.Ward.IsActive));

        if (isSingleWardModule)
        {
            var adminUserIds = await _userRoleAllocationRepository.GetQueryable().AsNoTracking()
                .Include(x => x.UserRole)
                .Where(x => x.IsActive && x.UserRole != null && x.UserRole.IsActive && AdminRoleNames.Contains(x.UserRole.UserRoleName))
                .Select(x => x.UserId).Distinct().ToListAsync(cancellationToken);

            conflictQuery = conflictQuery.Where(x => !adminUserIds.Contains(x.UserId));
        }

        var conflict = await conflictQuery.FirstOrDefaultAsync(cancellationToken);
        if (conflict != null)
        {
            var reason = $"Zone {conflict.Zone?.ZoneNo ?? conflict.ZoneId.ToString()} and Ward {conflict.Ward?.WardNo ?? conflict.WardId.ToString()} are already allocated to another user.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }
    }

    public void ValidateWardZoneRelationships(
        List<ZoneWardAllocationDto> allocations,
        Dictionary<int, int> validWardDict,
        OperationType operationType)
    {
        var invalidWardGroups = allocations
            .Select(a => new
            {
                ZoneId = a.ZoneId,
                InvalidWards = a.WardIds.Where(w => !validWardDict.ContainsKey(w) || validWardDict[w] != a.ZoneId).ToList()
            })
            .FirstOrDefault(g => g.InvalidWards.Count > 0);

        if (invalidWardGroups != null)
        {
            var reason = $"Invalid ward(s) for Zone {invalidWardGroups.ZoneId}: {string.Join(", ", invalidWardGroups.InvalidWards)}";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }
    }

    public void ValidateOldWards(
        List<int> oldWardIds,
        HashSet<int> activeOldWardIds,
        OperationType operationType)
    {
        if (oldWardIds.Count == 0) return;

        var invalidOldWardIds = oldWardIds.Where(id => !activeOldWardIds.Contains(id)).ToList();
        if (invalidOldWardIds.Count > 0)
        {
            var reason = $"Invalid or inactive OldWardId(s): {string.Join(", ", invalidOldWardIds)}";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }
    }

    public async Task ValidateUserDepartmentAndModuleAsync(
        int userId,
        int departmentId,
        int moduleId,
        CancellationToken cancellationToken,
        OperationType operationType = OperationType.Create)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null || !user.IsActive || user.MarkedForDeletion)
        {
            var reason = $"User {userId} not found or inactive.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        var dept = await _departmentRepository.GetByIdAsync(departmentId, cancellationToken);
        if (dept == null || !dept.IsActive)
        {
            var reason = $"Department {departmentId} not found or inactive.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        var mod = await _moduleRepository.GetByIdAsync(moduleId, cancellationToken);
        if (mod == null || !mod.IsActive)
        {
            var reason = $"Module {moduleId} not found or inactive.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        var hasDept = await _userDepartmentAllocationRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.DepartmentId == departmentId && x.IsActive, cancellationToken);
        if (!hasDept)
        {
            var reason = $"User {userId} is not allocated to Department {departmentId}.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }

        var hasMod = await _userModuleAllocationRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.DepartmentId == departmentId && x.ModuleId == moduleId && x.IsActive, cancellationToken);
        if (!hasMod)
        {
            var reason = $"User {userId} is not allocated to Module {moduleId} in Department {departmentId}.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, operationType);
        }
    }

    public async Task ValidateUniquenessForCreateAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<(int ZoneId, int WardId, int? OldWardId)> distinctPairs,
        CancellationToken cancellationToken)
    {
        var zoneIds = distinctPairs.Select(p => p.ZoneId).Distinct().ToList();
        var wardIds = distinctPairs.Select(p => p.WardId).Distinct().ToList();

        var existingAllocations = await _repository.GetQueryable()
            .Where(x => x.UserId == userId && x.DepartmentId == departmentId && x.ModuleId == moduleId &&
                        zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.WardId) && x.IsActive && !x.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        var propertyWiseDuplicates = distinctPairs.Where(pair =>
            existingAllocations.Any(e => e.ZoneId == pair.ZoneId && e.WardId == pair.WardId &&
                (!string.IsNullOrEmpty(e.FromPropertyNo) || !string.IsNullOrEmpty(e.ToPropertyNo)))
        ).ToList();

        if (propertyWiseDuplicates.Count > 0)
        {
            var reason = "Allocation already exists in Property Wise.";
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, OperationType.Create);
        }

        var duplicates = distinctPairs.Where(pair =>
            existingAllocations.Any(e => e.ZoneId == pair.ZoneId && e.WardId == pair.WardId && e.OldWardId == pair.OldWardId)
        ).ToList();

        if (duplicates.Count > 0)
        {
            var duplicateMessages = duplicates.Select(x => $"Zone {x.ZoneId}, Ward {x.WardId}" + (x.OldWardId.HasValue ? $", OldWard {x.OldWardId}" : ""));
            var reason = "User is already allocated to the following: " + string.Join("; ", duplicateMessages);
            _logger.LogWarning("Allocation validation failed: {Reason}", reason);
            throw new ValidationException(reason, OperationType.Create);
        }
    }
}
