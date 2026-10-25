using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetDocumentDefinitionService :
    AssetMasterCrudService<AssetDocumentDefinitionEntity, AssetDocumentDefinitionDto, CreateAssetDocumentDefinitionDto, UpdateAssetDocumentDefinitionDto, AssetDocumentDefinitionQueryParameters>,
    IAssetDocumentDefinitionService
{
    private readonly IRepository<AssetCategoryEntity, int> _categoryRepository;
    private readonly IRepository<AssetTypeEntity, int> _typeRepository;
    private readonly IReferenceValidationService _referenceValidator;

    public AssetDocumentDefinitionService(
        IRepository<AssetDocumentDefinitionEntity, int> repository,
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
    public override async Task<AssetDocumentDefinitionDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable()
            .AsNoTracking()
            .Include(x => x.AssetCategory)
            .Include(x => x.AssetType)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity == null ? null : _mapper.Map<AssetDocumentDefinitionDto>(entity);
    }

    // The base Create/Update map the response from the saved entity, which has no AssetCategory/AssetType
    // loaded, so AssetCategoryName/AssetTypeName came back null. Re-read the record the same way GET does.
    public override async Task<AssetDocumentDefinitionDto> CreateAsync(
        CreateAssetDocumentDefinitionDto createDto, CancellationToken cancellationToken = default)
    {
        var created = await base.CreateAsync(createDto, cancellationToken);
        return await GetByIdAsync(created.Id, cancellationToken) ?? created;
    }

    public override async Task<AssetDocumentDefinitionDto?> UpdateAsync(
        int id, UpdateAssetDocumentDefinitionDto updateDto, CancellationToken cancellationToken = default)
    {
        var updated = await base.UpdateAsync(id, updateDto, cancellationToken);
        if (updated == null)
            return null;

        return await GetByIdAsync(id, cancellationToken) ?? updated;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetDocumentDefinitionEntity entity, CancellationToken ct = default)
    {
        var categoryTypeResult = await ValidateCategoryAndTypeAsync(entity, ct);
        if (!categoryTypeResult.IsValid) return categoryTypeResult;

        return await ValidateUniqueCodeAndNameAsync(null, entity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetDocumentDefinitionEntity currentEntity, AssetDocumentDefinitionEntity updatedEntity, CancellationToken ct = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidator.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(id, ReferenceValidationOperation.Deactivate, ct);
            if (!refResult.IsValid) return refResult;
        }

        var categoryTypeResult = await ValidateCategoryAndTypeAsync(updatedEntity, ct);
        if (!categoryTypeResult.IsValid) return categoryTypeResult;

        return await ValidateUniqueCodeAndNameAsync(id, updatedEntity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetDocumentDefinitionEntity entity, CancellationToken ct = default)
        => await _referenceValidator.ValidateReferencesAsync<AssetDocumentDefinitionEntity>(id, ReferenceValidationOperation.Delete, ct);

    // DocumentCode mirrors UQ_AssetDocumentDefinition_Code (unique across all definitions); that constraint
    // also covers rows marked for deletion, so they still count. DocumentName has no DB constraint and only
    // has to be unique within the same Asset Category + Asset Type (a "Sale Deed" can exist for both Land
    // and Building), so deleted definitions do not block reusing a name. Both fields are checked so the
    // caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, AssetDocumentDefinitionEntity entity, CancellationToken ct)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => excludeId == null || x.Id != excludeId);

        var errors = new List<ValidationError>();

        if (await others.AnyAsync(x => x.DocumentCode == entity.DocumentCode, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.DocumentCode), "Document Code", entity.DocumentCode));

        if (await others.AnyAsync(x => !x.MarkedForDeletion
                                    && x.AssetCategoryId == entity.AssetCategoryId
                                    && x.AssetTypeId == entity.AssetTypeId
                                    && x.DocumentName == entity.DocumentName, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.DocumentName), "Document Name", entity.DocumentName, "Asset Category and Asset Type"));

        return AssetMasterValidation.ToResult(errors);
    }

    // Both are optional, but when given they must exist, and a type must belong to the chosen category
    // (an AssetType always has exactly one AssetCategoryId).
    private async Task<ValidationResult> ValidateCategoryAndTypeAsync(AssetDocumentDefinitionEntity entity, CancellationToken ct)
    {
        if (entity.AssetCategoryId.HasValue && entity.AssetCategoryId.Value > 0)
        {
            var categoryExists = await _categoryRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(c => c.Id == entity.AssetCategoryId.Value && !c.MarkedForDeletion, ct);

            if (!categoryExists)
                return ValidationResult.Failure(nameof(entity.AssetCategoryId), "AssetDocumentDefinition_AssetCategoryId_Invalid");
        }

        if (entity.AssetTypeId.HasValue && entity.AssetTypeId.Value > 0)
        {
            var typeCategoryId = await _typeRepository.GetQueryable()
                .AsNoTracking()
                .Where(t => t.Id == entity.AssetTypeId.Value && !t.MarkedForDeletion)
                .Select(t => (int?)t.AssetCategoryId)
                .FirstOrDefaultAsync(ct);

            if (typeCategoryId == null)
                return ValidationResult.Failure(nameof(entity.AssetTypeId), "AssetDocumentDefinition_AssetTypeId_Invalid");

            if (entity.AssetCategoryId.HasValue && entity.AssetCategoryId.Value > 0 && typeCategoryId != entity.AssetCategoryId.Value)
                return ValidationResult.Failure(nameof(entity.AssetTypeId), "AssetDocumentDefinition_AssetTypeId_Invalid");
        }

        return ValidationResult.Success();
    }
}
