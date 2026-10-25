using System.Threading;
using System.Threading.Tasks;
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

public class AssetFieldDefinitionService
    : AssetMasterCrudService<
        AssetFieldDefinitionEntity,
        AssetFieldDefinitionDto,
        CreateAssetFieldDefinitionDto,
        UpdateAssetFieldDefinitionDto,
        AssetFieldDefinitionQueryParameters>,
      IAssetFieldDefinitionService
{
    private readonly IReferenceValidationService _referenceValidator;

    public AssetFieldDefinitionService(
        IRepository<AssetFieldDefinitionEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    public async Task<List<string>> GetDistinctFieldGroupsAsync(CancellationToken cancellationToken = default)
    {
        // Trim before Distinct so blank groups drop out and " Survey" / "Survey" collapse into one option.
        return await _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => x.FieldGroup != null)
            .Select(x => x.FieldGroup!.Trim())
            .Where(group => group != string.Empty)
            .Distinct()
            .OrderBy(group => group)
            .ToListAsync(cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetFieldDefinitionEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueCodeAndNameAsync(null, entity, cancellationToken);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        AssetFieldDefinitionEntity currentEntity,
        AssetFieldDefinitionEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueCodeAndNameAsync(id, updatedEntity, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetFieldDefinitionEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        AssetFieldDefinitionEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<AssetFieldDefinitionEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    // FieldCode mirrors UQ_FieldDef_CategoryTypeField (AssetCategoryId, AssetTypeId, FieldCode); that
    // constraint also covers rows marked for deletion, so they still count. FieldName has no DB constraint
    // but is held to the same Asset Category + Asset Type scope, ignoring deleted definitions. Both fields
    // are checked so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, AssetFieldDefinitionEntity entity, CancellationToken cancellationToken)
    {
        var sameCategoryAndType = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => (excludeId == null || x.Id != excludeId)
                     && x.AssetCategoryId == entity.AssetCategoryId
                     && x.AssetTypeId == entity.AssetTypeId);

        var errors = new List<ValidationError>();

        if (await sameCategoryAndType.AnyAsync(x => x.FieldCode == entity.FieldCode, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.FieldCode), "Field Code", entity.FieldCode, "Asset Category and Asset Type"));

        if (await sameCategoryAndType.AnyAsync(x => !x.MarkedForDeletion && x.FieldName == entity.FieldName, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.FieldName), "Field Name", entity.FieldName, "Asset Category and Asset Type"));

        return AssetMasterValidation.ToResult(errors);
    }
}
