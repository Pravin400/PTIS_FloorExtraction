using NtisPlatform.Application.Enums;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetPhotoTypeService :
    AssetMasterCrudService<AssetPhotoTypeEntity, AssetPhotoTypeDto, CreateAssetPhotoTypeDto, UpdateAssetPhotoTypeDto, AssetPhotoTypeQueryParameters>,
    IAssetPhotoTypeService
{
    private readonly IRepository<AssetCategoryEntity, int> _categoryRepository;
    private readonly IRepository<AssetTypeEntity, int> _typeRepository;
    private readonly IReferenceValidationService _referenceValidator;

    public AssetPhotoTypeService(
        IRepository<AssetPhotoTypeEntity, int> repository,
        IRepository<AssetCategoryEntity, int> categoryRepository,
        IRepository<AssetTypeEntity, int> typeRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _categoryRepository = categoryRepository;
        _typeRepository = typeRepository;
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetPhotoTypeEntity entity, CancellationToken ct = default)
    {
        if (entity.AssetCategoryId.HasValue && entity.AssetCategoryId.Value > 0)
        {
            var categoryExists = await _categoryRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(c => c.Id == entity.AssetCategoryId.Value && !c.MarkedForDeletion, ct);

            if (!categoryExists)
                return ValidationResult.Failure(nameof(entity.AssetCategoryId), "AssetPhotoType_AssetCategoryId_Invalid");
        }

        if (entity.AssetTypeId.HasValue && entity.AssetTypeId.Value > 0)
        {
            var typeExists = await _typeRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(t => t.Id == entity.AssetTypeId.Value && !t.MarkedForDeletion, ct);

            if (!typeExists)
                return ValidationResult.Failure(nameof(entity.AssetTypeId), "AssetPhotoType_AssetTypeId_Invalid");
        }

        return await ValidateUniqueCodeAndNameAsync(null, entity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetPhotoTypeEntity currentEntity, AssetPhotoTypeEntity updatedEntity, CancellationToken ct = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidator.ValidateReferencesAsync<AssetPhotoTypeEntity>(id, ReferenceValidationOperation.Deactivate, ct);
            if (!refResult.IsValid) return refResult;
        }

        if (updatedEntity.AssetCategoryId.HasValue && updatedEntity.AssetCategoryId.Value > 0)
        {
            var categoryExists = await _categoryRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(c => c.Id == updatedEntity.AssetCategoryId.Value && !c.MarkedForDeletion, ct);

            if (!categoryExists)
                return ValidationResult.Failure(nameof(updatedEntity.AssetCategoryId), "AssetPhotoType_AssetCategoryId_Invalid");
        }

        if (updatedEntity.AssetTypeId.HasValue && updatedEntity.AssetTypeId.Value > 0)
        {
            var typeExists = await _typeRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(t => t.Id == updatedEntity.AssetTypeId.Value && !t.MarkedForDeletion, ct);

            if (!typeExists)
                return ValidationResult.Failure(nameof(updatedEntity.AssetTypeId), "AssetPhotoType_AssetTypeId_Invalid");
        }

        return await ValidateUniqueCodeAndNameAsync(id, updatedEntity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetPhotoTypeEntity entity, CancellationToken ct = default)
        => await _referenceValidator.ValidateReferencesAsync<AssetPhotoTypeEntity>(id, ReferenceValidationOperation.Delete, ct);

    // PhotoTypeCode mirrors UQ_AMS_AssetPhotoType_Code (unique across all photo types); that constraint also
    // covers rows marked for deletion, so they still count. PhotoTypeName has no DB constraint and only has to
    // be unique within the same Asset Category + Asset Type (a "Front View" can exist for several asset types),
    // so deleted photo types do not block reusing a name. Both fields are checked so the caller sees every
    // clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, AssetPhotoTypeEntity entity, CancellationToken ct)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => excludeId == null || x.Id != excludeId);

        var errors = new List<ValidationError>();

        if (await others.AnyAsync(x => x.PhotoTypeCode == entity.PhotoTypeCode, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.PhotoTypeCode), "Photo Type Code", entity.PhotoTypeCode));

        if (await others.AnyAsync(x => !x.MarkedForDeletion
                                    && x.AssetCategoryId == entity.AssetCategoryId
                                    && x.AssetTypeId == entity.AssetTypeId
                                    && x.PhotoTypeName == entity.PhotoTypeName, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.PhotoTypeName), "Photo Type Name", entity.PhotoTypeName, "Asset Category and Asset Type"));

        return AssetMasterValidation.ToResult(errors);
    }
}
