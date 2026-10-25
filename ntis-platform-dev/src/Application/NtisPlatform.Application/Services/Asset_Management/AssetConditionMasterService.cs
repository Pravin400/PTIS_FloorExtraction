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

public class AssetConditionMasterService
    : AssetMasterCrudService<
        AssetConditionMasterEntity,
        AssetConditionMasterDto,
        CreateAssetConditionMasterDto,
        UpdateAssetConditionMasterDto,
        AssetConditionMasterQueryParameters>,
      IAssetConditionMasterService
{
    // ConditionCategory discriminator values -- decide which master table CategoryId points at.
    private const string AssetConditionCategory = "Asset";
    private const string InventoryConditionCategory = "Inventory";

    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<AssetCategoryEntity, int> _assetCategoryRepository;
    private readonly IRepository<InventoryItemCategoryEntity, int> _inventoryItemCategoryRepository;

    public AssetConditionMasterService(
        IRepository<AssetConditionMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        IRepository<AssetCategoryEntity, int> assetCategoryRepository,
        IRepository<InventoryItemCategoryEntity, int> inventoryItemCategoryRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _assetCategoryRepository = assetCategoryRepository;
        _inventoryItemCategoryRepository = inventoryItemCategoryRepository;
    }

    /// <summary>
    /// Overrides the base list query to enrich each row with CategoryName via SQL joins (avoid
    /// in-memory lookups). CategoryId is polymorphic, so each left join also matches on the
    /// ConditionCategory discriminator: 'Asset' rows resolve against AssetCategoryMaster.CategoryName,
    /// 'Inventory' rows against InventoryItemCategoryMaster.TypeName. Both tables share Id values
    /// (e.g. Id 1 is "Buildings" in one and "Furniture" in the other), so joining on Id alone would
    /// return the wrong name.
    /// The joins happen first so CategoryName is a real column of the queried row: the generic Apply*
    /// helpers resolve query-parameter names against that row, so filtering, searching and sorting on
    /// CategoryName work like any other column (and the count honours them).
    /// Preserves the base order: Filter -> Search -> Sort -> Count -> Skip/Take -> Project.
    /// </summary>
    public override async Task<PagedResult<AssetConditionMasterDto>> GetAllAsync(
        AssetConditionMasterQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query =
            from c in _repository.GetQueryable()
            join ac in _assetCategoryRepository.GetQueryable().AsNoTracking()
                on new { Id = c.CategoryId, Category = c.ConditionCategory }
                equals new { Id = ac.Id, Category = AssetConditionCategory } into acJoin
            from ac in acJoin.DefaultIfEmpty()
            join ic in _inventoryItemCategoryRepository.GetQueryable().AsNoTracking()
                on new { Id = c.CategoryId, Category = c.ConditionCategory }
                equals new { Id = ic.Id, Category = InventoryConditionCategory } into icJoin
            from ic in icJoin.DefaultIfEmpty()
            select new AssetConditionMasterListRow
            {
                Id = c.Id,
                IsActive = c.IsActive,
                MarkedForDeletion = c.MarkedForDeletion,
                CreatedDate = c.CreatedDate,
                UpdatedDate = c.UpdatedDate,
                ConditionCategory = c.ConditionCategory,
                CategoryId = c.CategoryId,
                CategoryName = ac != null ? ac.CategoryName : ic != null ? ic.TypeName : null,
                ConditionName = c.ConditionName,
                Description = c.Description,
                ConditionFactor = c.ConditionFactor,
                DisplayOrder = c.DisplayOrder
            };

        query = query.ApplyFilters(queryParameters);
        query = query.ApplySearch(queryParameters);
        query = query.ApplySort(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize)
            .Select(r => new AssetConditionMasterDto
            {
                Id = r.Id,
                IsActive = r.IsActive,
                CreatedDate = r.CreatedDate,
                UpdatedDate = r.UpdatedDate,
                ConditionCategory = r.ConditionCategory,
                CategoryId = r.CategoryId,
                CategoryName = r.CategoryName,
                ConditionName = r.ConditionName,
                Description = r.Description,
                ConditionFactor = r.ConditionFactor,
                DisplayOrder = r.DisplayOrder
            })
            .ToListAsync(cancellationToken);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<AssetConditionMasterDto>(items, totalCount, pageNumber, pageSize);
    }

    /// <summary>
    /// Joined list row: every <see cref="AssetConditionMasterQueryParameters"/> filter/search/sort name
    /// must exist here. Kept separate from the DTO so MarkedForDeletion stays filterable without being
    /// added to the API response.
    /// </summary>
    private sealed class AssetConditionMasterListRow
    {
        public int Id { get; set; }
        public bool IsActive { get; set; }
        public bool MarkedForDeletion { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string ConditionCategory { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string ConditionName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? ConditionFactor { get; set; }
        public int? DisplayOrder { get; set; }
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetConditionMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueConditionNameAsync(null, entity, cancellationToken);
    }

    // Note: the base service only invokes this hook (not ValidateForCreateAsync) on Update/BulkUpdate,
    // so the duplicate-combination check is duplicated here — matching AssetAgeFactorCVService's
    // "validate on any update" convention — with the duplicate check excluding the record being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        AssetConditionMasterEntity currentEntity,
        AssetConditionMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueConditionNameAsync(id, updatedEntity, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetConditionMasterEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        AssetConditionMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<AssetConditionMasterEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    // Mirrors UQ_AssetConditionMaster_CategoryCondition (ConditionCategory, CategoryId, ConditionName): a
    // condition name only has to be unique within the category it belongs to. The constraint also covers rows
    // marked for deletion, so they are not excluded here.
    private async Task<ValidationResult> ValidateUniqueConditionNameAsync(
        int? excludeId, AssetConditionMasterEntity entity, CancellationToken cancellationToken)
    {
        var duplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x =>
                (excludeId == null || x.Id != excludeId) &&
                x.ConditionCategory == entity.ConditionCategory &&
                x.CategoryId == entity.CategoryId &&
                x.ConditionName == entity.ConditionName,
                cancellationToken);

        if (!duplicate)
            return ValidationResult.Success();

        var scope = entity.ConditionCategory == InventoryConditionCategory ? "Inventory Category" : "Asset Category";
        return AssetMasterValidation.ToResult(
            new[] { AssetMasterValidation.Duplicate(nameof(entity.ConditionName), "Condition Name", entity.ConditionName, scope) });
    }
}
