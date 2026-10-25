using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Service for managing inventory item category operations.
/// Provides CRUD operations for inventory item categories.
/// </summary>
public class InventoryItemCategoryService : AssetMasterCrudService<InventoryItemCategoryEntity, InventoryItemCategoryDto, CreateInventoryItemCategoryDto, UpdateInventoryItemCategoryDto, InventoryItemCategoryQueryParameters>,
    IInventoryItemCategoryService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<AssetCategoryEntity, int> _assetCategoryRepository;

    /// <summary>
    /// Initializes a new instance of the <see cref="InventoryItemCategoryService"/> class.
    /// </summary>
    /// <param name="repository">The repository for inventory item category entities.</param>
    /// <param name="unitOfWork">The unit of work for transaction management.</param>
    /// <param name="mapper">The AutoMapper instance for object mapping.</param>
    /// <param name="referenceValidator">The reference validation service for checking entity references.</param>
    /// <param name="assetCategoryRepository">The repository for the AssetCategoryId FK, used to enrich list results with AssetCategoryName.</param>
    public InventoryItemCategoryService(
        IRepository<InventoryItemCategoryEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        IRepository<AssetCategoryEntity, int> assetCategoryRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _assetCategoryRepository = assetCategoryRepository;
    }

    /// <summary>
    /// Overrides the base list query to enrich each row with AssetCategoryName via a SQL join
    /// against AssetCategoryMaster (per CLAUDE.md Section 7 -- avoid in-memory lookups; join in SQL).
    /// InventoryItemCategoryEntity deliberately holds only the AssetCategoryId FK (no navigation
    /// property), so this can't be done through the base class's ProjectTo/ApplyIncludes path.
    /// The join happens first so AssetCategoryName is a real column of the queried row: the generic
    /// Apply* helpers resolve query-parameter names against that row, so filtering, searching and
    /// sorting on AssetCategoryName work like any other column (and the count honours them).
    /// Preserves the base order: Filter -> Search -> Sort -> Count -> Skip/Take -> Project.
    /// </summary>
    public override async Task<PagedResult<InventoryItemCategoryDto>> GetAllAsync(
        InventoryItemCategoryQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query =
            from c in _repository.GetQueryable()
            join ac in _assetCategoryRepository.GetQueryable().AsNoTracking()
                on c.AssetCategoryId equals ac.Id into acJoin
            from ac in acJoin.DefaultIfEmpty()
            select new InventoryItemCategoryListRow
            {
                Id = c.Id,
                IsActive = c.IsActive,
                MarkedForDeletion = c.MarkedForDeletion,
                CreatedDate = c.CreatedDate,
                UpdatedDate = c.UpdatedDate,
                AssetCategoryId = c.AssetCategoryId,
                AssetCategoryName = ac != null ? ac.CategoryName : null,
                TypeCode = c.TypeCode,
                TypeName = c.TypeName,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder,
                DepreciationRate = c.DepreciationRate
            };

        query = query.ApplyFilters(queryParameters);
        query = query.ApplySearch(queryParameters);
        query = query.ApplySort(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize)
            .Select(r => new InventoryItemCategoryDto
            {
                Id = r.Id,
                IsActive = r.IsActive,
                CreatedDate = r.CreatedDate,
                UpdatedDate = r.UpdatedDate,
                AssetCategoryId = r.AssetCategoryId,
                AssetCategoryName = r.AssetCategoryName,
                TypeCode = r.TypeCode,
                TypeName = r.TypeName,
                Description = r.Description,
                DisplayOrder = r.DisplayOrder,
                DepreciationRate = r.DepreciationRate
            })
            .ToListAsync(cancellationToken);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<InventoryItemCategoryDto>(items, totalCount, pageNumber, pageSize);
    }

    /// <summary>
    /// Joined list row: every <see cref="InventoryItemCategoryQueryParameters"/> filter/search/sort
    /// name must exist here. Kept separate from the DTO so MarkedForDeletion stays filterable without
    /// being added to the API response.
    /// </summary>
    private sealed class InventoryItemCategoryListRow
    {
        public int Id { get; set; }
        public bool IsActive { get; set; }
        public bool MarkedForDeletion { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public int AssetCategoryId { get; set; }
        public string? AssetCategoryName { get; set; }
        public string TypeCode { get; set; } = string.Empty;
        public string TypeName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? DisplayOrder { get; set; }
        public decimal DepreciationRate { get; set; }
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        InventoryItemCategoryEntity entity, CancellationToken cancellationToken = default)
    {
        return await CheckDuplicateAsync(entity, excludeId: null, cancellationToken);
    }

    // Note: mirrors ValidateForCreateAsync's duplicate check because the base service only invokes
    // this hook (not ValidateForCreateAsync) on Update/BulkUpdate — the duplicate check excludes the
    // row being updated so renaming a category to its own current name/code is not flagged.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        InventoryItemCategoryEntity currentEntity,
        InventoryItemCategoryEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await CheckDuplicateAsync(updatedEntity, excludeId: id, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<InventoryItemCategoryEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
    int id,
          InventoryItemCategoryEntity entity,
          CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<InventoryItemCategoryEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    /// <summary>
    /// Checks TypeName and TypeCode (both required, per the DB's
    /// UQ_InventoryItemCategoryMaster_TypeName / _TypeCode constraints) for duplicates,
    /// excluding <paramref name="excludeId"/> on update.
    /// </summary>
    /// <remarks>
    /// Deliberately does NOT exclude <c>MarkedForDeletion</c> rows. Those unique constraints are
    /// plain (unfiltered) in the live DB -- a row that's only marked-for-deletion (pending the
    /// nightly <c>HardDeleteCleanupService</c> purge) still physically occupies its TypeCode/TypeName.
    /// Excluding it here would let this check pass while the actual INSERT still fails with a raw
    /// DB unique-constraint violation.
    /// </remarks>
    private async Task<ValidationResult> CheckDuplicateAsync(
        InventoryItemCategoryEntity entity, int? excludeId, CancellationToken cancellationToken)
    {
        var errors = new List<ValidationError>();

        var duplicateCode = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != (excludeId ?? 0)
                        && x.TypeCode == entity.TypeCode, cancellationToken);

        if (duplicateCode)
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.TypeCode), "Inventory Category Code", entity.TypeCode));

        var duplicateName = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != (excludeId ?? 0)
                        && x.TypeName == entity.TypeName, cancellationToken);

        if (duplicateName)
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.TypeName), "Inventory Category Name", entity.TypeName));

        // Both fields are checked so the caller sees every clash at once.
        return AssetMasterValidation.ToResult(errors);
    }
}
