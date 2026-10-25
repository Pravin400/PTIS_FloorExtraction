using AutoMapper;
using NtisPlatform.Application.DTOs.Master.AssetRoomType;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace NtisPlatform.Application.Services;

public class AssetRoomTypeService : AssetMasterCrudService<
    AssetRoomTypeMasterEntity,
    AssetRoomTypeMasterDto,
    CreateAssetRoomTypeDto,
    UpdateAssetRoomTypeDto,
    AssetRoomTypeQueryParameters>,
    IAssetRoomTypeMasterService
{
    private readonly IRepository<AssetTypeEntity, int> _assetTypeRepository;
    private readonly IRepository<AssetCategoryEntity, int> _assetCategoryRepository;
    private readonly IReferenceValidationService _referenceValidator;

    public AssetRoomTypeService(
        IRepository<AssetRoomTypeMasterEntity, int> repository,
        IRepository<AssetTypeEntity, int> assetTypeRepository,
        IRepository<AssetCategoryEntity, int> assetCategoryRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _assetTypeRepository = assetTypeRepository;
        _assetCategoryRepository = assetCategoryRepository;
        _referenceValidator = referenceValidator;
    }

    public override async Task<PagedResult<AssetRoomTypeMasterDto>> GetAllAsync(
        AssetRoomTypeQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var result = await base.GetAllAsync(queryParameters, cancellationToken);
        await EnrichNamesAsync(result.Items, cancellationToken);
        return result;
    }

    public override async Task<AssetRoomTypeMasterDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dto = await base.GetByIdAsync(id, cancellationToken);
        if (dto != null)
        {
            await EnrichNamesAsync(new[] { dto }, cancellationToken);
        }
        return dto;
    }

    /// <summary>
    /// Batch-resolves AssetCategoryName/AssetTypeName for the given rows via two filtered
    /// (not full-table) joins keyed by the distinct ids already present in <paramref name="items"/>.
    /// </summary>
    private async Task EnrichNamesAsync(IEnumerable<AssetRoomTypeMasterDto> items, CancellationToken cancellationToken)
    {
        var rows = items as ICollection<AssetRoomTypeMasterDto> ?? items.ToList();
        if (rows.Count == 0)
            return;

        var categoryIds = rows.Where(x => x.AssetCategoryId.HasValue)
            .Select(x => x.AssetCategoryId!.Value).Distinct().ToList();
        var typeIds = rows.Select(x => x.AssetTypeId).Distinct().ToList();

        var categoryNames = categoryIds.Count == 0
            ? new Dictionary<int, string>()
            : await _assetCategoryRepository.GetQueryable().AsNoTracking()
                .Where(x => categoryIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.CategoryName, cancellationToken);

        var typeNames = await _assetTypeRepository.GetQueryable().AsNoTracking()
            .Where(x => typeIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.TypeName, cancellationToken);

        foreach (var row in rows)
        {
            row.AssetCategoryName = row.AssetCategoryId.HasValue
                ? categoryNames.GetValueOrDefault(row.AssetCategoryId.Value)
                : null;
            row.AssetTypeName = typeNames.GetValueOrDefault(row.AssetTypeId);
        }
    }

    public override async Task<AssetRoomTypeMasterDto> CreateAsync(
        CreateAssetRoomTypeDto createDto,
        CancellationToken cancellationToken = default)
    {
        // DTO property is validated as [Required] by model binding before the service is reached,
        // so !.Value is safe here — see CreateAssetRoomTypeDto.
        await EnsureAssetTypeExistsAsync(createDto.AssetTypeId!.Value, OperationType.Create, cancellationToken);
        await EnsureAssetCategoryExistsAsync(createDto.AssetCategoryId, OperationType.Create, cancellationToken);
        return await base.CreateAsync(createDto, cancellationToken);
    }

    public override async Task<AssetRoomTypeMasterDto?> UpdateAsync(
        int id,
        UpdateAssetRoomTypeDto updateDto,
        CancellationToken cancellationToken = default)
    {
        await EnsureAssetTypeExistsAsync(updateDto.AssetTypeId!.Value, OperationType.Update, cancellationToken);
        await EnsureAssetCategoryExistsAsync(updateDto.AssetCategoryId, OperationType.Update, cancellationToken);
        return await base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetRoomTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueRoomTypeAsync(entity, excludeId: null, cancellationToken);
    }

    // Note: the base service only invokes this hook (not ValidateForCreateAsync) on Update/BulkUpdate,
    // so the same duplicate-combination check performed on create is re-run here — via the shared
    // ValidateUniqueRoomTypeAsync helper so the two paths can never drift — excluding the record
    // being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        AssetRoomTypeMasterEntity currentEntity,
        AssetRoomTypeMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueRoomTypeAsync(updatedEntity, id, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        // RoomWiseSubmissionDetails.RoomType stores the room type name as text, matched within the room type's
        // asset type, so changing either one for a room type that rooms use would leave them pointing at nothing.
        var changes = new List<ValidationError>();
        if (!string.Equals(currentEntity.RoomTypeName, updatedEntity.RoomTypeName, StringComparison.Ordinal))
            changes.Add(AssetMasterValidation.CannotChangeWhileInUse(nameof(updatedEntity.RoomTypeName), "Room Type Name", "Asset Room Type"));
        if (currentEntity.AssetTypeId != updatedEntity.AssetTypeId)
            changes.Add(AssetMasterValidation.CannotChangeWhileInUse(nameof(updatedEntity.AssetTypeId), "Asset Type", "Asset Room Type"));
        if (changes.Count > 0 && await IsInUseAsync(id, cancellationToken))
            return AssetMasterValidation.ToResult(changes);

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetRoomTypeMasterEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    // In use = the references that would block a delete. They match on the saved name and asset type, so this sees
    // the old values.
    private async Task<bool> IsInUseAsync(int id, CancellationToken cancellationToken)
        => !(await _referenceValidator.ValidateReferencesAsync<AssetRoomTypeMasterEntity>(id, ReferenceValidationOperation.Delete, cancellationToken)).IsValid;

    /// <summary>
    /// Mirrors the DB unique constraints, scoped per asset type:
    ///   UQ_AssetRoomTypeMaster_Asset_RoomTypeName  (AssetTypeId, RoomTypeName)
    ///   UQ_AssetRoomTypeMaster_Asset_RoomTypeCode  (AssetTypeId, RoomTypeCode)
    /// Shared by create and update validation so the two never drift apart. Both constraints also cover
    /// rows marked for deletion, so they are not excluded, and both fields are checked so the caller sees
    /// every clash at once.
    /// </summary>
    private async Task<ValidationResult> ValidateUniqueRoomTypeAsync(
        AssetRoomTypeMasterEntity entity,
        int? excludeId,
        CancellationToken cancellationToken)
    {
        var query = _repository.GetQueryable().AsNoTracking();
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);

        var errors = new List<ValidationError>();

        var duplicateName = await query
            .AnyAsync(x => x.AssetTypeId == entity.AssetTypeId
                        && x.RoomTypeName == entity.RoomTypeName, cancellationToken);
        if (duplicateName)
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.RoomTypeName), "Room Type Name", entity.RoomTypeName, "Asset Type"));

        if (!string.IsNullOrWhiteSpace(entity.RoomTypeCode))
        {
            var duplicateCode = await query
                .AnyAsync(x => x.AssetTypeId == entity.AssetTypeId
                            && x.RoomTypeCode == entity.RoomTypeCode, cancellationToken);
            if (duplicateCode)
                errors.Add(AssetMasterValidation.Duplicate(nameof(entity.RoomTypeCode), "Room Type Code", entity.RoomTypeCode, "Asset Type"));
        }

        return AssetMasterValidation.ToResult(errors);
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        AssetRoomTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<AssetRoomTypeMasterEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    private async Task EnsureAssetTypeExistsAsync(
        int assetTypeId,
        OperationType operationType,
        CancellationToken cancellationToken)
    {
        var assetType = await _assetTypeRepository
            .GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == assetTypeId &&
                x.IsActive &&
                !x.MarkedForDeletion,
                cancellationToken);

        if (assetType == null)
        {
            throw new ValidationException(
                nameof(CreateAssetRoomTypeDto.AssetTypeId),
                $"Asset type with ID {assetTypeId} not found.",
                operationType);
        }
    }

    private async Task EnsureAssetCategoryExistsAsync(
        int? assetCategoryId,
        OperationType operationType,
        CancellationToken cancellationToken)
    {
        if (!assetCategoryId.HasValue)
            return;

        var assetCategory = await _assetCategoryRepository
            .GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == assetCategoryId.Value &&
                x.IsActive &&
                !x.MarkedForDeletion,
                cancellationToken);

        if (assetCategory == null)
        {
            throw new ValidationException(
                nameof(CreateAssetRoomTypeDto.AssetCategoryId),
                $"Asset category with ID {assetCategoryId.Value} not found.",
                operationType);
        }
    }
}
