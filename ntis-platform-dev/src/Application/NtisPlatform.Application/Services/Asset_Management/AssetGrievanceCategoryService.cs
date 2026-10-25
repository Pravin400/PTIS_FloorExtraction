using NtisPlatform.Application.Enums;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetGrievanceCategoryService :
    AssetMasterCrudService<AssetGrievanceCategoryEntity, AssetGrievanceCategoryDto, CreateAssetGrievanceCategoryDto, UpdateAssetGrievanceCategoryDto, AssetGrievanceCategoryQueryParameters>,
    IAssetGrievanceCategoryService
{
    private readonly IReferenceValidationService _referenceValidator;

    public AssetGrievanceCategoryService(
        IRepository<AssetGrievanceCategoryEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetGrievanceCategoryEntity entity, CancellationToken ct = default)
    {
        return await ValidateUniqueCodeAndNameAsync(null, entity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetGrievanceCategoryEntity currentEntity, AssetGrievanceCategoryEntity updatedEntity, CancellationToken ct = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidator.ValidateReferencesAsync<AssetGrievanceCategoryEntity>(id, ReferenceValidationOperation.Deactivate, ct);
            if (!refResult.IsValid) return refResult;
        }

        return await ValidateUniqueCodeAndNameAsync(id, updatedEntity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetGrievanceCategoryEntity entity, CancellationToken ct = default)
        => await _referenceValidator.ValidateReferencesAsync<AssetGrievanceCategoryEntity>(id, ReferenceValidationOperation.Delete, ct);

    // Mirrors UQ_GrievanceCategoryMaster_GrievanceTypeCode and UQ_GrievanceCategoryMaster_GrievanceTypeName.
    // Both constraints also cover rows marked for deletion, so they are not excluded here — otherwise
    // the insert fails at the database. Both fields are checked so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, AssetGrievanceCategoryEntity entity, CancellationToken ct)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => excludeId == null || x.Id != excludeId);

        var errors = new List<ValidationError>();

        if (await others.AnyAsync(x => x.GrievanceTypeCode == entity.GrievanceTypeCode, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.GrievanceTypeCode), "Grievance Type Code", entity.GrievanceTypeCode));

        if (await others.AnyAsync(x => x.GrievanceTypeName == entity.GrievanceTypeName, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.GrievanceTypeName), "Grievance Type Name", entity.GrievanceTypeName));

        return AssetMasterValidation.ToResult(errors);
    }
}
