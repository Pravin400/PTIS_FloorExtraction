using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Enums;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.ChargeHeadMaster;

public class ChargeHeadMasterService
    : BaseCommonCrudService<ChargeHeadMasterEntity, ChargeHeadMasterDto, CreateChargeHeadMasterDto, UpdateChargeHeadMasterDto, ChargeHeadMasterQueryParameters, int>,
      IChargeHeadMasterService
{
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ICurrentUserService _currentUserService;

    public ChargeHeadMasterService(
        IRepository<ChargeHeadMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidationService,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidationService = referenceValidationService;
        _currentUserService = currentUserService;
    }

    public override Task<ChargeHeadMasterDto> CreateAsync(CreateChargeHeadMasterDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<ChargeHeadMasterDto?> UpdateAsync(int id, UpdateChargeHeadMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        ChargeHeadMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(entity.Code))
        {
            return ValidationResult.Failure(nameof(entity.Code), "Code cannot be null or whitespace.");
        }

        var chargeTypeValidation = ValidateChargeType(entity.ChargeType);
        if (!chargeTypeValidation.IsValid)
        {
            return chargeTypeValidation;
        }

        var isDuplicate = await _repository.GetQueryable()
            .AnyAsync(x => x.Code.ToLower() == entity.Code.ToLower(), cancellationToken);

        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(entity.Code), $"Code '{entity.Code}' already exists.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        ChargeHeadMasterEntity currentEntity,
        ChargeHeadMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(updatedEntity.Code))
        {
            return ValidationResult.Failure(nameof(updatedEntity.Code), "Code cannot be null or whitespace.");
        }

        var chargeTypeValidation = ValidateChargeType(updatedEntity.ChargeType);
        if (!chargeTypeValidation.IsValid)
        {
            return chargeTypeValidation;
        }

        var isDuplicate = await _repository.GetQueryable()
            .AnyAsync(x => x.Code.ToLower() == updatedEntity.Code.ToLower() && x.Id != id, cancellationToken);

        if (isDuplicate)
        {
            return ValidationResult.Failure(nameof(updatedEntity.Code), $"Code '{updatedEntity.Code}' already exists.");
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var refResult = await _referenceValidationService.ValidateReferencesAsync<ChargeHeadMasterEntity>(id, cancellationToken);
            if (!refResult.IsValid)
            {
                return refResult;
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        ChargeHeadMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidationService.ValidateReferencesAsync<ChargeHeadMasterEntity>(id, cancellationToken);
    }

    private static ValidationResult ValidateChargeType(string chargeType)
    {
        if (string.IsNullOrWhiteSpace(chargeType))
        {
            return ValidationResult.Failure(nameof(ChargeHeadMasterEntity.ChargeType), "ChargeType cannot be null or whitespace.");
        }

        if (!Enum.TryParse<ChargeType>(chargeType.Trim(), ignoreCase: true, out _))
        {
            return ValidationResult.Failure(
                nameof(ChargeHeadMasterEntity.ChargeType),
                $"ChargeType '{chargeType}' is invalid. Allowed values are: {string.Join(", ", Enum.GetNames<ChargeType>())}.");
        }

        return ValidationResult.Success();
    }
}
