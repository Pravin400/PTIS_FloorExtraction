using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class AssetCategoryService
    : AssetMasterCrudService<
        AssetCategoryEntity,
        AssetCategoryDto,
        CreateAssetCategoryDto,
        UpdateAssetCategoryDto,
        AssetCategoryQueryParameters>,
      IAssetCategoryService
{
    private readonly IReferenceValidationService _referenceValidator;

    public AssetCategoryService(
        IRepository<AssetCategoryEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetCategoryEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueCodeAndNameAsync(null, entity, cancellationToken);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        AssetCategoryEntity currentEntity,
        AssetCategoryEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueCodeAndNameAsync(id, updatedEntity, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        // Prevent deactivating a category that has active asset types
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetCategoryEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        AssetCategoryEntity entity,
        CancellationToken cancellationToken = default)
    {
        // Prevent deleting a category that has asset types
        return await _referenceValidator.ValidateReferencesAsync<AssetCategoryEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    // Mirrors UQ_AssetCategoryMaster_CategoryCode / _CategoryName. Both constraints also cover rows marked
    // for deletion, so they are not excluded here — otherwise the insert fails at the database. Both fields
    // are checked so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, AssetCategoryEntity entity, CancellationToken cancellationToken)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => excludeId == null || x.Id != excludeId);

        var errors = new List<ValidationError>();

        if (await others.AnyAsync(x => x.CategoryCode == entity.CategoryCode, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.CategoryCode), "Category Code", entity.CategoryCode));

        if (await others.AnyAsync(x => x.CategoryName == entity.CategoryName, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.CategoryName), "Category Name", entity.CategoryName));

        return AssetMasterValidation.ToResult(errors);
    }
}
