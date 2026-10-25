using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Range;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces ;

   using NtisPlatform.Application.Helpers;

namespace NtisPlatform.Application.Services;

public class FloorService : BaseCommonCrudService<FloorEntity, FloorDto, CreateFloorDto, UpdateFloorDto, FloorQueryParameters, int>, IFloorService
{
    private readonly IReferenceValidationService _referenceValidator;  

    public FloorService(  
        IRepository<FloorEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    /// <summary>
    /// Validates deactivation (IsActive change from true to false) for FloorEntity.
    /// Uses centralized IReferenceValidationService to check references in related tables.
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        FloorEntity currentEntity,
        FloorEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<FloorEntity>(id, cancellationToken);
        }

        return ValidationResult.Success();
    }
    /// <summary>
    /// DeleteAsync behavior and validation:
    ///
    /// - Soft Delete / Mark-for-Delete (entities with BaseEntity):
    ///     - The repository sets IsActive = false and/or MarkedForDeletion = true.
    ///     - The service's DeleteAsync calls ValidateForDeleteAsync before deleting.
    ///     - If the record is referenced elsewhere (checked via IReferenceValidationService), deletion is blocked and a ValidationException is thrown.
    ///     - This prevents soft delete/mark-for-delete if the record is in use.
    ///     - Note: UpdateAsync is NOT called during delete, so ValidateForDeactivationAsync is NOT triggered for deletes.
    ///
    /// - Hard Delete (entities without BaseEntity, e.g., via HardDeleteCleanupService):
    ///     - The record is physically removed from the database.
    ///     - No service-level validation is performed.
    ///     - Database constraints (e.g., foreign keys) prevent deletion if the record is referenced elsewhere.
    ///     - If a constraint violation occurs, it is caught and handled at the controller/middleware level.
    ///
    /// Summary:
    /// - Soft delete/mark-for-delete: ValidateForDeleteAsync uses centralized IReferenceValidationService for referential integrity/business rules.
    /// - Hard delete: Database constraints enforce integrity; no service validation needed.
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        FloorEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<FloorEntity>(id, cancellationToken);
    }

    public override async Task<FloorDto> CreateAsync(CreateFloorDto createDto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(createDto);

        // Backfill / fallback defaults for legacy callers
        if (createDto.FLatGenerationGroupId <= 0)
        {
            createDto.FLatGenerationGroupId = 1;
        }

        // Always ensure flat generation sequence continues without any gap
        var maxSeq = await _repository.GetQueryable().AsNoTracking()
            .Where(f => f.FLatGenerationGroupId == createDto.FLatGenerationGroupId)
            .Select(f => (int?)f.FLatGenerationSeq)
            .MaxAsync(cancellationToken) ?? 0;
        createDto.FLatGenerationSeq = maxSeq + 1;

        // Enforce uniqueness of (FLatGenerationGroupId, FLatGenerationSeq)
        var duplicateExists = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(f => f.FLatGenerationGroupId == createDto.FLatGenerationGroupId && f.FLatGenerationSeq == createDto.FLatGenerationSeq, cancellationToken);
        if (duplicateExists)
        {
            throw new ValidationException(
                "FLatGenerationSeq",
                $"Floor generation sequence {createDto.FLatGenerationSeq} already exists for flat generation group {createDto.FLatGenerationGroupId}.",
                OperationType.Create);
        }

        if (string.IsNullOrWhiteSpace(createDto.FloorCode))
        {
            var defaultPrefix = FloorNamingHelper.GetGroupCodePrefix(createDto.FLatGenerationGroupId);
            createDto.FloorCode = !string.IsNullOrWhiteSpace(defaultPrefix)
                ? $"{defaultPrefix}{createDto.FLatGenerationSeq}"
                : createDto.FLatGenerationSeq.ToString();
        }

        return await base.CreateAsync(createDto, cancellationToken);
    }

    public override async Task<FloorDto?> UpdateAsync(int id, UpdateFloorDto updateDto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(updateDto);

        // Enforce uniqueness of (FLatGenerationGroupId, FLatGenerationSeq)
        if (updateDto.FLatGenerationGroupId > 0 && updateDto.FLatGenerationSeq > 0)
        {
            var duplicateExists = await _repository.GetQueryable().AsNoTracking()
                .AnyAsync(f => f.Id != id && f.FLatGenerationGroupId == updateDto.FLatGenerationGroupId && f.FLatGenerationSeq == updateDto.FLatGenerationSeq, cancellationToken);
            if (duplicateExists)
            {
                throw new ValidationException(
                    "FLatGenerationSeq",
                    $"Floor generation sequence {updateDto.FLatGenerationSeq} already exists for flat generation group {updateDto.FLatGenerationGroupId}.",
                    OperationType.Update);
            }
        }

        return await base.UpdateAsync(id, updateDto, cancellationToken);
    }

    public async Task<RangeResult<FloorDto>> CreateFromRangeAsync(
        RangeCreateRequest<CreateFloorDto> request,
        CancellationToken cancellationToken = default)
    {
        // Query the latest max sequence directly from DB to guarantee flat generation sequence NEVER breaks and continues with NO GAP
        int maxSeqInDb = await GetMaxFlatGenerationSeqAsync(request.Template.FLatGenerationGroupId, cancellationToken);
        int currentSeq = maxSeqInDb + 1;

        Func<CreateFloorDto, string, int, CreateFloorDto> transformer = (template, rangeValue, sequenceNo) =>
        {
            int generationSeq = currentSeq++;

            string? customPrefix = !string.IsNullOrWhiteSpace(request.Prefix)
                ? request.Prefix.Trim()
                : (!string.IsNullOrWhiteSpace(template.FloorCode) ? template.FloorCode.Trim() : null);

            // Infer prefix from selected flat generation group (e.g. 'P' for PODIUM -> P57) if no custom prefix provided
            string prefix = !string.IsNullOrWhiteSpace(customPrefix)
                ? customPrefix
                : FloorNamingHelper.GetGroupCodePrefix(template.FLatGenerationGroupId);

            // Store in floor code like "[prefix][flatgenerationseq]" (e.g. "P45", "P57") or "[flatgenerationseq]" for GENERAL
            string floorCode = !string.IsNullOrWhiteSpace(prefix)
                ? $"{prefix}{generationSeq}"
                : generationSeq.ToString();

            string numericPart = generationSeq.ToString();

            string englishDesc = !string.IsNullOrWhiteSpace(template.DescriptionEnglish)
                ? template.DescriptionEnglish.Replace("{value}", numericPart)
                : FloorNamingHelper.GetEnglishDescription(numericPart, template.FLatGenerationGroupId);

            string regionalDesc = !string.IsNullOrWhiteSpace(template.Description)
                ? template.Description.Replace("{value}", FloorNamingHelper.ToMarathiDigits(numericPart))
                : FloorNamingHelper.GetRegionalDescription(numericPart, template.FLatGenerationGroupId);

            return new CreateFloorDto
            {
                FloorCode = floorCode,
                MaxFloorNo = template.MaxFloorNo,
                Description = regionalDesc,
                DescriptionEnglish = englishDesc,
                SequenceNo = sequenceNo,
                FloorGroupId = template.FloorGroupId,
                FLatGenerationGroupId = template.FLatGenerationGroupId,
                FLatGenerationSeq = generationSeq,
                IsActive = template.IsActive,
                CreatedBy = template.CreatedBy
            };
        };

        return await base.CreateFromRangeAsync(request, transformer, cancellationToken);
    }

    public async Task<int> GetMaxFlatGenerationSeqAsync(int flatGenerationGroupId, CancellationToken cancellationToken = default)
    {
        return await _repository.GetQueryable().AsNoTracking()
            .Where(f => f.FLatGenerationGroupId == flatGenerationGroupId)
            .Select(f => (int?)f.FLatGenerationSeq)
            .MaxAsync(cancellationToken) ?? 0;
    }
}
