using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.MeterTestStatusMaster;

public class MeterTestStatusMasterService
    : BaseCommonCrudService<MeterTestStatusMasterEntity, MeterTestStatusMasterDto, CreateMeterTestStatusMasterDto, UpdateMeterTestStatusMasterDto, MeterTestStatusMasterQueryParameters, int>,
      IMeterTestStatusMasterService
{
    private readonly IReferenceValidationService _referenceValidator;

    public MeterTestStatusMasterService(
        IRepository<MeterTestStatusMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    public override async Task<PagedResult<MeterTestStatusMasterDto>> GetAllAsync(
        MeterTestStatusMasterQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking();

        if (queryParameters.Id.HasValue)
        {
            query = query.Where(x => x.Id == queryParameters.Id.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SearchTerm))
        {
            var term = queryParameters.SearchTerm.Trim();
            query = query.Where(x => x.MeterTestStatus.Contains(term) || x.MeterTestStatusCode.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = queryParameters.SortBy.ToLower() switch
            {
                "meterteststatus" => isDesc ? query.OrderByDescending(x => x.MeterTestStatus) : query.OrderBy(x => x.MeterTestStatus),
                "meterteststatuscode" => isDesc ? query.OrderByDescending(x => x.MeterTestStatusCode) : query.OrderBy(x => x.MeterTestStatusCode),
                "id" => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id),
                _ => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id)
            };
        }
        else
        {
            query = query.OrderBy(x => x.Id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagedQuery = query
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize);

        var entities = await pagedQuery.ToListAsync(cancellationToken);
        var items = _mapper.Map<List<MeterTestStatusMasterDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<MeterTestStatusMasterDto>(items, totalCount, pageNumber, pageSize);
    }

    public override Task<MeterTestStatusMasterDto> CreateAsync(
        CreateMeterTestStatusMasterDto createDto,
        CancellationToken cancellationToken = default)
    {
        createDto.MeterTestStatusCode = createDto.MeterTestStatusCode.Trim();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<MeterTestStatusMasterDto?> UpdateAsync(
        int id,
        UpdateMeterTestStatusMasterDto updateDto,
        CancellationToken cancellationToken = default)
    {
        updateDto.MeterTestStatusCode = updateDto.MeterTestStatusCode.Trim();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override Task<ValidationResult> ValidateForCreateAsync(
        MeterTestStatusMasterEntity entity,
        CancellationToken cancellationToken = default)
        => ValidateUniqueCodeAsync(entity, excludeId: null, cancellationToken);

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        MeterTestStatusMasterEntity currentEntity,
        MeterTestStatusMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateValidation = await ValidateUniqueCodeAsync(updatedEntity, id, cancellationToken);
        if (!duplicateValidation.IsValid)
            return duplicateValidation;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<MeterTestStatusMasterEntity>(id, cancellationToken);

        return ValidationResult.Success();
    }

    /// <summary>
    /// Mirrors the MeterTestStatusCode uniqueness expectation. Shared by create and update
    /// validation so the two paths can never drift apart.
    /// </summary>
    private async Task<ValidationResult> ValidateUniqueCodeAsync(
        MeterTestStatusMasterEntity entity,
        int? excludeId,
        CancellationToken cancellationToken)
    {
        var query = _repository.GetQueryable().AsNoTracking();
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);

        var isDuplicate = await query.AnyAsync(
            x => x.MeterTestStatusCode.ToLower() == entity.MeterTestStatusCode.ToLower(), cancellationToken);

        return isDuplicate
            ? ValidationResult.Failure($"MeterTestStatusCode '{entity.MeterTestStatusCode}' already exists.")
            : ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        MeterTestStatusMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<MeterTestStatusMasterEntity>(id, cancellationToken);
    }
}
