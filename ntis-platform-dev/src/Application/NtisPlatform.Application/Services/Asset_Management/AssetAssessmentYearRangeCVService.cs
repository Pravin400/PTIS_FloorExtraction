using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management.AssetAssessmentYearRangeMasterCV;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>CRUD service for [AMS].[AssessmentYearRangeMaster].</summary>
public class AssetAssessmentYearRangeCVService :
    AssetMasterCrudService<
        AssetAssessmentYearRangeMasterCVEntity,
        AssetAssessmentYearRangeMasterCVDto,
        CreateAssetAssessmentYearRangeMasterCVDto,
        UpdateAssetAssessmentYearRangeMasterCVDto,
        AssetAssessmentYearRangeMasterCVQueryParameters>,
    IAssetAssessmentYearRangeCVService
{
    private readonly IReferenceValidationService _referenceValidator;

    public AssetAssessmentYearRangeCVService(
        IRepository<AssetAssessmentYearRangeMasterCVEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        AssetAssessmentYearRangeMasterCVEntity entity, CancellationToken cancellationToken = default)
    {
        if (entity.FromYear > entity.ToYear)
            return ValidationResult.Failure(nameof(entity.ToYear), "AssessmentYearRangeCV_ToYear_BeforeFromYear");

        var duplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.FromYear == entity.FromYear && x.ToYear == entity.ToYear, cancellationToken);

        if (duplicate)
            return DuplicateRange(entity);

        return await OverlapsExistingRangeAsync(null, entity.FromYear, entity.ToYear, cancellationToken)
            ? OverlappingRange(entity)
            : ValidationResult.Success();
    }

    // Note: the base service only invokes this hook (not ValidateForCreateAsync) on Update/BulkUpdate,
    // so the range, duplicate-range and overlap checks are duplicated here — matching AssetAgeFactorCVService's
    // "validate on any update" convention — with the duplicate/overlap checks excluding the record being updated.
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        AssetAssessmentYearRangeMasterCVEntity currentEntity,
        AssetAssessmentYearRangeMasterCVEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (updatedEntity.FromYear > updatedEntity.ToYear)
            return ValidationResult.Failure(nameof(updatedEntity.ToYear), "AssessmentYearRangeCV_ToYear_BeforeFromYear");

        var duplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != id && x.FromYear == updatedEntity.FromYear && x.ToYear == updatedEntity.ToYear, cancellationToken);

        if (duplicate)
            return DuplicateRange(updatedEntity);

        // Only re-check overlap when the years move, so rows that already overlap in legacy data
        // (e.g. seeded 2016-2025 and 2020-2025) can still be activated/deactivated without editing them.
        var yearsChanged = currentEntity.FromYear != updatedEntity.FromYear || currentEntity.ToYear != updatedEntity.ToYear;
        if (yearsChanged && await OverlapsExistingRangeAsync(id, updatedEntity.FromYear, updatedEntity.ToYear, cancellationToken))
            return OverlappingRange(updatedEntity);

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<AssetAssessmentYearRangeMasterCVEntity>(id, ReferenceValidationOperation.Deactivate, cancellationToken);
        }
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id, AssetAssessmentYearRangeMasterCVEntity entity, CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<AssetAssessmentYearRangeMasterCVEntity>(id, ReferenceValidationOperation.Delete, cancellationToken);
    }

    // The range is this master's only identifying value, so both errors name it, e.g. "Assessment Year Range
    // '2020-2025' already exists." Reported against ToYear, as before, so the client keeps the same field key.
    // Returned (not thrown) so bulk create/update can report it per item; AssetMasterCrudService puts the readable
    // text in the top-level message of a single create/update.
    private static ValidationResult DuplicateRange(AssetAssessmentYearRangeMasterCVEntity entity)
        => AssetMasterValidation.ToResult(
            new[] { AssetMasterValidation.Duplicate(nameof(entity.ToYear), "Assessment Year Range", $"{entity.FromYear}-{entity.ToYear}") });

    private static ValidationResult OverlappingRange(AssetAssessmentYearRangeMasterCVEntity entity)
        => AssetMasterValidation.ToResult(
            new[] { new ValidationError(nameof(entity.ToYear), $"Assessment Year Range '{entity.FromYear}-{entity.ToYear}' overlaps an existing year range.") });

    // Both ends are inclusive — the CV calculation picks the range where year >= FromYear && year <= ToYear —
    // so [2020, 2025] and [2025, 2030] overlap on 2025; the next range has to start at 2026.
    // Inactive ranges still count (they can be reactivated); ranges marked for deletion do not.
    private Task<bool> OverlapsExistingRangeAsync(int? excludeId, int fromYear, int toYear, CancellationToken cancellationToken)
        => _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => (excludeId == null || x.Id != excludeId)
                        && !x.MarkedForDeletion
                        && x.FromYear <= toYear
                        && x.ToYear >= fromYear, cancellationToken);
}
