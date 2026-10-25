using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master.BHKMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Master;

public class BHKMasterService : BaseCommonCrudService<BHKMasterEntity, BHKMasterDto, CreateBHKMasterDto, UpdateBHKMasterDto, BHKMasterQueryParameters, int>, IBHKMasterService
{
    private readonly IReferenceValidationService _referenceValidator;

    public BHKMasterService(
        IRepository<BHKMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        BHKMasterEntity entity, CancellationToken cancellationToken = default)
    {
        return await CheckDuplicateCodeAsync(entity, excludeId: null, cancellationToken);
    }

    // The base service only invokes this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here and excludes the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        BHKMasterEntity currentEntity,
        BHKMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateResult = await CheckDuplicateCodeAsync(updatedEntity, excludeId: id, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<BHKMasterEntity>(id, cancellationToken);
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        BHKMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<BHKMasterEntity>(id, cancellationToken);
    }

    // Mirrors UX_BHKMaster_BHKCode.
    private async Task<ValidationResult> CheckDuplicateCodeAsync(
        BHKMasterEntity entity, int? excludeId, CancellationToken cancellationToken)
    {
        var duplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != (excludeId ?? 0)
                        && x.BHKCode == entity.BHKCode, cancellationToken);

        return duplicate
            ? ValidationResult.Failure(nameof(entity.BHKCode), $"BHK code '{entity.BHKCode}' already exists.")
            : ValidationResult.Success();
    }
}
