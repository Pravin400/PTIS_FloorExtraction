using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.MeterTypeMaster;

public class MeterTypeMasterService
    : BaseCommonCrudService<MeterTypeMasterEntity, MeterTypeMasterDto, CreateMeterTypeMasterDto, UpdateMeterTypeMasterDto, MeterTypeMasterQueryParameters, int>,
      IMeterTypeMasterService
{
    private readonly IReferenceValidationService _referenceValidator;

    public MeterTypeMasterService(
        IRepository<MeterTypeMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    public override async Task<PagedResult<MeterTypeMasterDto>> GetAllAsync(
        MeterTypeMasterQueryParameters queryParameters,
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
            query = query.Where(x => x.MeterType.Contains(term) || x.MeterTypeCode.Contains(term) || (x.Description != null && x.Description.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = queryParameters.SortBy.ToLower() switch
            {
                "metertype" => isDesc ? query.OrderByDescending(x => x.MeterType) : query.OrderBy(x => x.MeterType),
                "metertypecode" => isDesc ? query.OrderByDescending(x => x.MeterTypeCode) : query.OrderBy(x => x.MeterTypeCode),
                "description" => isDesc ? query.OrderByDescending(x => x.Description) : query.OrderBy(x => x.Description),
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
        var items = _mapper.Map<List<MeterTypeMasterDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<MeterTypeMasterDto>(items, totalCount, pageNumber, pageSize);
    }

    public override Task<MeterTypeMasterDto> CreateAsync(
        CreateMeterTypeMasterDto createDto,
        CancellationToken cancellationToken = default)
    {
        createDto.MeterTypeCode = createDto.MeterTypeCode.Trim();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<MeterTypeMasterDto?> UpdateAsync(
        int id,
        UpdateMeterTypeMasterDto updateDto,
        CancellationToken cancellationToken = default)
    {
        updateDto.MeterTypeCode = updateDto.MeterTypeCode.Trim();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override Task<ValidationResult> ValidateForCreateAsync(
        MeterTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
        => ValidateUniqueCodeAsync(entity, excludeId: null, cancellationToken);

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        MeterTypeMasterEntity currentEntity,
        MeterTypeMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateValidation = await ValidateUniqueCodeAsync(updatedEntity, id, cancellationToken);
        if (!duplicateValidation.IsValid)
            return duplicateValidation;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<MeterTypeMasterEntity>(id, cancellationToken);

        return ValidationResult.Success();
    }

    /// <summary>
    /// Mirrors the MeterTypeCode uniqueness expectation. Shared by create and update
    /// validation so the two paths can never drift apart.
    /// </summary>
    private async Task<ValidationResult> ValidateUniqueCodeAsync(
        MeterTypeMasterEntity entity,
        int? excludeId,
        CancellationToken cancellationToken)
    {
        var query = _repository.GetQueryable().AsNoTracking();
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);

        var isDuplicate = await query.AnyAsync(
            x => x.MeterTypeCode.ToLower() == entity.MeterTypeCode.ToLower(), cancellationToken);

        return isDuplicate
            ? ValidationResult.Failure($"MeterTypeCode '{entity.MeterTypeCode}' already exists.")
            : ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        MeterTypeMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<MeterTypeMasterEntity>(id, cancellationToken);
    }
}
