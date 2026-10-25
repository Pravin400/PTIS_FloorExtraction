using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master.WaterBill;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Master.WaterBill;

public class ConnectionTypeMasterService
    : BaseCommonCrudService<ConnectionTypeMasterEntity, ConnectionTypeMasterDto, CreateConnectionTypeMasterDto, UpdateConnectionTypeMasterDto, ConnectionTypeMasterQueryParameters, int>,
      IConnectionTypeMasterService
{
    private readonly IReferenceValidationService _referenceValidationService;

    private readonly ICurrentUserService _currentUserService;

    public ConnectionTypeMasterService(
        IRepository<ConnectionTypeMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidationService,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidationService = referenceValidationService;
        _currentUserService = currentUserService;
    }

    public override Task<ConnectionTypeMasterDto> CreateAsync(CreateConnectionTypeMasterDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<ConnectionTypeMasterDto?> UpdateAsync(int id, UpdateConnectionTypeMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        ConnectionTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entity.ConnectionTypeCode))
        {
            return ValidationResult.Failure(nameof(entity.ConnectionTypeCode), "ConnectionTypeCode cannot be null or whitespace.");
        }

        var isDuplicate = await _repository.GetQueryable()
            .AnyAsync(x => x.ConnectionTypeCode.ToLower() == entity.ConnectionTypeCode.ToLower(), cancellationToken);

        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(entity.ConnectionTypeCode), $"ConnectionTypeCode '{entity.ConnectionTypeCode}' already exists.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        ConnectionTypeMasterEntity currentEntity,
        ConnectionTypeMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(updatedEntity.ConnectionTypeCode))
        {
            return ValidationResult.Failure(nameof(updatedEntity.ConnectionTypeCode), "ConnectionTypeCode cannot be null or whitespace.");
        }

        var isDuplicate = await _repository.GetQueryable()
            .AnyAsync(x => x.ConnectionTypeCode.ToLower() == updatedEntity.ConnectionTypeCode.ToLower() && x.Id != id, cancellationToken);

        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(updatedEntity.ConnectionTypeCode), $"ConnectionTypeCode '{updatedEntity.ConnectionTypeCode}' already exists.");
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidationService.ValidateReferencesAsync<ConnectionTypeMasterEntity>(id, cancellationToken);
            if (!refResult.IsValid)
            {
                return refResult;
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        ConnectionTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidationService.ValidateReferencesAsync<ConnectionTypeMasterEntity>(id, cancellationToken);
    }
}
