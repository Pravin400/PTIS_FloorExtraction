using AutoMapper;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class FLatGenerationGroupMasterService : BaseCommonCrudService<FLatGenerationGroupMasterEntity, FLatGenerationGroupMasterDto, CreateFLatGenerationGroupMasterDto, UpdateFLatGenerationGroupMasterDto, FLatGenerationGroupMasterQueryParameters, int>, IFLatGenerationGroupMasterService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly ICurrentUserService _currentUserService;

    public FLatGenerationGroupMasterService(
        IRepository<FLatGenerationGroupMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _currentUserService = currentUserService;
    }

    public override Task<FLatGenerationGroupMasterDto> CreateAsync(CreateFLatGenerationGroupMasterDto createDto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(createDto);
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<FLatGenerationGroupMasterDto?> UpdateAsync(int id, UpdateFLatGenerationGroupMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(updateDto);
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    /// <summary>
    /// Validates deactivation (IsActive change from true to false) for FLatGenerationGroupMasterEntity.
    /// Checks references in related tables (e.g. Floor).
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        FLatGenerationGroupMasterEntity currentEntity,
        FLatGenerationGroupMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<FLatGenerationGroupMasterEntity>(id, cancellationToken);
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validates deletion for FLatGenerationGroupMasterEntity.
    /// Checks references in related tables (e.g. Floor).
    /// </summary>
    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        FLatGenerationGroupMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<FLatGenerationGroupMasterEntity>(id, cancellationToken);
    }
}
