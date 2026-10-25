using NtisPlatform.Application.Enums;
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

/// <summary>CRUD service for the penalty rule master.</summary>
public class PenaltyRuleService :
    AssetMasterCrudService<PenaltyRuleMasterEntity, PenaltyRuleDto, CreatePenaltyRuleDto, UpdatePenaltyRuleDto, PenaltyRuleQueryParameters>,
    IPenaltyRuleService
{
    private readonly IReferenceValidationService _referenceValidator;

    public PenaltyRuleService(
        IRepository<PenaltyRuleMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        PenaltyRuleMasterEntity entity, CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueCodeAndNameAsync(null, entity, cancellationToken);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, PenaltyRuleMasterEntity currentEntity, PenaltyRuleMasterEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueCodeAndNameAsync(id, updatedEntity, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<PenaltyRuleMasterEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, PenaltyRuleMasterEntity entity, CancellationToken cancellationToken = default)
        => await _referenceValidator.ValidateReferencesAsync<PenaltyRuleMasterEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);

    // PenaltyCode mirrors UQ_PenaltyRuleMaster_PenaltyCode; it also covers rows marked for deletion, so they
    // still count. PenaltyName has no DB constraint, so deleted rules do not block reusing a name. Both fields
    // are checked so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, PenaltyRuleMasterEntity entity, CancellationToken cancellationToken)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => excludeId == null || x.Id != excludeId);

        var errors = new List<ValidationError>();

        if (await others.AnyAsync(x => x.PenaltyCode == entity.PenaltyCode, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.PenaltyCode), "Penalty Code", entity.PenaltyCode));

        if (await others.AnyAsync(x => !x.MarkedForDeletion && x.PenaltyName == entity.PenaltyName, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.PenaltyName), "Penalty Name", entity.PenaltyName));

        return AssetMasterValidation.ToResult(errors);
    }
}
