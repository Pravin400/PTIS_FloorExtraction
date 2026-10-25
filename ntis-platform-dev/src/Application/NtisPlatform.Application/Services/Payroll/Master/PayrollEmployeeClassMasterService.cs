using AutoMapper;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Payroll.Master;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Payroll.Master;

/// <summary>
/// Service implementation for Municipal Payroll Employee Class Master CRUD operations
/// </summary>
public class PayrollEmployeeClassMasterService : BaseCommonCrudService<PayrollEmployeeClassMasterEntity, PayrollEmployeeClassMasterDto, CreatePayrollEmployeeClassMasterDto, UpdatePayrollEmployeeClassMasterDto, PayrollEmployeeClassMasterQueryParameters, int>, IPayrollEmployeeClassMasterService
{
    private readonly ICurrentUserService _currentUserService;

    public PayrollEmployeeClassMasterService(
        IRepository<PayrollEmployeeClassMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserService currentUserService)
        : base(repository, unitOfWork, mapper)
    {
        _currentUserService = currentUserService;
    }

    public override Task<PayrollEmployeeClassMasterDto> CreateAsync(CreatePayrollEmployeeClassMasterDto createDto, CancellationToken cancellationToken = default)
    {
        createDto.CreatedBy = _currentUserService.GetCurrentUserId();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<PayrollEmployeeClassMasterDto?> UpdateAsync(int id, UpdatePayrollEmployeeClassMasterDto updateDto, CancellationToken cancellationToken = default)
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
}
