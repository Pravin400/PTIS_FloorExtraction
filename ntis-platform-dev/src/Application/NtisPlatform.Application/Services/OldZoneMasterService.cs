using AutoMapper;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class OldZoneMasterService : BaseCommonCrudService<OldZoneMasterEntity, OldZoneMasterDto, CreateOldZoneMasterDto, UpdateOldZoneMasterDto, OldZoneMasterQueryParameters, int>, IOldZoneMasterService
{
    private readonly IReferenceValidationService _referenceValidator;

    public OldZoneMasterService(
        IRepository<OldZoneMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    /// <summary>
    /// Validates deactivation (IsActive change from true to false) for OldZoneMasterEntity.
    /// Uses centralized IReferenceValidationService to check references in related tables.
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        OldZoneMasterEntity currentEntity,
        OldZoneMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<OldZoneMasterEntity>(id, cancellationToken);
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        OldZoneMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<OldZoneMasterEntity>(id, cancellationToken);
    }
}
