using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;
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
/// Service implementation for Municipal Payroll Village Master CRUD operations
/// </summary>
public class PayrollVillageMasterService : BaseCommonCrudService<PayrollVillageMasterEntity, PayrollVillageMasterDto, CreatePayrollVillageMasterDto, UpdatePayrollVillageMasterDto, PayrollVillageMasterQueryParameters, int>, IPayrollVillageMasterService
{
    private readonly IRepository<PayrollTalukaMasterEntity, int> _talukaRepository;
    private readonly ICurrentUserService _currentUserService;

    public PayrollVillageMasterService(
        IRepository<PayrollVillageMasterEntity, int> repository,
        IRepository<PayrollTalukaMasterEntity, int> talukaRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _talukaRepository = talukaRepository;
        _currentUserService = currentUserService;
    }

    public override async Task<PayrollVillageMasterDto> CreateAsync(CreatePayrollVillageMasterDto createDto, CancellationToken cancellationToken = default)
    {
        await EnsureTalukaExistsAsync(createDto.TalukaId, OperationType.Create, cancellationToken);
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return await base.CreateAsync(createDto, cancellationToken);
    }

    public override async Task<PayrollVillageMasterDto?> UpdateAsync(int id, UpdatePayrollVillageMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        await EnsureTalukaExistsAsync(updateDto.TalukaId, OperationType.Update, cancellationToken);
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

    protected override async Task<ValidationResult> ValidateForCreateAsync(PayrollVillageMasterEntity entity, CancellationToken cancellationToken = default)
    {
        var exists = await _talukaRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == entity.TalukaId && x.IsActive, cancellationToken);

        if (!exists)
        {
            return ValidationResult.Failure(nameof(entity.TalukaId), $"Taluka with ID {entity.TalukaId} does not exist or is inactive.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        PayrollVillageMasterEntity currentEntity,
        PayrollVillageMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var exists = await _talukaRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == updatedEntity.TalukaId && x.IsActive, cancellationToken);

        if (!exists)
        {
            return ValidationResult.Failure(nameof(updatedEntity.TalukaId), $"Taluka with ID {updatedEntity.TalukaId} does not exist or is inactive.");
        }

        return ValidationResult.Success();
    }

    protected override Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        PayrollVillageMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(ValidationResult.Success());
    }

    private async Task EnsureTalukaExistsAsync(int talukaId, OperationType operationType, CancellationToken cancellationToken)
    {
        var exists = await _talukaRepository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id == talukaId && x.IsActive, cancellationToken);

        if (!exists)
        {
            throw new ValidationException(
                nameof(CreatePayrollVillageMasterDto.TalukaId),
                $"Taluka with ID {talukaId} does not exist or is inactive.",
                operationType);
        }
    }
}
