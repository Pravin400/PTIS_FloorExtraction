using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master;

public class BillingFrequencyMasterService
    : BaseCommonCrudService<BillingFrequencyMasterEntity, BillingFrequencyMasterDto, CreateBillingFrequencyMasterDto, UpdateBillingFrequencyMasterDto, BillingFrequencyMasterQueryParameters, int>,
      IBillingFrequencyMasterService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<BillingPeriodEntity, int> _billingPeriodRepository;

    public BillingFrequencyMasterService(
        IRepository<BillingFrequencyMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        IRepository<BillingPeriodEntity, int> billingPeriodRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _billingPeriodRepository = billingPeriodRepository;
    }

    public override async Task<PagedResult<BillingFrequencyMasterDto>> GetAllAsync(
        BillingFrequencyMasterQueryParameters queryParameters,
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
            query = query.Where(x => x.BillingFrequency.Contains(term) || x.BillingFrequencyCode.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = queryParameters.SortBy.ToLower() switch
            {
                "billingfrequency" => isDesc ? query.OrderByDescending(x => x.BillingFrequency) : query.OrderBy(x => x.BillingFrequency),
                "billingfrequencycode" => isDesc ? query.OrderByDescending(x => x.BillingFrequencyCode) : query.OrderBy(x => x.BillingFrequencyCode),
                "periodsperyear" => isDesc ? query.OrderByDescending(x => x.PeriodsPerYear) : query.OrderBy(x => x.PeriodsPerYear),
                "sequenceno" => isDesc ? query.OrderByDescending(x => x.SequenceNo) : query.OrderBy(x => x.SequenceNo),
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
        var items = _mapper.Map<List<BillingFrequencyMasterDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<BillingFrequencyMasterDto>(items, totalCount, pageNumber, pageSize);
    }

    public override async Task<BillingFrequencyMasterDto> CreateAsync(CreateBillingFrequencyMasterDto createDto, CancellationToken cancellationToken = default)
    {
        if (createDto.SequenceNo == null || createDto.SequenceNo <= 0)
        {
            var maxSequence = await _repository.GetQueryable().AsNoTracking()
                .MaxAsync(x => (int?)x.SequenceNo, cancellationToken) ?? 0;
            createDto.SequenceNo = maxSequence + 1;
        }

        return await base.CreateAsync(createDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        BillingFrequencyMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        if (entity.PeriodsPerYear < 1)
        {
            return ValidationResult.Failure("PeriodsPerYear must be at least 1.");
        }

        var isCodeDuplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.BillingFrequencyCode.ToLower() == entity.BillingFrequencyCode.Trim().ToLower(), cancellationToken);
        if (isCodeDuplicate)
        {
            return ValidationResult.Failure($"BillingFrequencyCode '{entity.BillingFrequencyCode}' already exists.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        BillingFrequencyMasterEntity currentEntity,
        BillingFrequencyMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (updatedEntity.PeriodsPerYear < 1)
        {
            return ValidationResult.Failure("PeriodsPerYear must be at least 1.");
        }

        var isCodeDuplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != id && x.BillingFrequencyCode.ToLower() == updatedEntity.BillingFrequencyCode.Trim().ToLower(), cancellationToken);
        if (isCodeDuplicate)
        {
            return ValidationResult.Failure($"BillingFrequencyCode '{updatedEntity.BillingFrequencyCode}' already exists.");
        }


        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<BillingFrequencyMasterEntity>(id, cancellationToken);
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        BillingFrequencyMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<BillingFrequencyMasterEntity>(id, cancellationToken);
    }
}
