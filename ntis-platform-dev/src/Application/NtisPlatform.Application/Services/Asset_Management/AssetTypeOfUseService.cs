using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetTypeOfUseService :
    AssetMasterCrudService<AssetTypeOfUseMasterEntity, AssetTypeOfUseDto, CreateAssetTypeOfUseDto, UpdateAssetTypeOfUseDto, AssetTypeOfUseQueryParameters>,
    IAssetTypeOfUseService
{
    private readonly IReferenceValidationService _referenceValidator;

    public AssetTypeOfUseService(
        IRepository<AssetTypeOfUseMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetTypeOfUseMasterEntity entity, CancellationToken ct = default)
    {
        return await ValidateUniqueCodeAndNameAsync(null, entity, ct);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetTypeOfUseMasterEntity currentEntity, AssetTypeOfUseMasterEntity updatedEntity, CancellationToken ct = default)
    {
        var duplicateResult = await ValidateUniqueCodeAndNameAsync(id, updatedEntity, ct);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<AssetTypeOfUseMasterEntity>(id, ReferenceValidationOperation.Deactivate, ct);

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetTypeOfUseMasterEntity entity, CancellationToken ct = default)
        => await _referenceValidator.ValidateReferencesAsync<AssetTypeOfUseMasterEntity>(id, ReferenceValidationOperation.Delete, ct);

    // TypeOfUseCode is unique across all types of use; Description (the type of use's name) only has to be
    // unique within the same Asset Category + Asset Type ("Residential" can exist for several asset types).
    // There is no DB constraint on AMS.TypeOfUseMaster, so rows marked for deletion do not block reuse. Both
    // fields are checked so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, AssetTypeOfUseMasterEntity entity, CancellationToken ct)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => (excludeId == null || x.Id != excludeId) && !x.MarkedForDeletion);

        var errors = new List<ValidationError>();

        if (!string.IsNullOrEmpty(entity.TypeOfUseCode)
            && await others.AnyAsync(x => x.TypeOfUseCode == entity.TypeOfUseCode, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.TypeOfUseCode), "Type Of Use Code", entity.TypeOfUseCode));

        if (!string.IsNullOrWhiteSpace(entity.Description)
            && await others.AnyAsync(x => x.AssetCategoryId == entity.AssetCategoryId
                                       && x.AssetTypeId == entity.AssetTypeId
                                       && x.Description == entity.Description, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.Description), "Type Of Use Name", entity.Description, "Asset Category and Asset Type"));

        return AssetMasterValidation.ToResult(errors);
    }
}
