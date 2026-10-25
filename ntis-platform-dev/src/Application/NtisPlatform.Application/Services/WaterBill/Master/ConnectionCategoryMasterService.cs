using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master.WaterBill;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Master.WaterBill;

public class ConnectionCategoryMasterService
    : BaseCommonCrudService<ConnectionCategoryMasterEntity, ConnectionCategoryMasterDto, CreateConnectionCategoryMasterDto, UpdateConnectionCategoryMasterDto, ConnectionCategoryMasterQueryParameters, int>,
      IConnectionCategoryMasterService
{
    private static readonly HashSet<string> AllowedBillingMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "Hybrid", "Fixed", "Annual", "Telescopic", "Slab", "Flat", "Metered"
    };

    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<BillingFrequencyMasterEntity, int> _billingFrequencyRepository;

    public ConnectionCategoryMasterService(
        IRepository<ConnectionCategoryMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidationService,
        ICurrentUserService currentUserService,
        IRepository<BillingFrequencyMasterEntity, int> billingFrequencyRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidationService = referenceValidationService;
        _currentUserService = currentUserService;
        _billingFrequencyRepository = billingFrequencyRepository;
    }

    protected override IQueryable<ConnectionCategoryMasterEntity> ApplyIncludes(IQueryable<ConnectionCategoryMasterEntity> query)
    {
        return query.Include(x => x.BillingFrequency);
    }

    public override async Task<ConnectionCategoryMasterDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable().AsNoTracking()
            .Include(x => x.BillingFrequency)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity == null)
            return null;

        return _mapper.Map<ConnectionCategoryMasterDto>(entity);
    }

    public override Task<ConnectionCategoryMasterDto> CreateAsync(CreateConnectionCategoryMasterDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<ConnectionCategoryMasterDto?> UpdateAsync(int id, UpdateConnectionCategoryMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    private static ValidationResult ValidateBillingMethodConsistency(bool isMetered, string billingMethod)
    {
        if (isMetered && ConnectionCategoryBillingRules.NonMeteredBillingMethods.Contains(billingMethod))
        {
            return ValidationResult.Failure(nameof(ConnectionCategoryMasterEntity.BillingMethod),
                $"BillingMethod '{billingMethod}' is not valid for metered connections (IsMetered = true). Valid metered billing methods are: {string.Join(", ", ConnectionCategoryBillingRules.MeteredBillingMethods)}.");
        }

        if (!isMetered && ConnectionCategoryBillingRules.MeteredBillingMethods.Contains(billingMethod))
        {
            return ValidationResult.Failure(nameof(ConnectionCategoryMasterEntity.BillingMethod),
                $"BillingMethod '{billingMethod}' is not valid for non-metered connections (IsMetered = false). Valid non-metered billing methods are: {string.Join(", ", ConnectionCategoryBillingRules.NonMeteredBillingMethods)}.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        ConnectionCategoryMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entity.ConnectionCategoryCode))
        {
            return ValidationResult.Failure(nameof(entity.ConnectionCategoryCode), "ConnectionCategoryCode cannot be null or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(entity.ConnectionCategory))
        {
            return ValidationResult.Failure(nameof(entity.ConnectionCategory), "ConnectionCategory cannot be null or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(entity.BillingMethod) || !AllowedBillingMethods.Contains(entity.BillingMethod))
        {
            return ValidationResult.Failure(nameof(entity.BillingMethod), $"Invalid BillingMethod '{entity.BillingMethod}'. Allowed values are: {string.Join(", ", AllowedBillingMethods)}.");
        }

        var consistencyResult = ValidateBillingMethodConsistency(entity.IsMetered, entity.BillingMethod);
        if (!consistencyResult.IsValid)
        {
            return consistencyResult;
        }

        if (entity.BillingFrequencyId.HasValue)
        {
            var freq = await _billingFrequencyRepository.GetByIdAsync(entity.BillingFrequencyId.Value, cancellationToken);
            if (freq == null)
            {
                return ValidationResult.Failure(nameof(entity.BillingFrequencyId), $"BillingFrequency with ID {entity.BillingFrequencyId.Value} does not exist.");
            }

            if (!freq.IsActive)
            {
                return ValidationResult.Failure(nameof(entity.BillingFrequencyId), $"BillingFrequency '{freq.BillingFrequency}' is inactive.");
            }
        }

        var isDuplicate = await _repository.GetQueryable()
            .AnyAsync(x => x.ConnectionCategoryCode.ToLower() == entity.ConnectionCategoryCode.ToLower(), cancellationToken);

        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(entity.ConnectionCategoryCode), $"ConnectionCategoryCode '{entity.ConnectionCategoryCode}' already exists.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        ConnectionCategoryMasterEntity currentEntity,
        ConnectionCategoryMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(updatedEntity.ConnectionCategoryCode))
        {
            return ValidationResult.Failure(nameof(updatedEntity.ConnectionCategoryCode), "ConnectionCategoryCode cannot be null or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(updatedEntity.ConnectionCategory))
        {
            return ValidationResult.Failure(nameof(updatedEntity.ConnectionCategory), "ConnectionCategory cannot be null or whitespace.");
        }

        if (string.IsNullOrWhiteSpace(updatedEntity.BillingMethod) || !AllowedBillingMethods.Contains(updatedEntity.BillingMethod))
        {
            return ValidationResult.Failure(nameof(updatedEntity.BillingMethod), $"Invalid BillingMethod '{updatedEntity.BillingMethod}'. Allowed values are: {string.Join(", ", AllowedBillingMethods)}.");
        }

        var consistencyResult = ValidateBillingMethodConsistency(updatedEntity.IsMetered, updatedEntity.BillingMethod);
        if (!consistencyResult.IsValid)
        {
            return consistencyResult;
        }

        if (updatedEntity.BillingFrequencyId.HasValue)
        {
            var freq = await _billingFrequencyRepository.GetByIdAsync(updatedEntity.BillingFrequencyId.Value, cancellationToken);
            if (freq == null)
            {
                return ValidationResult.Failure(nameof(updatedEntity.BillingFrequencyId), $"BillingFrequency with ID {updatedEntity.BillingFrequencyId.Value} does not exist.");
            }

            if (!freq.IsActive)
            {
                return ValidationResult.Failure(nameof(updatedEntity.BillingFrequencyId), $"BillingFrequency '{freq.BillingFrequency}' is inactive.");
            }
        }

        var isDuplicate = await _repository.GetQueryable()
            .AnyAsync(x => x.ConnectionCategoryCode.ToLower() == updatedEntity.ConnectionCategoryCode.ToLower() && x.Id != id, cancellationToken);

        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(updatedEntity.ConnectionCategoryCode), $"ConnectionCategoryCode '{updatedEntity.ConnectionCategoryCode}' already exists.");
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidationService.ValidateReferencesAsync<ConnectionCategoryMasterEntity>(id, cancellationToken);
            if (!refResult.IsValid)
            {
                return refResult;
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        ConnectionCategoryMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidationService.ValidateReferencesAsync<ConnectionCategoryMasterEntity>(id, cancellationToken);
    }
}
