using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Payroll.Master.StateMaster;
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
/// Service implementation for Municipal Payroll State Master CRUD operations
/// </summary>
public class PayrollStateMasterService : BaseCommonCrudService<PayrollStateMasterEntity, PayrollStateMasterDto, CreatePayrollStateMasterDto, UpdatePayrollStateMasterDto, PayrollStateMasterQueryParameters, int>, IPayrollStateMasterService
{
    private readonly IRepository<PayrollDistrictMasterEntity, int> _districtRepository;
    private readonly ICurrentUserService _currentUserService;

    public PayrollStateMasterService(
        IRepository<PayrollStateMasterEntity, int> repository,
        IRepository<PayrollDistrictMasterEntity, int> districtRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _districtRepository = districtRepository;
        _currentUserService = currentUserService;
    }

    public override Task<PayrollStateMasterDto> CreateAsync(CreatePayrollStateMasterDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<PayrollStateMasterDto?> UpdateAsync(int id, UpdatePayrollStateMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        updateDto.UpdatedBy = _currentUserService.GetCurrentUserId();
        return base.UpdateAsync(id, updateDto, cancellationToken);
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

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        PayrollStateMasterEntity currentEntity,
        PayrollStateMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var hasActiveDistricts = await _districtRepository.GetQueryable().AsNoTracking()
                .AnyAsync(d => d.StateId == id && d.IsActive, cancellationToken);

            if (hasActiveDistricts)
            {
                return ValidationResult.Failure(
                    nameof(PayrollStateMasterEntity.IsActive),
                    "This State cannot be deactivated because it has active Districts. Please deactivate all active Districts for this State first.");
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        PayrollStateMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        var hasDistricts = await _districtRepository.GetQueryable().AsNoTracking()
            .AnyAsync(d => d.StateId == id, cancellationToken);

        if (hasDistricts)
        {
            return ValidationResult.Failure(
                nameof(PayrollStateMasterEntity.Id),
                "This State cannot be deleted because it has Districts. Please delete all Districts for this State first.");
        }

        return ValidationResult.Success();
    }
}
