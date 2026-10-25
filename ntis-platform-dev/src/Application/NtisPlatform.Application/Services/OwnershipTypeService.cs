using AutoMapper;
using NtisPlatform.Application.Enums;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class OwnershipTypeService : AssetMasterCrudService<
    OwnershipTypeEntity,
    OwnershipTypeDto,
    CreateOwnershipTypeDto,
    UpdateOwnershipTypeDto,
    OwnershipTypeQueryParameters>, IOwnershipTypeService
{
    private readonly IReferenceValidationService _referenceValidator;

    public OwnershipTypeService(
        IRepository<OwnershipTypeEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        OwnershipTypeEntity entity, CancellationToken cancellationToken = default)
    {
        return await CheckDuplicateAsync(entity, excludeId: null, cancellationToken);
    }

    // Note: mirrors ValidateForCreateAsync's duplicate check because the base service only invokes
    // this hook (not ValidateForCreateAsync) on Update/BulkUpdate — the duplicate check excludes the
    // row being updated so renaming a type to its own current name is not flagged.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        OwnershipTypeEntity currentEntity,
        OwnershipTypeEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await CheckDuplicateAsync(updatedEntity, excludeId: id, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        // AssetMaster.OwnershipType stores the name as text, so renaming a type that assets use would leave them
        // with a name the master no longer has (and the reference check could no longer find them).
        if (!string.Equals(currentEntity.OwnershipTypeName, updatedEntity.OwnershipTypeName, StringComparison.Ordinal)
            && await IsInUseAsync(id, cancellationToken))
        {
            return AssetMasterValidation.ToResult(new[]
            {
                AssetMasterValidation.CannotChangeWhileInUse(nameof(updatedEntity.OwnershipTypeName), "Ownership Type Name", "Ownership Type")
            });
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<OwnershipTypeEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    // In use = the references that would block a delete. They match on the saved name, so this sees the old one.
    private async Task<bool> IsInUseAsync(int id, CancellationToken cancellationToken)
        => !(await _referenceValidator.ValidateReferencesAsync<OwnershipTypeEntity>(id, ReferenceValidationOperation.Delete, cancellationToken)).IsValid;

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, OwnershipTypeEntity entity, CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<OwnershipTypeEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    // Mirrors UQ_OwnershipTypeMaster_OwnershipTypeName. The constraint also covers rows marked for deletion,
    // so they are not excluded here — excluding them let this check pass while the insert still failed at
    // the database with a generic conflict.
    private async Task<ValidationResult> CheckDuplicateAsync(
        OwnershipTypeEntity entity, int? excludeId, CancellationToken cancellationToken)
    {
        var duplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != (excludeId ?? 0)
                        && x.OwnershipTypeName == entity.OwnershipTypeName, cancellationToken);

        return duplicate
            ? AssetMasterValidation.ToResult(new[] { AssetMasterValidation.Duplicate(nameof(entity.OwnershipTypeName), "Ownership Type Name", entity.OwnershipTypeName) })
            : ValidationResult.Success();
    }
}
