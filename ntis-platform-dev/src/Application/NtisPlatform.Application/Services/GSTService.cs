using NtisPlatform.Application.Enums;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>CRUD service for the GST/tax rate master.</summary>
public class GSTService :
    AssetMasterCrudService<GSTMasterEntity, GSTDto, CreateGSTDto, UpdateGSTDto, GSTQueryParameters>,
    IGSTService
{
    private readonly IReferenceValidationService _referenceValidator;

    public GSTService(
        IRepository<GSTMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GSTMasterEntity entity, CancellationToken cancellationToken = default)
    {
        return await ValidateUniqueCodeAndNameAsync(null, entity, cancellationToken);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GSTMasterEntity currentEntity, GSTMasterEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        var duplicateResult = await ValidateUniqueCodeAndNameAsync(id, updatedEntity, cancellationToken);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<GSTMasterEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, GSTMasterEntity entity, CancellationToken cancellationToken = default)
        => await _referenceValidator.ValidateReferencesAsync<GSTMasterEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);

    // TaxCode mirrors the unique index on AMS.GSTMaster.TaxCode; it also covers rows marked for deletion, so
    // they still count. TaxName has no DB constraint, so deleted rates do not block reusing a name. Both
    // fields are checked so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueCodeAndNameAsync(
        int? excludeId, GSTMasterEntity entity, CancellationToken cancellationToken)
    {
        var others = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => excludeId == null || x.Id != excludeId);

        var errors = new List<ValidationError>();

        if (await others.AnyAsync(x => x.TaxCode == entity.TaxCode, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.TaxCode), "Tax Code", entity.TaxCode));

        if (await others.AnyAsync(x => !x.MarkedForDeletion && x.TaxName == entity.TaxName, cancellationToken))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.TaxName), "Tax Name", entity.TaxName));

        return AssetMasterValidation.ToResult(errors);
    }
}
