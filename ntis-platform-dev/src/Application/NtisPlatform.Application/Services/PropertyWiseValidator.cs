using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Service responsible for validating property-wise allocation operations and business rules.
/// Separates payload structure, property range matching, user/module authorization,
/// zone-ward hierarchy, conflict resolution, and entity lifecycle validations.
/// </summary>
public class PropertyWiseValidator : IPropertyWiseValidator
{
    private readonly IRepository<GlobalSurveyWardAllocationEntity, int> _repository;
    private readonly IRepository<ZoneEntity, int> _zoneRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<OldWardMasterEntity, int> _oldWardRepository;
    private readonly IRepository<UserEntity, int> _userRepository;
    private readonly IRepository<UserModuleAllocationEntity, int> _userModuleAllocationRepository;
    private readonly IRepository<ModuleMasterEntity, int> _moduleRepository;
    private readonly IRepository<UserRoleAllocationEntity, int> _userRoleAllocationRepository;
    private readonly IReferenceValidationService _referenceValidator;
    private readonly ILogger<PropertyWiseValidator> _logger;

    public PropertyWiseValidator(
        IRepository<GlobalSurveyWardAllocationEntity, int> repository,
        IRepository<ZoneEntity, int> zoneRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<OldWardMasterEntity, int> oldWardRepository,
        IRepository<UserEntity, int> userRepository,
        IRepository<UserModuleAllocationEntity, int> userModuleAllocationRepository,
        IRepository<ModuleMasterEntity, int> moduleRepository,
        IRepository<UserRoleAllocationEntity, int> userRoleAllocationRepository,
        IReferenceValidationService referenceValidator,
        ILogger<PropertyWiseValidator> logger)
    {
        _repository = repository;
        _zoneRepository = zoneRepository;
        _wardRepository = wardRepository;
        _oldWardRepository = oldWardRepository;
        _userRepository = userRepository;
        _userModuleAllocationRepository = userModuleAllocationRepository;
        _moduleRepository = moduleRepository;
        _userRoleAllocationRepository = userRoleAllocationRepository;
        _referenceValidator = referenceValidator;
        _logger = logger;
    }

    #region 1. Entry Point Validations (Create & Update)

    public async Task ValidateCreateAsync(CreatePropertyWiseDto createDto, CancellationToken cancellationToken = default)
    {
        if (createDto == null)
            throw new ValidationException("Allocation data is required.", OperationType.Create);

        await ValidatePropertyWiseAsync(
            createDto.UserId,
            createDto.DepartmentId,
            createDto.ModuleId,
            createDto.Allocations,
            createDto.FromPropertyNo,
            createDto.ToPropertyNo,
            cancellationToken);

        await ValidateCreateDuplicatesAsync(createDto, cancellationToken);
    }

    public async Task ValidateUpdateAsync(
        int id,
        GlobalSurveyWardAllocationEntity existingEntity,
        UpdatePropertyWiseDto updateDto,
        PropertyWisePair requestedPair,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var isEmployeeChanged = existingEntity.UserId != updateDto.UserId;
            var isZoneWardChanged = existingEntity.ZoneId != requestedPair.ZoneId ||
                existingEntity.WardId != requestedPair.WardId ||
                existingEntity.OldWardId != requestedPair.OldWardId;
            var isDepartmentOrModuleChanged = existingEntity.DepartmentId != updateDto.DepartmentId ||
                existingEntity.ModuleId != updateDto.ModuleId;

            var isAllocationChanged = isEmployeeChanged || isZoneWardChanged || isDepartmentOrModuleChanged;

            await ValidatePropertyWiseAsync(
                updateDto.UserId,
                updateDto.DepartmentId,
                updateDto.ModuleId,
                updateDto.Allocations,
                updateDto.FromPropertyNo,
                updateDto.ToPropertyNo,
                cancellationToken,
                id,
                isAllocationChanged);

            await ValidateUpdateDuplicatesAsync(id, updateDto, requestedPair, cancellationToken);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Allocation update validation failed for ID {Id}: {Reason}", id, ex.Message);
            throw;
        }
    }

    public async Task ValidatePropertyWiseAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<PropertyWiseZoneWardDto> allocations,
        string? fromPropertyNo,
        string? toPropertyNo,
        CancellationToken cancellationToken,
        int? excludeId = null,
        bool isZoneWardChanged = true)
    {
        try
        {
            var operationType = excludeId.HasValue ? OperationType.Update : OperationType.Create;

            // Step 1: Range & structure checks
            ValidatePropertyNumbers(fromPropertyNo, toPropertyNo, operationType);
            ValidateAllocations(allocations, operationType);

            var zoneIds = allocations.Select(x => x.ZoneId).Distinct().ToList();
            var wardIds = allocations.SelectMany(x => x.WardIds).Distinct().ToList();
            var oldZoneIds = allocations.SelectMany(x => x.OldZoneId).Distinct().ToList();
            var oldWardIds = allocations.SelectMany(x => x.OldWardIds).Distinct().ToList();

            // Step 2: Batch load reference data
            var validationData = await LoadValidationDataAsync(userId, departmentId, moduleId, zoneIds, wardIds, oldZoneIds, oldWardIds, cancellationToken);

            // Step 3: User, department & module rules
            ValidateUserDepartmentAndModule(validationData, userId, operationType);
            var isSingleWardModule = ValidateSingleWardRestriction(validationData, zoneIds, wardIds, operationType);
            _logger.LogDebug("Decision point: Single ward restriction evaluated. IsSingleWardModule={IsSingleWardModule}, IsAdmin={IsAdmin}", isSingleWardModule, validationData.IsAdmin);


            // Step 4: Overlap & Conflict checks
            if (!excludeId.HasValue)
            {
                await ValidateWardWiseOverlapAsync(userId, departmentId, moduleId, zoneIds, wardIds, operationType, cancellationToken);
            }

            if (!validationData.IsAdmin && isZoneWardChanged)
            {
                await ValidateConflictsAsync(userId, departmentId, moduleId, zoneIds, wardIds, excludeId, isSingleWardModule, operationType, cancellationToken);
            }

            // Step 5: Hierarchy mappings
            ValidateWardZoneMappings(allocations, validationData.ValidWardZoneMap, operationType);
            ValidateOldZoneWardMappings(allocations, oldZoneIds, oldWardIds, validationData.ActiveOldWardZoneMap, validationData.ValidOldZoneIds, operationType);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Allocation validation failed: {Reason} (UserId: {UserId}, DeptId: {DeptId}, ModuleId: {ModuleId})", ex.Message, userId, departmentId, moduleId);
            throw;
        }
    }

    #endregion

    #region 2. Property Range Validation Logic

    private static readonly System.Text.RegularExpressions.Regex PropertyNoRegex = new(@"^[\u0900-\u097fa-zA-Z0-9\-_/,\.]+$", System.Text.RegularExpressions.RegexOptions.Compiled);

    private static void ValidatePropertyNumbers(string? fromPropertyNo, string? toPropertyNo, OperationType operationType)
    {
        if (operationType == OperationType.Create)
        {
            if (string.IsNullOrWhiteSpace(fromPropertyNo) || fromPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase))
                throw new ValidationException("From Property No is required and cannot be null or empty.", operationType);

            if (string.IsNullOrWhiteSpace(toPropertyNo) || toPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase))
                throw new ValidationException("To Property No is required and cannot be null or empty.", operationType);
        }
        else
        {
            var isFromEmpty = string.IsNullOrWhiteSpace(fromPropertyNo) || fromPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase);
            var isToEmpty = string.IsNullOrWhiteSpace(toPropertyNo) || toPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase);

            if (isFromEmpty && isToEmpty)
                return;

            if (isFromEmpty)
                throw new ValidationException("From Property No is required when To Property No is provided.", operationType);

            if (isToEmpty)
                throw new ValidationException("To Property No is required when From Property No is provided.", operationType);
        }

        var from = fromPropertyNo!.Trim();
        var to = toPropertyNo!.Trim();

        if (!PropertyNoRegex.IsMatch(from))
            throw new ValidationException("Special characters are not allowed in From Property No.", operationType);

        if (!PropertyNoRegex.IsMatch(to))
            throw new ValidationException("Special characters are not allowed in To Property No.", operationType);

        if (PropertyRangeMatcher.Compare(from, to) > 0)
            throw new ValidationException("From Property No cannot be greater than To Property No.", operationType);
    }

    #endregion

    #region 3. Allocation Payload Structure Validation

    private static void ValidateAllocations(List<PropertyWiseZoneWardDto> allocations, OperationType operationType)
    {
        if (allocations == null || allocations.Count == 0)
            throw new ValidationException("At least one allocation is required.", operationType);

        if (allocations.Any(a => a.ZoneId <= 0))
            throw new ValidationException("Zone is required.", operationType);

        if (allocations.Any(a => a.WardIds == null || !a.WardIds.Any() || a.WardIds.Any(w => w <= 0)))
            throw new ValidationException("Ward is required.", operationType);

        if (allocations.Any(a => a.OldZoneId == null || !a.OldZoneId.Any() || a.OldZoneId.Any(z => z <= 0)))
            throw new ValidationException("OldZone is required.", operationType);

        if (allocations.Any(a => a.OldWardIds == null || !a.OldWardIds.Any() || a.OldWardIds.Any(w => w <= 0)))
            throw new ValidationException("OldWard is required.", operationType);

        var mismatchedAllocation = allocations.FirstOrDefault(a => a.OldWardIds.Count > 1 && a.WardIds.Count > 1 && a.OldWardIds.Count != a.WardIds.Count);
        if (mismatchedAllocation != null)
            throw new ValidationException($"In Zone {mismatchedAllocation.ZoneId}, the number of OldWardIds must either be 1 or match the number of WardIds.", operationType);
    }

    #endregion

    #region 4. User, Department & Module Rules

    private static void ValidateUserDepartmentAndModule(ValidationData data, int userId, OperationType operationType)
    {
        if (data.User == null || !data.User.IsActive)
            throw new ValidationException($"User {userId} not found or inactive.", operationType);

        if (!data.HasUserModuleAllocation)
            throw new ValidationException("Selected User, Department and Module combination is not assigned.", operationType);
    }

    private static bool ValidateSingleWardRestriction(ValidationData data, List<int> zoneIds, List<int> wardIds, OperationType operationType)
    {
        var isGeoSequencingModule = data.Module != null && data.Module.IsActive &&
            string.Equals(data.Module.ModuleCode?.Trim(), ModuleConstants.GeoSequencing, StringComparison.OrdinalIgnoreCase);

        var isSurveyModule = data.Module != null && data.Module.IsActive &&
            string.Equals(data.Module.ModuleCode?.Trim(), ModuleConstants.Survey, StringComparison.OrdinalIgnoreCase);

        var isSingleWardModule = isGeoSequencingModule || isSurveyModule;

        if (isSingleWardModule && !data.IsAdmin && (zoneIds.Count != 1 || wardIds.Count != 1))
        {
            var moduleName = data.Module?.ModuleName?.Trim() ?? data.Module?.ModuleCode?.Trim() ?? (isSurveyModule ? "Survey" : "Geosequencing");
            throw new ValidationException($"{moduleName} user can be allocated to only one zone and one ward.", operationType);
        }

        return isSingleWardModule;
    }

    #endregion

    #region 5. Conflict Resolution & Duplication Checks

    private async Task ValidateWardWiseOverlapAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<int> zoneIds,
        List<int> wardIds,
        OperationType operationType,
        CancellationToken cancellationToken)
    {
        var existingWardWise = await _repository.GetQueryable().AsNoTracking()
            .Include(x => x.Zone).Include(x => x.Ward)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.DepartmentId == departmentId && x.ModuleId == moduleId &&
                zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.WardId) &&
                string.IsNullOrEmpty(x.FromPropertyNo) && string.IsNullOrEmpty(x.ToPropertyNo) &&
                x.IsActive && !x.MarkedForDeletion &&
                (x.User == null || x.User.IsActive) && (x.Zone == null || x.Zone.IsActive) && (x.Ward == null || x.Ward.IsActive), cancellationToken);

        if (existingWardWise != null)
            throw new ValidationException("Allocation already exists in Ward Wise.", operationType);
    }

    private async Task ValidateConflictsAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<int> zoneIds,
        List<int> wardIds,
        int? excludeId,
        bool isSingleWardModule,
        OperationType operationType,
        CancellationToken cancellationToken)
    {
        var conflictQuery = _repository.GetQueryable().AsNoTracking()
            .Include(x => x.Zone).Include(x => x.Ward)
            .Where(x => x.IsActive && !x.MarkedForDeletion &&
                x.UserId != userId && x.DepartmentId == departmentId && x.ModuleId == moduleId &&
                zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.WardId) &&
                (!excludeId.HasValue || x.Id != excludeId.Value) &&
                (x.User == null || x.User.IsActive) && (x.Zone == null || x.Zone.IsActive) && (x.Ward == null || x.Ward.IsActive));

        if (isSingleWardModule)
        {
            var adminUserIds = await _userRoleAllocationRepository.GetQueryable().AsNoTracking()
                .Include(x => x.UserRole)
                .Where(x => x.IsActive && x.UserRole != null && x.UserRole.IsActive && RoleConstants.AdminRoleNames.Contains(x.UserRole.UserRoleName))
                .Select(x => x.UserId).Distinct().ToListAsync(cancellationToken);

            conflictQuery = conflictQuery.Where(x => !adminUserIds.Contains(x.UserId));
        }

        var conflict = await conflictQuery.FirstOrDefaultAsync(cancellationToken);
        if (conflict != null)
            throw new ValidationException($"Zone {conflict.Zone?.ZoneNo ?? conflict.ZoneId.ToString()} and Ward {conflict.Ward?.WardNo ?? conflict.WardId.ToString()} are already allocated to another user.", operationType);
    }

    private async Task ValidateUpdateDuplicatesAsync(
        int id,
        UpdatePropertyWiseDto updateDto,
        PropertyWisePair requestedPair,
        CancellationToken cancellationToken)
    {

        var isFromEmpty = string.IsNullOrWhiteSpace(updateDto.FromPropertyNo) || updateDto.FromPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase);
        var isToEmpty = string.IsNullOrWhiteSpace(updateDto.ToPropertyNo) || updateDto.ToPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase);

        if (isFromEmpty && isToEmpty)
        {
            var duplicateWardWise = await _repository.GetQueryable().AsNoTracking()
                .AnyAsync(x => x.Id != id && x.UserId == updateDto.UserId && x.DepartmentId == updateDto.DepartmentId && x.ModuleId == updateDto.ModuleId &&
                    x.ZoneId == requestedPair.ZoneId && x.WardId == requestedPair.WardId && x.OldWardId == requestedPair.OldWardId &&
                    string.IsNullOrEmpty(x.FromPropertyNo) && string.IsNullOrEmpty(x.ToPropertyNo) &&
                    x.IsActive && !x.MarkedForDeletion, cancellationToken);

            if (duplicateWardWise)
                throw new ValidationException("Allocation already exists in Ward Wise.", OperationType.Update);

            return;
        }

        var fromProp = updateDto.FromPropertyNo!.Trim();
        var toProp = updateDto.ToPropertyNo!.Trim();
        var duplicatePropWise = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != id && x.UserId == updateDto.UserId && x.DepartmentId == updateDto.DepartmentId && x.ModuleId == updateDto.ModuleId &&
                x.ZoneId == requestedPair.ZoneId && x.WardId == requestedPair.WardId && x.OldWardId == requestedPair.OldWardId &&
                x.FromPropertyNo == fromProp && x.ToPropertyNo == toProp &&
                x.IsActive && !x.MarkedForDeletion, cancellationToken);

        if (duplicatePropWise)
            throw new ValidationException("This Property Wise allocation already exists.", OperationType.Update);
    }

    private async Task ValidateCreateDuplicatesAsync(CreatePropertyWiseDto createDto, CancellationToken cancellationToken)
    {
        var zoneIds = createDto.Allocations.Select(x => x.ZoneId).Distinct().ToList();
        var wardIds = createDto.Allocations.SelectMany(x => x.WardIds).Distinct().ToList();
        var fromProp = createDto.FromPropertyNo.Trim();
        var toProp = createDto.ToPropertyNo.Trim();

        var candidateRecords = await _repository.GetQueryable().AsNoTracking()
            .Where(x => x.UserId == createDto.UserId && x.DepartmentId == createDto.DepartmentId && x.ModuleId == createDto.ModuleId &&
                zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.WardId) &&
                x.FromPropertyNo == fromProp && x.ToPropertyNo == toProp &&
                x.IsActive && !x.MarkedForDeletion)
            .Select(x => new { x.ZoneId, x.WardId })
            .ToListAsync(cancellationToken);

        if (candidateRecords.Count > 0)
        {
            var requestedPairs = createDto.Allocations
                .SelectMany(a => a.WardIds.Select(w => (ZoneId: a.ZoneId, WardId: w)))
                .ToHashSet();

            if (candidateRecords.Any(c => requestedPairs.Contains((c.ZoneId, c.WardId))))
            {
                throw new ValidationException("This Property Wise allocation already exists.", OperationType.Create);
            }
        }
    }

    #endregion

    #region 6. Zone & Ward Hierarchy Validation

    private static void ValidateWardZoneMappings(
        List<PropertyWiseZoneWardDto> allocations,
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
            throw new ValidationException($"Invalid ward(s) for Zone {invalidWardGroups.ZoneId}: {string.Join(", ", invalidWardGroups.InvalidWards)}", operationType);
    }

    private static void ValidateOldZoneWardMappings(
        List<PropertyWiseZoneWardDto> allocations,
        List<int> oldZoneIds,
        List<int> oldWardIds,
        Dictionary<int, int> activeOldWardDict,
        List<int> validOldZoneIds,
        OperationType operationType)
    {
        var sameWardOldWardMatch = allocations.SelectMany(a => a.WardIds.Where(w => a.OldWardIds.Contains(w))).FirstOrDefault();
        if (sameWardOldWardMatch != 0)
            throw new ValidationException($"WardId {sameWardOldWardMatch} and OldWardId cannot be the same.", operationType);

        if (oldWardIds.Count > 0)
        {
            var invalidOldWardIds = oldWardIds.Where(id => !activeOldWardDict.ContainsKey(id)).ToList();
            if (invalidOldWardIds.Count > 0)
                throw new ValidationException($"Invalid or inactive OldWardId(s): {string.Join(", ", invalidOldWardIds)}", operationType);

            var mismatchedOldWardsList = allocations
                .SelectMany(a => a.OldWardIds.Where(oldWardId => activeOldWardDict.TryGetValue(oldWardId, out var oldZoneId) && !a.OldZoneId.Contains(oldZoneId)))
                .ToList();

            if (mismatchedOldWardsList.Count > 0)
                throw new ValidationException($"OldWard(s) {string.Join(", ", mismatchedOldWardsList)} do not belong to the selected OldZone(s).", operationType);
        }
        else if (oldZoneIds.Count > 0)
        {
            var invalidOldZoneIds = oldZoneIds.Except(validOldZoneIds).ToList();
            if (invalidOldZoneIds.Count > 0)
                throw new ValidationException($"Invalid or inactive OldZoneId(s): {string.Join(", ", invalidOldZoneIds)}", operationType);
        }
    }

    #endregion

    #region 7. Entity Lifecycle & Reference Validation

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
                throw new ValidationException(errorMessage, result.ToDictionary(), OperationType.Update);
            }
        }

        return ValidationResult.Success();
    }

    public async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GlobalSurveyWardAllocationEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (!entity.IsActive || entity.MarkedForDeletion)
            throw new ValidationException($"Property wise allocation with ID {id} is already deleted.", OperationType.Delete);

        var result = await _referenceValidator.ValidateReferencesAsync<GlobalSurveyWardAllocationEntity>(id, cancellationToken);
        if (!result.IsValid)
        {
            var errorMessage = result.Errors.FirstOrDefault()?.ErrorMessage ?? "Cannot delete as this record is referenced by other entities.";
            throw new ValidationException(errorMessage, result.ToDictionary(), OperationType.Delete);
        }

        return ValidationResult.Success();
    }

    #endregion

    #region 8. Reference Data Batch Loading

    private sealed record ValidationData(
        UserEntity? User,
        bool HasUserModuleAllocation,
        ModuleMasterEntity? Module,
        bool IsAdmin,
        Dictionary<int, int> ValidWardZoneMap,
        Dictionary<int, int> ActiveOldWardZoneMap,
        List<int> ValidOldZoneIds);

    private async Task<ValidationData> LoadValidationDataAsync(
        int userId,
        int departmentId,
        int moduleId,
        List<int> zoneIds,
        List<int> wardIds,
        List<int> oldZoneIds,
        List<int> oldWardIds,
        CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);

        var hasUserModule = await _userModuleAllocationRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.DepartmentId == departmentId && x.ModuleId == moduleId && x.IsActive, cancellationToken);

        var module = await _moduleRepository.GetByIdAsync(moduleId, cancellationToken);

        var isAdmin = await _userRoleAllocationRepository.GetQueryable().AsNoTracking()
            .Include(x => x.UserRole)
            .AnyAsync(x => x.UserId == userId && x.IsActive && x.UserRole != null && x.UserRole.IsActive && RoleConstants.AdminRoleNames.Contains(x.UserRole.UserRoleName), cancellationToken);

        var validWardZoneMap = await _wardRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.ZoneId, cancellationToken);

        Dictionary<int, int> activeOldWardZoneMap = new();
        List<int> validOldZoneIds = new();

        if (oldWardIds.Count > 0)
        {
            var activeOldWards = await _oldWardRepository.GetQueryable().AsNoTracking()
                .Where(x => oldWardIds.Contains(x.Id) && x.IsActive)
                .Select(x => new { x.Id, x.OldZoneId })
                .ToListAsync(cancellationToken);

            activeOldWardZoneMap = activeOldWards.ToDictionary(x => x.Id, x => x.OldZoneId);
        }
        else if (oldZoneIds.Count > 0)
        {
            validOldZoneIds = await _oldWardRepository.GetQueryable().AsNoTracking()
                .Where(x => oldZoneIds.Contains(x.OldZoneId) && x.IsActive)
                .Select(x => x.OldZoneId).Distinct().ToListAsync(cancellationToken);
        }

        return new ValidationData(user, hasUserModule, module, isAdmin, validWardZoneMap, activeOldWardZoneMap, validOldZoneIds);
    }

    #endregion
}

