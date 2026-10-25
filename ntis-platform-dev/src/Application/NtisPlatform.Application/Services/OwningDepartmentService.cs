using NtisPlatform.Application.Enums;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class OwningDepartmentService : AssetMasterCrudService<
    OwningDepartmentEntity,
    OwningDepartmentDto,
    CreateOwningDepartmentDto,
    UpdateOwningDepartmentDto,
    OwningDepartmentQueryParameters>, IOwningDepartmentService
{
    private readonly IReferenceValidationService _referenceValidator;

    public OwningDepartmentService(
        IRepository<OwningDepartmentEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        OwningDepartmentEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueNameAsync(null, entity, cancellationToken);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        OwningDepartmentEntity currentEntity,
        OwningDepartmentEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueNameAsync(id, updatedEntity, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<OwningDepartmentEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        OwningDepartmentEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<OwningDepartmentEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    // Mirrors UQ_OwningDepartmentMaster_OwningDepartmentName. The constraint also covers rows marked for
    // deletion, so they are not excluded here — otherwise the insert fails at the database with a generic
    // conflict.
    private async Task<ValidationResult> ValidateUniqueNameAsync(
        int? excludeId, OwningDepartmentEntity entity, CancellationToken cancellationToken)
    {
        var duplicate = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x => (excludeId == null || x.Id != excludeId)
                        && x.OwningDepartmentName == entity.OwningDepartmentName, cancellationToken);

        return duplicate
            ? AssetMasterValidation.ToResult(new[] { AssetMasterValidation.Duplicate(nameof(entity.OwningDepartmentName), "Owning Department Name", entity.OwningDepartmentName) })
            : ValidationResult.Success();
    }
}
