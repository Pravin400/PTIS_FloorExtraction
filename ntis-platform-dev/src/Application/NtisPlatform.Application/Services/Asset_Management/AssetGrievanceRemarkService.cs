using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetGrievanceRemarkService :
    AssetMasterCrudService<AssetGrievanceRemarkMasterEntity, AssetGrievanceRemarkDto, CreateAssetGrievanceRemarkDto, UpdateAssetGrievanceRemarkDto, AssetGrievanceRemarkQueryParameters>,
    IAssetGrievanceRemarkService
{
    private readonly IRepository<AssetGrievanceCategoryEntity, int> _categoryRepository;
    private readonly IReferenceValidationService _referenceValidator;

    public AssetGrievanceRemarkService(
        IRepository<AssetGrievanceRemarkMasterEntity, int> repository,
        IRepository<AssetGrievanceCategoryEntity, int> categoryRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _categoryRepository = categoryRepository;
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetGrievanceRemarkMasterEntity entity, CancellationToken ct = default)
    {
        var categoryExists = await _categoryRepository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(c => c.Id == entity.GrievanceCategoryId && !c.MarkedForDeletion && c.IsActive, ct);

        if (!categoryExists)
            return ValidationResult.Failure(nameof(entity.GrievanceCategoryId), "AssetGrievanceRemark_GrievanceCategoryId_Invalid");

        return await ValidateUniqueRemarkAsync(null, entity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetGrievanceRemarkMasterEntity currentEntity, AssetGrievanceRemarkMasterEntity updatedEntity, CancellationToken ct = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidator.ValidateReferencesAsync<AssetGrievanceRemarkMasterEntity>(id, ct);
            if (!refResult.IsValid) return refResult;
        }

        var categoryExists = await _categoryRepository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(c => c.Id == updatedEntity.GrievanceCategoryId && !c.MarkedForDeletion && c.IsActive, ct);

        if (!categoryExists)
            return ValidationResult.Failure(nameof(updatedEntity.GrievanceCategoryId), "AssetGrievanceRemark_GrievanceCategoryId_Invalid");

        return await ValidateUniqueRemarkAsync(id, updatedEntity, ct);
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetGrievanceRemarkMasterEntity entity, CancellationToken ct = default)
        => await _referenceValidator.ValidateReferencesAsync<AssetGrievanceRemarkMasterEntity>(id, ct);

    // A remark only has to be unique within its grievance category. There is no DB constraint, so remarks
    // marked for deletion do not block reusing the text.
    private async Task<ValidationResult> ValidateUniqueRemarkAsync(
        int? excludeId, AssetGrievanceRemarkMasterEntity entity, CancellationToken ct)
    {
        var duplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x => (excludeId == null || x.Id != excludeId)
                        && x.GrievanceCategoryId == entity.GrievanceCategoryId
                        && x.Remark == entity.Remark
                        && !x.MarkedForDeletion, ct);

        return duplicate
            ? AssetMasterValidation.ToResult(new[] { AssetMasterValidation.Duplicate(nameof(entity.Remark), "Remark", entity.Remark, "Grievance Category") })
            : ValidationResult.Success();
    }
}
