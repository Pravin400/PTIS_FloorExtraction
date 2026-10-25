using System.Threading;
using System.Threading.Tasks;
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

public class AssetTypeService
    : AssetMasterCrudService<
        AssetTypeEntity,
        AssetTypeDto,
        CreateAssetTypeDto,
        UpdateAssetTypeDto,
        AssetTypeQueryParameters>,
      IAssetTypeService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<AssetCategoryEntity, int> _assetCategoryRepository;

    public AssetTypeService(
        IRepository<AssetTypeEntity, int> repository,
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
    /// against AssetCategoryMaster (avoid in-memory lookups; join in SQL).
    /// AssetTypeEntity deliberately holds only the AssetCategoryId FK (no navigation property),
    /// so this can't be done through the base class's ProjectTo/ApplyIncludes path.
    /// The join happens first so AssetCategoryName is a real column of the queried row: the generic
    /// Apply* helpers resolve query-parameter names against that row, so filtering, searching and
    /// sorting on AssetCategoryName work like any other column (and the count honours them).
    /// Preserves the base order: Filter -> Search -> Sort -> Count -> Skip/Take -> Project.
    /// </summary>
    public override async Task<PagedResult<AssetTypeDto>> GetAllAsync(
        AssetTypeQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query =
            from t in _repository.GetQueryable()
            join ac in _assetCategoryRepository.GetQueryable().AsNoTracking()
                on t.AssetCategoryId equals ac.Id into acJoin
            from ac in acJoin.DefaultIfEmpty()
            select new AssetTypeListRow
            {
                Id = t.Id,
                IsActive = t.IsActive,
                MarkedForDeletion = t.MarkedForDeletion,
                CreatedDate = t.CreatedDate,
                UpdatedDate = t.UpdatedDate,
                CreatedBy = t.CreatedBy,
                UpdatedBy = t.UpdatedBy,
                AssetCategoryId = t.AssetCategoryId,
                AssetCategoryName = ac != null ? ac.CategoryName : null,
                TypeCode = t.TypeCode,
                TypeName = t.TypeName,
                TypeNameLocal = t.TypeNameLocal,
                Description = t.Description,
                IsSubUnit = t.IsSubUnit,
                AllowUnitRegistration = t.AllowUnitRegistration,
                AllowRoomRegistration = t.AllowRoomRegistration,
                AssetWardNo = t.AssetWardNo
            };

        query = query.ApplyFilters(queryParameters);
        query = query.ApplySearch(queryParameters);
        query = query.ApplySort(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize)
            .Select(r => new AssetTypeDto
            {
                Id = r.Id,
                IsActive = r.IsActive,
                CreatedDate = r.CreatedDate,
                UpdatedDate = r.UpdatedDate,
                CreatedBy = r.CreatedBy,
                UpdatedBy = r.UpdatedBy,
                AssetCategoryId = r.AssetCategoryId,
                AssetCategoryName = r.AssetCategoryName,
                TypeCode = r.TypeCode,
                TypeName = r.TypeName,
                TypeNameLocal = r.TypeNameLocal,
                Description = r.Description,
                IsSubUnit = r.IsSubUnit,
                AllowUnitRegistration = r.AllowUnitRegistration,
                AllowRoomRegistration = r.AllowRoomRegistration,
                AssetWardNo = r.AssetWardNo
            })
            .ToListAsync(cancellationToken);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<AssetTypeDto>(items, totalCount, pageNumber, pageSize);
    }

    /// <summary>
    /// Joined list row: every <see cref="AssetTypeQueryParameters"/> filter/search/sort name must
    /// exist here. Kept separate from the DTO so MarkedForDeletion stays filterable without being
    /// added to the API response.
    /// </summary>
    private sealed class AssetTypeListRow
    {
        public int Id { get; set; }
        public bool IsActive { get; set; }
        public bool MarkedForDeletion { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public int? CreatedBy { get; set; }
        public int? UpdatedBy { get; set; }
        public int AssetCategoryId { get; set; }
        public string? AssetCategoryName { get; set; }
        public string TypeCode { get; set; } = string.Empty;
        public string TypeName { get; set; } = string.Empty;
        public string? TypeNameLocal { get; set; }
        public string? Description { get; set; }
        public bool IsSubUnit { get; set; }
        public bool AllowUnitRegistration { get; set; }
        public bool AllowRoomRegistration { get; set; }
        public string? AssetWardNo { get; set; }
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetTypeEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueCodeAndNameAsync(null, entity, cancellationToken);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        AssetTypeEntity currentEntity,
        AssetTypeEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueCodeAndNameAsync(id, updatedEntity, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetTypeEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        AssetTypeEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<AssetTypeEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    // Mirrors UQ_AssetTypeMaster_TypeCode / _TypeName (unique across all categories). Both constraints
    // also cover rows marked for deletion, so they are not excluded here — otherwise the insert fails at
    // the database with a generic conflict. Both fields are checked so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, AssetTypeEntity entity, CancellationToken cancellationToken)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => excludeId == null || x.Id != excludeId);

        var errors = new List<ValidationError>();

        if (await others.AnyAsync(x => x.TypeCode == entity.TypeCode, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.TypeCode), "Asset Type Code", entity.TypeCode));

        if (await others.AnyAsync(x => x.TypeName == entity.TypeName, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.TypeName), "Asset Type Name", entity.TypeName));

        return AssetMasterValidation.ToResult(errors);
    }
}
