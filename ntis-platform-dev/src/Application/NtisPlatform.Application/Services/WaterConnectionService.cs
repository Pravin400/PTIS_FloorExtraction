using NtisPlatform.Application.Helpers;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Master.WaterConnection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class WaterConnectionService
    : BaseCommonCrudService<WaterConnectionMasterEntity, WaterConnectionDto, CreateWaterConnectionDto, UpdateWaterConnectionDto, WaterConnectionQueryParameters, int>,
      IWaterConnectionService
{
    private readonly IReferenceValidationService _referenceValidator;
    private readonly IRepository<WaterRateMasterEntity, int> _rateRepository;
    private readonly IRepository<YearMasterEntity, int> _yearRepository;
    private readonly IWaterConnectionDetailsService _detailsService;
    private readonly ILogger<WaterConnectionService> _logger;

    public WaterConnectionService(
        IRepository<WaterConnectionMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IReferenceValidationService referenceValidator,
        IRepository<WaterRateMasterEntity, int> rateRepository,
        IRepository<YearMasterEntity, int> yearRepository,
        IWaterConnectionDetailsService detailsService,
        ILogger<WaterConnectionService> logger)
        : base(repository, unitOfWork, mapper)
    {
        _referenceValidator = referenceValidator;
        _rateRepository = rateRepository;
        _yearRepository = yearRepository;
        _detailsService = detailsService;
        _logger = logger;
    }

    protected override IQueryable<WaterConnectionMasterEntity> ApplyIncludes(
        IQueryable<WaterConnectionMasterEntity> query)
        => query
            .Include(x => x.WaterConnectionType)
            .Include(x => x.WaterConnectionSize)
            .Include(x => x.WaterConnectionStatus);

    // Base GetById — uses auto-detected current FY (no financeYearId param available on base signature)
    public override async Task<WaterConnectionDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => await GetByIdWithFinanceYearAsync(id, financeYearId: null, cancellationToken);

    // Extended GetById — caller may supply a specific financeYearId
    public async Task<WaterConnectionDto?> GetByIdWithFinanceYearAsync(
        int id,
        int? financeYearId,
        CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetQueryable()
            .Include(x => x.WaterConnectionType)
            .Include(x => x.WaterConnectionSize)
            .Include(x => x.WaterConnectionStatus)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity == null) return null;

        var dto = _mapper.Map<WaterConnectionDto>(entity);
        await PopulateRateFieldsAsync(new[] { dto }, financeYearId, cancellationToken);
        return dto;
    }

    // GetAll — forwards WaterConnectionQueryParameters.FinanceYearId to the rate lookup
    public override async Task<PagedResult<WaterConnectionDto>> GetAllAsync(
        WaterConnectionQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var result = await base.GetAllAsync(queryParameters, cancellationToken);
        await PopulateRateFieldsAsync(result.Items, queryParameters.FinanceYearId, cancellationToken);
        return result;
    }

    /// <summary>
    /// Resolves the financial year (by id if supplied, otherwise current date), fetches all matching
    /// active rate rows in one query, then sets ApplicableRate and ApplicableCharges on every DTO.
    ///
    /// ApplicableRate  = WaterRateMaster.YearlyRate
    /// ApplicableCharges = CEILING((YearlyRate / 12) * ChargeMonths) - always rounds up to nearest whole number
    ///   where ChargeMonths counts months from MAX(ConnectionStartDate, FYStart)
    ///                                          to MIN(ConnectionStopDate ?? FYEnd, FYEnd) inclusive.
    /// </summary>
    private async Task PopulateRateFieldsAsync(
        IEnumerable<WaterConnectionDto> dtos,
        int? financeYearId,
        CancellationToken cancellationToken)
    {
        var dtoList = dtos.ToList();
        if (dtoList.Count == 0) return;

        YearMasterEntity? year;
        if (financeYearId.HasValue)
        {
            year = await _yearRepository.GetByIdAsync(financeYearId.Value, cancellationToken);
        }
        else
        {
            var today = DateTime.Today;
            year = await _yearRepository.GetQueryable()
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    y => y.IsActive && y.StartDate <= today && y.EndDate >= today,
                    cancellationToken);

            year ??= await _yearRepository.GetQueryable()
                .AsNoTracking()
                .FirstOrDefaultAsync(y => y.IsActive, cancellationToken);
        }

        if (year == null) return;

        var fyStart = year.StartDate?.Date ?? new DateTime(year.Year > 0 ? year.Year : DateTime.Today.Year, 4, 1);
        var fyEnd   = year.EndDate?.Date   ?? fyStart.AddYears(1).AddDays(-1);

        var rates = await _rateRepository.GetQueryable()
            .AsNoTracking()
            .Where(r => r.FinanceYearId == year.Id && r.IsActive)
            .ToListAsync(cancellationToken);

        if (rates.Count == 0) return;

        var rateDict = rates.ToDictionary(r => (r.WaterConnectionTypeId, r.WaterConnectionSizeId));

        foreach (var dto in dtoList)
        {
            if (!dto.WaterConnectionTypeId.HasValue || !dto.WaterConnectionSizeId.HasValue || !dto.ConnectionStartDate.HasValue)
            {
                continue;
            }

            if (!rateDict.TryGetValue((dto.WaterConnectionTypeId.Value, dto.WaterConnectionSizeId.Value), out var rate))
                continue;

            var (applicableRate, category) = WaterRateCalculationHelper.ResolveApplicableRate(
                rate.YearlyRate,
                rate.MonthlyRate,
                rate.QuarterlyRate);

            dto.ApplicableRate = applicableRate;
            dto.Category = category;

            // Connection has no overlap with this FY 
            if (dto.ConnectionStopDate.HasValue && dto.ConnectionStopDate.Value.Date < fyStart) continue;
            if (dto.ConnectionStartDate.Value.Date > fyEnd) continue;

            // Pro-rata bill: same formula as WaterConnectionDetailsService.GenerateBillAsync
            var chargeStart = dto.ConnectionStartDate.Value.Date > fyStart
                ? dto.ConnectionStartDate.Value.Date
                : fyStart;

            var chargeEnd = dto.ConnectionStopDate.HasValue && dto.ConnectionStopDate.Value.Date < fyEnd
                ? dto.ConnectionStopDate.Value.Date
                : fyEnd;

            var chargeMonths = (chargeEnd.Year - chargeStart.Year) * 12
                             + chargeEnd.Month - chargeStart.Month + 1;

            if (chargeMonths > 0)
            {
                dto.ApplicableCharges = WaterRateCalculationHelper.CalculateWaterBill(
                    rate.YearlyRate,
                    rate.MonthlyRate,
                    rate.QuarterlyRate,
                    chargeMonths);
            }
        }
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id,
        WaterConnectionMasterEntity currentEntity,
        WaterConnectionMasterEntity updatedEntity,
        CancellationToken cancellationToken = default)
    {
        if (currentEntity.IsActive && !updatedEntity.IsActive)
            return await _referenceValidator.ValidateReferencesAsync<WaterConnectionMasterEntity>(id, cancellationToken);
        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeleteAsync(
        int id,
        WaterConnectionMasterEntity entity,
        CancellationToken cancellationToken = default)
    {
        return await _referenceValidator.ValidateReferencesAsync<WaterConnectionMasterEntity>(id, cancellationToken);
    }

    public override async Task<WaterConnectionDto> CreateAsync(CreateWaterConnectionDto createDto, CancellationToken cancellationToken = default)
    {
        var dto = await base.CreateAsync(createDto, cancellationToken);

        // Automatically generate bill details for the current financial year
        try
        {
            var today = DateTime.Today;
            var currentYear = await _yearRepository.GetQueryable()
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    y => y.IsActive && y.StartDate <= today && y.EndDate >= today,
                    cancellationToken);

            if (currentYear != null)
            {
                _logger.LogInformation("Generating WaterConnectionDetails for WaterConnectionId {WaterConnectionId} and FinanceYearId {FinanceYearId}", dto.Id, currentYear.Id);
                await _detailsService.GenerateBillAsync(dto.Id, currentYear.Id, cancellationToken);
                _logger.LogInformation("Successfully generated WaterConnectionDetails for WaterConnectionId {WaterConnectionId}", dto.Id);
            }
            else
            {
                _logger.LogWarning("No active financial year found for today's date. WaterConnectionDetails not generated for WaterConnectionId {WaterConnectionId}", dto.Id);
            }
        }
        catch (OperationCanceledException)
        {
            // Re-throw cancellation to allow proper request cancellation handling
            throw;
        }
        catch (Exception ex)
        {
            // Only swallow genuine bill-generation failures (not cancellation)
            _logger.LogError(ex, "Failed to generate WaterConnectionDetails for WaterConnectionId {WaterConnectionId}. The bill can be generated later manually.", dto.Id);
        }

        return dto;
    }
}
