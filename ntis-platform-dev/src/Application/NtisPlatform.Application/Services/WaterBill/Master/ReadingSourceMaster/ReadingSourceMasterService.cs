using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master.ReadingSourceMaster;

public class ReadingSourceMasterService
    : BaseCommonCrudService<ReadingSourceMasterEntity, ReadingSourceMasterDto, CreateReadingSourceMasterDto, UpdateReadingSourceMasterDto, ReadingSourceMasterQueryParameters, int>,
      IReadingSourceMasterService
{
    private readonly IReferenceValidationService _referenceValidator;

    public ReadingSourceMasterService(
        IRepository<ReadingSourceMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
    }

    public override async Task<PagedResult<ReadingSourceMasterDto>> GetAllAsync(
        ReadingSourceMasterQueryParameters queryParameters,
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
            query = query.Where(x => x.ReadingSource.Contains(term) || x.ReadingSourceCode.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = queryParameters.SortBy.ToLower() switch
            {
                "readingsource" => isDesc ? query.OrderByDescending(x => x.ReadingSource) : query.OrderBy(x => x.ReadingSource),
                "readingsourcecode" => isDesc ? query.OrderByDescending(x => x.ReadingSourceCode) : query.OrderBy(x => x.ReadingSourceCode),
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
        var items = _mapper.Map<List<ReadingSourceMasterDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<ReadingSourceMasterDto>(items, totalCount, pageNumber, pageSize);
    }

    public override Task<ReadingSourceMasterDto> CreateAsync(
        CreateReadingSourceMasterDto createDto,
        CancellationToken cancellationToken = default)
    {
        createDto.ReadingSourceCode = createDto.ReadingSourceCode.Trim();
        return base.CreateAsync(createDto, cancellationToken);
    }

    public override Task<ReadingSourceMasterDto?> UpdateAsync(
        int id,
        UpdateReadingSourceMasterDto updateDto,
        CancellationToken cancellationToken = default)
    {
        updateDto.ReadingSourceCode = updateDto.ReadingSourceCode.Trim();
        return base.UpdateAsync(id, updateDto, cancellationToken);
    }

    protected override Task<ValidationResult> ValidateForCreateAsync(
        ReadingSourceMasterEntity entity,
        CancellationToken cancellationToken = default)
        => ValidateUniqueCodeAsync(entity, excludeId: null, cancellationToken);

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        ReadingSourceMasterEntity currentEntity,
        ReadingSourceMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var duplicateValidation = await ValidateUniqueCodeAsync(updatedEntity, id, cancellationToken);
        if (!duplicateValidation.IsValid)
            return duplicateValidation;

        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<ReadingSourceMasterEntity>(id, cancellationToken);

        return ValidationResult.Success();
    }

    /// <summary>
    /// Mirrors the ReadingSourceCode uniqueness expectation. Shared by create and update
    /// validation so the two paths can never drift apart.
    /// </summary>
    private async Task<ValidationResult> ValidateUniqueCodeAsync(
        ReadingSourceMasterEntity entity,
        int? excludeId,
        CancellationToken cancellationToken)
    {
        var query = _repository.GetQueryable().AsNoTracking();
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);

        var isDuplicate = await query.AnyAsync(
            x => x.ReadingSourceCode.ToLower() == entity.ReadingSourceCode.ToLower(), cancellationToken);

        return isDuplicate
            ? ValidationResult.Failure($"ReadingSourceCode '{entity.ReadingSourceCode}' already exists.")
            : ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        ReadingSourceMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<ReadingSourceMasterEntity>(id, cancellationToken);
    }
}
