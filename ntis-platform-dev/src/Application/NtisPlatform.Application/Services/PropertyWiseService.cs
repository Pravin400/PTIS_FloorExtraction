using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Service responsible for managing property-wise zone and ward allocations.
/// Orchestrates validation, pair building, persistence transactions, and querying.
/// </summary>
public class PropertyWiseService : BaseCommonCrudService<
    GlobalSurveyWardAllocationEntity, PropertyWiseDto, CreatePropertyWiseDto, UpdatePropertyWiseDto, PropertyWiseQueryParameters, int>,
    IPropertyWiseService
{
    private readonly IPropertyWiseValidator _validator;
    private readonly IPropertyWiseAllocationBuilder _allocationBuilder;
    private readonly ILogger<PropertyWiseService> _logger;

    public PropertyWiseService(
        IRepository<GlobalSurveyWardAllocationEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IPropertyWiseValidator validator,
        IPropertyWiseAllocationBuilder allocationBuilder,
        ILogger<PropertyWiseService> logger)
        : base(repository, unitOfWork, mapper)
    {
        _validator = validator;
        _allocationBuilder = allocationBuilder;
        _logger = logger;
    }

    protected override Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        GlobalSurveyWardAllocationEntity currentEntity,
        GlobalSurveyWardAllocationEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        return _validator.ValidateForDeactivationAsync(id, currentEntity, updatedEntity, cancellationToken);
    }

    protected override Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        GlobalSurveyWardAllocationEntity entity,
        CancellationToken cancellationToken = default)
    {
        return _validator.ValidateForDeleteAsync(id, entity, cancellationToken);
    }

    public override async Task<PropertyWiseDto> CreateAsync(CreatePropertyWiseDto createDto, CancellationToken cancellationToken = default)
    {
        var results = await CreateAllocationsAsync(createDto, cancellationToken);
        return results.First();
    }

    public async Task<List<PropertyWiseDto>> CreateAllocationsAsync(CreatePropertyWiseDto createDto, CancellationToken cancellationToken = default)
    {
        if (createDto == null)
            throw new ValidationException("Allocation data is required.", OperationType.Create);

        var firstAlloc = createDto.Allocations?.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(createDto.FromPropertyNo) && !string.IsNullOrWhiteSpace(firstAlloc?.FromPropertyNo))
        {
            createDto.FromPropertyNo = firstAlloc.FromPropertyNo;
        }
        if (string.IsNullOrWhiteSpace(createDto.ToPropertyNo) && !string.IsNullOrWhiteSpace(firstAlloc?.ToPropertyNo))
        {
            createDto.ToPropertyNo = firstAlloc.ToPropertyNo;
        }
       

        // 1. Validation & Pre-processing (Outside Transaction Scope)
        await _validator.ValidateCreateAsync(createDto, cancellationToken);

        var pairs = _allocationBuilder.BuildPairs(createDto.Allocations!);
        var now = DateTime.Now;

        var distinctPairs = pairs.GroupBy(p => new { p.ZoneId, p.WardId, p.OldWardId }).Select(g => g.First()).ToList();
        var zoneIds = distinctPairs.Select(p => p.ZoneId).Distinct().ToList();
        var wardIds = distinctPairs.Select(p => p.WardId).Distinct().ToList();

        var existingAllocations = await _repository.GetQueryable()
            .Where(x => x.UserId == createDto.UserId && x.DepartmentId == createDto.DepartmentId && x.ModuleId == createDto.ModuleId &&
                        zoneIds.Contains(x.ZoneId) && wardIds.Contains(x.WardId) && x.IsActive && !x.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        var existingLookup = existingAllocations.GroupBy(x => (x.ZoneId, x.WardId, x.OldWardId)).ToDictionary(g => g.Key, g => g.First());

        var entitiesToUpdate = distinctPairs
            .Where(pair => existingLookup.ContainsKey((pair.ZoneId, pair.WardId, pair.OldWardId)))
            .Select(pair =>
            {
                var existing = existingLookup[(pair.ZoneId, pair.WardId, pair.OldWardId)];
                existing.OldWardId = pair.OldWardId;
                existing.FromPropertyNo = createDto.FromPropertyNo.Trim();
                existing.ToPropertyNo = createDto.ToPropertyNo.Trim();
                existing.IsActive = createDto.IsActive;
                existing.MarkedForDeletion = !createDto.IsActive;
                existing.MarkedForDeletionDate = createDto.IsActive ? null : now;
                existing.UpdatedBy = createDto.CreatedBy ?? createDto.UserId;
                existing.UpdatedDate = now;
                return existing;
            }).ToList();

        var entitiesToAdd = distinctPairs
            .Where(pair => !existingLookup.ContainsKey((pair.ZoneId, pair.WardId, pair.OldWardId)))
            .Select(pair => new GlobalSurveyWardAllocationEntity
            {
                UserId = createDto.UserId,
                DepartmentId = createDto.DepartmentId,
                ModuleId = createDto.ModuleId,
                ZoneId = pair.ZoneId,
                WardId = pair.WardId,
                OldWardId = pair.OldWardId,
                FromPropertyNo = createDto.FromPropertyNo.Trim(),
                ToPropertyNo = createDto.ToPropertyNo.Trim(),
                IsActive = createDto.IsActive,
                MarkedForDeletion = !createDto.IsActive,
                MarkedForDeletionDate = createDto.IsActive ? null : now,
                CreatedBy = createDto.CreatedBy,
                CreatedDate = now
            }).ToList();

        var savedEntities = entitiesToUpdate.Concat(entitiesToAdd).ToList();

        // 2. Atomic Persistence (Inside Transaction Boundary Only)
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            if (entitiesToUpdate.Count > 0) await _repository.UpdateRangeAsync(entitiesToUpdate, cancellationToken);
            if (entitiesToAdd.Count > 0) await _repository.AddRangeAsync(entitiesToAdd, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);

            switch (ex)
            {
                case DbUpdateConcurrencyException cex:
                    _logger.LogError(cex, "Concurrency error persisting property wise allocation for User {UserId}", createDto?.UserId);
                    break;
                case DbUpdateException dex:
                    _logger.LogError(dex, "DB error persisting property wise allocation for User {UserId}", createDto?.UserId);
                    break;
                default:
                    _logger.LogError(ex, "Error persisting property wise allocation for User {UserId}", createDto?.UserId);
                    break;
            }

            throw;
        }

        // 3. Post-Persistence Query & Mapping
        var savedIds = savedEntities.Select(x => x.Id).ToList();
        var fullEntities = await QueryWithIncludes()
            .Where(x => savedIds.Contains(x.Id))
            .OrderBy(x => x.ZoneId).ThenBy(x => x.WardId)
            .ToListAsync(cancellationToken);

        var results = fullEntities.Count > 0 ? _mapper.Map<List<PropertyWiseDto>>(fullEntities) : _mapper.Map<List<PropertyWiseDto>>(savedEntities);
        _logger.LogInformation("Successfully created {Count} property wise allocations for UserId {UserId}, DepartmentId {DepartmentId}, ModuleId {ModuleId}",
            results.Count, createDto?.UserId, createDto?.DepartmentId, createDto?.ModuleId);
        return results;
    }

    public override async Task<PropertyWiseDto?> UpdateAsync(int id, UpdatePropertyWiseDto updateDto, CancellationToken cancellationToken = default)
    {
        if (updateDto == null)
            throw new ValidationException("Allocation data is required.", OperationType.Update);

        try
        {
            var entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity == null || !entity.IsActive || entity.MarkedForDeletion)
                return null;
            if (updateDto.Allocations == null || updateDto.Allocations.Count == 0)
                throw new ValidationException("Exactly one allocation is required.", OperationType.Update);

            var firstAlloc = updateDto.Allocations.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(updateDto.FromPropertyNo) && !string.IsNullOrWhiteSpace(firstAlloc?.FromPropertyNo))
            {
                updateDto.FromPropertyNo = firstAlloc.FromPropertyNo;
            }
            if (string.IsNullOrWhiteSpace(updateDto.ToPropertyNo) && !string.IsNullOrWhiteSpace(firstAlloc?.ToPropertyNo))
            {
                updateDto.ToPropertyNo = firstAlloc.ToPropertyNo;
            }
         

            var requestedPairs = _allocationBuilder.BuildPairs(updateDto.Allocations);
            if (requestedPairs.Count != 1)
                throw new ValidationException("Exactly one zone, ward, and old ward allocation is required when updating a record.", OperationType.Update);

            var requestedPair = requestedPairs[0];

            await _validator.ValidateUpdateAsync(id, entity, updateDto, requestedPair, cancellationToken);

            var isEmployeeChanged = entity.UserId != updateDto.UserId;
            var isZoneWardChanged = entity.ZoneId != requestedPair.ZoneId ||
                entity.WardId != requestedPair.WardId ||
                entity.OldWardId != requestedPair.OldWardId;
            var isDepartmentOrModuleChanged = entity.DepartmentId != updateDto.DepartmentId ||
                entity.ModuleId != updateDto.ModuleId;

            var isAllocationChanged = isEmployeeChanged || isZoneWardChanged || isDepartmentOrModuleChanged;

            var isFromEmpty = string.IsNullOrWhiteSpace(updateDto.FromPropertyNo) || updateDto.FromPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase);
            var isToEmpty = string.IsNullOrWhiteSpace(updateDto.ToPropertyNo) || updateDto.ToPropertyNo.Trim().Equals("null", StringComparison.OrdinalIgnoreCase);
            var now = DateTime.Now;

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                if (isAllocationChanged)
                {
                    _allocationBuilder.PrepareExistingForDeactivation(entity, updateDto.UpdatedBy, now);
                    await _repository.UpdateAsync(entity, cancellationToken);

                    var newEntity = new GlobalSurveyWardAllocationEntity
                    {
                        UserId = updateDto.UserId,
                        DepartmentId = updateDto.DepartmentId,
                        ModuleId = updateDto.ModuleId,
                        ZoneId = requestedPair.ZoneId,
                        WardId = requestedPair.WardId,
                        OldWardId = requestedPair.OldWardId,
                        FromPropertyNo = isFromEmpty ? null : updateDto.FromPropertyNo!.Trim(),
                        ToPropertyNo = isToEmpty ? null : updateDto.ToPropertyNo!.Trim(),
                        IsActive = updateDto.IsActive,
                        MarkedForDeletion = !updateDto.IsActive,
                        MarkedForDeletionDate = updateDto.IsActive ? null : now,
                        CreatedBy = updateDto.UpdatedBy,
                        CreatedDate = now
                    };

                    await _repository.AddAsync(newEntity, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    await _unitOfWork.CommitTransactionAsync(cancellationToken);

                    _logger.LogInformation("Successfully replaced allocation {Id} with new allocation {NewId}", id, newEntity.Id);
                    return _mapper.Map<PropertyWiseDto>(newEntity);
                }
                else
                {
                    if (requestedPair.OldWardId.HasValue)
                    {
                        entity.OldWardId = requestedPair.OldWardId;
                    }
                    entity.FromPropertyNo = isFromEmpty ? null : updateDto.FromPropertyNo!.Trim();
                    entity.ToPropertyNo = isToEmpty ? null : updateDto.ToPropertyNo!.Trim();
                    entity.IsActive = updateDto.IsActive;
                    entity.MarkedForDeletion = !updateDto.IsActive;
                    entity.MarkedForDeletionDate = updateDto.IsActive ? null : now;
                    entity.UpdatedBy = updateDto.UpdatedBy;
                    entity.UpdatedDate = now;

                 

                    await _repository.UpdateAsync(entity, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    await _unitOfWork.CommitTransactionAsync(cancellationToken);

                    _logger.LogInformation("Successfully updated property wise allocation {Id}", id);
                    return _mapper.Map<PropertyWiseDto>(entity);
                }
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
        catch (Exception ex)
        {
            switch (ex)
            {
                case ValidationException vex:
                    _logger.LogWarning(vex, "Allocation validation failed: {Reason} updating property wise allocation {Id}", vex.Message, id);
                    break;
                case DbUpdateConcurrencyException cex:
                    _logger.LogError(cex, "Concurrency error updating property wise allocation {Id}", id);
                    break;
                case DbUpdateException dex:
                    _logger.LogError(dex, "DB error updating property wise allocation {Id}", id);
                    break;
                default:
                    _logger.LogError(ex, "Error updating property wise allocation {Id}", id);
                    break;
            }

            throw;
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

    protected override IQueryable<GlobalSurveyWardAllocationEntity> ApplyIncludes(IQueryable<GlobalSurveyWardAllocationEntity> query)
    {
        return query
            .AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.Department)
            .Include(a => a.Module)
            .Include(a => a.Zone)
            .Include(a => a.Ward)
              .Include(a => a.OldWard)
            .ThenInclude(ow => ow!.OldZone);
    }

    protected override IQueryable<GlobalSurveyWardAllocationEntity> ApplyReadScope(IQueryable<GlobalSurveyWardAllocationEntity> query)
    {
        return query.Where(x => x.IsActive && !x.MarkedForDeletion);
    }

    private IQueryable<GlobalSurveyWardAllocationEntity> QueryWithIncludes()
    {
        return ApplyIncludes(ApplyReadScope(_repository.GetQueryable().AsNoTracking()));
    }

    public override async Task<PropertyWiseDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await ApplyIncludes(_repository.GetQueryable().AsNoTracking())
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (entity == null)
            {
                _logger.LogInformation("Property wise allocation with ID {Id} not found", id);
                return null;
            }
            return _mapper.Map<PropertyWiseDto>(entity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property wise allocation with ID {Id}", id);
            throw;
        }
    }

    public override async Task<PagedResult<PropertyWiseDto>> GetAllAsync(PropertyWiseQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = QueryWithIncludes()
                .ApplyFilters(queryParameters)
                .ApplySearch(queryParameters)
                .ApplySort(queryParameters);

            var totalCount = await query.CountAsync(cancellationToken);

            List<GlobalSurveyWardAllocationEntity> entities;
            int pageNumber;
            int pageSize;

            if (queryParameters.PageSize == -1)
            {
                entities = await query.ToListAsync(cancellationToken);
                pageNumber = 1;
                pageSize = totalCount == 0 ? 1 : totalCount;
            }
            else
            {
                entities = await query
                    .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
                    .Take(queryParameters.PageSize)
                    .ToListAsync(cancellationToken);
                pageNumber = queryParameters.PageNumber;
                pageSize = queryParameters.PageSize;
            }

            var items = _mapper.Map<List<PropertyWiseDto>>(entities);
            _logger.LogInformation("Successfully retrieved {Count} property wise allocations (Total: {TotalCount})", items.Count, totalCount);
            return new PagedResult<PropertyWiseDto>(items, totalCount, pageNumber, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property wise allocations");
            throw;
        }
    }
}
