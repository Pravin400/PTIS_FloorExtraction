using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

public class AssetSubZoneDetailsForCVService :
    AssetMasterCrudService<AssetSubZoneDetailsForCVEntity, AssetSubZoneDetailsForCVDto, CreateAssetSubZoneDetailsForCVDto, UpdateAssetSubZoneDetailsForCVDto, AssetSubZoneDetailsForCVQueryParameters>,
    IAssetSubZoneDetailsForCVService
{
    private readonly IReferenceValidationService _referenceValidator;

    public AssetSubZoneDetailsForCVService(
        IRepository<AssetSubZoneDetailsForCVEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetSubZoneDetailsForCVEntity entity, CancellationToken ct = default)
    {
        return await ValidateUniqueNoAndNameAsync(null, entity, ct);
    }

    // The base service only runs this hook (not ValidateForCreateAsync) on Update/BulkUpdate, so the
    // duplicate check is repeated here, excluding the row being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, AssetSubZoneDetailsForCVEntity currentEntity, AssetSubZoneDetailsForCVEntity updatedEntity, CancellationToken ct = default)
    {
        var duplicateResult = await ValidateUniqueNoAndNameAsync(id, updatedEntity, ct);
        if (!duplicateResult.IsValid)
            return duplicateResult;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<AssetSubZoneDetailsForCVEntity>(id, ReferenceValidationOperation.Deactivate, ct);

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetSubZoneDetailsForCVEntity entity, CancellationToken ct = default)
        => await _referenceValidator.ValidateReferencesAsync<AssetSubZoneDetailsForCVEntity>(id, ReferenceValidationOperation.Delete, ct);

    // Sub zone no and name only have to be unique within their mouja. There is no DB constraint on
    // AMS.SubZoneDetailsForCV, so sub zones marked for deletion do not block reuse. Both fields are checked
    // so the caller sees every clash at once.
    private async Task<ValidationResult> ValidateUniqueNoAndNameAsync(
        int? excludeId, AssetSubZoneDetailsForCVEntity entity, CancellationToken ct)
    {
        var sameMouja = _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => (excludeId == null || x.Id != excludeId)
                     && x.MoujaId == entity.MoujaId
                     && !x.MarkedForDeletion);

        var errors = new List<ValidationError>();

        if (await sameMouja.AnyAsync(x => x.SubZoneNo == entity.SubZoneNo, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.SubZoneNo), "Sub Zone No", entity.SubZoneNo, "Mouja"));

        if (await sameMouja.AnyAsync(x => x.SubZoneName == entity.SubZoneName, ct))
            errors.Add(AssetMasterValidation.Duplicate(nameof(entity.SubZoneName), "Sub Zone Name", entity.SubZoneName, "Mouja"));

        return AssetMasterValidation.ToResult(errors);
    }
}
