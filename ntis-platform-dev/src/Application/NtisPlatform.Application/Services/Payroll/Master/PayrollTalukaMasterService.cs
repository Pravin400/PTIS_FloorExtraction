using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Payroll.Master.TalukaMaster;
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
/// Service implementation for Municipal Payroll Taluka Master CRUD operations
/// </summary>
public class PayrollTalukaMasterService : BaseCommonCrudService<PayrollTalukaMasterEntity, PayrollTalukaMasterDto, CreatePayrollTalukaMasterDto, UpdatePayrollTalukaMasterDto, PayrollTalukaMasterQueryParameters, int>, IPayrollTalukaMasterService
{
    private readonly IRepository<PayrollDistrictMasterEntity, int> _districtRepository;
    private readonly IRepository<PayrollVillageMasterEntity, int> _villageRepository;
    private readonly ICurrentUserService _currentUserService;

    public PayrollTalukaMasterService(
        IRepository<PayrollTalukaMasterEntity, int> repository,
        IRepository<PayrollDistrictMasterEntity, int> districtRepository,
        IRepository<PayrollVillageMasterEntity, int> villageRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _districtRepository = districtRepository;
        _villageRepository = villageRepository;
        _currentUserService = currentUserService;
    }

    public override async Task<PayrollTalukaMasterDto> CreateAsync(CreatePayrollTalukaMasterDto createDto, CancellationToken cancellationToken = default)
    {
        await EnsureDistrictExistsAsync(createDto.DistrictId, OperationType.Create, cancellationToken);
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return await base.CreateAsync(createDto, cancellationToken);
    }

    public override async Task<PayrollTalukaMasterDto?> UpdateAsync(int id, UpdatePayrollTalukaMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        await EnsureDistrictExistsAsync(updateDto.DistrictId, OperationType.Update, cancellationToken);
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

    protected override async Task<ValidationResult> ValidateForCreateAsync(PayrollTalukaMasterEntity entity, CancellationToken cancellationToken = default)
    {
        var exists = await _districtRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == entity.DistrictId && x.IsActive, cancellationToken);

        if (!exists)
        {
            return ValidationResult.Failure(nameof(entity.DistrictId), $"District with ID {entity.DistrictId} does not exist or is inactive.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        PayrollTalukaMasterEntity currentEntity,
        PayrollTalukaMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            var hasActiveVillages = await _villageRepository.GetQueryable().AsNoTracking()
                .AnyAsync(v => v.TalukaId == id && v.IsActive, cancellationToken);

            if (hasActiveVillages)
            {
                return ValidationResult.Failure(
                    nameof(PayrollTalukaMasterEntity.IsActive),
                    "This Taluka cannot be deactivated because it has active Villages. Please deactivate all active Villages for this Taluka first.");
            }
        }

        var exists = await _districtRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == updatedEntity.DistrictId && x.IsActive, cancellationToken);

        if (!exists)
        {
            return ValidationResult.Failure(nameof(updatedEntity.DistrictId), $"District with ID {updatedEntity.DistrictId} does not exist or is inactive.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        PayrollTalukaMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        var hasVillages = await _villageRepository.GetQueryable().AsNoTracking()
            .AnyAsync(v => v.TalukaId == id, cancellationToken);

        if (hasVillages)
        {
            return ValidationResult.Failure(
                nameof(PayrollTalukaMasterEntity.Id),
                "This Taluka cannot be deleted because it has Villages. Please delete all Villages for this Taluka first.");
        }

        return ValidationResult.Success();
    }

    private async Task EnsureDistrictExistsAsync(int districtId, OperationType operationType, CancellationToken cancellationToken)
    {
        var exists = await _districtRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == districtId && x.IsActive, cancellationToken);

        if (!exists)
        {
            throw new ValidationException(
                nameof(CreatePayrollTalukaMasterDto.DistrictId),
                $"District with ID {districtId} does not exist or is inactive.",
                operationType);
        }
    }
}
