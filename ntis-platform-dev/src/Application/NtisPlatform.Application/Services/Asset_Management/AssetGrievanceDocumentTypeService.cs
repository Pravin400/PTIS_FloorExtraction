using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocumentType;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetGrievanceDocumentTypeService :
    BaseCommonCrudService<
        AssetGrievanceDocumentTypeEntity,
        AssetGrievanceDocumentTypeDto,
        CreateAssetGrievanceDocumentTypeDto,
        UpdateAssetGrievanceDocumentTypeDto,
        AssetGrievanceDocumentTypeQueryParameters,
        int>,
    IAssetGrievanceDocumentTypeService
{
    private readonly IRepository<AssetGrievanceCategoryEntity, int> _categoryRepository;
    private readonly IReferenceValidationService _referenceValidator;

    public AssetGrievanceDocumentTypeService(
        IRepository<AssetGrievanceDocumentTypeEntity, int> repository,
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
        AssetGrievanceDocumentTypeEntity entity, CancellationToken ct = default)
    {
        var categoryExists = await _categoryRepository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(c => c.Id == entity.GrievanceCategoryId && !c.MarkedForDeletion && c.IsActive, ct);

        if (!categoryExists)
            return ValidationResult.Failure(nameof(entity.GrievanceCategoryId), "AssetGrievanceDocumentType_GrievanceCategoryId_Invalid");

        var duplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x => x.DocumentTypeCode == entity.DocumentTypeCode && !x.MarkedForDeletion, ct);

        return duplicate
            ? ValidationResult.Failure(nameof(entity.DocumentTypeCode), "AssetGrievanceDocumentType_DocumentTypeCode_Duplicate")
            : ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetGrievanceDocumentTypeEntity currentEntity, AssetGrievanceDocumentTypeEntity updatedEntity, CancellationToken ct = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidator.ValidateReferencesAsync<AssetGrievanceDocumentTypeEntity>(id, ct);
            if (!refResult.IsValid) return refResult;
        }

        var categoryExists = await _categoryRepository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(c => c.Id == updatedEntity.GrievanceCategoryId && !c.MarkedForDeletion && c.IsActive, ct);

        if (!categoryExists)
            return ValidationResult.Failure(nameof(updatedEntity.GrievanceCategoryId), "AssetGrievanceDocumentType_GrievanceCategoryId_Invalid");

        var duplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x => x.Id != id && x.DocumentTypeCode == updatedEntity.DocumentTypeCode && !x.MarkedForDeletion, ct);

        return duplicate
            ? ValidationResult.Failure(nameof(updatedEntity.DocumentTypeCode), "AssetGrievanceDocumentType_DocumentTypeCode_Duplicate")
            : ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetGrievanceDocumentTypeEntity entity, CancellationToken ct = default)
        => await _referenceValidator.ValidateReferencesAsync<AssetGrievanceDocumentTypeEntity>(id, ct);
}
