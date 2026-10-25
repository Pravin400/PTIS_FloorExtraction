using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Payroll.Master.DistrictMaster;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Payroll.Master;

/// <summary>
/// Service implementation for Municipal Payroll District Master CRUD operations
/// </summary>
public class PayrollDistrictMasterService : BaseCommonCrudService<PayrollDistrictMasterEntity, PayrollDistrictMasterDto, CreatePayrollDistrictMasterDto, UpdatePayrollDistrictMasterDto, PayrollDistrictMasterQueryParameters, int>, IPayrollDistrictMasterService
{
    private readonly IRepository<PayrollStateMasterEntity, int> _stateRepository;
    private readonly IRepository<PayrollTalukaMasterEntity, int> _talukaRepository;
    private readonly ICurrentUserService _currentUserService;

    public PayrollDistrictMasterService(
        IRepository<PayrollDistrictMasterEntity, int> repository,
        IRepository<PayrollStateMasterEntity, int> stateRepository,
        IRepository<PayrollTalukaMasterEntity, int> talukaRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _stateRepository = stateRepository;
        _talukaRepository = talukaRepository;
        _currentUserService = currentUserService;
    }

    public override async Task<PayrollDistrictMasterDto> CreateAsync(CreatePayrollDistrictMasterDto createDto, CancellationToken cancellationToken = default)
    {
        await EnsureStateExistsAsync(createDto.StateId, OperationType.Create, cancellationToken);
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return await base.CreateAsync(createDto, cancellationToken);
    }

    public override async Task<PayrollDistrictMasterDto?> UpdateAsync(int id, UpdatePayrollDistrictMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        await EnsureStateExistsAsync(updateDto.StateId, OperationType.Update, cancellationToken);
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return await base.UpdateAsync(id, updateDto, cancellationToken);
    }

    public override async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return false;

        var validationResult = await ValidateForDeleteAsync(id, entity, cancellationToken);
        if (!validationResult.IsValid)
        {
            var firstError = validationResult.Errors.FirstOrDefault()?.ErrorMessage ?? "Validation failed for delete operation";
            throw new ValidationException(firstError, validationResult.ToDictionary(), OperationType.Delete);
        }

        await _repository.HardDeleteAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public override async Task<BulkResult<int>> BulkDeleteAsync(int[] ids, CancellationToken cancellationToken = default)
    {
        if (ids.Length == 0)
            return new BulkResult<int>(0, 0, []);

        var deletedIds = new List<int>();
        var errors = new List<string>();
        var failedCount = 0;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var id in ids)
            {
                var entity = await _repository.GetByIdAsync(id, cancellationToken);
                if (entity is null)
                {
                    failedCount++;
                    errors.Add($"Record with Id '{id}' not found.");
                    continue;
                }

                var validationResult = await ValidateForDeleteAsync(id, entity, cancellationToken);
                if (!validationResult.IsValid)
                {
                    failedCount++;
                    var errorMessages = string.Join(", ", validationResult.Errors.Select(e =>
                        string.IsNullOrEmpty(e.PropertyName) ? e.ErrorMessage : $"{e.PropertyName}: {e.ErrorMessage}"));
                    errors.Add($"Record with Id '{id}': {errorMessages}");
                    continue;
                }

                await _repository.HardDeleteAsync(entity, cancellationToken);
                deletedIds.Add(id);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return new BulkResult<int>(deletedIds.Count, failedCount, deletedIds, errors);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(PayrollDistrictMasterEntity entity, CancellationToken cancellationToken = default)
    {
        var exists = await _stateRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == entity.StateId && x.IsActive, cancellationToken);

        if (!exists)
        {
            return ValidationResult.Failure(nameof(entity.StateId), $"State with ID {entity.StateId} does not exist or is inactive.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        PayrollDistrictMasterEntity currentEntity,
        PayrollDistrictMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var hasActiveTalukas = await _talukaRepository.GetQueryable().AsNoTracking()
                .AnyAsync(t => t.DistrictId == id && t.IsActive, cancellationToken);

            if (hasActiveTalukas)
            {
                return ValidationResult.Failure(
                    nameof(PayrollDistrictMasterEntity.IsActive),
                    "This District cannot be deactivated because it has active Talukas. Please deactivate all active Talukas for this District first.");
            }
        }

        var exists = await _stateRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == updatedEntity.StateId && x.IsActive, cancellationToken);

        if (!exists)
        {
            return ValidationResult.Failure(nameof(updatedEntity.StateId), $"State with ID {updatedEntity.StateId} does not exist or is inactive.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        PayrollDistrictMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        var hasTalukas = await _talukaRepository.GetQueryable().AsNoTracking()
            .AnyAsync(t => t.DistrictId == id, cancellationToken);

        if (hasTalukas)
        {
            return ValidationResult.Failure(
                nameof(PayrollDistrictMasterEntity.Id),
                "This District cannot be deleted because it has Talukas. Please delete all Talukas for this District first.");
        }

        return ValidationResult.Success();
    }

    private async Task EnsureStateExistsAsync(int stateId, OperationType operationType, CancellationToken cancellationToken)
    {
        var exists = await _stateRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == stateId && x.IsActive, cancellationToken);

        if (!exists)
        {
            throw new ValidationException(
                nameof(CreatePayrollDistrictMasterDto.StateId),
                $"State with ID {stateId} does not exist or is inactive.",
                operationType);
        }
    }
}
