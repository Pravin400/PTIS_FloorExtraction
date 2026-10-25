using System.IO;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NtisPlatform.Application.DTOs.PropertyTaxOperations;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Options;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Enums;
using Microsoft.Extensions.Configuration;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService;
using NtisPlatform.Application.DTOs.CapitalValue;

namespace NtisPlatform.Application.Services.PropertyTaxOperations;

/// <summary>
/// Implements the Property Tax Operations workflow. "Add Tax" reuses
/// <see cref="IRateableValueService.CalculateAndSaveAsync"/> per eligible property, followed by the
/// Retrospective Rule Engine for the same property (the RV recalculation replaces the current-year
/// TransMast rows of a certificate with NETTAX rows; only the engine puts them back); execution is
/// synchronous for now but records a job + per-property results so the Audit &amp; Monitor screen
/// and runtime bar have real data.
/// </summary>
public class PropertyTaxOperationsService : IPropertyTaxOperationsService
{
    private readonly ICapitalValueService _capitalValueService;
    private readonly IPolicyConfigurationService _policyConfigService;
    private readonly IRepository<PropertyEntity, int> _propertyRepo;
    private readonly IRepository<PropertyTaxJobEntity, long> _jobRepo;
    private readonly IRepository<PropertyTaxJobDetailEntity, long> _jobDetailRepo;
    private readonly IRepository<PropertyScreenLockEntity, int> _lockRepo;
    private readonly IRepository<PropertyDetailsEntity, int> _propertyDetailsRepo;
    private readonly IRepository<YearMasterEntity, int> _yearMasterRepo;
    private readonly IRepository<WardEntity, int> _wardRepo;
    private readonly IRepository<ZoneEntity, int> _zoneRepo;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeRepo;
    private readonly IRepository<PropertyAssessmentStatusEntity, int> _propertyAssessmentStatusRepo;
    private readonly IRepository<RateEntity, int> _rateRepo;
    private readonly IRepository<TaxPercentageMasterRVEntity, int> _taxPercentageMasterRVRepo;
    private readonly IRepository<TaxMasterEntity, int> _taxMasterRepo;
    private readonly IRepository<TransMastEntity, int> _transMastRepo;
    private readonly IRepository<AssessmentYearRangeEntity, int> _assessmentYearRangeRepo;
    private readonly IRepository<TypeOfUseEntity, int> _typeOfUseRepo;
    private readonly IRepository<RateSectionDetailsEntity, int> _rateSectionDetailsRepo;
    private readonly IRepository<CSNDetailsEntity, int> _csnDetailsRepo;
    private readonly IRepository<RateMasterForCVEntity, int> _rateMasterForCVRepo;
    private readonly IRepository<TaxPercentageMasterCVEntity, int> _taxPercentageMasterCVRepo;
    private readonly IRepository<AssessmentYearRangeCVEntity, int> _assessmentYearRangeCVRepo;
    private readonly IRepository<PropertyTaxRecalcFlagEntity, long> _recalcFlagRepo;
    private readonly IRepository<MasterDataChangeBatchEntity, long> _changeBatchRepo;
    private readonly IRepository<MasterDataChangeEventEntity, long> _changeEventRepo;
    private readonly IRepository<DepreciationMasterEntity, int> _depreciationRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PropertyTaxOperationsService> _logger;
    private readonly IUserScreenAccessService _screenAccessService;
    private readonly IConfiguration _configuration;
    private readonly IRetrospectiveTaxRefresher _retrospectiveTaxRefresher;
    private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache? _memoryCache;
    private readonly IBackgroundTaskQueue? _backgroundTaskQueue;

    private const string NetTaxPolicyCode = "NETTAX";

    public PropertyTaxOperationsService(
        ICapitalValueService capitalValueService,
        IPolicyConfigurationService policyConfigService,
        IRepository<PropertyEntity, int> propertyRepo,
        IRepository<PropertyTaxJobEntity, long> jobRepo,
        IRepository<PropertyTaxJobDetailEntity, long> jobDetailRepo,
        IRepository<PropertyScreenLockEntity, int> lockRepo,
        IRepository<PropertyDetailsEntity, int> propertyDetailsRepo,
        IRepository<YearMasterEntity, int> yearMasterRepo,
        IRepository<WardEntity, int> wardRepo,
        IRepository<ZoneEntity, int> zoneRepo,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeRepo,
        IRepository<PropertyAssessmentStatusEntity, int> propertyAssessmentStatusRepo,
        IRepository<RateEntity, int> rateRepo,
        IRepository<TaxPercentageMasterRVEntity, int> taxPercentageMasterRVRepo,
        IRepository<TaxMasterEntity, int> taxMasterRepo,
        IRepository<TransMastEntity, int> transMastRepo,
        IRepository<AssessmentYearRangeEntity, int> assessmentYearRangeRepo,
        IRepository<TypeOfUseEntity, int> typeOfUseRepo,
        IRepository<RateSectionDetailsEntity, int> rateSectionDetailsRepo,
        IRepository<CSNDetailsEntity, int> csnDetailsRepo,
        IRepository<RateMasterForCVEntity, int> rateMasterForCVRepo,
        IRepository<TaxPercentageMasterCVEntity, int> taxPercentageMasterCVRepo,
        IRepository<AssessmentYearRangeCVEntity, int> assessmentYearRangeCVRepo,
        IRepository<PropertyTaxRecalcFlagEntity, long> recalcFlagRepo,
        IRepository<MasterDataChangeBatchEntity, long> changeBatchRepo,
        IRepository<MasterDataChangeEventEntity, long> changeEventRepo,
        IRepository<DepreciationMasterEntity, int> depreciationRepo,
        IUnitOfWork unitOfWork,
        ILogger<PropertyTaxOperationsService> logger,
        IUserScreenAccessService screenAccessService,
        IConfiguration configuration,
        IRetrospectiveTaxRefresher retrospectiveTaxRefresher,
        Microsoft.Extensions.Caching.Memory.IMemoryCache? memoryCache = null,
        IBackgroundTaskQueue? backgroundTaskQueue = null)
    {
        _capitalValueService = capitalValueService;
        _policyConfigService = policyConfigService;
        _propertyRepo = propertyRepo;
        _jobRepo = jobRepo;
        _jobDetailRepo = jobDetailRepo;
        _lockRepo = lockRepo;
        _propertyDetailsRepo = propertyDetailsRepo;
        _yearMasterRepo = yearMasterRepo;
        _wardRepo = wardRepo;
        _zoneRepo = zoneRepo;
        _propertyTypeRepo = propertyTypeRepo;
        _propertyAssessmentStatusRepo = propertyAssessmentStatusRepo;
        _rateRepo = rateRepo;
        _taxPercentageMasterRVRepo = taxPercentageMasterRVRepo;
        _taxMasterRepo = taxMasterRepo;
        _transMastRepo = transMastRepo;
        _assessmentYearRangeRepo = assessmentYearRangeRepo;
        _typeOfUseRepo = typeOfUseRepo;
        _rateSectionDetailsRepo = rateSectionDetailsRepo;
        _csnDetailsRepo = csnDetailsRepo;
        _rateMasterForCVRepo = rateMasterForCVRepo;
        _taxPercentageMasterCVRepo = taxPercentageMasterCVRepo;
        _assessmentYearRangeCVRepo = assessmentYearRangeCVRepo;
        _recalcFlagRepo = recalcFlagRepo;
        _changeBatchRepo = changeBatchRepo;
        _changeEventRepo = changeEventRepo;
        _depreciationRepo = depreciationRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _screenAccessService = screenAccessService;
        _configuration = configuration;
        _retrospectiveTaxRefresher = retrospectiveTaxRefresher;
        _memoryCache = memoryCache;
        _backgroundTaskQueue = backgroundTaskQueue;
    }

    // ---------------------------------------------------------------- Init

    public async Task<OperationsInitDto> GetInitAsync(int actingUserId, int? financeYearId = null, CancellationToken cancellationToken = default)
    {
        var today = DateTime.Today;

        var userScreens = (await _screenAccessService.GetUserScreensByUserIdAsync(actingUserId, cancellationToken)).ToList();
        
        bool canAddTax = userScreens.Any(s => s.ScreenCode == "PROP_TAX_OPS" && (s.HaveFullAccess || s.CanEdit));

        var allYears = await _yearMasterRepo.GetQueryable()
            .AsNoTracking()
            .OrderByDescending(y => y.Year)
            .ToListAsync(cancellationToken);

        var currentYearEntity = allYears.FirstOrDefault(y => y.IsActive)
            ?? allYears.FirstOrDefault(y => y.StartDate <= today && y.EndDate >= today)
            ?? allYears.FirstOrDefault();

        var selectedYearEntity = financeYearId.HasValue && financeYearId > 0
            ? allYears.FirstOrDefault(y => y.Id == financeYearId.Value)
            : currentYearEntity;

        int total = 0, transmast = 0, eligible = 0, skipped = 0;
        if (selectedYearEntity is not null)
        {
            (total, transmast, eligible, skipped) = await GetSummaryCountsAsync(selectedYearEntity.Id, cancellationToken);
        }
        else
        {
            total = await ActiveProperties().CountAsync(cancellationToken);
        }

        int runningJobs = await _jobRepo.GetQueryable().AsNoTracking()
            .CountAsync(j => j.Status == nameof(JobStatus.InProgress) && !j.MarkedForDeletion, cancellationToken);

        return new OperationsInitDto
        {
            FinanceYears = allYears.Select(y => new FinanceYearOptionDto
            {
                Value = y.Id.ToString(),
                Label = !string.IsNullOrWhiteSpace(y.YearCode) ? y.YearCode : $"{y.Year}-{(y.Year + 1) % 100:D2}",
                IsActive = y.IsActive
            }).ToList(),
            Permissions = new OperationPermissionsDto
            {
                AddTax = canAddTax
            },
            Summary = new OperationsSummaryDto
            {
                TotalProperties = total,
                TransmastProperties = transmast,
                EligibleRecords = eligible,
                SkippedRecords = skipped,
                RunningJobs = runningJobs
            }
        };
    }

    public Task<ImportTemplateDto> GetImportTemplateAsync(CancellationToken cancellationToken = default)
    {
        var template = new ImportTemplateDto
        {
            Columns = new List<ImportTemplateColumnDto>
            {
                new() { Key = "Ward", Header = "Ward", DataType = "string", Required = true },
                new() { Key = "PropertyNoPartitionNo", Header = "PropertyNo-PartitionNo", DataType = "string", Required = true }
            },
            ScopeCategories = new List<ScopeCategoryOptionDto>
            {
                new() { Id = (int)ScopeCategory.ZoneNode, Name = ScopeCategory.ZoneNode.ToString(), Description = ScopeCategory.ZoneNode.GetDescription(), ScopeType = ScopeCategory.ZoneNode.GetScopeType(), RequiredColumns = ScopeCategory.ZoneNode.GetOptions() },
                new() { Id = (int)ScopeCategory.WardSector, Name = ScopeCategory.WardSector.ToString(), Description = ScopeCategory.WardSector.GetDescription(), ScopeType = ScopeCategory.WardSector.GetScopeType(), RequiredColumns = ScopeCategory.WardSector.GetOptions() },
                new() { Id = (int)ScopeCategory.BuildingWise, Name = ScopeCategory.BuildingWise.ToString(), Description = ScopeCategory.BuildingWise.GetDescription(), ScopeType = ScopeCategory.BuildingWise.GetScopeType(), RequiredColumns = ScopeCategory.BuildingWise.GetOptions() },
                new() { Id = (int)ScopeCategory.PropertyWise, Name = ScopeCategory.PropertyWise.ToString(), Description = ScopeCategory.PropertyWise.GetDescription(), ScopeType = ScopeCategory.PropertyWise.GetScopeType(), RequiredColumns = ScopeCategory.PropertyWise.GetOptions() }
            }
        };

        return Task.FromResult(template);
    }

    // ---------------------------------------------------------------- Eligible count

    public async Task<EligibleCountResponseDto> GetEligibleCountAsync(
        EligibleCountRequestDto request, int actingUserId, CancellationToken cancellationToken = default)
    {
        var yearEntity = await _yearMasterRepo.GetByIdAsync(request.FinanceYearId, cancellationToken);
        if (yearEntity is null) throw new ArgumentException("Invalid finance year ID.");
        var scopeType = ParseScopeType(request.ScopeType);
        var (isPtAll, isAsAll) = await CheckAllSelectedFlagsAsync(request.Scope, cancellationToken);
        var candidates = BuildCandidateQuery(scopeType, request.Scope, yearEntity, isPtAll, isAsAll);

        int total = await candidates.CountAsync(cancellationToken);
        if (scopeType == JobScopeType.Property && total == 0)
        {
            throw new ValidationException("No properties found for the provided search criteria.", OperationType.Read);
        }
        var breakdown = await EvaluateEligibilityAsync(candidates, request.FinanceYearId, cancellationToken, request.Scope.OverrideAlreadyTaxed);

        int eligible = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.Eligible);
        int alreadyTaxed = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.AlreadyTaxed);
        var skipCodes = breakdown.Values
            .Select(r => r.Code)
            .Where(c => c is PropertyEligibilityCode.Locked
                or PropertyEligibilityCode.DetailsMissing
                or PropertyEligibilityCode.RateNotFound
                or PropertyEligibilityCode.TaxPercentageMissing
                or PropertyEligibilityCode.CVRateMappingNotFound
                or PropertyEligibilityCode.CVRateNotFound
                or PropertyEligibilityCode.CVTaxPercentageMissing)
            .ToList();

        int skipped = skipCodes.Count;
        var skipReasons = skipCodes
            .GroupBy(c => c)
            .Select(g => new SkipReasonSummaryDto { Code = ToSkipReasonCode(g.Key) ?? g.Key.ToString(), Count = g.Count() })
            .OrderByDescending(r => r.Count)
            .ToList();

        return new EligibleCountResponseDto
        {
            Total = total,
            Eligible = eligible,
            Skipped = skipped,
            AlreadyTaxed = alreadyTaxed,
            SkipReasons = skipReasons
        };
    }

    // ---------------------------------------------------------------- Preview

    public async Task<OperationPreviewResponseDto> GetPreviewAsync(
        OperationPreviewRequestDto request, int actingUserId, CancellationToken cancellationToken = default)
    {
        var yearEntity = await _yearMasterRepo.GetByIdAsync(request.FinanceYearId, cancellationToken);
        if (yearEntity is null) throw new ArgumentException("Invalid finance year ID.");
        var scopeType = ParseScopeType(request.ScopeType);
        var (isPtAll, isAsAll) = await CheckAllSelectedFlagsAsync(request.Scope, cancellationToken);
        var candidates = BuildCandidateQuery(scopeType, request.Scope, yearEntity, isPtAll, isAsAll);

        int total = await candidates.CountAsync(cancellationToken);
        if (scopeType == JobScopeType.Property && total == 0)
        {
            throw new ValidationException("No properties found for the provided search criteria.", OperationType.Read);
        }

        int pageNumber = request.PageNumber > 0 ? request.PageNumber : 1;
        int pageSize = request.PageSize > 0 ? request.PageSize : 10;

        var wards = _wardRepo.GetQueryable().AsNoTracking();
        var zones = _zoneRepo.GetQueryable().AsNoTracking();

        var query = from p in candidates
                    join w in wards on p.WardId equals w.Id into wardJoin
                    from w in wardJoin.DefaultIfEmpty()
                    join z in zones on (w != null ? w.ZoneId : (int?)null) equals z.Id into zoneJoin
                    from z in zoneJoin.DefaultIfEmpty()
                    select new
                    {
                        p.Id,
                        p.PropertyNo,
                        p.PartitionNo,
                        p.OwnerName,
                        p.PropertyTypeId,
                        WardDescription = w != null ? w.Description : string.Empty,
                        ZoneDescription = z != null ? z.Description : string.Empty
                    };

        var page = await query
            .OrderBy(p => p.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var breakdown = await EvaluateEligibilityAsync(candidates, request.FinanceYearId, cancellationToken, request.Scope.OverrideAlreadyTaxed);

        var ids = page.Select(p => p.Id).ToList();
        var noDetailPageIds = ids
            .Where(id => breakdown.GetValueOrDefault(id)?.Code == PropertyEligibilityCode.DetailsMissing)
            .ToList();
        var detailFields = await GetPropertyDetailFieldsAsync(noDetailPageIds, cancellationToken);

        var records = new List<JobPropertyPreviewDto>(page.Count);
        foreach (var p in page)
        {
            var code = breakdown.GetValueOrDefault(p.Id)?.Code ?? PropertyEligibilityCode.DetailsMissing;
            string? skipReasonText = code switch
            {
                PropertyEligibilityCode.Eligible              => null,
                PropertyEligibilityCode.DetailsMissing         => BuildDetailsSkipReason(detailFields.GetValueOrDefault(p.Id)),
                PropertyEligibilityCode.Locked                 => ToDisplayReason(SkipReason.PropertyLocked),
                PropertyEligibilityCode.AlreadyTaxed           => ToDisplayReason(SkipReason.AlreadyProcessed),
                PropertyEligibilityCode.RateNotFound           => ToDisplayReason(SkipReason.RateNotFound),
                PropertyEligibilityCode.TaxPercentageMissing   => ToDisplayReason(SkipReason.TaxPercentageMissing),
                PropertyEligibilityCode.CVRateMappingNotFound  => ToDisplayReason(SkipReason.CVRateMappingNotFound),
                PropertyEligibilityCode.CVRateNotFound         => ToDisplayReason(SkipReason.CVRateNotFound),
                PropertyEligibilityCode.CVTaxPercentageMissing => ToDisplayReason(SkipReason.CVTaxPercentageMissing),
                _                                               => null
            };

            string? skipReasonCode = ToSkipReasonCode(code);

            var missingKeys = code == PropertyEligibilityCode.DetailsMissing
                ? GetMissingDetailFieldKeys(detailFields.GetValueOrDefault(p.Id))
                : new List<string>();

            records.Add(new JobPropertyPreviewDto
            {
                PropertyId = p.Id,
                Zone = p.ZoneDescription,
                Ward = p.WardDescription,
                PropertyNo = p.PropertyNo ?? string.Empty,
                PartitionNo = p.PartitionNo ?? string.Empty,
                Owner = p.OwnerName ?? string.Empty,
                PropertyTypeId = p.PropertyTypeId,
                IsEligible = code == PropertyEligibilityCode.Eligible,
                SkipReason = skipReasonText,
                SkipReasonCode = skipReasonCode,
                MissingFieldKeys = missingKeys
            });
        }

        int eligibleCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.Eligible);
        int alreadyTaxedCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.AlreadyTaxed);
        int lockedCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.Locked);
        int detailsMissingCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.DetailsMissing);
        int rateNotFoundCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.RateNotFound);
        int taxPercentageMissingCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.TaxPercentageMissing);
        int cvRateMappingNotFoundCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.CVRateMappingNotFound);
        int cvRateNotFoundCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.CVRateNotFound);
        int cvTaxPercentageMissingCount = breakdown.Values.Count(r => r.Code == PropertyEligibilityCode.CVTaxPercentageMissing);
        int skippedCount = lockedCount + detailsMissingCount + rateNotFoundCount + taxPercentageMissingCount
            + cvRateMappingNotFoundCount + cvRateNotFoundCount + cvTaxPercentageMissingCount;

        var skippedReasons = new List<SkippedReasonDto>
        {
            new() { Reason = ToLocalizationKey(SkipReason.PropertyLocked), Count = lockedCount },
            new() { Reason = ToLocalizationKey(SkipReason.PendingVerification), Count = detailsMissingCount },
            new() { Reason = ToLocalizationKey(SkipReason.RateNotFound), Count = rateNotFoundCount },
            new() { Reason = ToLocalizationKey(SkipReason.TaxPercentageMissing), Count = taxPercentageMissingCount },
            new() { Reason = ToLocalizationKey(SkipReason.CVRateMappingNotFound), Count = cvRateMappingNotFoundCount },
            new() { Reason = ToLocalizationKey(SkipReason.CVRateNotFound), Count = cvRateNotFoundCount },
            new() { Reason = ToLocalizationKey(SkipReason.CVTaxPercentageMissing), Count = cvTaxPercentageMissingCount },
            new() { Reason = ToLocalizationKey(SkipReason.AlreadyProcessed), Count = alreadyTaxedCount }
        };

        var eligibleIds = breakdown
            .Where(kv => kv.Value.Code == PropertyEligibilityCode.Eligible)
            .Select(kv => kv.Key)
            .ToHashSet();

        var typeBreakdown = await candidates
            .Where(p => eligibleIds.Contains(p.Id))
            .GroupBy(p => p.PropertyTypeId)
            .Select(g => new PropertyTypeBreakdownDto
            {
                PropertyTypeId = g.Key ?? 0,
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        return new OperationPreviewResponseDto
        {
            TotalSelected = total,
            Eligible = eligibleCount,
            Skipped = skippedCount,
            AlreadyTaxed = alreadyTaxedCount,
            RequiresApproval = 0, // Add Tax requires no approval; only Remove operations do (future)
            Records = records,
            SkippedReasons = skippedReasons,
            EligibleBreakdown = typeBreakdown
        };
    }

    // ---------------------------------------------------------------- Execute (synchronous)

    public async Task<ExecuteOperationResponseDto> ExecuteAsync(
        ExecuteOperationRequestDto request, OperationContext context, CancellationToken cancellationToken = default)
    {
        if (request.FinanceYearId <= 0)
            throw new ArgumentException("FinanceYearId is required before execution.");

        var operation = ParseOperation(request.Operation);
        if (operation != JobOperation.AddTax)
            throw new InvalidOperationException("Only the Add Tax operation is supported.");

        var yearEntity = await _yearMasterRepo.GetByIdAsync(request.FinanceYearId, cancellationToken);
        if (yearEntity is null) throw new ArgumentException("Invalid finance year ID.");
        if (!yearEntity.IsActive)
            throw new InvalidOperationException("Tax calculation can only be performed for the current active finance year.");

        int financeYear = yearEntity.Year;
        var scopeType = ParseScopeType(request.ScopeType);
        ValidateScope(scopeType, request.Scope);

        var (isPtAll, isAsAll) = await CheckAllSelectedFlagsAsync(request.Scope, cancellationToken);
        var candidates = BuildCandidateQuery(scopeType, request.Scope, yearEntity, isPtAll, isAsAll);
        var breakdown = await EvaluateEligibilityAsync(candidates, request.FinanceYearId, cancellationToken, request.Scope.OverrideAlreadyTaxed);
        var eligiblePropertyIds = breakdown
            .Where(kv => kv.Value.Code == PropertyEligibilityCode.Eligible)
            .Select(kv => kv.Key)
            .ToHashSet();

        int totalSelected = await candidates.CountAsync(cancellationToken);
        int eligibleCount = eligiblePropertyIds.Count;
        if (eligibleCount == 0)
            throw new InvalidOperationException("No eligible records for the selected scope.");

        var eligibleTargets = await candidates
            .Where(p => eligiblePropertyIds.Contains(p.Id))
            .OrderBy(p => p.Id)
            .Select(p => new { p.Id, p.PropertyNo })
            .ToListAsync(cancellationToken);

        var activeJobs = await _jobRepo.GetQueryable().AsNoTracking()
            .Include(j => j.FinanceYear)
            .Where(j => j.IsActive
                && !j.MarkedForDeletion
                && (j.Status == nameof(JobStatus.InProgress)
                    || j.Status == nameof(JobStatus.Pending)
                    || j.Status == nameof(JobStatus.Scheduled)))
            .ToListAsync(cancellationToken);

        if (activeJobs.Any())
        {
            // All active jobs (InProgress/Pending/Scheduled) have their eligible property set
            // pinned as PropertyTaxJobDetailEntity rows from the moment they're created, so a
            // single query against those rows detects overlap regardless of job status.
            var activeJobIds = activeJobs.Select(j => j.Id).ToList();
            var conflictingDetail = await _jobDetailRepo.GetQueryable()
                .Where(d => activeJobIds.Contains(d.JobId) && !d.MarkedForDeletion && eligiblePropertyIds.Contains(d.PropertyId))
                .FirstOrDefaultAsync(cancellationToken);

            if (conflictingDetail != null)
            {
                var conflictingJob = activeJobs.First(j => j.Id == conflictingDetail.JobId);
                throw new InvalidOperationException($"One or more selected properties overlap with job '{conflictingJob.JobCode}' (started by {conflictingJob.StartedByUserName}). Please select different properties.");
            }
        }

        DateTime startTime = DateTime.Now;
        string status = nameof(JobStatus.Pending);

        if (request.Options?.IsScheduled == true)
        {
            status = nameof(JobStatus.Scheduled);
            if (request.Options.ScheduledDateTime.HasValue)
            {
                var scheduledTime = request.Options.ScheduledDateTime.Value.ToLocalTime();
                var today = DateTime.Today;

                if (scheduledTime <= DateTime.Now.AddMinutes(-5))
                {
                    throw new ArgumentException("Scheduled time must be in the future.");
                }

                if (scheduledTime.Date != today && 
                    scheduledTime.Date != today.AddDays(1) && 
                    scheduledTime.Date != today.AddDays(2))
                {
                    throw new ArgumentException("Scheduled time must be for today or tomorrow.");
                }

                startTime = scheduledTime;
            }
            else
            {
                var timeStr = _configuration.GetValue<string>("PropertyTaxJobRecovery:ScheduledTimeOfDay", "00:00:00");
                if (TimeSpan.TryParse(timeStr, out var timeOfDay))
                {
                    var today = DateTime.Today; // local time
                    var scheduledLocal = today.Date + timeOfDay;
                    if (scheduledLocal <= DateTime.Now)
                    {
                        scheduledLocal = scheduledLocal.AddDays(1);
                    }
                    startTime = scheduledLocal;
                }
                else
                {
                    var scheduledLocal = DateTime.Today.AddDays(1);
                    startTime = scheduledLocal;
                }
            }
        }

        var job = new PropertyTaxJobEntity
        {
            JobCode = $"TEMP-{Guid.NewGuid().ToString("N")[..20]}",
            Operation = operation.ToString(),
            FinanceYearId = request.FinanceYearId,
            ScopeType = scopeType.ToString(),
            ScopeParamsJson = JsonSerializer.Serialize(request.Scope),
            ScopeDescription = BuildScopeDescription(scopeType, request.Scope),
            StartedByUserId = context.ActingUserId,
            StartedByUserName = context.UserName,
            UserRole = context.UserRole,
            StartTime = startTime,
            Status = status,
            Remarks = status == nameof(JobStatus.Scheduled)
                ? "job is scheduled, not yet started"
                : "Records are still pending to be processed",
            RecordsSelected = eligibleCount,
            RecordsProcessed = 0,
            SuccessCount = 0,
            SkippedCount = 0,
            CreatedBy = context.ActingUserId,
            CreatedDate = DateTime.Now,
            IsActive = true
        };
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _jobRepo.AddAsync(job, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Pin the exact eligible property set now, at job creation, rather than letting
            // ProcessJobAsync re-derive it later from a possibly-drifted live query. This guarantees
            // the job only ever processes what was actually reviewed and approved here.
            var jobDetails = eligibleTargets.Select(t => new PropertyTaxJobDetailEntity
            {
                JobId = job.Id,
                PropertyId = t.Id,
                PropertyNo = t.PropertyNo,
                Status = nameof(JobDetailStatus.Pending),
                CreatedBy = context.ActingUserId,
                CreatedDate = DateTime.Now,
                IsActive = true
            }).ToList();
            await _jobDetailRepo.AddRangeAsync(jobDetails, cancellationToken);

            // Update JobCode using the generated job.Id (Identity column)
            job.JobCode = FormatJobCode(operation, financeYear, job.Id);
            job.UpdatedBy = context.ActingUserId;
            job.UpdatedDate = DateTime.Now;
            await _jobRepo.UpdateAsync(job, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            InvalidateSummaryCountsCache(request.FinanceYearId);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }

        return new ExecuteOperationResponseDto
        {
            JobId = job.JobCode,
            Status = job.Status,
            Summary = new JobSummaryDto
            {
                Total = job.RecordsSelected,
                Processed = 0,
                Success = 0,
                Failed = 0,
                Skipped = job.SkippedCount
            }
        };
    }

    public async Task ProcessJobAsync(long jobId, CancellationToken cancellationToken = default)
    {
        var job = await _jobRepo.GetQueryable()
            .Include(j => j.FinanceYear)
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.MarkedForDeletion, cancellationToken);
        if (job is null)
        {
            _logger.LogError("ProcessJobAsync: Job ID {JobId} not found.", jobId);
            return;
        }

        var existingDetails = await _jobDetailRepo.GetQueryable()
            .Where(d => d.JobId == job.Id && !d.MarkedForDeletion)
            .ToListAsync(cancellationToken);

        // Deserialized unconditionally (unlike the legacy-fallback-only `scope` variable below) so
        // options like ForceRecalculate reach the per-property processing loop regardless of which
        // branch below ran — the normal (pinned-details) path never otherwise reads ScopeParamsJson.
        var jobScope = JsonSerializer.Deserialize<OperationScopeDto>(job.ScopeParamsJson ?? "{}",
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

        List<PropertyTaxJobDetailEntity> details;

        if (existingDetails.Any())
        {
            // Normal path: ExecuteAsync already pinned the exact eligible property set for this
            // job when it was created, so we process exactly that — no re-evaluation needed.
            details = existingDetails;
        }
        else
        {
            // Legacy fallback for jobs created before eligible properties were pinned at
            // ExecuteAsync time (in-flight Pending/Scheduled jobs from before this code shipped).
            // Re-derives eligibility now, same as the old behavior.
            _ = ParseOperation(job.Operation);
            var scopeType = ParseScopeType(job.ScopeType);
            var scope = JsonSerializer.Deserialize<OperationScopeDto>(job.ScopeParamsJson ?? "{}", new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

            var (isPtAll, isAsAll) = await CheckAllSelectedFlagsAsync(scope, cancellationToken);
            var candidates = BuildCandidateQuery(scopeType, scope, job.FinanceYear, isPtAll, isAsAll);
            var breakdown = await EvaluateEligibilityAsync(candidates, job.FinanceYearId, cancellationToken, scope.OverrideAlreadyTaxed);
            var eligiblePropertyIds = breakdown
                .Where(kv => kv.Value.Code == PropertyEligibilityCode.Eligible)
                .Select(kv => kv.Key)
                .ToHashSet();

            var targets = await candidates
                .Where(p => eligiblePropertyIds.Contains(p.Id))
                .OrderBy(p => p.Id)
                .Select(p => new { p.Id, p.PropertyNo })
                .ToListAsync(cancellationToken);

            if (targets.Count == 0)
            {
                job.Status = nameof(JobStatus.Completed);
                job.Remarks = "Completed with 0 eligible records at processing time.";
                job.RecordsProcessed = job.RecordsSelected;
                job.SuccessCount = 0;
                job.FailedCount = 0;
                job.SkippedCount = job.RecordsSelected;
                job.CompleteTime = DateTime.Now;
                job.DurationMs = (long)(job.CompleteTime.Value - job.StartTime).TotalMilliseconds;
                job.UpdatedDate = DateTime.Now;
                await _jobRepo.UpdateAsync(job, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                InvalidateSummaryCountsCache(job.FinanceYearId);
                return;
            }

            details = targets.Select(t => new PropertyTaxJobDetailEntity
            {
                JobId = job.Id,
                PropertyId = t.Id,
                PropertyNo = t.PropertyNo,
                Status = nameof(JobDetailStatus.Pending),
                CreatedBy = job.StartedByUserId,
                CreatedDate = DateTime.Now,
                IsActive = true
            }).ToList();

            await _jobDetailRepo.AddRangeAsync(details, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var calculationMethod = await _policyConfigService.GetPolicyValueAsync(
            "TaxCalculationMethod", "RV", cancellationToken);

        int batchSize = _configuration.GetValue<int>("PropertyTaxJobProcessor:BatchSize", 50);
        if (batchSize <= 0) batchSize = 50;
        int totalBatches = (int)Math.Ceiling((double)details.Count / batchSize);
        if (totalBatches == 0) totalBatches = 1;

        int success = details.Count(d => d.Status == nameof(JobDetailStatus.Added));
        int failed = details.Count(d => d.Status == nameof(JobDetailStatus.Failed));
        int skipped = details.Count(d => d.Status == nameof(JobDetailStatus.Skipped));

        int processedCount = success + failed + skipped;
        int initialBatch = (processedCount / batchSize) + 1;
        if (initialBatch > totalBatches) initialBatch = totalBatches;

        job.Remarks = $"Batch {initialBatch} of {totalBatches} processing";
        await _jobRepo.UpdateAsync(job, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        int processedSinceLastSave = 0;

        for (int i = 0; i < details.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var detail = details[i];

            if (detail.Status == nameof(JobDetailStatus.Added) || detail.Status == nameof(JobDetailStatus.Skipped))
            {
                continue;
            }

            detail.ExecutionStartTime = DateTime.Now;
            
            try
            {
                if (string.Equals(calculationMethod, "CV", StringComparison.OrdinalIgnoreCase))
                {
                    var cvResults = await _capitalValueService.CreateAsync(new CreateCapitalValueDto
                    {
                        PropertyId = detail.PropertyId,
                        FinanceYear = job.FinanceYear.Year,
                        CreatedBy = job.StartedByUserId
                    }, cancellationToken);

                    var totalTax = cvResults.SelectMany(r => r.Taxes).Sum(t => t.Amount ?? 0);
                    var taxHeads = cvResults.SelectMany(r => r.Taxes)
                        .Select(t => t.TaxName)
                        .Where(name => !string.IsNullOrEmpty(name))
                        .Distinct();

                    detail.Status = nameof(JobDetailStatus.Added);
                    detail.Amount = totalTax;
                    detail.TaxHead = taxHeads.Any() ? string.Join(", ", taxHeads) : NetTaxPolicyCode;
                    detail.Message = "Capital Value Tax added successfully";
                }
                else
                {
                    // A recalculation that persists replaces every current-year TransMast row of the property with
                    // NETTAX, including the CC / OC / electricity-bill row of a certificate (the certificate's
                    // PolicyTaxDetails row stays). Only the retrospective engine puts the ledger right again, so the
                    // refresher runs it after the recalculation, both under the property's lock (an API request or a
                    // queued certificate pipeline for the same property cannot slip in between). The engine gets a scope
                    // of its own: this loop's DbContext also tracks the job and detail rows with changes still to be
                    // saved, and an engine run that fails half-way must not leave tracked changes behind for the job's
                    // next SaveChanges. A failure of the engine fails the property (the catch below records it on its detail
                    // row: Failed, with the refresher's message, which is safe to show): the RV result is saved but the
                    // ledger is known to need repair, so the property must not be listed as taxed. Its master-data-change
                    // flag stays open, so the property shows up again for the next Add Tax run.
                    var refresh = await _retrospectiveTaxRefresher.RefreshAsync(
                        detail.PropertyId,
                        job.StartedByUserId,
                        new RetrospectiveTaxRefreshOptions { ForceRecalculate = jobScope.ForceRecalculate },
                        cancellationToken);
                    var rv = refresh.RateableValue;
                    detail.Status = nameof(JobDetailStatus.Added);

                    bool isCarpetAreaZero = rv.Details.Count > 0 && rv.Details.All(d => d.CarpetAreaSqFeet == 0 && d.CarpetAreaSqMeter == 0);
                    bool isRateMissing = rv.Details.Count > 0 && rv.Details.All(d => d.MonthlyRate == 0 && d.YearlyRate == 0);

                    // Read the actual, final applied tax figures straight from TransMast instead of
                    // rv.Policy.Taxes (that in-memory result reflects only the plain NETTAX
                    // calculation CalculateAndSaveAsync just computed, BEFORE any post-save hook —
                    // e.g. Section 129A — supersedes the row with its own applied amount). This also
                    // sidesteps the "TaxTotal" vs "Tax Total" key-name mismatch that made the old
                    // fallback silently double-count the aggregate on top of its own components.
                    var activeTransMastRows = await _transMastRepo.GetQueryable()
                        .AsNoTracking()
                        .Where(t => t.PropertyId == detail.PropertyId &&
                                    t.FinanceYearId == job.FinanceYearId &&
                                    t.CalculationType == "RV" &&
                                    t.IsActive && !t.MarkedForDeletion)
                        .Select(t => new { t.TaxId, t.TaxAmount })
                        .ToListAsync(cancellationToken);

                    var activeTaxIds = activeTransMastRows.Select(r => r.TaxId).ToList();
                    var taxMasterById = await _taxMasterRepo.GetQueryable()
                        .AsNoTracking()
                        .Where(t => activeTaxIds.Contains(t.Id))
                        .ToDictionaryAsync(t => t.Id, cancellationToken);

                    var taxTotalRow = activeTransMastRows.FirstOrDefault(r =>
                        taxMasterById.TryGetValue(r.TaxId, out var tm) && string.Equals(tm.TaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase));

                    decimal totalTaxAmount = taxTotalRow != null
                        ? taxTotalRow.TaxAmount
                        : activeTransMastRows.Sum(r => r.TaxAmount);

                    var taxHeadNames = activeTransMastRows
                        .Where(r => taxMasterById.ContainsKey(r.TaxId))
                        .Select(r =>
                        {
                            var tm = taxMasterById[r.TaxId];
                            return string.IsNullOrWhiteSpace(tm.TaxNameAlias) ? tm.TaxName : tm.TaxNameAlias!;
                        })
                        .ToList();

                    // If RateableValue is positive but the calculated tax amount is 0, the tax percentage configuration is missing.
                    bool isTaxPercentageMissing = rv.TotalRateableValue > 0 && totalTaxAmount == 0m;

                    if (isCarpetAreaZero || isRateMissing || isTaxPercentageMissing)
                    {
                        detail.Amount = 0m;
                        detail.TaxHead = NetTaxPolicyCode;
                        detail.Message = "Related data is not available for the selected property factors. Therefore, the tax value has been calculated as 0.";
                    }
                    else
                    {
                        detail.Amount = totalTaxAmount;
                        detail.TaxHead = taxHeadNames.Count > 0
                            ? string.Join(", ", taxHeadNames)
                            : NetTaxPolicyCode;
                        detail.Message = "Rateable Value Tax added successfully";
                    }
                }

                // Successfully (re-)taxed — resolve any open master-data-change recalculation flag
                // for this property/finance year matching calculation type so it drops out of the "affected properties" list
                // and returns to Already Taxed with fresh figures.
                var openFlag = await _recalcFlagRepo.GetQueryable()
                    .FirstOrDefaultAsync(f => f.PropertyId == detail.PropertyId
                        && f.FinanceYearId == job.FinanceYearId
                        && (f.CalculationType == calculationMethod || f.CalculationType == "BOTH")
                        && f.ResolvedAt == null && f.IsActive, cancellationToken);
                if (openFlag != null)
                {
                    openFlag.ResolvedAt = DateTime.Now;
                    openFlag.ResolvedBy = job.StartedByUserId;
                    await _recalcFlagRepo.UpdateAsync(openFlag, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                detail.Status = nameof(JobDetailStatus.Failed);
                
                string errorMessage = ex.Message;
                try
                {
                    var prop = await _propertyRepo.GetQueryable()
                        .Include(p => p.Ward)
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.Id == detail.PropertyId, cancellationToken);

                    if (prop != null)
                    {
                        var wardNo = prop.Ward?.WardNo;
                        var propCode = !string.IsNullOrWhiteSpace(prop.PropertyNo)
                            ? $"{(string.IsNullOrWhiteSpace(wardNo) ? "" : $"{wardNo}-")}{prop.PropertyNo}{(string.IsNullOrWhiteSpace(prop.PartitionNo) ? "" : $"-{prop.PartitionNo}")}"
                            : $"PropertyId={detail.PropertyId}";

                        errorMessage = errorMessage.Replace($"PropertyId={detail.PropertyId}", propCode)
                                                 .Replace($"PropertyId = {detail.PropertyId}", propCode)
                                                 .Replace($"propertyId={detail.PropertyId}", propCode)
                                                 .Replace(detail.PropertyId.ToString(), propCode);
                    }
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "Failed to load property details for error message formatting");
                }

                detail.Message = Truncate(errorMessage, 2000);
                _logger.LogWarning(ex,
                    "Add Tax failed for PropertyId={PropertyId}, JobCode={JobCode}", detail.PropertyId, job.JobCode);
            }

            detail.ExecutionEndTime = DateTime.Now;
            detail.UpdatedBy = job.StartedByUserId;
            detail.UpdatedDate = DateTime.Now;
            await _jobDetailRepo.UpdateAsync(detail, cancellationToken);

            job.SuccessCount = details.Count(d => d.Status == nameof(JobDetailStatus.Added));
            job.FailedCount = details.Count(d => d.Status == nameof(JobDetailStatus.Failed));
            job.SkippedCount = details.Count(d => d.Status == nameof(JobDetailStatus.Skipped));
            job.RecordsProcessed = job.SuccessCount + job.FailedCount + job.SkippedCount;

            int currentBatch = (i / batchSize) + 1;
            if (currentBatch > totalBatches) currentBatch = totalBatches;
            job.Remarks = $"Batch {currentBatch} of {totalBatches} processing";

            job.UpdatedDate = DateTime.Now;
            await _jobRepo.UpdateAsync(job, cancellationToken);
            
            processedSinceLastSave++;
            if (processedSinceLastSave >= batchSize || i == details.Count - 1)
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                processedSinceLastSave = 0;
            }
        }

        job.Status = nameof(JobStatus.Completed);
        job.Remarks = "All records processed";
        job.CompleteTime = DateTime.Now;
        job.DurationMs = (long)(job.CompleteTime.Value - job.StartTime).TotalMilliseconds;
        job.SuccessCount = details.Count(d => d.Status == nameof(JobDetailStatus.Added));
        job.FailedCount = details.Count(d => d.Status == nameof(JobDetailStatus.Failed));
        job.SkippedCount = details.Count(d => d.Status == nameof(JobDetailStatus.Skipped));
        job.RecordsProcessed = job.SuccessCount + job.FailedCount + job.SkippedCount;
        job.UpdatedDate = DateTime.Now;
        await _jobRepo.UpdateAsync(job, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        InvalidateSummaryCountsCache(job.FinanceYearId);
    }

    // ---------------------------------------------------------------- Job status / properties

    public async Task<JobStatusDto> GetJobStatusAsync(
        long jobId, int actingUserId, CancellationToken cancellationToken = default)
    {
        var job = await GetJobByIdAsync(jobId, cancellationToken);
        int total = job.RecordsSelected;
        int processed = job.RecordsProcessed;
        return new JobStatusDto
        {
            JobId = job.JobCode,
            Status = job.Status,
            Total = total,
            Processed = processed,
            Success = job.SuccessCount,
            Failed = job.FailedCount,
            Pending = Math.Max(0, total - processed),
            Percentage = total > 0 ? (int)Math.Round(processed * 100.0 / total) : 100
        };
    }

    private IQueryable<JobPropertyResultDto> GetJobPropertiesQuery(long jobId)
    {
        var wards = _wardRepo.GetQueryable().AsNoTracking();
        var zones = _zoneRepo.GetQueryable().AsNoTracking();

        return from d in _jobDetailRepo.GetQueryable().AsNoTracking()
               join p in _propertyRepo.GetQueryable().AsNoTracking() on d.PropertyId equals p.Id
               join w in wards on p.WardId equals w.Id into wardJoin
               from w in wardJoin.DefaultIfEmpty()
               join z in zones on (w != null ? w.ZoneId : (int?)null) equals z.Id into zoneJoin
               from z in zoneJoin.DefaultIfEmpty()
               where d.JobId == jobId && !d.MarkedForDeletion
               orderby d.Id
               select new JobPropertyResultDto
               {
                   Zone = z != null ? z.Description : string.Empty,
                   Ward = w != null ? w.Description : string.Empty,
                   WardNo = w != null ? w.WardNo : string.Empty,
                   UPICID = p.UPICId ?? string.Empty,
                   PropertyNo = d.PropertyNo ?? string.Empty,
                   PartitionNo = p.PartitionNo ?? string.Empty,
                   Owner = p.OwnerName ?? string.Empty,
                   TaxHead = d.TaxHead ?? string.Empty,
                   Amount = d.Amount ?? 0m,
                   Status = d.Status,
                   Message = d.Message ?? string.Empty
               };
    }

    public async Task<PagedResult<JobPropertyResultDto>> GetJobPropertiesAsync(
        long jobId, JobPropertiesQueryParameters queryParams, int actingUserId, CancellationToken cancellationToken = default)
    {
        var job = await GetJobByIdAsync(jobId, cancellationToken);
        var query = GetJobPropertiesQuery(job.Id);

        int totalCount = await query.CountAsync(cancellationToken);
        var pageSize = queryParams.PageSize == -1 ? totalCount == 0 ? 1 : totalCount : queryParams.PageSize;

        var items = await query
            .Skip((queryParams.PageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<JobPropertyResultDto>(items, totalCount, queryParams.PageNumber, pageSize);
    }

    // ---------------------------------------------------------------- Audit

    public async Task<PagedResult<JobAuditDto>> GetAuditListAsync(
        OperationAuditQueryParameters query, int actingUserId, CancellationToken cancellationToken = default)
    {
        var q = _jobRepo.GetQueryable().AsNoTracking().Where(j => !j.MarkedForDeletion);

        if (!string.IsNullOrWhiteSpace(query.Operation))
            q = q.Where(j => j.Operation == query.Operation);
        if (query.FinanceYearId.HasValue)
            q = q.Where(j => j.FinanceYearId == query.FinanceYearId.Value);
        if (!string.IsNullOrWhiteSpace(query.Status))
            q = q.Where(j => j.Status == query.Status);
        if (!string.IsNullOrWhiteSpace(query.JobCode))
            q = q.Where(j => j.JobCode == query.JobCode);

        if (query.StartTime.HasValue)
        {
            var date = query.StartTime.Value.Date;
            q = q.Where(j => j.StartTime >= date && j.StartTime < date.AddDays(1));
        }
        if (query.CompleteTime.HasValue)
        {
            var date = query.CompleteTime.Value.Date;
            q = q.Where(j => j.CompleteTime >= date && j.CompleteTime < date.AddDays(1));
        }
        if (query.CreatedDate.HasValue)
        {
            var date = query.CreatedDate.Value.Date;
            q = q.Where(j => j.CreatedDate >= date && j.CreatedDate < date.AddDays(1));
        }

        int totalCount = await q.CountAsync(cancellationToken);

        var pageSize = query.PageSize == -1 ? totalCount == 0 ? 1 : totalCount : query.PageSize;
        var items = await q
            .OrderByDescending(j => j.StartTime)
            .Skip((query.PageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new JobAuditDto
            {
                Id = j.Id,
                JobId = j.JobCode,
                DateTime = j.StartTime,
                Operation = j.Operation,
                DoneBy = j.StartedByUserName ?? j.StartedByUserId.ToString(),
                Scope = j.ScopeDescription ?? j.ScopeType,
                StartTime = j.StartTime,
                CompleteTime = j.CompleteTime,
                Duration = FormatDuration(j.DurationMs),
                Records = $"{j.SuccessCount} / {j.RecordsSelected}",
                Status = j.Status,
                Remarks = j.Remarks
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<JobAuditDto>(items, totalCount, query.PageNumber, pageSize);
    }

    public async Task<JobAuditDetailDto> GetAuditDetailAsync(
        long jobId, JobPropertiesQueryParameters queryParams, int actingUserId, CancellationToken cancellationToken = default)
    {
        var job = await _jobRepo.GetQueryable().AsNoTracking()
            .Include(j => j.FinanceYear)
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.MarkedForDeletion, cancellationToken);
        if (job is null)
            throw new KeyNotFoundException($"Job ID '{jobId}' was not found.");

        var query = GetJobPropertiesQuery(job.Id);

        int totalCount = await query.CountAsync(cancellationToken);
        var pageSize = queryParams.PageSize == -1 ? totalCount == 0 ? 1 : totalCount : queryParams.PageSize;

        var properties = await query
            .Skip((queryParams.PageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var pagedProperties = new PagedResult<JobPropertyResultDto>(properties, totalCount, queryParams.PageNumber, pageSize);

        return new JobAuditDetailDto
        {
            JobId = job.JobCode,
            Operation = job.Operation,
            FinanceYear = job.FinanceYear?.YearCode ?? job.FinanceYear?.Year.ToString() ?? string.Empty,
            StartedBy = job.StartedByUserName ?? job.StartedByUserId.ToString(),
            UserRole = job.UserRole,
            StartTime = job.StartTime,
            CompleteTime = job.CompleteTime,
            Duration = FormatDuration(job.DurationMs),
            Summary = new ProcessingSummaryDto
            {
                TotalSelected = job.RecordsSelected,
                SuccessfullyAdded = job.SuccessCount,
                SkippedRecords = job.SkippedCount,
                Failed = job.FailedCount
            },
            Properties = pagedProperties
        };
    }

    // ---------------------------------------------------------------- Scope & eligibility

    private IQueryable<PropertyEntity> ActiveProperties() =>
        _propertyRepo.GetQueryable().AsNoTracking().Where(p => p.IsActive && !p.MarkedForDeletion);

    /// <summary>
    /// Resolves the effective list of zone IDs to filter by. If the frontend sent explicit
    /// <see cref="OperationScopeDto.ZoneIds"/> those are used directly; otherwise we attempt
    /// a name-based match against <see cref="ZoneEntity.ZoneNo"/> and
    /// <see cref="ZoneEntity.Description"/> using the fallback
    /// <see cref="OperationScopeDto.ZoneNames"/> list populated by the Excel importer when
    /// numeric ZoneIds could not be resolved on the client.
    /// </summary>
    private IReadOnlyCollection<int> ResolveEffectiveZoneIds(OperationScopeDto scope)
    {
        if (scope.ZoneIds is { Count: > 0 }) return scope.ZoneIds;
        if (scope.ZoneNames is { Count: > 0 })
        {
            var candidates = scope.ZoneNames
                .Where(z => !string.IsNullOrWhiteSpace(z))
                .Select(z => z.Trim())
                .ToList();
            if (candidates.Count == 0) return Array.Empty<int>();

            var normalized = candidates
                .Select(z => z.ToLowerInvariant())
                .ToHashSet(StringComparer.Ordinal);

            var stripped = new HashSet<string>(
                normalized.Select(z => new string(z.Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '_').ToArray())),
                StringComparer.Ordinal);

            var zoneIds = _zoneRepo.GetQueryable()
                .AsNoTracking()
                .Select(z => new
                {
                    z.Id,
                    ZoneNoLower = (z.ZoneNo ?? "").ToLower(),
                    DescLower = (z.Description ?? "").ToLower()
                })
                .AsEnumerable()
                .Where(z =>
                    normalized.Contains(z.ZoneNoLower) ||
                    normalized.Contains(z.DescLower) ||
                    stripped.Contains(new string(z.ZoneNoLower.Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '_').ToArray())) ||
                    stripped.Contains(new string(z.DescLower.Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '_').ToArray())))
                .Select(z => z.Id)
                .Distinct()
                .ToList();
            return zoneIds;
        }
        return Array.Empty<int>();
    }

    /// <summary>
    /// Resolves the effective list of ward IDs to filter by. If the frontend sent explicit
    /// <see cref="OperationScopeDto.WardIds"/> those are used directly; otherwise we attempt
    /// a name-based match against <see cref="WardEntity.WardNo"/> and
    /// <see cref="WardEntity.Description"/> using the fallback
    /// <see cref="OperationScopeDto.WardNames"/> list populated by the Excel importer when
    /// numeric WardIds could not be resolved on the client.
    /// </summary>
    private IReadOnlyCollection<int> ResolveEffectiveWardIds(OperationScopeDto scope)
    {
        if (scope.WardIds is { Count: > 0 }) return scope.WardIds;
        if (scope.WardNames is { Count: > 0 })
        {
            var candidates = scope.WardNames
                .Where(w => !string.IsNullOrWhiteSpace(w))
                .Select(w => w.Trim())
                .ToList();
            if (candidates.Count == 0) return Array.Empty<int>();

            var normalized = candidates
                .Select(w => w.ToLowerInvariant())
                .ToHashSet(StringComparer.Ordinal);

            var stripped = new HashSet<string>(
                normalized.Select(w => new string(w.Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '_').ToArray())),
                StringComparer.Ordinal);

            var wardIds = _wardRepo.GetQueryable()
                .AsNoTracking()
                .Select(w => new
                {
                    w.Id,
                    WardNoLower = (w.WardNo ?? "").ToLower(),
                    DescLower = (w.Description ?? "").ToLower()
                })
                .AsEnumerable()
                .Where(w =>
                    normalized.Contains(w.WardNoLower) ||
                    normalized.Contains(w.DescLower) ||
                    stripped.Contains(new string(w.WardNoLower.Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '_').ToArray())) ||
                    stripped.Contains(new string(w.DescLower.Where(c => !char.IsWhiteSpace(c) && c != '-' && c != '_').ToArray())))
                .Select(w => w.Id)
                .Distinct()
                .ToList();
            return wardIds;
        }
        return Array.Empty<int>();
    }

    private async Task<(bool isPropertyTypeAllSelected, bool isAssessmentStatusAllSelected)> CheckAllSelectedFlagsAsync(
        OperationScopeDto scope, CancellationToken cancellationToken)
    {
        bool isPropertyTypeAllSelected = false;
        bool isAssessmentStatusAllSelected = false;

        if (scope.PropertyTypeIds is { Count: > 0 } ptids)
        {
            var activePtIds = await _propertyTypeRepo.GetQueryable()
                .Where(pt => pt.IsActive)
                .Select(pt => pt.Id)
                .ToListAsync(cancellationToken);
            isPropertyTypeAllSelected = activePtIds.Count > 0 && activePtIds.All(id => ptids.Contains(id));
        }

        if (scope.AssessmentStatusIds is { Count: > 0 } asids)
        {
            var activeAsIds = await _propertyAssessmentStatusRepo.GetQueryable()
                .Where(status => status.IsActive)
                .Select(status => status.Id)
                .ToListAsync(cancellationToken);
            isAssessmentStatusAllSelected = activeAsIds.Count > 0 && activeAsIds.All(id => asids.Contains(id));
        }

        return (isPropertyTypeAllSelected, isAssessmentStatusAllSelected);
    }

    private IQueryable<PropertyEntity> BuildCandidateQuery(
        JobScopeType scopeType,
        OperationScopeDto scope,
        YearMasterEntity? year = null,
        bool isPropertyTypeAllSelected = false,
        bool isAssessmentStatusAllSelected = false)
    {
        // Note: candidates are NOT filtered by CreatedDate against the finance year window —
        // "already taxed this finance year" is determined via TransMast inside EvaluateEligibilityAsync,
        // not by when the property record was created.
        var q = ActiveProperties();

        switch (scopeType)
        {     
            case JobScopeType.MasterDataChange:
                {
                    var targetFyId = year?.Id ?? 0;
                    var flaggedPropertyIds = _recalcFlagRepo.GetQueryable()
                        .AsNoTracking()
                        .Where(f => f.FinanceYearId == targetFyId && f.ResolvedAt == null && f.IsActive)
                        .Select(f => f.PropertyId);

                    q = q.Where(p => flaggedPropertyIds.Contains(p.Id));
                    break;
                }

            case JobScopeType.Zone:
                {
                    var effectiveZoneIds = ResolveEffectiveZoneIds(scope);
                    if (effectiveZoneIds.Count > 0)
                        q = q.Where(p => effectiveZoneIds.Contains(p.Ward!.ZoneId));
                    if (scope.PropertyTypeIds is { Count: > 0 } ptids)
                    {
                        if (isPropertyTypeAllSelected)
                            q = q.Where(p => !p.PropertyTypeId.HasValue || ptids.Contains(p.PropertyTypeId.Value));
                        else
                            q = q.Where(p => p.PropertyTypeId.HasValue && ptids.Contains(p.PropertyTypeId.Value));
                    }
                    if (scope.AssessmentStatusIds is { Count: > 0 } asids)
                    {
                        if (isAssessmentStatusAllSelected)
                            q = q.Where(p => !p.PropertyAssessmentStatusId.HasValue || asids.Contains(p.PropertyAssessmentStatusId.Value));
                        else
                            q = q.Where(p => p.PropertyAssessmentStatusId.HasValue && asids.Contains(p.PropertyAssessmentStatusId.Value));
                    }
                    break;
                }

            case JobScopeType.Ward:
                {
                    var effectiveWardIds = ResolveEffectiveWardIds(scope);
                    if (effectiveWardIds.Count > 0)
                        q = q.Where(p => effectiveWardIds.Contains(p.WardId));
                    var effectiveZoneIds = ResolveEffectiveZoneIds(scope);
                    if (effectiveZoneIds.Count > 0)
                        q = q.Where(p => effectiveZoneIds.Contains(p.Ward!.ZoneId));
                    if (scope.PropertyTypeIds is { Count: > 0 } ptids2)
                    {
                        if (isPropertyTypeAllSelected)
                            q = q.Where(p => !p.PropertyTypeId.HasValue || ptids2.Contains(p.PropertyTypeId.Value));
                        else
                            q = q.Where(p => p.PropertyTypeId.HasValue && ptids2.Contains(p.PropertyTypeId.Value));
                    }
                    if (scope.AssessmentStatusIds is { Count: > 0 } asids2)
                    {
                        if (isAssessmentStatusAllSelected)
                            q = q.Where(p => !p.PropertyAssessmentStatusId.HasValue || asids2.Contains(p.PropertyAssessmentStatusId.Value));
                        else
                            q = q.Where(p => p.PropertyAssessmentStatusId.HasValue && asids2.Contains(p.PropertyAssessmentStatusId.Value));
                    }
                    break;
                }

            case JobScopeType.Building:
                {
                    var effectiveZoneIds = ResolveEffectiveZoneIds(scope);
                    var effectiveWardIds = ResolveEffectiveWardIds(scope);
                    var hasBuildings = scope.Building is { Count: > 0 };

                    // -----------------------------------------------------------------
                    // SAFETY NET FOR EXCEL UPLOAD: If the user uploaded a building-list
                    // scope but NEITHER zone IDs/names NOR ward IDs/names could be
                    // resolved (e.g. frontend ward lookup failed), then do NOT apply the
                    // (PropertyNo, PartitionNo) building filter across ALL wards — that
                    // would match identical (PropNo, PartNo) combos in unrelated wards
                    // and produce hundreds of unintended records (see: 12 Excel rows
                    // yielding 133 records). Instead, return an empty result set so the
                    // counts clearly signal that the scope is invalid.
                    // -----------------------------------------------------------------
                    if (hasBuildings && effectiveZoneIds.Count == 0 && effectiveWardIds.Count == 0
                        && (scope.WardNames is { Count: > 0 } || scope.ZoneNames is { Count: > 0 })
                        && !scope.Building!.Any(b => b.Contains(':')))
                    {
                        // The user DID specify ward/zone names but they didn't match any
                        // master records → treat as "no valid scope" rather than matching
                        // the whole system.
                        return q.Take(0);
                    }

                    if (hasBuildings)
                    {
                        var buildings = scope.Building!;
                        if (buildings.Any(b => b.Contains(':')))
                        {
                            var parameter = System.Linq.Expressions.Expression.Parameter(typeof(PropertyEntity), "p");
                            System.Linq.Expressions.Expression? body = null;

                            // Cache ward lookups to avoid redundant DB queries in the loop
                            var wardCache = new Dictionary<string, int>();

                            foreach (var b in buildings)
                            {
                                if (b.Contains(':'))
                                {
                                    var parts = b.Split(':');
                                    var wardKey = parts[0]?.Trim();
                                    var propVal = parts.Length > 1 ? parts[1]?.Trim() : string.Empty;

                                    if (string.IsNullOrEmpty(wardKey) || string.IsNullOrEmpty(propVal))
                                        continue;

                                    int? wardId = null;
                                    if (int.TryParse(wardKey, out var parsedWardId))
                                    {
                                        wardId = parsedWardId;
                                    }
                                    else
                                    {
                                        if (wardCache.TryGetValue(wardKey, out var cachedId))
                                        {
                                            wardId = cachedId;
                                        }
                                        else
                                        {
                                            var wardEntity = _wardRepo.GetQueryable()
                                                .FirstOrDefault(w => w.IsActive && 
                                                    (w.WardNo == wardKey || w.Description == wardKey));
                                            if (wardEntity != null)
                                            {
                                                wardId = wardEntity.Id;
                                                wardCache[wardKey] = wardEntity.Id;
                                            }
                                        }
                                    }

                                    if (wardId.HasValue)
                                    {
                                        string propNo = propVal;
                                        string partNo = string.Empty;
                                        if (propVal.Contains('-'))
                                        {
                                            var subParts = propVal.Split('-');
                                            propNo = subParts[0]?.Trim() ?? string.Empty;
                                            partNo = subParts.Length > 1 ? subParts[1]?.Trim() ?? string.Empty : string.Empty;
                                        }

                                        var wardEqual = System.Linq.Expressions.Expression.Equal(
                                            System.Linq.Expressions.Expression.Property(parameter, nameof(PropertyEntity.WardId)),
                                            System.Linq.Expressions.Expression.Constant(wardId.Value)
                                        );
                                        var propEqual = System.Linq.Expressions.Expression.Equal(
                                            System.Linq.Expressions.Expression.Property(parameter, nameof(PropertyEntity.PropertyNo)),
                                            System.Linq.Expressions.Expression.Constant(propNo)
                                        );

                                        System.Linq.Expressions.Expression rowExpr = System.Linq.Expressions.Expression.AndAlso(wardEqual, propEqual);

                                        if (!string.IsNullOrEmpty(partNo))
                                        {
                                            var partEqual = System.Linq.Expressions.Expression.Equal(
                                                System.Linq.Expressions.Expression.Property(parameter, nameof(PropertyEntity.PartitionNo)),
                                                System.Linq.Expressions.Expression.Constant(partNo)
                                            );
                                            rowExpr = System.Linq.Expressions.Expression.AndAlso(rowExpr, partEqual);
                                        }
                                        else
                                        {
                                            var partProp = System.Linq.Expressions.Expression.Property(parameter, nameof(PropertyEntity.PartitionNo));
                                            var partNull = System.Linq.Expressions.Expression.Equal(partProp, System.Linq.Expressions.Expression.Constant(null, typeof(string)));
                                            var partEmpty = System.Linq.Expressions.Expression.Equal(partProp, System.Linq.Expressions.Expression.Constant(string.Empty));
                                            var partNullOrEmpty = System.Linq.Expressions.Expression.OrElse(partNull, partEmpty);
                                            rowExpr = System.Linq.Expressions.Expression.AndAlso(rowExpr, partNullOrEmpty);
                                        }

                                        body = body == null ? rowExpr : System.Linq.Expressions.Expression.OrElse(body, rowExpr);
                                    }
                                }
                            }

                            if (body != null)
                            {
                                var lambda = System.Linq.Expressions.Expression.Lambda<Func<PropertyEntity, bool>>(body, parameter);
                                q = q.Where(lambda);
                            }
                            else
                            {
                                return q.Take(0);
                            }
                        }
                        else
                        {
                            if (effectiveZoneIds.Count > 0)
                                q = q.Where(p => effectiveZoneIds.Contains(p.Ward!.ZoneId));
                            if (effectiveWardIds.Count > 0)
                                q = q.Where(p => effectiveWardIds.Contains(p.WardId));

                            if (buildings.Any(b => b.Contains('-')))
                            {
                                var pairs = buildings
                                    .Select(b =>
                                    {
                                        var parts = b.Split('-');
                                        return (PropNo: parts[0]?.Trim(), PartNo: parts.Length > 1 ? parts[1]?.Trim() : string.Empty);
                                    })
                                    .Where(pair => !string.IsNullOrEmpty(pair.PropNo))
                                    .ToList();

                                var parameter = System.Linq.Expressions.Expression.Parameter(typeof(PropertyEntity), "p");
                                System.Linq.Expressions.Expression? body = null;

                                foreach (var pair in pairs)
                                {
                                    var propEqual = System.Linq.Expressions.Expression.Equal(
                                        System.Linq.Expressions.Expression.Property(parameter, nameof(PropertyEntity.PropertyNo)),
                                        System.Linq.Expressions.Expression.Constant(pair.PropNo)
                                    );
                                    var partEqual = System.Linq.Expressions.Expression.Equal(
                                        System.Linq.Expressions.Expression.Property(parameter, nameof(PropertyEntity.PartitionNo)),
                                        System.Linq.Expressions.Expression.Constant(pair.PartNo)
                                    );
                                    var andExpr = System.Linq.Expressions.Expression.AndAlso(propEqual, partEqual);

                                    body = body == null ? andExpr : System.Linq.Expressions.Expression.OrElse(body, andExpr);
                                }

                                if (body != null)
                                {
                                    var lambda = System.Linq.Expressions.Expression.Lambda<Func<PropertyEntity, bool>>(body, parameter);
                                    q = q.Where(lambda);
                                }
                            }
                            else
                            {
                                q = q.Where(p => buildings.Contains(p.PropertyNo ?? string.Empty));
                                if (scope.PartitionNos is { Count: > 0 } partNos3)
                                {
                                    q = q.Where(p => partNos3.Contains(p.PartitionNo ?? string.Empty));
                                }
                            }
                        }
                    }
                    else
                    {
                        if (effectiveZoneIds.Count > 0)
                            q = q.Where(p => effectiveZoneIds.Contains(p.Ward!.ZoneId));
                        if (effectiveWardIds.Count > 0)
                            q = q.Where(p => effectiveWardIds.Contains(p.WardId));
                    }
                    break;
                }

            case JobScopeType.Property:
                {
                    if (scope.PropertyIds is { Count: > 0 } pids)
                    {
                        q = q.Where(p => pids.Contains(p.Id));
                    }
                    if (scope.UpicIds is { Count: > 0 } upics)
                    {
                        q = q.Where(p => p.UPICId != null && upics.Contains(p.UPICId));
                    }
                    if (scope.MobileNumbers is { Count: > 0 } mobiles)
                    {
                        q = q.Where(p => p.MobileNo != null && mobiles.Contains(p.MobileNo));
                    }
                    if (!string.IsNullOrWhiteSpace(scope.SearchText))
                    {
                        var s = scope.SearchText.Trim();
                        q = q.Where(p =>
                            p.MobileNo == s ||
                            p.UPICId == s);
                    }
                    break;
                }

            case JobScopeType.Range:
                var rangeQ = ActiveProperties();

                if (scope.ZoneIds is { Count: > 0 } zids4) rangeQ = rangeQ.Where(p => zids4.Contains(p.Ward!.ZoneId));
                if (scope.WardIds is { Count: > 0 } wIds4) rangeQ = rangeQ.Where(p => wIds4.Contains(p.WardId));
                if (scope.PartitionNos is { Count: > 0 } partNos4) rangeQ = rangeQ.Where(p => partNos4.Contains(p.PartitionNo ?? string.Empty));
                if (scope.PropertyTypeIds is { Count: > 0 } ptids4)
                {
                    if (isPropertyTypeAllSelected)
                        rangeQ = rangeQ.Where(p => !p.PropertyTypeId.HasValue || ptids4.Contains(p.PropertyTypeId.Value));
                    else
                        rangeQ = rangeQ.Where(p => p.PropertyTypeId.HasValue && ptids4.Contains(p.PropertyTypeId.Value));
                }
                if (scope.AssessmentStatusIds is { Count: > 0 } asids4)
                {
                    if (isAssessmentStatusAllSelected)
                        rangeQ = rangeQ.Where(p => !p.PropertyAssessmentStatusId.HasValue || asids4.Contains(p.PropertyAssessmentStatusId.Value));
                    else
                        rangeQ = rangeQ.Where(p => p.PropertyAssessmentStatusId.HasValue && asids4.Contains(p.PropertyAssessmentStatusId.Value));
                }

                var propertiesInWard = rangeQ
                    .Select(p => new { p.Id, p.PropertyNo, p.PartitionNo })
                    .ToList();

                var matchedIds = new List<int>();
                foreach (var p in propertiesInWard)
                {
                    var computed = string.IsNullOrEmpty(p.PartitionNo) 
                        ? p.PropertyNo 
                        : p.PropertyNo + "-" + p.PartitionNo;

                    bool matchesFrom = string.IsNullOrWhiteSpace(scope.FromPropertyNo) || 
                        NtisPlatform.Application.Utilities.NaturalStringComparer.Instance.Compare(computed, scope.FromPropertyNo) >= 0;

                    bool matchesTo = string.IsNullOrWhiteSpace(scope.ToPropertyNo) || 
                        (!scope.ToPropertyNo.Contains('-') && p.PropertyNo == scope.ToPropertyNo) ||
                        NtisPlatform.Application.Utilities.NaturalStringComparer.Instance.Compare(computed, scope.ToPropertyNo) <= 0;

                    if (matchesFrom && matchesTo)
                    {
                        matchedIds.Add(p.Id);
                    }
                }

                q = q.Where(p => matchedIds.Contains(p.Id));
                break;
        }

        return q;
    }

    private IQueryable<int> LockedPropertyIds() =>
        _lockRepo.GetQueryable().AsNoTracking()
            .Where(l => l.IsLocked && l.IsActive && !l.MarkedForDeletion)
            .Select(l => l.PropertyId);

    // ---------------------------------------------------------------- Eligibility evaluation

    private enum PropertyEligibilityCode
    {
        Eligible,
        AlreadyTaxed,
        Locked,
        DetailsMissing,
        RateNotFound,
        TaxPercentageMissing,
        CVRateMappingNotFound,
        CVRateNotFound,
        CVTaxPercentageMissing
    }

    private sealed record PropertyEligibilityResult(PropertyEligibilityCode Code);

    private static string? ToSkipReasonCode(PropertyEligibilityCode code) => code switch
    {
        PropertyEligibilityCode.Eligible              => null,
        PropertyEligibilityCode.DetailsMissing        => "DetailsMissing",
        PropertyEligibilityCode.Locked                => "PropertyLocked",
        PropertyEligibilityCode.AlreadyTaxed          => "AlreadyProcessed",
        PropertyEligibilityCode.RateNotFound          => "RateNotFound",
        PropertyEligibilityCode.TaxPercentageMissing  => "TaxPercentageMissing",
        PropertyEligibilityCode.CVRateMappingNotFound => "CVRateMappingNotFound",
        PropertyEligibilityCode.CVRateNotFound        => "CVRateNotFound",
        PropertyEligibilityCode.CVTaxPercentageMissing => "CVTaxPercentageMissing",
        _                                              => null
    };

    private sealed record YearRangeInfo(int Id, int FromYear, int ToYear);

    /// <summary>
    /// Classifies every candidate property as Eligible / AlreadyTaxed / Locked / DetailsMissing /
    /// RateNotFound / TaxPercentageMissing for the given finance year. A property is Eligible only
    /// when it is not already taxed for the finance year, not locked, has at least one active
    /// PropertyDetails row, and EVERY active detail row resolves a valid RateMaster match AND has a
    /// TaxPercentageMasterRV row for every active TaxMaster.TaxId.
    /// </summary>
    private async Task<Dictionary<int, PropertyEligibilityResult>> EvaluateEligibilityAsync(
        IQueryable<PropertyEntity> candidates, int financeYearId, CancellationToken cancellationToken,
        bool overrideAlreadyTaxed = false)
    {
        var calculationMethodRaw = await _policyConfigService.GetPolicyValueAsync(
            "TaxCalculationMethod", "RV", cancellationToken);
        bool isCV = string.Equals(calculationMethodRaw, "CV", StringComparison.OrdinalIgnoreCase);
        string calculationMethod = isCV ? "CV" : "RV";

        // Scoped to the actual candidate set (joined, not just filtered by FinanceYearId) — these
        // three used to load every already-taxed/flagged/locked PropertyId across the WHOLE finance
        // year (potentially 100K+ rows for a large ULB) regardless of how narrow the requested scope
        // was, so even a single-property eligibility check paid the full dataset-wide cost. Joining
        // against `candidates` instead keeps this a cheap indexed join for a narrow scope, while an
        // "all properties" scope still joins against the full set — same cost as before, no regression.
        var alreadyTaxedIds = (await (
            from t in _transMastRepo.GetQueryable().AsNoTracking()
            join c in candidates on t.PropertyId equals c.Id
            where t.FinanceYearId == financeYearId && t.IsActive && !t.MarkedForDeletion
                && (t.CalculationType == calculationMethod
                    || (calculationMethod == "RV" && string.IsNullOrEmpty(t.CalculationType)))
            select t.PropertyId)
            .Distinct()
            .ToListAsync(cancellationToken))
            .ToHashSet();

        // Properties flagged by the CDC master-data-change pipeline (PTIS.PropertyTaxRecalcFlag) drop
        // out of Already Taxed and fall through to the normal rate/tax checks below, landing back in
        // Eligible or Skipped based on current master data — no separate bucket-shift logic needed.
        var flaggedForRecalcIds = (await (
            from f in _recalcFlagRepo.GetQueryable().AsNoTracking()
            join c in candidates on f.PropertyId equals c.Id
            where f.FinanceYearId == financeYearId && f.ResolvedAt == null && f.IsActive
                && (f.CalculationType == calculationMethod || f.CalculationType == "BOTH")
            select f.PropertyId)
            .ToListAsync(cancellationToken))
            .ToHashSet();
        alreadyTaxedIds.ExceptWith(flaggedForRecalcIds);

        var lockedIds = (await (
            from l in LockedPropertyIds()
            join c in candidates on l equals c.Id
            select l)
            .ToListAsync(cancellationToken))
            .ToHashSet();

        var detailRows = await (
            from d in _propertyDetailsRepo.GetQueryable().AsNoTracking()
            join p in candidates on d.PropertyId equals p.Id
            where d.IsActive && !d.MarkedForDeletion
            select new
            {
                d.PropertyId, p.TaxZoneId, p.WardId, p.MoujaId, p.CSN,
                d.ConstructionTypeId, d.TypeOfUseId, d.AssessmentYear,
                FloorGroupId = d.Floor != null ? d.Floor.FloorGroupId : (int?)null,
                d.IsTaxable
            }
        ).ToListAsync(cancellationToken);

        var detailsByProperty = detailRows
            .GroupBy(d => d.PropertyId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var candidateIds = await candidates.Select(p => p.Id).ToListAsync(cancellationToken);

        var result = new Dictionary<int, PropertyEligibilityResult>(candidateIds.Count);

        if (!isCV)
        {
            // ---- RV branch: unchanged logic from before the RV/CV split ----
            var orderedYearRanges = (await _assessmentYearRangeRepo.GetQueryable().AsNoTracking()
                .Where(r => r.IsActive)
                .Select(r => new YearRangeInfo(r.Id, r.FromYear, r.ToYear))
                .ToListAsync(cancellationToken))
                .OrderByDescending(r => r.FromYear)
                .ThenBy(r => r.Id)
                .ToList();

            var wardRateSectionMap = (await _rateSectionDetailsRepo.GetQueryable().AsNoTracking()
                .Where(sd => sd.IsActive)
                .Select(sd => new { sd.WardId, sd.RateSectionId })
                .ToListAsync(cancellationToken))
                .GroupBy(sd => sd.WardId)
                .ToDictionary(g => g.Key, g => g.Select(sd => sd.RateSectionId).FirstOrDefault());

            var rateKeys = (await _rateRepo.GetQueryable().AsNoTracking()
                .Where(r => r.IsActive)
                .Select(r => new { r.RateSectionId, r.TaxZoneId, r.ConstructionTypeId, r.TypeOfUseGroupId, r.YearRangeRVId })
                .ToListAsync(cancellationToken))
                .Select(r => (r.RateSectionId, r.TaxZoneId, r.ConstructionTypeId, r.TypeOfUseGroupId, r.YearRangeRVId))
                .ToHashSet();

            var taxPctKeys = (await _taxPercentageMasterRVRepo.GetQueryable().AsNoTracking()
                .Where(t => t.IsActive)
                .Select(t => new { t.TaxId, t.TypeOfUseId, t.YearRangeRVId })
                .ToListAsync(cancellationToken))
                .Select(t => (t.TaxId, t.TypeOfUseId, t.YearRangeRVId))
                .ToHashSet();

            var activeTaxIds = await _taxMasterRepo.GetQueryable().AsNoTracking()
                .Where(t => t.IsActive && t.TaxCode != "TaxTotal" && t.TaxName != "TaxTotal")
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);

            var typeOfUseGroupMap = await _typeOfUseRepo.GetQueryable().AsNoTracking()
                .Where(u => u.IsActive)
                .ToDictionaryAsync(u => u.Id, u => u.TypeOfUseGroupId, cancellationToken);

            foreach (var propertyId in candidateIds)
            {
                if (alreadyTaxedIds.Contains(propertyId) && !overrideAlreadyTaxed)
                {
                    result[propertyId] = new PropertyEligibilityResult(PropertyEligibilityCode.AlreadyTaxed);
                    continue;
                }

                if (lockedIds.Contains(propertyId))
                {
                    result[propertyId] = new PropertyEligibilityResult(PropertyEligibilityCode.Locked);
                    continue;
                }

                if (!detailsByProperty.TryGetValue(propertyId, out var details) || details.Count == 0)
                {
                    result[propertyId] = new PropertyEligibilityResult(PropertyEligibilityCode.DetailsMissing);
                    continue;
                }

                var code = PropertyEligibilityCode.Eligible;
                foreach (var detail in details)
                {
                    // Non-taxable property details are computed as zero tax by RateableValueCalculatorService
                    // (if (detail.IsTaxable == false) return CreateZeroResult(...)) and do not require rate
                    // or tax percentage configurations to be eligible.
                    if (detail.IsTaxable == false)
                    {
                        continue;
                    }

                    int? yearRangeId = ResolveYearRangeId(detail.AssessmentYear, orderedYearRanges);
                    int? typeOfUseGroupId = typeOfUseGroupMap.GetValueOrDefault(detail.TypeOfUseId);
                    int rateSectionId = wardRateSectionMap.GetValueOrDefault(detail.WardId);

                    bool rateOk = yearRangeId.HasValue
                        && typeOfUseGroupId.HasValue
                        && detail.ConstructionTypeId.HasValue
                        && rateKeys.Contains((rateSectionId, detail.TaxZoneId, detail.ConstructionTypeId.Value, typeOfUseGroupId.Value, yearRangeId.Value));

                    if (!rateOk)
                    {
                        code = PropertyEligibilityCode.RateNotFound;
                        break;
                    }

                    // A property is eligible as long as AT LEAST ONE active tax head has a
                    // percentage configured for its TypeOfUseId/YearRangeRVId — tax heads with no
                    // configured percentage are simply computed as 0 by RateableValueService rather
                    // than blocking the property entirely (matches the RV calculator's own tolerance
                    // for missing percentage rows).
                    bool taxPctOk = yearRangeId.HasValue
                        && activeTaxIds.Any(taxId => taxPctKeys.Contains((taxId, detail.TypeOfUseId, yearRangeId.Value)));

                    if (!taxPctOk)
                    {
                        code = PropertyEligibilityCode.TaxPercentageMissing;
                        break;
                    }
                }

                result[propertyId] = new PropertyEligibilityResult(code);
            }

            return result;
        }

        // ---- CV branch ----
        var capitalValueAreaTypePolicy = await _policyConfigService.GetPolicyValueAsync(
            "CapitalValueAreaType", string.Empty, cancellationToken);
        if (string.IsNullOrWhiteSpace(capitalValueAreaTypePolicy))
        {
            throw new InvalidOperationException(
                "CapitalValueAreaType policy is not configured — cannot evaluate Capital Value eligibility.");
        }

        var csnMap = (await _csnDetailsRepo.GetQueryable().AsNoTracking()
            .Where(c => c.IsActive)
            .Select(c => new { c.MoujaId, c.CSN, c.RateCVMasterId })
            .ToListAsync(cancellationToken))
            .GroupBy(c => (c.MoujaId, c.CSN))
            .ToDictionary(g => g.Key, g => g.Select(c => c.RateCVMasterId).ToList());

        var typeOfUseGroupCVMap = (await _typeOfUseRepo.GetQueryable().AsNoTracking()
            .Where(u => u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.TypeOfUseGroupCVId,
                Code = u.TypeOfUseGroupCV != null ? u.TypeOfUseGroupCV.TypeOfUseGroupCVCode : string.Empty,
                IsFloorWise = u.TypeOfUseGroupCV != null && u.TypeOfUseGroupCV.IsFloorWiseRateApplicable
            })
            .ToListAsync(cancellationToken))
            .ToDictionary(u => u.Id, u => (u.TypeOfUseGroupCVId, u.Code, u.IsFloorWise));

        var yearRangeCVList = (await _assessmentYearRangeCVRepo.GetQueryable().AsNoTracking()
            .Where(r => r.IsActive)
            .Select(r => new YearRangeInfo(r.Id, r.FromYear, r.ToYear))
            .ToListAsync(cancellationToken))
            .OrderByDescending(r => r.FromYear)
            .ThenBy(r => r.Id)
            .ToList();

        var cvRateMasterById = (await _rateMasterForCVRepo.GetQueryable().AsNoTracking()
            .Where(r => r.IsActive)
            .Select(r => new { r.Id, r.AssessmentYearRangeId, r.TypeOfUseGroupCVId, r.FloorGroupId })
            .ToListAsync(cancellationToken))
            .ToDictionary(r => r.Id);

        var cvTaxPctKeys = (await _taxPercentageMasterCVRepo.GetQueryable().AsNoTracking()
            .Where(t => t.IsActive)
            .Select(t => new { t.TaxId, t.TypeOfUseId, t.YearRangeCVId })
            .ToListAsync(cancellationToken))
            .Select(t => (t.TaxId, t.TypeOfUseId, t.YearRangeCVId))
            .ToHashSet();

        var activeTaxIdsCV = await _taxMasterRepo.GetQueryable().AsNoTracking()
            .Where(t => t.IsActive && t.TaxCode != "TaxTotal" && t.TaxName != "TaxTotal")
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        foreach (var propertyId in candidateIds)
        {
            if (alreadyTaxedIds.Contains(propertyId) && !overrideAlreadyTaxed)
            {
                result[propertyId] = new PropertyEligibilityResult(PropertyEligibilityCode.AlreadyTaxed);
                continue;
            }

            if (lockedIds.Contains(propertyId))
            {
                result[propertyId] = new PropertyEligibilityResult(PropertyEligibilityCode.Locked);
                continue;
            }

            if (!detailsByProperty.TryGetValue(propertyId, out var details) || details.Count == 0)
            {
                result[propertyId] = new PropertyEligibilityResult(PropertyEligibilityCode.DetailsMissing);
                continue;
            }

            var code = PropertyEligibilityCode.Eligible;
            foreach (var detail in details)
            {
                if (detail.IsTaxable == false)
                {
                    continue;
                }

                var (typeOfUseGroupCVId, groupCode, isFloorWise) = typeOfUseGroupCVMap.GetValueOrDefault(detail.TypeOfUseId);

                if (groupCode == "N")
                {
                    // Mirrors CapitalValueService.CreateAsync's own "N" handling (CapitalValueService.cs:171-256):
                    // not a failure — this detail contributes no CV tax and does not block eligibility.
                    continue;
                }

                if (detail.MoujaId is null || string.IsNullOrEmpty(detail.CSN))
                {
                    // Defensive: CreateAsync does `property.MoujaId!.Value`, which would NPE on null.
                    code = PropertyEligibilityCode.CVRateMappingNotFound;
                    break;
                }

                if (!csnMap.TryGetValue((detail.MoujaId.Value, detail.CSN), out var candidateRateMasterIds))
                {
                    code = PropertyEligibilityCode.CVRateMappingNotFound;
                    break;
                }

                int? yearRangeCVId = ResolveYearRangeId(detail.AssessmentYear, yearRangeCVList);
                if (!yearRangeCVId.HasValue)
                {
                    code = PropertyEligibilityCode.CVRateNotFound;
                    break;
                }

                if (isFloorWise && detail.FloorGroupId is null)
                {
                    // Mirrors FloorGroupNotFoundException in CapitalValueCalculatorService.cs:73-77.
                    code = PropertyEligibilityCode.CVRateNotFound;
                    break;
                }

                bool rateOk = candidateRateMasterIds.Any(id =>
                    cvRateMasterById.TryGetValue(id, out var rm)
                    && rm.AssessmentYearRangeId == yearRangeCVId.Value
                    && rm.TypeOfUseGroupCVId == typeOfUseGroupCVId
                    && (isFloorWise ? rm.FloorGroupId == detail.FloorGroupId : rm.FloorGroupId == null));

                if (!rateOk)
                {
                    code = PropertyEligibilityCode.CVRateNotFound;
                    break;
                }

                // Same "at least one" relaxation as the RV branch above — matches
                // CapitalValueCalculatorService's own behavior, which only requires at least one
                // tax head to have a configured percentage (throws only when taxes.Any() is false)
                // and simply omits any tax head with no percentage row rather than blocking the
                // property.
                bool taxPctOk = activeTaxIdsCV.Any(taxId =>
                    cvTaxPctKeys.Contains((taxId, detail.TypeOfUseId, yearRangeCVId.Value)));

                if (!taxPctOk)
                {
                    code = PropertyEligibilityCode.CVTaxPercentageMissing;
                    break;
                }
            }

            result[propertyId] = new PropertyEligibilityResult(code);
        }

        return result;
    }

    

    /// <summary>Parses the leading 4-digit year out of a free-text AssessmentYear value and resolves
    /// the most specific/most recent active year range that contains it (mirrors TRY_CONVERT +
    /// TOP(1) ORDER BY FromYear DESC semantics).</summary>
    private static int? ResolveYearRangeId(string? assessmentYear, List<YearRangeInfo> orderedYearRanges)
    {
        if (string.IsNullOrWhiteSpace(assessmentYear)) return null;

        var trimmed = assessmentYear.Trim();
        var yearText = trimmed.Length >= 4 ? trimmed[..4] : trimmed;
        if (!int.TryParse(yearText, out var year)) return null;

        foreach (var range in orderedYearRanges)
        {
            if (year >= range.FromYear && year <= range.ToYear) return range.Id;
        }
        return null;
    }

    // ---------------------------------------------------------------- Helpers

    private async Task<PropertyTaxJobEntity> GetJobByIdAsync(long jobId, CancellationToken ct)
    {
        var job = await _jobRepo.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == jobId && !j.MarkedForDeletion, ct);
        if (job is null)
            throw new KeyNotFoundException($"Job ID '{jobId}' was not found.");
        return job;
    }

    private static string FormatJobCode(JobOperation operation, int financeYear, long jobId)
    {
        return $"JOB-{OperationPrefix(operation)}-{financeYear}-{jobId:D4}";
    }

    private static string OperationPrefix(JobOperation operation) => operation switch
    {
        JobOperation.AddTax => "ADD",
        JobOperation.QuarterlyAdd => "QADD",
        JobOperation.RemoveTax => "REM",
        JobOperation.QuarterlyRemove => "QREM",
        _ => "OP"
    };

    private static void ValidateScope(JobScopeType scopeType, OperationScopeDto scope)
    {
        switch (scopeType)
        {
            case JobScopeType.Zone when (scope.ZoneIds is null || scope.ZoneIds.Count == 0)
                                       && (scope.ZoneNames is null || scope.ZoneNames.Count == 0):
                throw new ArgumentException("At least one zone is required for the selected scope.");
            case JobScopeType.Ward when (scope.WardIds is null || scope.WardIds.Count == 0)
                                       && (scope.WardNames is null || scope.WardNames.Count == 0):
                throw new ArgumentException("At least one ward is required for the selected scope.");
            case JobScopeType.Building when ((scope.ZoneIds is null || scope.ZoneIds.Count == 0)
                                             && (scope.ZoneNames is null || scope.ZoneNames.Count == 0))
                                         || (scope.WardIds is null || scope.WardIds.Count == 0)
                                             && (scope.WardNames is null || scope.WardNames.Count == 0)
                                         || scope.Building is null || scope.Building.Count == 0:
                throw new ArgumentException("Zone, ward and building are required for the selected scope.");
            case JobScopeType.Property when (scope.PropertyIds is null || scope.PropertyIds.Count == 0)
                                            && (scope.UpicIds is null || scope.UpicIds.Count == 0)
                                            && (scope.MobileNumbers is null || scope.MobileNumbers.Count == 0)
                                            && string.IsNullOrWhiteSpace(scope.SearchText):
                throw new ArgumentException("Select at least one property for the selected scope.");
            case JobScopeType.Range when string.IsNullOrWhiteSpace(scope.FromPropertyNo)
                                         || string.IsNullOrWhiteSpace(scope.ToPropertyNo):
                throw new ArgumentException("Both From and To property numbers are required for the selected scope.");
        }
    }

    private static string BuildScopeDescription(JobScopeType scopeType, OperationScopeDto scope)
    {
        if (scopeType == JobScopeType.MasterDataChange)
            return "Master Change Batch";

        var category = scopeType switch
        {
            JobScopeType.Zone => ScopeCategory.ZoneNode,
            JobScopeType.Ward => ScopeCategory.WardSector,
            JobScopeType.Building => ScopeCategory.BuildingWise,
            JobScopeType.Property => ScopeCategory.PropertyWise,
            JobScopeType.Range => ScopeCategory.PropertyRange,
            _ => throw new ArgumentException($"Unknown scope type '{scopeType}'.")
        };
        return category.GetDescription();
    }

    private static JobScopeType ParseScopeType(string value) =>
        Enum.TryParse<JobScopeType>(value, ignoreCase: true, out var parsed)
            ? parsed
            : throw new ArgumentException($"Unknown scope type '{value}'.");

    private static JobOperation ParseOperation(string value) =>
        Enum.TryParse<JobOperation>(value, ignoreCase: true, out var parsed)
            ? parsed
            : throw new ArgumentException($"Unknown operation '{value}'.");

    private static string FormatDuration(long? durationMs)
    {
        if (durationMs is null) return string.Empty;
        var span = TimeSpan.FromMilliseconds(durationMs.Value);
        return span.TotalMinutes >= 1
            ? $"{(int)span.TotalMinutes}m {span.Seconds}s"
            : $"{span.Seconds}s";
    }

    private static string ToLocalizationKey(SkipReason reason) => reason switch
    {
        SkipReason.AlreadyProcessed => "Skip_AlreadyProcessed",
        SkipReason.PropertyLocked => "Skip_PropertyLocked",
        SkipReason.PendingVerification => "Skip_PropertyDetailsMissing",
        SkipReason.InvalidScope => "Skip_InvalidScope",
        SkipReason.PermissionRestricted => "Skip_PermissionRestricted",
        SkipReason.ApprovalRequired => "Skip_ApprovalRequired",
        SkipReason.RateNotFound => "Skip_RateNotFound",
        SkipReason.TaxPercentageMissing => "Skip_TaxPercentageMissing",
        SkipReason.CVRateMappingNotFound => "Skip_CVRateMappingNotFound",
        SkipReason.CVRateNotFound => "Skip_CVRateNotFound",
        SkipReason.CVTaxPercentageMissing => "Skip_CVTaxPercentageMissing",
        _ => reason.ToString()
    };

    private static string Truncate(string value, int max) =>
        string.IsNullOrEmpty(value) || value.Length <= max ? value : value[..max];

    private static readonly string DefaultDetailsMissingReason =
        "Property details not found: Floor type, Construction type, Carpet area, Built-up area, Type of use, Assessment year missing";

    public async Task WritePreviewExportCsvToStreamAsync(
        Stream outputStream,
        OperationPreviewRequestDto request,
        string downloadType,
        CancellationToken cancellationToken = default)
    {
        var yearEntity = await _yearMasterRepo.GetByIdAsync(request.FinanceYearId, cancellationToken);
        if (yearEntity is null) throw new ArgumentException("Invalid finance year ID.");

        var scopeType = ParseScopeType(request.ScopeType);
        var (isPtAll, isAsAll) = await CheckAllSelectedFlagsAsync(request.Scope, cancellationToken);
        var candidates = BuildCandidateQuery(scopeType, request.Scope, yearEntity, isPtAll, isAsAll);

        var breakdown = await EvaluateEligibilityAsync(candidates, request.FinanceYearId, cancellationToken, request.Scope.OverrideAlreadyTaxed);

        var wards = _wardRepo.GetQueryable().AsNoTracking();
        var zones = _zoneRepo.GetQueryable().AsNoTracking();

        var query = from p in candidates
                    join w in wards on p.WardId equals w.Id into wardJoin
                    from w in wardJoin.DefaultIfEmpty()
                    join z in zones on (w != null ? w.ZoneId : (int?)null) equals z.Id into zoneJoin
                    from z in zoneJoin.DefaultIfEmpty()
                    select new
                    {
                        PropertyId = p.Id,
                        Zone = z != null ? z.Description : string.Empty,
                        Ward = w != null ? w.Description : string.Empty,
                        PropertyNo = p.PropertyNo ?? string.Empty,
                        PartitionNo = p.PartitionNo ?? string.Empty,
                        OwnerName = p.OwnerName ?? string.Empty
                    };

        await using var writer = new StreamWriter(outputStream, new System.Text.UTF8Encoding(true), bufferSize: 1024, leaveOpen: true);

        await writer.WriteLineAsync("Zone,Ward,Property No,Partition No,Owner,Status,Skip Reason");

        int count = 0;
        await foreach (var item in query.AsAsyncEnumerable().WithCancellation(cancellationToken))
        {
            var code = breakdown.GetValueOrDefault(item.PropertyId)?.Code;

            // Filter in-memory against the requested downloadType bucket ("all" writes every row)
            bool include = downloadType switch
            {
                var t when string.Equals(t, "eligible", StringComparison.OrdinalIgnoreCase) => code == PropertyEligibilityCode.Eligible,
                var t when string.Equals(t, "skipped", StringComparison.OrdinalIgnoreCase) => code is PropertyEligibilityCode.Locked
                    or PropertyEligibilityCode.DetailsMissing or PropertyEligibilityCode.RateNotFound or PropertyEligibilityCode.TaxPercentageMissing
                    or PropertyEligibilityCode.CVRateMappingNotFound or PropertyEligibilityCode.CVRateNotFound or PropertyEligibilityCode.CVTaxPercentageMissing,
                _ => true
            };
            if (!include) continue;

            var (status, skipReason) = DescribeEligibility(code);

            string zone = EscapeCsvField(item.Zone);
            string ward = EscapeCsvField(item.Ward);
            string propNo = EscapeCsvField(item.PropertyNo);
            string partNo = EscapeCsvField(item.PartitionNo);
            string owner = EscapeCsvField(item.OwnerName);
            string reason = EscapeCsvField(skipReason);

            await writer.WriteLineAsync($"{zone},{ward},{propNo},{partNo},{owner},{status},{reason}");

            count++;
            if (count % 500 == 0)
            {
                await writer.FlushAsync(cancellationToken);
            }
        }
    }

    public async Task WritePropertiesCsvToStreamAsync(
        Stream outputStream,
        string statusFilter,
        int? financeYearId = null,
        CancellationToken cancellationToken = default)
    {
        var candidates = _propertyRepo.GetQueryable().AsNoTracking()
            .Where(p => p.IsActive && !p.MarkedForDeletion);

        var resolvedYearId = financeYearId;
        if (!resolvedYearId.HasValue || resolvedYearId <= 0)
        {
            var today = DateTime.Today;
            var activeYear = await _yearMasterRepo.GetQueryable().AsNoTracking()
                .FirstOrDefaultAsync(y => y.IsActive, cancellationToken)
                ?? await _yearMasterRepo.GetQueryable().AsNoTracking()
                    .FirstOrDefaultAsync(y => y.StartDate <= today && y.EndDate >= today, cancellationToken)
                    ?? await _yearMasterRepo.GetQueryable().AsNoTracking()
                        .FirstOrDefaultAsync(cancellationToken);

            resolvedYearId = activeYear?.Id;
        }

        // Note: candidates are NOT filtered by CreatedDate against the finance year window — Total
        // is identical for every finance year; "already taxed" is determined via TransMast below.
        var breakdown = resolvedYearId.HasValue && resolvedYearId > 0
            ? await EvaluateEligibilityAsync(candidates, resolvedYearId.Value, cancellationToken)
            : new Dictionary<int, PropertyEligibilityResult>();

        var wards = _wardRepo.GetQueryable().AsNoTracking();
        var zones = _zoneRepo.GetQueryable().AsNoTracking();

        var query = from p in candidates
                    join w in wards on p.WardId equals w.Id into wardJoin
                    from w in wardJoin.DefaultIfEmpty()
                    join z in zones on (w != null ? w.ZoneId : (int?)null) equals z.Id into zoneJoin
                    from z in zoneJoin.DefaultIfEmpty()
                    select new
                    {
                        PropertyId = p.Id,
                        Zone = z != null ? z.Description : string.Empty,
                        Ward = w != null ? w.Description : string.Empty,
                        PropertyNo = p.PropertyNo ?? string.Empty,
                        PartitionNo = p.PartitionNo ?? string.Empty,
                        OwnerName = p.OwnerName ?? string.Empty
                    };

        await using var writer = new StreamWriter(outputStream, new System.Text.UTF8Encoding(true), bufferSize: 1024, leaveOpen: true);

        // Write headers
        await writer.WriteLineAsync("Zone,Ward,Property No,Partition No,Owner,Status,Skip Reason");

        int count = 0;
        await foreach (var item in query.AsAsyncEnumerable().WithCancellation(cancellationToken))
        {
            var code = breakdown.GetValueOrDefault(item.PropertyId)?.Code;

            bool include = statusFilter switch
            {
                var t when string.Equals(t, "eligible", StringComparison.OrdinalIgnoreCase) =>
                    code == PropertyEligibilityCode.Eligible,
                var t when string.Equals(t, "pending", StringComparison.OrdinalIgnoreCase) =>
                    code != PropertyEligibilityCode.AlreadyTaxed && code != PropertyEligibilityCode.Locked,
                var t when string.Equals(t, "skipped", StringComparison.OrdinalIgnoreCase) =>
                    code != PropertyEligibilityCode.Eligible && code != PropertyEligibilityCode.AlreadyTaxed,
                var t when string.Equals(t, "transmast", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(t, "calculated", StringComparison.OrdinalIgnoreCase) => code == PropertyEligibilityCode.AlreadyTaxed,
                _ => true
            };
            if (!include) continue;

            var (status, skipReason) = DescribeEligibility(code);

            // Escape fields for CSV format safety & formula injection protection
            var zone = EscapeCsvField(item.Zone);
            var ward = EscapeCsvField(item.Ward);
            var propNo = EscapeCsvField(item.PropertyNo);
            var partNo = EscapeCsvField(item.PartitionNo);
            var owner = EscapeCsvField(item.OwnerName);
            var reason = EscapeCsvField(skipReason);

            await writer.WriteLineAsync($"{zone},{ward},{propNo},{partNo},{owner},{status},{reason}");

            count++;
            if (count % 500 == 0)
            {
                await writer.FlushAsync(cancellationToken);
            }
        }
    }

    private static (string Status, string SkipReason) DescribeEligibility(PropertyEligibilityCode? code) => code switch
    {
        PropertyEligibilityCode.Eligible => ("Eligible", "-"),
        PropertyEligibilityCode.AlreadyTaxed => ("Already Taxed", ToDisplayReason(SkipReason.AlreadyProcessed)),
        PropertyEligibilityCode.Locked => ("Skipped", ToDisplayReason(SkipReason.PropertyLocked)),
        PropertyEligibilityCode.DetailsMissing => ("Skipped", DefaultDetailsMissingReason),
        PropertyEligibilityCode.RateNotFound => ("Skipped", ToDisplayReason(SkipReason.RateNotFound)),
        PropertyEligibilityCode.TaxPercentageMissing => ("Skipped", ToDisplayReason(SkipReason.TaxPercentageMissing)),
        PropertyEligibilityCode.CVRateMappingNotFound => ("Skipped", ToDisplayReason(SkipReason.CVRateMappingNotFound)),
        PropertyEligibilityCode.CVRateNotFound => ("Skipped", ToDisplayReason(SkipReason.CVRateNotFound)),
        PropertyEligibilityCode.CVTaxPercentageMissing => ("Skipped", ToDisplayReason(SkipReason.CVTaxPercentageMissing)),
        _ => ("Skipped", "Unknown")
    };

    // ---------------------------------------------------------------- Detail-level skip reason helpers

    private sealed record PropertyDetailFields(
        int? FloorId, int? ConstructionTypeId,
        double? CarpetAreaSqMeter, double? CarpetAreaSqFeet,
        double? BuiltupAreaSqMeter, double? BuiltupAreaSqFeet,
        int? TypeOfUseId, string? AssessmentYear);

    /// <summary>
    /// Builds a human-readable skip reason that lists exactly which required PropertyDetails
    /// fields are absent. When <paramref name="fields"/> is null the property has no active
    /// details record at all, so every required field is reported as missing.
    /// </summary>
    private static string BuildDetailsSkipReason(PropertyDetailFields? fields)
    {
        var missing = new List<string>();

        if (fields is null || !fields.FloorId.HasValue)                                     missing.Add("Floor type");
        if (fields is null || !fields.ConstructionTypeId.HasValue)                          missing.Add("Construction type");
        if (fields is null || (!fields.CarpetAreaSqMeter.HasValue && !fields.CarpetAreaSqFeet.HasValue))   missing.Add("Carpet area");
        if (fields is null || (!fields.BuiltupAreaSqMeter.HasValue && !fields.BuiltupAreaSqFeet.HasValue)) missing.Add("Built-up area");
        if (fields is null || !fields.TypeOfUseId.HasValue || fields.TypeOfUseId <= 0)      missing.Add("Type of use");
        if (fields is null || string.IsNullOrWhiteSpace(fields.AssessmentYear))             missing.Add("Assessment year");

        return missing.Count > 0
            ? $"Property details not found: {string.Join(", ", missing)} missing"
            : "Property details complete";
    }

    private static List<string> GetMissingDetailFieldKeys(PropertyDetailFields? fields)
    {
        var missing = new List<string>();

        if (fields is null || !fields.FloorId.HasValue)                                     missing.Add("floorType");
        if (fields is null || !fields.ConstructionTypeId.HasValue)                          missing.Add("constructionType");
        if (fields is null || (!fields.CarpetAreaSqMeter.HasValue && !fields.CarpetAreaSqFeet.HasValue))   missing.Add("carpetArea");
        if (fields is null || (!fields.BuiltupAreaSqMeter.HasValue && !fields.BuiltupAreaSqFeet.HasValue)) missing.Add("builtupArea");
        if (fields is null || !fields.TypeOfUseId.HasValue || fields.TypeOfUseId <= 0)      missing.Add("typeOfUse");
        if (fields is null || string.IsNullOrWhiteSpace(fields.AssessmentYear))             missing.Add("assessmentYear");

        return missing;
    }

    /// <summary>
    /// Batch-loads the required detail fields for a set of property IDs in a single SQL query.
    /// Returns null for any ID that has no active PropertyDetails record.
    /// </summary>
    private async Task<Dictionary<int, PropertyDetailFields>> GetPropertyDetailFieldsAsync(
        IList<int> propertyIds, CancellationToken cancellationToken)
    {
        if (propertyIds.Count == 0) return new Dictionary<int, PropertyDetailFields>();

        var rows = await _propertyDetailsRepo.GetQueryable().AsNoTracking()
            .Where(d => d.IsActive && propertyIds.Contains(d.PropertyId))
            .GroupBy(d => d.PropertyId)
            .Select(g => new
            {
                PropertyId       = g.Key,
                FloorId          = g.Min(d => d.FloorId),
                ConstructionType = g.Min(d => d.ConstructionTypeId),
                CarpetSqm        = g.Min(d => d.CarpetAreaSqMeter),
                CarpetSqft       = g.Min(d => d.CarpetAreaSqFeet),
                BuiltupSqm       = g.Min(d => d.BuiltupAreaSqMeter),
                BuiltupSqft      = g.Min(d => d.BuiltupAreaSqFeet),
                TypeOfUse        = g.Min(d => d.TypeOfUseId),
                AssessmentYear   = g.Min(d => d.AssessmentYear)
            })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(
            r => r.PropertyId,
            r => new PropertyDetailFields(
                r.FloorId,
                r.ConstructionType,
                r.CarpetSqm,
                r.CarpetSqft,
                r.BuiltupSqm,
                r.BuiltupSqft,
                r.TypeOfUse,
                r.AssessmentYear));
    }

    /// <summary>
    /// Returns a plain-English display message for a skip reason (locked case only).
    /// Details-missing cases use <see cref="BuildDetailsSkipReason"/> for field-level specifics.
    /// </summary>
    private static string ToDisplayReason(SkipReason reason) => reason switch
    {
        SkipReason.PropertyLocked => "Property is locked",
        SkipReason.AlreadyProcessed => "Taxes are already calculated for this property for the selected finance year",
        SkipReason.RateNotFound => "Rate not configured for one or more property details",
        SkipReason.TaxPercentageMissing => "Tax percentage not configured for one or more property details",
        SkipReason.CVRateMappingNotFound => "No CSN rate mapping found for this property (Capital Value)",
        SkipReason.CVRateNotFound => "Rate not configured for one or more property details (Capital Value)",
        SkipReason.CVTaxPercentageMissing => "Tax percentage not configured for one or more property details (Capital Value)",
        _ => reason.ToString()
    };

    private static string EscapeCsvField(string? field)
    {
        if (string.IsNullOrEmpty(field)) return string.Empty;
        
        // Neutralize formula injection
        char first = field[0];
        if (first == '=' || first == '+' || first == '-' || first == '@')
        {
            field = "'" + field;
        }
        
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }

    /// <summary>Only called when the TaxCalculationMethod policy is RV — see GetSummaryCountsAsync.</summary>
    private IQueryable<PropertyEntity> GetEligiblePropertiesQuery(int financeYearId)
    {
        var activeProperties = ActiveProperties();

        var flaggedForRecalcIds = _recalcFlagRepo.GetQueryable().AsNoTracking()
            .Where(f => f.FinanceYearId == financeYearId && f.ResolvedAt == null && f.IsActive
                && (f.CalculationType == "RV" || f.CalculationType == "BOTH"))
            .Select(f => f.PropertyId);

        var taxedPropertyIds = _transMastRepo.GetQueryable().AsNoTracking()
            .Where(t => t.FinanceYearId == financeYearId && t.IsActive && !t.MarkedForDeletion
                && (t.CalculationType == "RV" || string.IsNullOrEmpty(t.CalculationType)))
            .Select(t => t.PropertyId)
            .Where(id => !flaggedForRecalcIds.Contains(id));

        var lockedPropertyIds = _lockRepo.GetQueryable().AsNoTracking()
            .Where(l => l.IsLocked && l.IsActive && !l.MarkedForDeletion)
            .Select(l => l.PropertyId);

        var activeDetails = _propertyDetailsRepo.GetQueryable().AsNoTracking()
            .Where(pd => pd.IsActive && !pd.MarkedForDeletion);

        var activeRates = _rateRepo.GetQueryable().AsNoTracking()
            .Where(r => r.IsActive);

        var activeYearRanges = _assessmentYearRangeRepo.GetQueryable().AsNoTracking()
            .Where(yr => yr.IsActive);

        var activeTypeOfUses = _typeOfUseRepo.GetQueryable().AsNoTracking()
            .Where(tou => tou.IsActive);

        var activeTaxes = _taxMasterRepo.GetQueryable().AsNoTracking()
            .Where(tx => tx.IsActive && tx.TaxCode != "TaxTotal" && tx.TaxName != "TaxTotal");

        var activeTaxPercentages = _taxPercentageMasterRVRepo.GetQueryable().AsNoTracking()
            .Where(tpm => tpm.IsActive);

        var activeRateSectionDetails = _rateSectionDetailsRepo.GetQueryable().AsNoTracking()
            .Where(sd => sd.IsActive);

        return activeProperties
            .Where(p => !taxedPropertyIds.Contains(p.Id))
            .Where(p => !lockedPropertyIds.Contains(p.Id))
            .Where(p => activeDetails.Any(pd => pd.PropertyId == p.Id))
            .Where(p => !activeDetails.Where(pd => pd.PropertyId == p.Id && pd.IsTaxable != false).Any(pd =>
                !activeYearRanges.Where(yr =>
                    pd.AssessmentYear != null &&
                    EF.Functions.Like(pd.AssessmentYear, "[0-9][0-9][0-9][0-9]%") &&
                    Convert.ToInt32(pd.AssessmentYear.Substring(0, 4)) >= yr.FromYear &&
                    Convert.ToInt32(pd.AssessmentYear.Substring(0, 4)) <= yr.ToYear
                ).Any(yr =>
                    activeTypeOfUses.Where(tou => tou.Id == pd.TypeOfUseId).Any(tou =>
                        activeRateSectionDetails.Where(sd => p.WardId != null && sd.WardId == p.WardId).Any(sd =>
                            activeRates.Any(rm =>
                                rm.RateSectionId == sd.RateSectionId &&
                                rm.TaxZoneId == p.TaxZoneId &&
                                rm.ConstructionTypeId == pd.ConstructionTypeId &&
                                rm.TypeOfUseGroupId == tou.TypeOfUseGroupId &&
                                rm.YearRangeRVId == yr.Id
                            )
                        )
                    )
                )
                ||
                // A detail row only fails the tax-percentage check if NONE of the active tax heads
                // have a configured percentage (at-least-one semantics, matching
                // EvaluateEligibilityAsync — a tax head with no percentage row is simply computed as
                // 0 by RateableValueService rather than blocking the property).
                !activeTaxes.Any(tx =>
                    activeYearRanges.Where(yr =>
                        pd.AssessmentYear != null &&
                        EF.Functions.Like(pd.AssessmentYear, "[0-9][0-9][0-9][0-9]%") &&
                        Convert.ToInt32(pd.AssessmentYear.Substring(0, 4)) >= yr.FromYear &&
                        Convert.ToInt32(pd.AssessmentYear.Substring(0, 4)) <= yr.ToYear
                    ).Any(yr =>
                        activeTaxPercentages.Any(tpm =>
                            tpm.TaxId == tx.Id &&
                            tpm.TypeOfUseId == pd.TypeOfUseId &&
                            tpm.YearRangeRVId == yr.Id
                        )
                    )
                )
            ));
    }

    private async Task<(int total, int transmast, int eligible, int skipped)> GetSummaryCountsAsync(int financeYearId, CancellationToken cancellationToken)
    {
        // Dashboard cards reflect the currently configured RV/CV calculation method
        var calculationMethodRaw = await _policyConfigService.GetPolicyValueAsync(
            "TaxCalculationMethod", "RV", cancellationToken);
        bool isCV = string.Equals(calculationMethodRaw, "CV", StringComparison.OrdinalIgnoreCase);
        string calculationMethod = isCV ? "CV" : "RV";

        string cacheKey = $"PropertyTax_SummaryCounts_{financeYearId}_{calculationMethod}";
        if (_memoryCache != null && _memoryCache.TryGetValue(cacheKey, out (int total, int transmast, int eligible, int skipped) cached))
        {
            return cached;
        }

        // 1. Total Properties count (pure EF Core LINQ)
        int total = await ActiveProperties().CountAsync(cancellationToken);

        // 2. Authoritative eligibility evaluation for all active properties
        var eligibilityMap = await EvaluateEligibilityAsync(ActiveProperties(), financeYearId, cancellationToken);

        int transmast = eligibilityMap.Values.Count(v => v.Code == PropertyEligibilityCode.AlreadyTaxed);
        int eligible = eligibilityMap.Values.Count(v => v.Code == PropertyEligibilityCode.Eligible);
        int skipped = eligibilityMap.Values.Count(v => v.Code != PropertyEligibilityCode.Eligible && v.Code != PropertyEligibilityCode.AlreadyTaxed);

        var result = (total, transmast, eligible, skipped);

        if (_memoryCache != null)
        {
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2),
                Size = 1
            };
            _memoryCache.Set(cacheKey, result, cacheOptions);
        }

        return result;
    }

    public async Task WarmupSummaryCountsAsync(int? financeYearId = null, CancellationToken cancellationToken = default)
    {
        int targetYearId;
        if (financeYearId.HasValue && financeYearId.Value > 0)
        {
            targetYearId = financeYearId.Value;
        }
        else
        {
            var today = DateTime.Today;
            var currentYear = await _yearMasterRepo.GetQueryable().AsNoTracking()
                .OrderByDescending(y => y.Year)
                .FirstOrDefaultAsync(y => y.IsActive, cancellationToken)
                ?? await _yearMasterRepo.GetQueryable().AsNoTracking()
                    .OrderByDescending(y => y.Year)
                    .FirstOrDefaultAsync(y => y.StartDate <= today && y.EndDate >= today, cancellationToken)
                ?? await _yearMasterRepo.GetQueryable().AsNoTracking()
                    .OrderByDescending(y => y.Year)
                    .FirstOrDefaultAsync(cancellationToken);

            if (currentYear == null) return;
            targetYearId = currentYear.Id;
        }

        await GetSummaryCountsAsync(targetYearId, cancellationToken);
    }

    private void InvalidateSummaryCountsCache(int? financeYearId = null)
    {
        if (_memoryCache == null) return;

        if (financeYearId.HasValue)
        {
            _memoryCache.Remove($"PropertyTax_SummaryCounts_{financeYearId.Value}_RV");
            _memoryCache.Remove($"PropertyTax_SummaryCounts_{financeYearId.Value}_CV");
        }
        else
        {
            var yearIds = _yearMasterRepo.GetQueryable().AsNoTracking().Select(y => y.Id).ToList();
            foreach (var yId in yearIds)
            {
                _memoryCache.Remove($"PropertyTax_SummaryCounts_{yId}_RV");
                _memoryCache.Remove($"PropertyTax_SummaryCounts_{yId}_CV");
            }
        }
    }

    // ---------------------------------------------------------------- Master Data Change banner

    private IQueryable<PropertyTaxRecalcFlagEntity> GetUnresolvedRecalcFlags(int financeYearId, string calculationMethod) =>
        _recalcFlagRepo.GetQueryable().AsNoTracking()
            .Where(f => f.FinanceYearId == financeYearId && f.ResolvedAt == null && f.IsActive
                && (f.CalculationType == calculationMethod || f.CalculationType == "BOTH"));

    public async Task<MasterDataChangeSummaryDto> GetMasterDataChangeSummaryAsync(
        int financeYearId, CancellationToken cancellationToken = default)
    {
        var calculationMethodRaw = await _policyConfigService.GetPolicyValueAsync(
            "TaxCalculationMethod", "RV", cancellationToken);
        bool isCV = string.Equals(calculationMethodRaw, "CV", StringComparison.OrdinalIgnoreCase);
        var flags = GetUnresolvedRecalcFlags(financeYearId, isCV ? "CV" : "RV");

        int affectedCount = await flags.CountAsync(cancellationToken);
        if (affectedCount == 0)
        {
            return new MasterDataChangeSummaryDto { AffectedCount = 0 };
        }

        var batchIds = await flags.Select(f => f.BatchId).Distinct().ToListAsync(cancellationToken);
        var sourceTables = await _changeBatchRepo.GetQueryable().AsNoTracking()
            .Where(b => batchIds.Contains(b.Id))
            .Select(b => b.SourceTable)
            .Distinct()
            .ToListAsync(cancellationToken);
        var latestChangedAtUtc = await flags.MaxAsync(f => (DateTime?)f.FlaggedAt, cancellationToken);

        var activeJob = await _jobRepo.GetQueryable().AsNoTracking()
            .Where(j => j.IsActive && !j.MarkedForDeletion
                     && j.FinanceYearId == financeYearId 
                     && j.ScopeType == "MasterDataChange" 
                     && (j.Status == JobStatus.Scheduled.ToString() 
                      || j.Status == JobStatus.InProgress.ToString() 
                      || j.Status == JobStatus.Pending.ToString()))
            .OrderByDescending(j => j.StartTime)
            .FirstOrDefaultAsync(cancellationToken);

        return new MasterDataChangeSummaryDto
        {
            AffectedCount = affectedCount,
            RemarkSummary = sourceTables.Count > 0 ? string.Join(", ", sourceTables) : null,
            LatestChangedAtUtc = latestChangedAtUtc,
            ActiveJobId = activeJob?.Id,
            ActiveJobCode = activeJob?.JobCode,
            ActiveJobStatus = activeJob?.Status
        };
    }

    private async Task<IQueryable<MasterDataChangeAffectedPropertyDto>> BuildAffectedPropertiesQueryAsync(
        int financeYearId, CancellationToken cancellationToken)
    {
        var calculationMethodRaw = await _policyConfigService.GetPolicyValueAsync(
            "TaxCalculationMethod", "RV", cancellationToken);
        bool isCV = string.Equals(calculationMethodRaw, "CV", StringComparison.OrdinalIgnoreCase);
        var flags = GetUnresolvedRecalcFlags(financeYearId, isCV ? "CV" : "RV");

        var wards = _wardRepo.GetQueryable().AsNoTracking();
        var zones = _zoneRepo.GetQueryable().AsNoTracking();
        var properties = _propertyRepo.GetQueryable().AsNoTracking();

        return from f in flags
               join p in properties on f.PropertyId equals p.Id
               join w in wards on p.WardId equals w.Id into wardJoin
               from w in wardJoin.DefaultIfEmpty()
               join z in zones on (w != null ? w.ZoneId : (int?)null) equals z.Id into zoneJoin
               from z in zoneJoin.DefaultIfEmpty()
               orderby f.FlaggedAt descending
               select new MasterDataChangeAffectedPropertyDto
               {
                   PropertyId = p.Id,
                   Zone = z != null ? z.Description : string.Empty,
                   Ward = w != null ? w.Description : string.Empty,
                   PropertyNo = p.PropertyNo ?? string.Empty,
                   PartitionNo = p.PartitionNo ?? string.Empty,
                   UpicId = p.UPICId,
                   Owner = p.OwnerName ?? string.Empty,
                   Remark = f.Remark,
                   FlaggedAt = f.FlaggedAt
               };
    }

    public async Task<PagedResult<MasterDataChangeAffectedPropertyDto>> GetMasterDataChangeAffectedPropertiesAsync(
        int financeYearId, JobPropertiesQueryParameters queryParams, CancellationToken cancellationToken = default)
    {
        var query = await BuildAffectedPropertiesQueryAsync(financeYearId, cancellationToken);

        int totalCount = await query.CountAsync(cancellationToken);
        int effectivePageSize = queryParams.PageSize == -1 ? Math.Max(totalCount, 1) : queryParams.PageSize;
        int pageNumber = queryParams.PageSize == -1 ? 1 : queryParams.PageNumber;

        var items = await query
            .Skip(queryParams.PageSize == -1 ? 0 : (pageNumber - 1) * effectivePageSize)
            .Take(effectivePageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<MasterDataChangeAffectedPropertyDto>(items, totalCount, pageNumber, effectivePageSize);
    }

    public async Task WriteMasterDataChangeExportCsvToStreamAsync(
        Stream outputStream, int financeYearId, CancellationToken cancellationToken = default)
    {
        var query = await BuildAffectedPropertiesQueryAsync(financeYearId, cancellationToken);

        await using var writer = new StreamWriter(outputStream, new System.Text.UTF8Encoding(true), bufferSize: 1024, leaveOpen: true);
        await writer.WriteLineAsync("Zone,Ward,Property No,Partition No,UPIC ID,Owner,Remark,Flagged At");

        int count = 0;
        await foreach (var item in query.AsAsyncEnumerable().WithCancellation(cancellationToken))
        {
            string zone = EscapeCsvField(item.Zone);
            string ward = EscapeCsvField(item.Ward);
            string propNo = EscapeCsvField(item.PropertyNo);
            string partNo = EscapeCsvField(item.PartitionNo);
            string upic = EscapeCsvField(item.UpicId ?? string.Empty);
            string owner = EscapeCsvField(item.Owner);
            string remark = EscapeCsvField(item.Remark ?? string.Empty);
            string flaggedAt = item.FlaggedAt.ToString("yyyy-MM-dd HH:mm:ss");

            await writer.WriteLineAsync($"{zone},{ward},{propNo},{partNo},{upic},{owner},{remark},{flaggedAt}");

            count++;
            if (count % 500 == 0)
            {
                await writer.FlushAsync(cancellationToken);
            }
        }
    }

    // ---------------------------------------------------------------- Master Data Change resolver
    // Resolves a PENDING PTIS.MasterDataChangeBatch (populated by PTIS.usp_ProcessCdcChanges) into
    // PropertyTaxRecalcFlag rows. See IPropertyTaxOperationsService.ResolveMasterDataChangeBatchAsync.

    private sealed record FieldChange(string Field, string? OldValue, string? NewValue);

    private static List<FieldChange> ParseFieldChanges(string? fieldChangesJson)
    {
        var result = new List<FieldChange>();
        if (string.IsNullOrWhiteSpace(fieldChangesJson)) return result;

        try
        {
            using var doc = JsonDocument.Parse(fieldChangesJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return result;

            foreach (var element in doc.RootElement.EnumerateArray())
            {
                string? field = element.TryGetProperty("Field", out var f) ? f.GetString() : null;
                if (string.IsNullOrEmpty(field)) continue;

                string? oldValue = element.TryGetProperty("OldValue", out var o) ? o.GetString() : null;
                string? newValue = element.TryGetProperty("NewValue", out var n) ? n.GetString() : null;
                result.Add(new FieldChange(field, oldValue, newValue));
            }
        }
        catch (JsonException)
        {
            // Malformed/unexpected FieldChanges JSON — treat as "no parseable field changes" rather
            // than failing the whole batch resolution.
        }

        return result;
    }

    public async Task ResolveMasterDataChangeBatchAsync(long batchId, CancellationToken cancellationToken = default)
    {
        var batch = await _changeBatchRepo.GetByIdAsync(batchId, cancellationToken);
        if (batch is null) return;

        try
        {
            var events = await _changeEventRepo.GetQueryable().AsNoTracking()
                .Where(e => e.BatchId == batchId)
                .ToListAsync(cancellationToken);

            HashSet<int> affectedPropertyIds;
            string sourceTable = batch.SourceTable ?? string.Empty;

            if (string.Equals(sourceTable, nameof(RateSectionDetailsEntity).Replace("Entity", ""), StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, nameof(RateSectionDetailsEntity), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByRateSectionDetailsAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, nameof(RateEntity).Replace("Entity", "") + "Master", StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, nameof(RateEntity), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByRateMasterAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, "RateCVMaster", StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, "RateCV", StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByRateCVMasterAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, "CSNDetails", StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, "CSNDetail", StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByCSNDetailsAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, "FloorMaster", StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, "Floor", StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByFloorMasterAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, nameof(TaxPercentageMasterRVEntity).Replace("Entity", ""), StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, nameof(TaxPercentageMasterRVEntity), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByTaxPercentageMasterRVAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, nameof(TypeOfUseEntity).Replace("Entity", "") + "Master", StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, nameof(TypeOfUseEntity), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByTypeOfUseMasterAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, nameof(DepreciationMasterEntity).Replace("Entity", ""), StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, nameof(DepreciationMasterEntity), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByDepreciationMasterAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, nameof(AssessmentYearRangeEntity).Replace("Entity", "") + "MasterRV", StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, nameof(AssessmentYearRangeEntity), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByAssessmentYearRangeAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, nameof(TypeOfUseCategoryEntity).Replace("Entity", "") + "Master", StringComparison.OrdinalIgnoreCase) || string.Equals(sourceTable, nameof(TypeOfUseCategoryEntity), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByTypeOfUseCategoryMasterAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, "TaxPercentageMasterCV", StringComparison.OrdinalIgnoreCase)
                  || string.Equals(sourceTable, "EmploymentTaxMaster", StringComparison.OrdinalIgnoreCase)
                  || string.Equals(sourceTable, "EducationTaxMaster", StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAffectedByYearFieldFallbackAsync(events, cancellationToken);
            }
            else if (string.Equals(sourceTable, nameof(PropertyRuleEvaluationMasterEntity).Replace("Entity", ""), StringComparison.OrdinalIgnoreCase)
                  || string.Equals(sourceTable, nameof(TaxMasterEntity).Replace("Entity", ""), StringComparison.OrdinalIgnoreCase)
                  || string.Equals(sourceTable, nameof(TaxCategoryMasterEntity).Replace("Entity", ""), StringComparison.OrdinalIgnoreCase)
                  || string.Equals(sourceTable, nameof(PolicyConfigurationEntity).Replace("Entity", ""), StringComparison.OrdinalIgnoreCase))
            {
                affectedPropertyIds = await ResolveAllActiveTransMastPropertiesAsync(cancellationToken);
            }
            else
            {
                _logger.LogWarning(
                    "MasterDataChangeResolver: unrecognized SourceTable '{SourceTable}' for batch {BatchId} — skipping resolution.",
                    batch.SourceTable, batchId);
                affectedPropertyIds = new HashSet<int>();
            }

            int totalAffected = affectedPropertyIds.Count;

            string calcFilter = string.IsNullOrWhiteSpace(batch.CalculationType) ? "BOTH" : batch.CalculationType!;

            var transQuery = _transMastRepo.GetQueryable().AsNoTracking()
                .Where(t => affectedPropertyIds.Contains(t.PropertyId) && t.IsActive && !t.MarkedForDeletion);

            if (string.Equals(calcFilter, "RV", StringComparison.OrdinalIgnoreCase))
            {
                transQuery = transQuery.Where(t => t.CalculationType == "RV");
            }
            else if (string.Equals(calcFilter, "CV", StringComparison.OrdinalIgnoreCase))
            {
                transQuery = transQuery.Where(t => t.CalculationType == "CV");
            }

            var distinctPairs = await transQuery
                .Select(t => new { t.PropertyId, t.FinanceYearId, EffectiveCalculationType = t.CalculationType })
                .Distinct()
                .ToListAsync(cancellationToken);

            int insertedCount = 0;
            foreach (var pair in distinctPairs)
            {
                bool alreadyFlagged = await _recalcFlagRepo.GetQueryable()
                    .AnyAsync(f => f.PropertyId == pair.PropertyId && f.FinanceYearId == pair.FinanceYearId
                        && (f.CalculationType == pair.EffectiveCalculationType || f.CalculationType == "BOTH")
                        && f.ResolvedAt == null && f.IsActive, cancellationToken);
                if (alreadyFlagged) continue;

                var flag = new PropertyTaxRecalcFlagEntity
                {
                    PropertyId = pair.PropertyId,
                    FinanceYearId = pair.FinanceYearId,
                    BatchId = batchId,
                    CalculationType = pair.EffectiveCalculationType,
                    Remark = batch.RemarkSummary,
                    FlaggedAt = DateTime.Now
                };
                await _recalcFlagRepo.AddAsync(flag, cancellationToken);
                insertedCount++;
            }

            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                if (insertedCount > 0)
                {
                    try
                    {
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                    }
                    catch (DbUpdateException ex)
                    {
                        // The DB's own filtered unique index (PropertyId, FinanceYearId, CalculationType
                        // WHERE ResolvedAt IS NULL) rejected a race-condition duplicate — the
                        // pre-check above already avoids the common case, so this is rare/benign.
                        _logger.LogWarning(ex,
                            "MasterDataChangeResolver: unique-constraint conflict while inserting recalc flags for batch {BatchId} — treating as already-flagged.",
                            batchId);
                    }
                }

                batch.TotalRecords = totalAffected;
                batch.ProcessedRecords = insertedCount;
                batch.Status = "COMPLETED";
                batch.CompletedAt = DateTime.Now;
                await _changeBatchRepo.UpdateAsync(batch, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                await _unitOfWork.CommitTransactionAsync(cancellationToken);
                InvalidateSummaryCountsCache();
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MasterDataChangeResolver: failed to resolve MasterDataChangeBatch {BatchId}", batchId);
            try
            {
                batch.Status = "FAILED";
                batch.ErrorDetail = Truncate(ex.Message, 2000);
                batch.CompletedAt = DateTime.Now;
                await _changeBatchRepo.UpdateAsync(batch, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            catch (Exception saveEx)
            {
                _logger.LogError(saveEx, "MasterDataChangeResolver: failed to persist FAILED status for batch {BatchId}", batchId);
            }
        }
    }

    /// <summary>RateSectionDetails: reload current WardId; fall back to FieldChanges' pre-image
    /// (a Delete event) when the row can no longer be reloaded.</summary>
    private async Task<HashSet<int>> ResolveAffectedByRateSectionDetailsAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        foreach (var evt in events)
        {
            if (!evt.SourceRecordId.HasValue) continue;

            int? newWardId = null;
            int? oldWardId = null;

            var row = await _rateSectionDetailsRepo.GetByIdAsync(evt.SourceRecordId.Value, cancellationToken);
            if (row is not null)
            {
                newWardId = row.WardId;
            }

            var wardChange = ParseFieldChanges(evt.FieldChanges)
                .FirstOrDefault(c => string.Equals(c.Field, "WardId", StringComparison.OrdinalIgnoreCase));
            if (wardChange?.OldValue != null && int.TryParse(wardChange.OldValue, out var parsedOldWard))
            {
                oldWardId = parsedOldWard;
            }

            if (newWardId == null && oldWardId == null) continue;

            var propertyIds = await ActiveProperties()
                .Where(p => (newWardId != null && p.WardId == newWardId.Value)
                    || (oldWardId != null && p.WardId == oldWardId.Value))
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);
            result.UnionWith(propertyIds);
        }

        return result;
    }

    /// <summary>RateMaster: reload the current (RateSectionId, TaxZoneId, ConstructionTypeId,
    /// TypeOfUseGroupId, YearRangeRVId) key and find properties whose PropertyDetails resolve to that
    /// exact key — same join logic as EvaluateEligibilityAsync's RV branch/GetEligiblePropertiesQuery.</summary>
    private async Task<HashSet<int>> ResolveAffectedByRateMasterAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();
        var recordIds = events.Where(e => e.SourceRecordId.HasValue).Select(e => e.SourceRecordId!.Value).Distinct().ToList();
        if (recordIds.Count == 0) return result;

        var rates = new List<RateEntity>();
        foreach (var id in recordIds)
        {
            var rate = await _rateRepo.GetByIdAsync(id, cancellationToken);
            if (rate is not null) rates.Add(rate);
        }
        if (rates.Count == 0) return result;

        var orderedYearRanges = (await _assessmentYearRangeRepo.GetQueryable().AsNoTracking()
            .Where(r => r.IsActive)
            .Select(r => new YearRangeInfo(r.Id, r.FromYear, r.ToYear))
            .ToListAsync(cancellationToken))
            .OrderByDescending(r => r.FromYear)
            .ThenBy(r => r.Id)
            .ToList();

        var wardRateSectionMap = (await _rateSectionDetailsRepo.GetQueryable().AsNoTracking()
            .Where(sd => sd.IsActive)
            .Select(sd => new { sd.WardId, sd.RateSectionId })
            .ToListAsync(cancellationToken))
            .GroupBy(sd => sd.WardId)
            .ToDictionary(g => g.Key, g => g.Select(sd => sd.RateSectionId).FirstOrDefault());

        var typeOfUseGroupMap = await _typeOfUseRepo.GetQueryable().AsNoTracking()
            .Where(u => u.IsActive)
            .ToDictionaryAsync(u => u.Id, u => u.TypeOfUseGroupId, cancellationToken);

        foreach (var rate in rates)
        {
            var candidateDetails = await (
                from d in _propertyDetailsRepo.GetQueryable().AsNoTracking()
                join p in ActiveProperties() on d.PropertyId equals p.Id
                where d.IsActive && !d.MarkedForDeletion
                    && p.TaxZoneId == rate.TaxZoneId
                    && d.ConstructionTypeId == rate.ConstructionTypeId
                select new { d.PropertyId, p.WardId, d.TypeOfUseId, d.AssessmentYear }
            ).ToListAsync(cancellationToken);

            foreach (var detail in candidateDetails)
            {
                int rateSectionId = wardRateSectionMap.GetValueOrDefault(detail.WardId);
                if (rateSectionId != rate.RateSectionId) continue;

                int? typeOfUseGroupId = typeOfUseGroupMap.GetValueOrDefault(detail.TypeOfUseId);
                if (typeOfUseGroupId != rate.TypeOfUseGroupId) continue;

                int? yearRangeId = ResolveYearRangeId(detail.AssessmentYear, orderedYearRanges);
                if (yearRangeId != rate.YearRangeRVId) continue;

                result.Add(detail.PropertyId);
            }
        }

        return result;
    }

    /// <summary>TaxPercentageMasterRV: reload current (TypeOfUseId, YearRangeRVId) and find properties
    /// whose PropertyDetails.TypeOfUseId matches and whose resolved year range matches.</summary>
    private async Task<HashSet<int>> ResolveAffectedByTaxPercentageMasterRVAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        var orderedYearRanges = (await _assessmentYearRangeRepo.GetQueryable().AsNoTracking()
            .Where(r => r.IsActive)
            .Select(r => new YearRangeInfo(r.Id, r.FromYear, r.ToYear))
            .ToListAsync(cancellationToken))
            .OrderByDescending(r => r.FromYear)
            .ThenBy(r => r.Id)
            .ToList();

        foreach (var evt in events)
        {
            int? newTouId = null;
            int? oldTouId = null;
            int? newYrId = null;
            int? oldYrId = null;

            if (evt.SourceRecordId.HasValue)
            {
                var taxPct = await _taxPercentageMasterRVRepo.GetByIdAsync(evt.SourceRecordId.Value, cancellationToken);
                if (taxPct is not null)
                {
                    newTouId = taxPct.TypeOfUseId;
                    newYrId = taxPct.YearRangeRVId;
                }
            }

            var changes = ParseFieldChanges(evt.FieldChanges);

            var touChange = changes.FirstOrDefault(c => string.Equals(c.Field, "TypeOfUseId", StringComparison.OrdinalIgnoreCase));
            if (touChange?.OldValue != null && int.TryParse(touChange.OldValue, out var parsedOldTou)) oldTouId = parsedOldTou;
            if (touChange?.NewValue != null && int.TryParse(touChange.NewValue, out var parsedNewTou)) newTouId ??= parsedNewTou;

            var yrChange = changes.FirstOrDefault(c => string.Equals(c.Field, "YearRangeRVId", StringComparison.OrdinalIgnoreCase));
            if (yrChange?.OldValue != null && int.TryParse(yrChange.OldValue, out var parsedOldYr)) oldYrId = parsedOldYr;
            if (yrChange?.NewValue != null && int.TryParse(yrChange.NewValue, out var parsedNewYr)) newYrId ??= parsedNewYr;

            if (newTouId == null) newTouId = oldTouId;
            if (newYrId == null) newYrId = oldYrId;

            bool hasNew = newTouId.HasValue && newYrId.HasValue;
            bool hasOld = oldTouId.HasValue && oldYrId.HasValue;
            if (!hasNew && !hasOld) continue;

            var targetTouIds = new HashSet<int>();
            if (hasNew) targetTouIds.Add(newTouId!.Value);
            if (hasOld) targetTouIds.Add(oldTouId!.Value);

            var details = await _propertyDetailsRepo.GetQueryable().AsNoTracking()
                .Where(d => d.IsActive && !d.MarkedForDeletion && targetTouIds.Contains(d.TypeOfUseId))
                .Select(d => new { d.PropertyId, d.TypeOfUseId, d.AssessmentYear })
                .ToListAsync(cancellationToken);

            foreach (var detail in details)
            {
                int? yearRangeId = ResolveYearRangeId(detail.AssessmentYear, orderedYearRanges);
                if (!yearRangeId.HasValue) continue;

                if ((hasNew && detail.TypeOfUseId == newTouId!.Value && yearRangeId == newYrId!.Value) ||
                    (hasOld && detail.TypeOfUseId == oldTouId!.Value && yearRangeId == oldYrId!.Value))
                {
                    result.Add(detail.PropertyId);
                }
            }
        }

        return result;
    }

    /// <summary>TypeOfUseMaster: TypeOfUseGroupId (RV) and/or TypeOfUseGroupCVId (CV) may have
    /// changed — either way, properties with PropertyDetails.TypeOfUseId == the changed row's Id are
    /// affected; the later TransMast/CalculationType filter narrows to whichever method matters.</summary>
    private async Task<HashSet<int>> ResolveAffectedByTypeOfUseMasterAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        foreach (var evt in events)
        {
            if (!evt.SourceRecordId.HasValue) continue;

            var changes = ParseFieldChanges(evt.FieldChanges);

            bool relevant = changes.Count == 0
                || changes.Any(c => string.Equals(c.Field, "TypeOfUseGroupId", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(c.Field, "TypeOfUseCategoryId", StringComparison.OrdinalIgnoreCase));

            if (!relevant) continue;

            var propertyIds = await _propertyDetailsRepo.GetQueryable().AsNoTracking()
                .Where(d => d.IsActive && !d.MarkedForDeletion && d.TypeOfUseId == evt.SourceRecordId.Value)
                .Select(d => d.PropertyId)
                .Distinct()
                .ToListAsync(cancellationToken);

            result.UnionWith(propertyIds);
        }

        return result;
    }

    /// <summary>DepreciationMaster: matches ConstructionTypeId and building age (CurrentFinanceYear - ConstructionYear) between MinYear and MaxYear.</summary>
    private async Task<HashSet<int>> ResolveAffectedByDepreciationMasterAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();
        var recordIds = events.Where(e => e.SourceRecordId.HasValue).Select(e => e.SourceRecordId!.Value).Distinct().ToList();
        if (recordIds.Count == 0) return result;

        var today = DateTime.Today;
        var activeYear = await _yearMasterRepo.GetQueryable().AsNoTracking()
            .FirstOrDefaultAsync(y => y.IsActive, cancellationToken)
            ?? await _yearMasterRepo.GetQueryable().AsNoTracking()
                .FirstOrDefaultAsync(y => y.StartDate <= today && y.EndDate >= today, cancellationToken)
                ?? await _yearMasterRepo.GetQueryable().AsNoTracking()
                    .OrderByDescending(y => y.Year)
                    .FirstOrDefaultAsync(cancellationToken);

        if (activeYear is null) return result;

        int currentFinanceYear = activeYear.Year;

        foreach (var id in recordIds)
        {
            var dep = await _depreciationRepo.GetByIdAsync(id, cancellationToken);
            if (dep is null) continue;

            var details = await _propertyDetailsRepo.GetQueryable().AsNoTracking()
                .Where(d => d.IsActive && !d.MarkedForDeletion
                    && d.ConstructionTypeId == dep.ConstructionTypeId
                    && d.ConstructionYear != null)
                .Select(d => new { d.PropertyId, d.ConstructionYear })
                .ToListAsync(cancellationToken);

            foreach (var detail in details)
            {
                if (!int.TryParse(detail.ConstructionYear, out var constYear)) continue;

                int age = currentFinanceYear - constYear;

                if (age < dep.MinYear || age > dep.MaxYear) continue;

                result.Add(detail.PropertyId);
            }
        }

        return result;
    }

    /// <summary>AssessmentYearRangeMasterRV: reload the current (FromYear, ToYear) and also parse
    /// FieldChanges for the previous (FromYear, ToYear) (falling back to the current values when a
    /// field wasn't changed) — properties whose AssessmentYear falls in EITHER the old or the new
    /// span are affected, since a boundary shrink/grow can both gain and lose properties.</summary>
    private async Task<HashSet<int>> ResolveAffectedByAssessmentYearRangeAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        foreach (var evt in events)
        {
            if (!evt.SourceRecordId.HasValue) continue;

            var row = await _assessmentYearRangeRepo.GetByIdAsync(evt.SourceRecordId.Value, cancellationToken);
            var changes = ParseFieldChanges(evt.FieldChanges);

            int? currentFromYear = row?.FromYear;
            int? currentToYear = row?.ToYear;

            int? oldFromYear = currentFromYear;
            int? oldToYear = currentToYear;

            var fromChange = changes.FirstOrDefault(c => string.Equals(c.Field, "FromYear", StringComparison.OrdinalIgnoreCase));
            if (fromChange?.OldValue != null && int.TryParse(fromChange.OldValue, out var parsedFrom)) oldFromYear = parsedFrom;

            var toChange = changes.FirstOrDefault(c => string.Equals(c.Field, "ToYear", StringComparison.OrdinalIgnoreCase));
            if (toChange?.OldValue != null && int.TryParse(toChange.OldValue, out var parsedTo)) oldToYear = parsedTo;

            // Compute envelope min/max across available current and old bounds
            var years = new List<int>();
            if (currentFromYear.HasValue) years.Add(currentFromYear.Value);
            if (currentToYear.HasValue) years.Add(currentToYear.Value);
            if (oldFromYear.HasValue) years.Add(oldFromYear.Value);
            if (oldToYear.HasValue) years.Add(oldToYear.Value);

            if (years.Count == 0) continue;

            int lowYear = years.Min();
            int highYear = years.Max();

            var details = await _propertyDetailsRepo.GetQueryable().AsNoTracking()
                .Where(d => d.IsActive && !d.MarkedForDeletion
                    && d.AssessmentYear != null && d.AssessmentYear.Length >= 4
                    && Convert.ToInt32(d.AssessmentYear.Substring(0, 4)) >= lowYear
                    && Convert.ToInt32(d.AssessmentYear.Substring(0, 4)) <= highYear)
                .Select(d => new { d.PropertyId, d.AssessmentYear })
                .ToListAsync(cancellationToken);

            foreach (var detail in details)
            {
                int year = Convert.ToInt32(detail.AssessmentYear!.Substring(0, 4));
                bool inNewSpan = currentFromYear.HasValue && currentToYear.HasValue && year >= currentFromYear.Value && year <= currentToYear.Value;
                bool inOldSpan = oldFromYear.HasValue && oldToYear.HasValue && year >= oldFromYear.Value && year <= oldToYear.Value;
                if (inNewSpan || inOldSpan) result.Add(detail.PropertyId);
            }
        }

        return result;
    }

    /// <summary>RateCVMaster (incl. cascaded CSNDetails): find properties whose Property.MoujaId/CSN
    /// maps (via CSNDetails) to the changed RateCVMasterId. Uses the event's SourceRecordId directly
    /// (rather than requiring the RateCVMaster row to still exist) since CSNDetails.RateCVMasterId
    /// still references it even across a Delete event.</summary>
    private async Task<HashSet<int>> ResolveAffectedByRateCVMasterAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();
        var recordIds = events.Where(e => e.SourceRecordId.HasValue).Select(e => e.SourceRecordId!.Value).Distinct().ToList();
        if (recordIds.Count == 0) return result;

        foreach (var rateCVMasterId in recordIds)
        {
            var csnPairs = (await _csnDetailsRepo.GetQueryable().AsNoTracking()
                .Where(c => c.IsActive && c.RateCVMasterId == rateCVMasterId)
                .Select(c => new { c.MoujaId, c.CSN })
                .ToListAsync(cancellationToken));
            if (csnPairs.Count == 0) continue;

            var csnByMouja = csnPairs
                .GroupBy(c => c.MoujaId)
                .ToDictionary(g => g.Key, g => g.Select(c => c.CSN).ToHashSet(StringComparer.OrdinalIgnoreCase));

            var moujaIds = csnByMouja.Keys.ToList();
            var candidateProps = await ActiveProperties()
                .Where(p => p.MoujaId != null && moujaIds.Contains(p.MoujaId.Value) && p.CSN != null)
                .Select(p => new { p.Id, p.MoujaId, p.CSN })
                .ToListAsync(cancellationToken);

            foreach (var prop in candidateProps)
            {
                if (prop.MoujaId.HasValue
                    && csnByMouja.TryGetValue(prop.MoujaId.Value, out var csns)
                    && prop.CSN != null
                    && csns.Contains(prop.CSN))
                {
                    result.Add(prop.Id);
                }
            }
        }

        return result;
    }

    /// <summary>Coarse fallback for tables with no dedicated repo in this service
    /// (EmploymentTaxMaster/EducationTaxMaster/TaxPercentageMasterCV): parse the changed row's "Year"
    /// field from FieldChanges, resolve it to a FinanceYearId via YearMaster, and flag every property
    /// already in TransMast for that finance year.</summary>
    private async Task<HashSet<int>> ResolveAffectedByYearFieldFallbackAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        foreach (var evt in events)
        {
            var yearChange = ParseFieldChanges(evt.FieldChanges)
                .FirstOrDefault(c => string.Equals(c.Field, "Year", StringComparison.OrdinalIgnoreCase));
            if (yearChange is null) continue;

            var yearsToResolve = new HashSet<int>();
            if (yearChange.OldValue != null && int.TryParse(yearChange.OldValue, out var oldYear)) yearsToResolve.Add(oldYear);
            if (yearChange.NewValue != null && int.TryParse(yearChange.NewValue, out var newYear)) yearsToResolve.Add(newYear);

            if (yearsToResolve.Count == 0) continue;

            var financeYearIds = await _yearMasterRepo.GetQueryable().AsNoTracking()
                .Where(y => yearsToResolve.Contains(y.Year))
                .Select(y => y.Id)
                .ToListAsync(cancellationToken);
            if (financeYearIds.Count == 0) continue;

            var propertyIds = await _transMastRepo.GetQueryable().AsNoTracking()
                .Where(t => financeYearIds.Contains(t.FinanceYearId) && t.IsActive && !t.MarkedForDeletion)
                .Select(t => t.PropertyId)
                .Distinct()
                .ToListAsync(cancellationToken);
            result.UnionWith(propertyIds);
        }

        return result;
    }

    /// <summary>TypeOfUseCategoryMaster: one level up TypeOfUseMaster's hierarchy — find properties
    /// whose PropertyDetails.TypeOfUseId points to a TypeOfUseMaster row belonging to the changed
    /// TypeOfUseCategoryMaster record.</summary>
    private async Task<HashSet<int>> ResolveAffectedByTypeOfUseCategoryMasterAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        foreach (var evt in events)
        {
            if (!evt.SourceRecordId.HasValue) continue;

            var propertyIds = await _propertyDetailsRepo.GetQueryable().AsNoTracking()
                .Where(d => d.IsActive && !d.MarkedForDeletion)
                .Join(_typeOfUseRepo.GetQueryable().AsNoTracking(),
                    d => d.TypeOfUseId,
                    t => t.Id,
                    (d, t) => new { d.PropertyId, t.TypeOfUseCategoryId })
                .Where(x => x.TypeOfUseCategoryId == evt.SourceRecordId.Value)
                .Select(x => x.PropertyId)
                .Distinct()
                .ToListAsync(cancellationToken);
            result.UnionWith(propertyIds);
        }

        return result;
    }

    /// <summary>FloorMaster: find properties whose PropertyDetails.FloorId matches the changed
    /// FloorMaster record. No reload needed — works even for Delete events, since
    /// PropertyDetailsEntity.FloorId still references the old Id.</summary>
    private async Task<HashSet<int>> ResolveAffectedByFloorMasterAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        foreach (var evt in events)
        {
            if (!evt.SourceRecordId.HasValue) continue;

            var propertyIds = await _propertyDetailsRepo.GetQueryable().AsNoTracking()
                .Where(d => d.IsActive && !d.MarkedForDeletion && d.FloorId == evt.SourceRecordId.Value)
                .Select(d => d.PropertyId)
                .Distinct()
                .ToListAsync(cancellationToken);
            result.UnionWith(propertyIds);
        }

        return result;
    }

    /// <summary>CSNDetails: reload the current (MoujaId, CSN) pair (if the row still exists) and also
    /// parse FieldChanges for the previous pair (falling back to whichever of old/new IS available
    /// when a field wasn't changed, or when the row was deleted) — properties matching EITHER the old
    /// or the new (MoujaId, CSN) pair are affected.</summary>
    private async Task<HashSet<int>> ResolveAffectedByCSNDetailsAsync(
        List<MasterDataChangeEventEntity> events, CancellationToken cancellationToken)
    {
        var result = new HashSet<int>();

        foreach (var evt in events)
        {
            if (!evt.SourceRecordId.HasValue) continue;

            int? newMoujaId = null;
            string? newCsn = null;

            var row = await _csnDetailsRepo.GetByIdAsync(evt.SourceRecordId.Value, cancellationToken);
            if (row is not null)
            {
                newMoujaId = row.MoujaId;
                newCsn = row.CSN;
            }

            var changes = ParseFieldChanges(evt.FieldChanges);
            int? oldMoujaId = newMoujaId;
            string? oldCsn = newCsn;

            var moujaChange = changes.FirstOrDefault(c => string.Equals(c.Field, "MoujaId", StringComparison.OrdinalIgnoreCase));
            if (moujaChange?.OldValue != null && int.TryParse(moujaChange.OldValue, out var parsedMouja)) oldMoujaId = parsedMouja;

            var csnChange = changes.FirstOrDefault(c => string.Equals(c.Field, "CSN", StringComparison.OrdinalIgnoreCase));
            if (csnChange?.OldValue != null) oldCsn = csnChange.OldValue;

            // Row deleted (or never loaded) and FieldChanges had no old value either — fall back the
            // other way so at least one of old/new is populated when only one side has data.
            if (newMoujaId == null) newMoujaId = oldMoujaId;
            if (newCsn == null) newCsn = oldCsn;

            bool hasNew = newMoujaId.HasValue && newCsn != null;
            bool hasOld = oldMoujaId.HasValue && oldCsn != null;
            if (!hasNew && !hasOld) continue;

            var propertyIds = await ActiveProperties()
                .Where(p => (hasNew && p.MoujaId == newMoujaId!.Value && p.CSN == newCsn)
                    || (hasOld && p.MoujaId == oldMoujaId!.Value && p.CSN == oldCsn))
                .Select(p => p.Id)
                .Distinct()
                .ToListAsync(cancellationToken);
            result.UnionWith(propertyIds);
        }

        return result;
    }

    /// <summary>Broad, not property-key-based fallback for TaxMaster/TaxCategoryMaster/
    /// PolicyConfiguration: these changes (e.g. a tax-head activation flip, a tax-category
    /// reclassification, or a policy value change) can affect every already-taxed property's
    /// calculated total, not a subset matched by a specific key. Conservative over precise.</summary>
    


    private async Task<HashSet<int>> ResolveAllActiveTransMastPropertiesAsync(CancellationToken cancellationToken)
    {
        var currentFyId = await _yearMasterRepo.GetQueryable()
            .AsNoTracking()
            .Where(y => y.IsActive)
            .Select(y => (int?)y.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!currentFyId.HasValue)
        {
            _logger.LogWarning("No active Financial Year found in YearMaster.");
            return new HashSet<int>();
        }

        var propertyIds = await (
            from p in _propertyRepo.GetQueryable().AsNoTracking()
            join t in _transMastRepo.GetQueryable().AsNoTracking() on p.Id equals t.PropertyId
            where t.FinanceYearId == currentFyId.Value
               && t.IsActive
               && !t.MarkedForDeletion
               && p.IsActive
               && !p.MarkedForDeletion
            select p.Id
        ).Distinct().ToListAsync(cancellationToken);

        return propertyIds.ToHashSet();
    }
}
