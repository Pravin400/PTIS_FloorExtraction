using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Service orchestrating ward allocation business operations, transactions, and queries
/// </summary>
public class WardAllocationService : BaseCommonCrudService<
    GlobalSurveyWardAllocationEntity, WardAllocationDto, CreateWardAllocationDto, UpdateWardAllocationDto, WardAllocationQueryParameters, int>,
    IWardAllocationService
{
    private readonly IWardAllocationValidator _validator;
    private readonly IWardAllocationBuilder _builder;
    private readonly IRepository<ZoneEntity, int> _zoneRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<OldWardMasterEntity, int> _oldWardRepository;
    private readonly IRepository<OldZoneMasterEntity, int>? _oldZoneRepository;
    private readonly IRepository<UserEntity, int> _userRepository;
    private readonly IRepository<UserModuleAllocationEntity, int> _userModuleAllocationRepository;
    private readonly IRepository<DepartmentMasterEntity, int> _departmentRepository;
    private readonly IRepository<ModuleMasterEntity, int> _moduleRepository;
    private readonly ILogger<WardAllocationService> _logger;

    public WardAllocationService(
        IRepository<GlobalSurveyWardAllocationEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IWardAllocationValidator validator,
        IWardAllocationBuilder builder,
        IRepository<ZoneEntity, int> zoneRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<OldWardMasterEntity, int> oldWardRepository,
        IRepository<UserEntity, int> userRepository,
        IRepository<UserModuleAllocationEntity, int> userModuleAllocationRepository,
        IRepository<DepartmentMasterEntity, int> departmentRepository,
        IRepository<ModuleMasterEntity, int> moduleRepository,
        ILogger<WardAllocationService> logger,
        IRepository<OldZoneMasterEntity, int>? oldZoneRepository = null)
        : base(repository, unitOfWork, mapper)
    {
        _validator = validator;
        _builder = builder;
        _zoneRepository = zoneRepository;
        _wardRepository = wardRepository;
        _oldWardRepository = oldWardRepository;
        _oldZoneRepository = oldZoneRepository;
        _userRepository = userRepository;
        _userModuleAllocationRepository = userModuleAllocationRepository;
        _departmentRepository = departmentRepository;
        _moduleRepository = moduleRepository;
        _logger = logger;
    }

    protected override Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        GlobalSurveyWardAllocationEntity currentEntity,
        GlobalSurveyWardAllocationEntity updatedEntity,
        CancellationToken cancellationToken = default)
        => _validator.ValidateForDeactivationAsync(id, currentEntity, updatedEntity, cancellationToken);

    protected override Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GlobalSurveyWardAllocationEntity entity,
        CancellationToken cancellationToken = default)
        => _validator.ValidateForDeleteAsync(id, entity, cancellationToken);

    protected override IQueryable<GlobalSurveyWardAllocationEntity> ApplyIncludes(IQueryable<GlobalSurveyWardAllocationEntity> query)
        => query.AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.Department)
            .Include(a => a.Module)
            .Include(a => a.Zone)
            .Include(a => a.Ward)
            .Include(a => a.OldWard)
                .ThenInclude(ow => ow!.OldZone);

    protected override IQueryable<GlobalSurveyWardAllocationEntity> ApplyReadScope(IQueryable<GlobalSurveyWardAllocationEntity> query)
        => query.Where(x => x.IsActive && !x.MarkedForDeletion);

    public async Task<List<WardAllocationDto>> CreateFlexibleAsync(
        CreateFlexibleWardAllocationDto createDto,
        CancellationToken cancellationToken = default)
    {
        if (createDto == null)
            throw new ValidationException("Allocation data is required.", OperationType.Create);



        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        List<GlobalSurveyWardAllocationEntity> entitiesToAdd;
        try
        {
            await _validator.ValidateWardAllocationAsync(createDto.UserId, createDto.DepartmentId, createDto.ModuleId, createDto.Allocations, cancellationToken);

            var pairs = _builder.BuildPairs(createDto.Allocations);
            var distinctPairs = _builder.GetDistinctPairs(pairs);

            await _validator.ValidateUniquenessForCreateAsync(createDto.UserId, createDto.DepartmentId, createDto.ModuleId, distinctPairs, cancellationToken);

            var now = DateTime.Now;
            entitiesToAdd = _builder.BuildEntitiesForCreate(createDto, distinctPairs, now);

            if (entitiesToAdd.Count > 0)
                await _repository.AddRangeAsync(entitiesToAdd, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            switch (ex)
            {
                case DbUpdateConcurrencyException concEx:
                    _logger.LogError(concEx, "Concurrency conflict creating allocations for UserId {UserId}", createDto.UserId);
                    break;
                case DbUpdateException dbEx:
                    _logger.LogError(dbEx, "Database error creating allocations for UserId {UserId}", createDto.UserId);
                    break;
                case ValidationException valEx:
                    _logger.LogWarning(valEx, "Validation failed for UserId {UserId}", createDto.UserId);
                    break;
                default:
                    _logger.LogError(ex, "Error creating allocations for UserId {UserId}", createDto.UserId);
                    break;
            }
            throw;
        }

        var savedIds = entitiesToAdd.Select(x => x.Id).ToList();
        var fullEntities = await QueryWithIncludes()
            .Where(x => savedIds.Contains(x.Id))
            .OrderBy(x => x.ZoneId).ThenBy(x => x.WardId)
            .ToListAsync(cancellationToken);

        var results = fullEntities.Count > 0 ? _mapper.Map<List<WardAllocationDto>>(fullEntities) : _mapper.Map<List<WardAllocationDto>>(entitiesToAdd);
        _logger.LogInformation("Successfully created {Count} ward allocations for UserId {UserId}", results.Count, createDto.UserId);
        return results;
    }

    public async Task<List<WardAllocationDto>> ReplaceAllocationsAsync(
        int id,
        int userId,
        int moduleId,
        UpdateFlexibleWardAllocationDto updateDto,
        CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            throw new ValidationException("Invalid allocation ID.", OperationType.Update);

        if (updateDto == null)
            throw new ValidationException("Allocation data is required.", OperationType.Update);

        var existingAllocation = await _repository.GetByIdAsync(id, cancellationToken);

        if (existingAllocation == null ||
            !existingAllocation.IsActive ||
            existingAllocation.MarkedForDeletion)
        {
            throw new KeyNotFoundException(
                $"Active Ward allocation with ID {id} not found.");
        }
        // Property number only update - Same ID
        if (existingAllocation.IsActive &&
            !existingAllocation.MarkedForDeletion &&
            existingAllocation.UserId == updateDto.UserId &&
            existingAllocation.DepartmentId == updateDto.DepartmentId &&
            existingAllocation.ModuleId == updateDto.ModuleId &&
            (updateDto.FromPropertyNo != null || updateDto.ToPropertyNo != null))
        {
            var pairs = _builder.GetDistinctPairs(
                _builder.BuildPairs(updateDto.Allocations));

            if (pairs.Count == 1 &&
                pairs[0].ZoneId == existingAllocation.ZoneId &&
                pairs[0].WardId == existingAllocation.WardId &&
                pairs[0].OldWardId == existingAllocation.OldWardId)
            {
                await _validator.ValidateWardAllocationAsync(
                    updateDto.UserId,
                    updateDto.DepartmentId,
                    updateDto.ModuleId,
                    updateDto.Allocations,
                    cancellationToken,
                    id);

                await _unitOfWork.BeginTransactionAsync(cancellationToken);

                try
                {
                    existingAllocation.FromPropertyNo =
                        string.IsNullOrWhiteSpace(updateDto.FromPropertyNo)
                            ? null
                            : updateDto.FromPropertyNo.Trim();

                    existingAllocation.ToPropertyNo =
                        string.IsNullOrWhiteSpace(updateDto.ToPropertyNo)
                            ? null
                            : updateDto.ToPropertyNo.Trim();

                    existingAllocation.UpdatedBy = updateDto.UpdatedBy;
                    existingAllocation.UpdatedDate = DateTime.Now;

                    await _repository.UpdateAsync(
                        existingAllocation, cancellationToken);

                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    await _unitOfWork.CommitTransactionAsync(cancellationToken);

                    return new List<WardAllocationDto>
            {
                _mapper.Map<WardAllocationDto>(existingAllocation)
            };
                }
                catch
                {
                    await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                    throw;
                }
            }
        }

        if (updateDto.UserId != userId || updateDto.ModuleId != moduleId)
            throw new ValidationException("UserId and ModuleId in request body must match the route parameters.", OperationType.Update);
        var requestedPairs = _builder.GetDistinctPairs(
    _builder.BuildPairs(updateDto.Allocations));

        if (requestedPairs.Count != 1)
        {
            throw new ValidationException(
                "Only one Ward allocation can be updated at a time.",
                OperationType.Update);
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        List<GlobalSurveyWardAllocationEntity> toUpdate;
        List<GlobalSurveyWardAllocationEntity> newEntities;
        try
        {
            await _validator.ValidateWardAllocationAsync(updateDto.UserId, updateDto.DepartmentId, updateDto.ModuleId, updateDto.Allocations, cancellationToken, id);

            var pairs = _builder.BuildPairs(updateDto.Allocations);
            var distinctPairs = _builder.GetDistinctPairs(pairs);
            var now = DateTime.Now;

            // If the employee (UserId) changed from the existing record, deactivate the old employee's allocation
            if (existingAllocation.UserId != updateDto.UserId && existingAllocation.IsActive && !existingAllocation.MarkedForDeletion)
            {
                _builder.PrepareExistingAllocationsForDeactivation(new List<GlobalSurveyWardAllocationEntity> { existingAllocation }, updateDto.UpdatedBy, now);
                await _repository.UpdateAsync(existingAllocation, cancellationToken);
            }

            var existingAllocations = await _repository.GetQueryable().Where(x => x.Id == id && x.UserId == updateDto.UserId && x.IsActive && !x.MarkedForDeletion) .ToListAsync(cancellationToken);

            var existingLookup = existingAllocations
                .GroupBy(x => (x.ZoneId, x.WardId, x.OldWardId))
                .ToDictionary(g => g.Key, g => g.First());

            var newDistinctSet = distinctPairs.ToHashSet();

            var toDeactivate = existingAllocations
                .Where(x => !newDistinctSet.Contains((x.ZoneId, x.WardId, x.OldWardId)))
                .ToList();

            var matchingGrouped = existingAllocations
                .Where(x => newDistinctSet.Contains((x.ZoneId, x.WardId, x.OldWardId)))
                .GroupBy(x => (x.ZoneId, x.WardId, x.OldWardId));

            toUpdate = new List<GlobalSurveyWardAllocationEntity>();
            var extraPropertyAllocationsToDeactivate = new List<GlobalSurveyWardAllocationEntity>();

            foreach (var group in matchingGrouped)
            {
                var primary = group.First();
                primary.IsActive = updateDto.IsActive;
                primary.MarkedForDeletion = !updateDto.IsActive;
                primary.MarkedForDeletionDate = updateDto.IsActive ? null : now;
                primary.UpdatedBy = updateDto.UpdatedBy;
                primary.UpdatedDate = now;
                primary.FromPropertyNo = null;
                primary.ToPropertyNo = null;
                toUpdate.Add(primary);

                foreach (var extra in group.Skip(1))
                {
                    extraPropertyAllocationsToDeactivate.Add(extra);
                }
            }

            var allToDeactivate = toDeactivate.Concat(extraPropertyAllocationsToDeactivate).ToList();
            _builder.PrepareExistingAllocationsForDeactivation(allToDeactivate, updateDto.UpdatedBy, now);

            var toAddPairs = distinctPairs
                .Where(pair => !existingLookup.ContainsKey((pair.ZoneId, pair.WardId, pair.OldWardId)))
                .ToList();
            newEntities = _builder.BuildEntitiesForReplace(updateDto, updateDto.UserId, moduleId, toAddPairs, now);
            if (newEntities.Count == 1)
{
    var newEntity = newEntities[0];

    newEntity.FromPropertyNo =string.IsNullOrWhiteSpace(updateDto.FromPropertyNo)? null : updateDto.FromPropertyNo.Trim();

    newEntity.ToPropertyNo = string.IsNullOrWhiteSpace(updateDto.ToPropertyNo) ? null: updateDto.ToPropertyNo.Trim();

    newEntity.IsActive = true;
    newEntity.MarkedForDeletion = false;
    newEntity.MarkedForDeletionDate = null;
}

            var allModified = allToDeactivate.Concat(toUpdate).ToList();
            if (allModified.Count > 0)
                await _repository.UpdateRangeAsync(allModified, cancellationToken);

            if (newEntities.Count > 0)
                await _repository.AddRangeAsync(newEntities, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            switch (ex)
            {
                case DbUpdateConcurrencyException concEx:
                    _logger.LogError(concEx, "Concurrency conflict replacing allocations for UserId {UserId}", userId);
                    break;
                case DbUpdateException dbEx:
                    _logger.LogError(dbEx, "Database error replacing allocations for UserId {UserId}", userId);
                    break;
                case ValidationException valEx:
                    _logger.LogWarning(valEx, "Validation failed for UserId {UserId}", userId);
                    break;
                case KeyNotFoundException knfEx:
                    _logger.LogWarning(knfEx, "Allocation {Id} not found", id);
                    break;
                default:
                    _logger.LogError(ex, "Error replacing allocations for UserId {UserId}", userId);
                    break;
            }
            throw;
        }

        var savedIds = toUpdate.Select(x => x.Id).Concat(newEntities.Select(x => x.Id)).ToList();
        var fullEntities = await QueryWithIncludes()
            .Where(x => savedIds.Contains(x.Id))
            .OrderBy(x => x.ZoneId).ThenBy(x => x.WardId)
            .ToListAsync(cancellationToken);

        var results = fullEntities.Count > 0 ? _mapper.Map<List<WardAllocationDto>>(fullEntities) : _mapper.Map<List<WardAllocationDto>>(newEntities);
        _logger.LogInformation("Successfully replaced {Count} ward allocations for UserId {UserId}", results.Count, userId);
        return results;
    }

    public override async Task<WardAllocationDto?> UpdateAsync(int id, UpdateWardAllocationDto updateDto, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing == null || !existing.IsActive || existing.MarkedForDeletion)
            return null;

        var isEmployeeChanged = updateDto.UserId.HasValue && updateDto.UserId.Value > 0 && existing.UserId != updateDto.UserId.Value;
        var isZoneWardChanged = existing.ZoneId != updateDto.ZoneId ||
            existing.WardId != updateDto.WardId ||
            existing.OldWardId != updateDto.OldWardId;
        var isDepartmentOrModuleChanged = existing.DepartmentId != updateDto.DepartmentId ||
            existing.ModuleId != updateDto.ModuleId;

        var isAllocationChanged = isEmployeeChanged || isZoneWardChanged || isDepartmentOrModuleChanged;

        if (isAllocationChanged)
        {
            var now = DateTime.Now;
            _builder.PrepareExistingAllocationsForDeactivation(new List<GlobalSurveyWardAllocationEntity> { existing }, updateDto.UpdatedBy, now);

            var newEntity = new GlobalSurveyWardAllocationEntity
            {
                UserId = updateDto.UserId.HasValue && updateDto.UserId.Value > 0 ? updateDto.UserId.Value : existing.UserId,
                DepartmentId = updateDto.DepartmentId,
                ModuleId = updateDto.ModuleId,
                ZoneId = updateDto.ZoneId,
                WardId = updateDto.WardId,
                OldWardId = updateDto.OldWardId,
                FromPropertyNo = string.IsNullOrWhiteSpace(updateDto.FromPropertyNo)
                ? null : updateDto.FromPropertyNo.Trim(),

                ToPropertyNo = string.IsNullOrWhiteSpace(updateDto.ToPropertyNo)
                ? null : updateDto.ToPropertyNo.Trim(),
                IsActive = updateDto.IsActive,
                MarkedForDeletion = !updateDto.IsActive,
                MarkedForDeletionDate = updateDto.IsActive ? null : now,
                CreatedBy = updateDto.UpdatedBy,
                CreatedDate = now
            };

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                await _repository.UpdateAsync(existing, cancellationToken);
                await _repository.AddAsync(newEntity, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                return _mapper.Map<WardAllocationDto>(newEntity);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
        else
        {
            existing.FromPropertyNo = string.IsNullOrWhiteSpace(updateDto.FromPropertyNo)
                ? null
                : updateDto.FromPropertyNo.Trim();

            existing.ToPropertyNo = string.IsNullOrWhiteSpace(updateDto.ToPropertyNo)
                ? null
                : updateDto.ToPropertyNo.Trim();

            return await base.UpdateAsync(id, updateDto, cancellationToken);
        }
    }

    public override async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return false;

        var validationResult = await ValidateForDeleteAsync(id, entity, cancellationToken);
        if (!validationResult.IsValid)
        {
            var firstError = validationResult.Errors.FirstOrDefault()?.ErrorMessage ?? "Validation failed for delete operation";
            throw new ValidationException(firstError, validationResult.ToDictionary(), OperationType.Delete);
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            entity.IsActive = false;
            entity.MarkedForDeletion = true;
            entity.MarkedForDeletionDate = DateTime.Now;

            await _repository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return true;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public override async Task<BulkResult<int>> BulkDeleteAsync(
        int[] ids,
        CancellationToken cancellationToken = default)
    {
        if (ids.Length == 0)
            return new BulkResult<int>(0, 0, []);

        var deletedIds = new List<int>();
        var errors = new List<string>();
        var failedCount = 0;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var id in ids)
            {
                var entity = await _repository.GetByIdAsync(id, cancellationToken);
                if (entity is null)
                {
                    failedCount++;
                    errors.Add($"Record with Id '{id}' not found.");
                    continue;
                }

                var validationResult = await ValidateForDeleteAsync(id, entity, cancellationToken);
                if (!validationResult.IsValid)
                {
                    failedCount++;
                    var errorMessages = string.Join(", ", validationResult.Errors.Select(e =>
                        string.IsNullOrEmpty(e.PropertyName) ? e.ErrorMessage : $"{e.PropertyName}: {e.ErrorMessage}"));
                    errors.Add($"Record with Id '{id}': {errorMessages}");
                    continue;
                }

                entity.IsActive = false;
                entity.MarkedForDeletion = true;
                entity.MarkedForDeletionDate = DateTime.Now;

                await _repository.UpdateAsync(entity, cancellationToken);
                deletedIds.Add(id);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return new BulkResult<int>(
            deletedIds.Count,
            failedCount,
            deletedIds,
            errors.Count > 0 ? errors : null);
    }

    public override async Task<WardAllocationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await QueryWithIncludes().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (entity == null)
            {
                _logger.LogInformation("Ward allocation with ID {Id} not found", id);
                return null;
            }
            return _mapper.Map<WardAllocationDto>(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ward allocation with ID {Id}", id);
            throw;
        }
    }

    public override async Task<PagedResult<WardAllocationDto>> GetAllAsync(WardAllocationQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = QueryWithIncludes()
                .ApplyFilters(queryParameters)
                .ApplySearch(queryParameters)
                .ApplySort(queryParameters);

            var pagedResult = await query.ApplyPaginationAsync(queryParameters, cancellationToken);
            var items = _mapper.Map<List<WardAllocationDto>>(pagedResult.Items);
            _logger.LogInformation("Successfully retrieved {Count} ward allocations (Total: {TotalCount})", items.Count, pagedResult.TotalCount);
            return new PagedResult<WardAllocationDto>(items, pagedResult.TotalCount, pagedResult.PageNumber, pagedResult.PageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ward allocations");
            throw;
        }
    }

    public async Task<List<WardAllocationDto>> GetByUserModuleZoneAsync(
        int userId,
        int moduleId,
        int zoneId,
        CancellationToken cancellationToken = default)
    {
        var entities = await QueryWithIncludes()
            .Where(x => x.UserId == userId && x.ModuleId == moduleId && x.ZoneId == zoneId)
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.WardId)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<WardAllocationDto>>(entities);
    }

    public async Task<List<WardAllocationEmployeeDto>> GetEmployeesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _userRepository.GetQueryable().AsNoTracking()
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName).ThenBy(u => u.UserName)
                .Select(u => new WardAllocationEmployeeDto
                {
                    UserId = u.Id,
                    EmployeeName = ((u.FirstName ?? "") + (string.IsNullOrWhiteSpace(u.MiddleName) ? "" : " " + u.MiddleName) + (string.IsNullOrWhiteSpace(u.LastName) ? "" : " " + u.LastName)).Trim().Length > 0
                        ? ((u.FirstName ?? "") + (string.IsNullOrWhiteSpace(u.MiddleName) ? "" : " " + u.MiddleName) + (string.IsNullOrWhiteSpace(u.LastName) ? "" : " " + u.LastName)).Trim()
                        : u.UserName,
                    EmpCode = u.UserCode,
                    IsActive = u.IsActive
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all employees for ward allocation");
            throw;
        }
    }

    public async Task<List<WardAllocationEmployeeDto>> GetActiveEmployeesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _userRepository.GetQueryable().AsNoTracking()
                .Where(u => u.IsActive && !u.MarkedForDeletion)
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName).ThenBy(u => u.UserName)
                .Select(u => new WardAllocationEmployeeDto
                {
                    UserId = u.Id,
                    EmployeeName = ((u.FirstName ?? "") + (string.IsNullOrWhiteSpace(u.MiddleName) ? "" : " " + u.MiddleName) + (string.IsNullOrWhiteSpace(u.LastName) ? "" : " " + u.LastName)).Trim().Length > 0
                        ? ((u.FirstName ?? "") + (string.IsNullOrWhiteSpace(u.MiddleName) ? "" : " " + u.MiddleName) + (string.IsNullOrWhiteSpace(u.LastName) ? "" : " " + u.LastName)).Trim()
                        : u.UserName,
                    EmpCode = u.UserCode,
                    IsActive = u.IsActive
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active employees for ward allocation");
            throw;
        }
    }

    public async Task<List<WardAllocationEmployeeDto>> GetInactiveEmployeesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _userRepository.GetQueryable().AsNoTracking()
                .Where(u => !u.IsActive)
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName).ThenBy(u => u.UserName)
                .Select(u => new WardAllocationEmployeeDto
                {
                    UserId = u.Id,
                    EmployeeName = ((u.FirstName ?? "") + (string.IsNullOrWhiteSpace(u.MiddleName) ? "" : " " + u.MiddleName) + (string.IsNullOrWhiteSpace(u.LastName) ? "" : " " + u.LastName)).Trim().Length > 0
                        ? ((u.FirstName ?? "") + (string.IsNullOrWhiteSpace(u.MiddleName) ? "" : " " + u.MiddleName) + (string.IsNullOrWhiteSpace(u.LastName) ? "" : " " + u.LastName)).Trim()
                        : u.UserName,
                    EmpCode = u.UserCode,
                    IsActive = u.IsActive
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving inactive employees for ward allocation");
            throw;
        }
    }

    public async Task<List<WardAllocationZoneDto>> GetZonesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _zoneRepository.GetQueryable().AsNoTracking()
                .Where(z => z.IsActive)
                .OrderBy(z => z.SequenceNo).ThenBy(z => z.Description)
                .Select(z => new WardAllocationZoneDto
                {
                    ZoneId = z.Id,
                    ZoneNo = z.ZoneNo,
                    ZoneName = z.Description
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving zones for ward allocation");
            throw;
        }
    }

    public async Task<List<WardAllocationDepartmentDto>> GetDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _departmentRepository.GetQueryable().AsNoTracking()
                .Where(d => d.IsActive)
                .OrderBy(d => d.DepartmentName)
                .Select(d => new WardAllocationDepartmentDto
                {
                    DepartmentId = d.Id,
                    DepartmentCode = d.DepartmentCode,
                    DepartmentName = d.DepartmentName
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving departments for ward allocation");
            throw;
        }
    }

    public async Task<List<WardAllocationModuleDto>> GetModulesByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            throw new ValidationException("UserId must be greater than zero.", OperationType.Create);

        try
        {
            return await (
                from userModuleAllocation in _userModuleAllocationRepository.GetQueryable().AsNoTracking()
                join module in _moduleRepository.GetQueryable().AsNoTracking().Where(m => m.IsActive)
                    on userModuleAllocation.ModuleId equals module.Id
                join department in _departmentRepository.GetQueryable().AsNoTracking().Where(d => d.IsActive)
                    on userModuleAllocation.DepartmentId equals department.Id into departmentJoin
                from department in departmentJoin.DefaultIfEmpty()
                where userModuleAllocation.UserId == userId && userModuleAllocation.IsActive
                orderby module.ModuleName
                select new WardAllocationModuleDto
                {
                    ModuleId = module.Id,
                    ModuleCode = module.ModuleCode,
                    ModuleName = module.ModuleName,
                    DepartmentId = userModuleAllocation.DepartmentId,
                    DepartmentCode = department != null ? department.DepartmentCode : null,
                    DepartmentName = department != null ? department.DepartmentName : null
                })
                .Distinct()
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving modules for UserId {UserId}", userId);
            throw;
        }
    }

    public async Task<List<WardAllocationWardDto>> GetWardsByZoneIdAsync(
        int zoneId,
        CancellationToken cancellationToken = default)
    {
        if (zoneId <= 0)
            throw new ValidationException("ZoneId must be greater than zero.", OperationType.Create);

        try
        {
            return await _wardRepository.GetQueryable().AsNoTracking()
                .Where(x => x.IsActive && x.ZoneId == zoneId)
                .OrderBy(x => x.SequenceNo).ThenBy(x => x.Description)
                .Select(x => new WardAllocationWardDto
                {
                    WardId = x.Id,
                    ZoneId = x.ZoneId,
                    WardNo = x.WardNo,
                    WardName = x.Description
                })
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving wards for ZoneId {ZoneId}", zoneId);
            throw;
        }
    }

    public async Task<List<UserAllocatedZoneWardDto>> GetAllocatedZonesAndWardsByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            throw new ValidationException("UserId must be greater than zero.", OperationType.Create);

        var isDeallocated = await IsUserDeallocatedAsync(userId, cancellationToken);
        if (isDeallocated)
            return new List<UserAllocatedZoneWardDto>();

        try
        {
            var allocations = await (
                from allocation in _repository.GetQueryable().AsNoTracking()
                join zone in _zoneRepository.GetQueryable().AsNoTracking().Where(z => z.IsActive)
                    on allocation.ZoneId equals zone.Id into zoneJoin
                from zone in zoneJoin.DefaultIfEmpty()
                join ward in _wardRepository.GetQueryable().AsNoTracking().Where(w => w.IsActive)
                    on allocation.WardId equals ward.Id into wardJoin
                from ward in wardJoin.DefaultIfEmpty()
                where allocation.UserId == userId && allocation.IsActive && !allocation.MarkedForDeletion
                select new
                {
                    allocation.ZoneId,
                    ZoneNo = zone != null ? zone.ZoneNo : null,
                    ZoneName = zone != null ? zone.Description : null,
                    allocation.WardId,
                    WardNo = ward != null ? ward.WardNo : null
                })
                .Distinct()
                .OrderBy(x => x.ZoneId).ThenBy(x => x.WardNo)
                .ToListAsync(cancellationToken);

            return allocations
                .GroupBy(x => new { x.ZoneId, x.ZoneNo, x.ZoneName })
                .Select(group => new UserAllocatedZoneWardDto
                {
                    ZoneId = group.Key.ZoneId,
                    ZoneNo = group.Key.ZoneNo,
                    ZoneName = group.Key.ZoneName,
                    Wards = group
                        .GroupBy(x => new { x.WardId, x.WardNo })
                        .Select(wardGroup => new UserAllocatedWardDto
                        {
                            WardId = wardGroup.Key.WardId,
                            WardNo = wardGroup.Key.WardNo
                        })
                        .OrderBy(x => x.WardNo)
                        .ToList()
                })
                .OrderBy(x => x.ZoneNo)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving allocated zones and wards for UserId {UserId}", userId);
            throw;
        }
    }

    public async Task<List<AllocatedZoneByUserDto>> GetAllocatedZonesByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            throw new ValidationException("UserId must be greater than zero.", OperationType.Create);

        var isDeallocated = await IsUserDeallocatedAsync(userId, cancellationToken);
        if (isDeallocated)
            return new List<AllocatedZoneByUserDto>();

        try
        {
            return await (
                from allocation in _repository.GetQueryable().AsNoTracking()
                join module in _moduleRepository.GetQueryable().AsNoTracking().Where(m => m.IsActive)
                    on allocation.ModuleId equals module.Id into moduleJoin
                from module in moduleJoin.DefaultIfEmpty()
                join zone in _zoneRepository.GetQueryable().AsNoTracking().Where(z => z.IsActive)
                    on allocation.ZoneId equals zone.Id into zoneJoin
                from zone in zoneJoin.DefaultIfEmpty()
                where allocation.UserId == userId && allocation.IsActive && !allocation.MarkedForDeletion
                select new AllocatedZoneByUserDto
                {
                    ModuleId = allocation.ModuleId,
                    ModuleName = module != null ? module.ModuleName : null,
                    ZoneId = allocation.ZoneId,
                    ZoneNo = zone != null ? zone.ZoneNo : null,
                    ZoneName = zone != null ? zone.Description : null
                })
                .Distinct()
                .OrderBy(x => x.ModuleName).ThenBy(x => x.ZoneNo)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving allocated zones for UserId {UserId}", userId);
            throw;
        }
    }

    public async Task<List<AllocatedWardByUserDto>> GetAllocatedWardsByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            throw new ValidationException("UserId must be greater than zero.", OperationType.Create);

        var isDeallocated = await IsUserDeallocatedAsync(userId, cancellationToken);
        if (isDeallocated)
            return new List<AllocatedWardByUserDto>();

        try
        {
            return await (
                from allocation in _repository.GetQueryable().AsNoTracking()
                join module in _moduleRepository.GetQueryable().AsNoTracking().Where(m => m.IsActive)
                    on allocation.ModuleId equals module.Id into moduleJoin
                from module in moduleJoin.DefaultIfEmpty()
                join ward in _wardRepository.GetQueryable().AsNoTracking().Where(w => w.IsActive)
                    on allocation.WardId equals ward.Id into wardJoin
                from ward in wardJoin.DefaultIfEmpty()
                where allocation.UserId == userId && allocation.IsActive && !allocation.MarkedForDeletion
                select new AllocatedWardByUserDto
                {
                    ModuleId = allocation.ModuleId,
                    ModuleName = module != null ? module.ModuleName : null,
                    ZoneId = allocation.ZoneId,
                    WardId = allocation.WardId,
                    WardNo = ward != null ? ward.WardNo : null
                })
                .Distinct()
                .OrderBy(x => x.ModuleId).ThenBy(x => x.ZoneId).ThenBy(x => x.WardNo)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving allocated wards for UserId {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> IsUserDeallocatedAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return user == null || !user.IsActive || user.MarkedForDeletion;
    }

    public async Task<List<OldWardByWardDto>> GetOldWardsByWardIdAsync(
        int wardId,
        int? userId = null,
        CancellationToken cancellationToken = default)
    {
        if (wardId <= 0)
            throw new ValidationException("WardId must be greater than zero.", OperationType.Create);

        try
        {
            var query = _repository
                .GetQueryable().AsNoTracking()
                .Where(x => x.WardId == wardId && x.IsActive && !x.MarkedForDeletion && x.OldWardId.HasValue);

            if (userId.HasValue && userId.Value > 0)
                query = query.Where(x => x.UserId == userId.Value);

            var oldZoneQuery = _oldZoneRepository != null
                ? _oldZoneRepository.GetQueryable().AsNoTracking().Where(oz => oz.IsActive)
                : Enumerable.Empty<OldZoneMasterEntity>().AsQueryable();

            return await (
                from allocation in query
                join oldWard in _oldWardRepository.GetQueryable().AsNoTracking().Where(ow => ow.IsActive)
                    on allocation.OldWardId equals oldWard.Id
                join oldZone in oldZoneQuery
                    on oldWard.OldZoneId equals oldZone.Id into oldZoneJoin
                from oldZone in oldZoneJoin.DefaultIfEmpty()
                select new OldWardByWardDto
                {
                    OldWardId = oldWard.Id,
                    OldWardNo = oldWard.OldWardNo,
                    OldWardName = oldWard.Description,
                    OldZoneNo = oldZone != null ? oldZone.OldZoneNo : null,
                    OldZoneName = oldZone != null ? (!string.IsNullOrWhiteSpace(oldZone.Description) ? oldZone.Description : oldZone.OldZoneNo) : null
                })
                .Distinct()
                .OrderBy(x => x.OldWardNo)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving old wards for WardId {WardId}", wardId);
            throw;
        }
    }

    private IQueryable<GlobalSurveyWardAllocationEntity> QueryWithIncludes()
        => ApplyIncludes(ApplyReadScope(_repository.GetQueryable().AsNoTracking()));
}