using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.WaterBill.Master;

public class BillingPeriodService
    : BaseCommonCrudService<BillingPeriodEntity, BillingPeriodDto, CreateBillingPeriodDto, UpdateBillingPeriodDto, BillingPeriodQueryParameters, int>,
      IBillingPeriodService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<YearMasterEntity, int> _financialYearRepository;
    private readonly IRepository<BillingFrequencyMasterEntity, int> _billingFrequencyRepository;

    public BillingPeriodService(
        IRepository<BillingPeriodEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        IRepository<YearMasterEntity, int> financialYearRepository,
        IRepository<BillingFrequencyMasterEntity, int> billingFrequencyRepository)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _financialYearRepository = financialYearRepository;
        _billingFrequencyRepository = billingFrequencyRepository;
    }

    protected override IQueryable<BillingPeriodEntity> ApplyIncludes(IQueryable<BillingPeriodEntity> query)
    {
        return query
            .Include(x => x.FinancialYear)
            .Include(x => x.BillingFrequency);
    }

    public override async Task<PagedResult<BillingPeriodDto>> GetAllAsync(
        BillingPeriodQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var query = _repository.GetQueryable().AsNoTracking();

        if (queryParameters.Id.HasValue)
        {
            query = query.Where(x => x.Id == queryParameters.Id.Value);
        }

        if (queryParameters.FinancialYearId.HasValue)
        {
            query = query.Where(x => x.FinancialYearId == queryParameters.FinancialYearId.Value);
        }

        if (queryParameters.BillingFrequencyId.HasValue)
        {
            query = query.Where(x => x.BillingFrequencyId == queryParameters.BillingFrequencyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SearchTerm))
        {
            var term = queryParameters.SearchTerm.Trim();
            query = query.Where(x =>
                x.BillingPeriodCode.Contains(term) ||
                (x.FinancialYear != null && (x.FinancialYear.Year.ToString().Contains(term) || (x.FinancialYear.YearCode != null && x.FinancialYear.YearCode.Contains(term)))) ||
                (x.BillingFrequency != null && (x.BillingFrequency.BillingFrequency.Contains(term) || x.BillingFrequency.BillingFrequencyCode.Contains(term))));
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            query = queryParameters.SortBy.ToLower() switch
            {
                "billingperiodcode" => isDesc ? query.OrderByDescending(x => x.BillingPeriodCode) : query.OrderBy(x => x.BillingPeriodCode),
                "financialyear" => isDesc ? query.OrderByDescending(x => x.FinancialYear != null ? (x.FinancialYear.YearCode ?? x.FinancialYear.Year.ToString()) : "") : query.OrderBy(x => x.FinancialYear != null ? (x.FinancialYear.YearCode ?? x.FinancialYear.Year.ToString()) : ""),
                "billingfrequency" => isDesc ? query.OrderByDescending(x => x.BillingFrequency != null ? x.BillingFrequency.BillingFrequency : "") : query.OrderBy(x => x.BillingFrequency != null ? x.BillingFrequency.BillingFrequency : ""),
                "sequenceno" => isDesc ? query.OrderByDescending(x => x.SequenceNo) : query.OrderBy(x => x.SequenceNo),
                "periodfromdate" => isDesc ? query.OrderByDescending(x => x.PeriodFromDate) : query.OrderBy(x => x.PeriodFromDate),
                "periodtodate" => isDesc ? query.OrderByDescending(x => x.PeriodToDate) : query.OrderBy(x => x.PeriodToDate),
                "billgenerationdate" => isDesc ? query.OrderByDescending(x => x.BillGenerationDate) : query.OrderBy(x => x.BillGenerationDate),
                "duedate" => isDesc ? query.OrderByDescending(x => x.DueDate) : query.OrderBy(x => x.DueDate),
                "gracedays" => isDesc ? query.OrderByDescending(x => x.GraceDays) : query.OrderBy(x => x.GraceDays),
                "id" => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id),
                _ => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id)
            };
        }
        else
        {
            query = query.OrderBy(x => x.Id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var queryWithIncludes = ApplyIncludes(query);
        var pagedQuery = queryWithIncludes
            .Skip(queryParameters.PageSize == -1 ? 0 : (queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize);

        var entities = await pagedQuery.ToListAsync(cancellationToken);
        var items = _mapper.Map<List<BillingPeriodDto>>(entities);

        var pageNumber = queryParameters.PageSize == -1 ? 1 : queryParameters.PageNumber;
        var pageSize = queryParameters.PageSize == -1 ? totalCount : queryParameters.PageSize;

        return new PagedResult<BillingPeriodDto>(items, totalCount, pageNumber, pageSize);
    }

    public override async Task<BillingPeriodDto> CreateAsync(CreateBillingPeriodDto createDto, CancellationToken cancellationToken = default)
    {
        if (!createDto.SequenceNo.HasValue || createDto.SequenceNo.Value <= 0)
        {
            var maxSeq = await _repository.GetQueryable().AsNoTracking()
                .Where(x => x.FinancialYearId == createDto.FinancialYearId && x.BillingFrequencyId == createDto.BillingFrequencyId)
                .MaxAsync(x => (int?)x.SequenceNo, cancellationToken) ?? 0;
            createDto.SequenceNo = maxSeq + 1;
        }

        return await base.CreateAsync(createDto, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        BillingPeriodEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await ValidateBillingPeriodDomainRulesAsync(0, entity, cancellationToken);
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        BillingPeriodEntity currentEntity,
        BillingPeriodEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        var domainValidation = await ValidateBillingPeriodDomainRulesAsync(id, updatedEntity, cancellationToken);
        if (!domainValidation.IsValid)
        {
            return domainValidation;
        }

        if (currentEntity.IsActive && !updatedEntity.IsActive)
        {
            return await _referenceValidator.ValidateReferencesAsync<BillingPeriodEntity>(id, cancellationToken);
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        BillingPeriodEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<BillingPeriodEntity>(id, cancellationToken);
    }

    private async Task<ValidationResult> ValidateBillingPeriodDomainRulesAsync(
        int currentId,
        BillingPeriodEntity entity,
        CancellationToken cancellationToken)
    {
        // 1. Basic Date Relationships
        if (entity.PeriodFromDate == default || entity.PeriodFromDate == DateTime.MinValue ||
            entity.PeriodToDate == default || entity.PeriodToDate == DateTime.MinValue)
        {
            return ValidationResult.Failure("PeriodFromDate and PeriodToDate must be valid dates.");
        }

        if (entity.PeriodFromDate > entity.PeriodToDate)
        {
            return ValidationResult.Failure("PeriodFromDate cannot be later than PeriodToDate.");
        }

        if (entity.CurrentPenaltyStartDate.HasValue && entity.CurrentPenaltyEndDate.HasValue &&
            entity.CurrentPenaltyStartDate.Value > entity.CurrentPenaltyEndDate.Value)
        {
            return ValidationResult.Failure("CurrentPenaltyStartDate cannot be later than CurrentPenaltyEndDate.");
        }

        if (entity.PendingPenaltyStartDate.HasValue && entity.PendingPenaltyEndDate.HasValue &&
            entity.PendingPenaltyStartDate.Value > entity.PendingPenaltyEndDate.Value)
        {
            return ValidationResult.Failure("PendingPenaltyStartDate cannot be later than PendingPenaltyEndDate.");
        }

        if (entity.BillGenerationDate.HasValue && entity.DueDate.HasValue &&
            entity.BillGenerationDate.Value > entity.DueDate.Value)
        {
            return ValidationResult.Failure("BillGenerationDate cannot be later than DueDate.");
        }

        // 2. Validate Financial Year existence
        var fy = await _financialYearRepository.GetByIdAsync(entity.FinancialYearId, cancellationToken);
        if (fy == null)
        {
            return ValidationResult.Failure($"Financial Year with ID {entity.FinancialYearId} does not exist.");
        }

        if (entity.PeriodFromDate < fy.StartDate || entity.PeriodToDate > fy.EndDate)
        {
            return ValidationResult.Failure(
                $"Billing period dates ({entity.PeriodFromDate:yyyy-MM-dd} to {entity.PeriodToDate:yyyy-MM-dd}) must fall within Financial Year '{fy.YearCode ?? fy.Year.ToString()}' ({fy.StartDate:yyyy-MM-dd} to {fy.EndDate:yyyy-MM-dd}).");
        }

        // 3. Validate Billing Frequency existence, active status, and sequence limits
        var freq = await _billingFrequencyRepository.GetByIdAsync(entity.BillingFrequencyId, cancellationToken);
        if (freq == null)
        {
            return ValidationResult.Failure($"Billing Frequency with ID {entity.BillingFrequencyId} does not exist.");
        }

        if (!freq.IsActive)
        {
            return ValidationResult.Failure($"Billing Frequency '{freq.BillingFrequency}' is inactive and cannot be used.");
        }

        // 4. Validate Max Period Count for Financial Year and Billing Frequency
        if (freq.PeriodsPerYear > 0)
        {
            var existingCount = await _repository.GetQueryable().AsNoTracking()
                .CountAsync(x => x.Id != currentId &&
                                 x.FinancialYearId == entity.FinancialYearId &&
                                 x.BillingFrequencyId == entity.BillingFrequencyId, cancellationToken);

            if (existingCount >= freq.PeriodsPerYear)
            {
                return ValidationResult.Failure(
                    $"Cannot create more than {freq.PeriodsPerYear} billing period(s) for '{freq.BillingFrequency}' in the selected Financial Year. All {freq.PeriodsPerYear} period(s) already exist.");
            }
        }

        // 5. Validate Sequence bounds
        if (entity.SequenceNo < 1 || (freq.PeriodsPerYear > 0 && entity.SequenceNo > freq.PeriodsPerYear))
        {
            return ValidationResult.Failure($"SequenceNo must be between 1 and {freq.PeriodsPerYear} for '{freq.BillingFrequency}'.");
        }

        // 5. Duplicate SequenceNo for same FinancialYear and BillingFrequency
        var isSeqDuplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != currentId &&
                           x.FinancialYearId == entity.FinancialYearId &&
                           x.BillingFrequencyId == entity.BillingFrequencyId &&
                           x.SequenceNo == entity.SequenceNo, cancellationToken);
        if (isSeqDuplicate)
        {
            return ValidationResult.Failure($"A billing period with Sequence No {entity.SequenceNo} already exists for the selected Financial Year and Billing Frequency.");
        }

        // 6. Duplicate BillingPeriodCode
        var isCodeDuplicate = await _repository.GetQueryable().AsNoTracking()
            .AnyAsync(x => x.Id != currentId && x.BillingPeriodCode.ToLower() == entity.BillingPeriodCode.Trim().ToLower(), cancellationToken);
        if (isCodeDuplicate)
        {
            return ValidationResult.Failure($"BillingPeriodCode '{entity.BillingPeriodCode}' already exists.");
        }

        // 7. Overlapping Billing Periods for the same FY and Frequency
        var overlappingPeriod = await _repository.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id != currentId &&
                                      x.FinancialYearId == entity.FinancialYearId &&
                                      x.BillingFrequencyId == entity.BillingFrequencyId &&
                                      entity.PeriodFromDate <= x.PeriodToDate &&
                                      entity.PeriodToDate >= x.PeriodFromDate, cancellationToken);
        if (overlappingPeriod != null)
        {
            return ValidationResult.Failure(
                $"Billing period dates ({entity.PeriodFromDate:yyyy-MM-dd} to {entity.PeriodToDate:yyyy-MM-dd}) overlap with existing period '{overlappingPeriod.BillingPeriodCode}' ({overlappingPeriod.PeriodFromDate:yyyy-MM-dd} to {overlappingPeriod.PeriodToDate:yyyy-MM-dd}).");
        }

        return ValidationResult.Success();
    }
}
