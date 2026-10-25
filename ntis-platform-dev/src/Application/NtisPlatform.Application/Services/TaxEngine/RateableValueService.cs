using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.RateableValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.DTOs.Rules.RuleExecution;
using NtisPlatform.Application.DTOs.TaxEngine.DynamicTax;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.Section129;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Interfaces.Rules;
using NtisPlatform.Application.Services.TaxEngine.DynamicTax;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Rules;
using NtisPlatform.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using static NtisPlatform.Core.Constants.CapitalValueConstants;

namespace NtisPlatform.Application.Services.TaxEngine
{
    /// <summary>
    /// Orchestrates the end-to-end Rateable Value calculation for a single property.
    /// Persistence is delegated to <see cref="IRVPersistenceService"/>;
    /// context loading is delegated to <see cref="IPropertyContextLoaderService"/>;
    /// rule-engine application is delegated to <see cref="IRuleApplierService"/>.
    /// </summary>
    public class RateableValueService : IRateableValueService
    {
        private readonly ITaxMasterDataService _masterDataService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<RateableValueService> _logger;
        private readonly IRepository<YearMasterEntity, int> _yearMasterRepo;
        private readonly IPolicyConfigurationService _policyConfigurationService;
        private readonly IRateableValueCalculatorService _rateableValueCalculatorService;
        private readonly IFinanceYearProvider _financeYearProvider;
        private readonly IPropertyContextLoaderService _propertyContextLoaderService;
        private readonly IRuleApplierService _ruleApplierService;
        private readonly IRVPersistenceService _persistenceService;
        private readonly TimeProvider _timeProvider;
        private readonly IRVCalculationCleanupService _rvCalculationCleanupService;
        private readonly ITaxApplicabilityService _taxApplicabilityService;
        private readonly IRVCalculationSignatureService _signatureService;
        private readonly IDynamicTaxConfigReader _dynamicTaxConfigReader;
        private readonly IDynamicTaxAmountResolver _dynamicTaxAmountResolver;
        private readonly IPropertyFieldFlattenerService _fieldFlattener;
        private readonly IRepository<RulesFieldEntity, int> _rulesFieldRepo;
        private readonly IRepository<PropertyRuleEvaluationMasterEntity, int>? _evalMasterRepo;
        private readonly IRepository<PropertySection129ApplicationEntity, int>? _section129AppRepo;
        private readonly IServiceProvider? _serviceProvider;

        public RateableValueService(
            ITaxMasterDataService masterDataService,
            IUnitOfWork unitOfWork,
            ILogger<RateableValueService> logger,
            IRepository<YearMasterEntity, int> yearMasterRepo,
            IPolicyConfigurationService policyConfigurationService,
            IRateableValueCalculatorService rateableValueCalculatorService,
            IFinanceYearProvider financeYearProvider,
            IPropertyContextLoaderService propertyContextLoaderService,
            IRuleApplierService ruleApplierService,
            IRVPersistenceService persistenceService,
            TimeProvider timeProvider,
            IRVCalculationCleanupService rvCalculationCleanupService,
            ITaxApplicabilityService taxApplicabilityService,
            IRVCalculationSignatureService signatureService,
            IDynamicTaxConfigReader dynamicTaxConfigReader,
            IDynamicTaxAmountResolver dynamicTaxAmountResolver,
            IPropertyFieldFlattenerService fieldFlattener,
            IRepository<RulesFieldEntity, int> rulesFieldRepo,
            IRepository<PropertyRuleEvaluationMasterEntity, int>? evalMasterRepo = null,
            IServiceProvider? serviceProvider = null,
            IRepository<PropertySection129ApplicationEntity, int>? section129AppRepo = null)
        {
            _masterDataService = masterDataService;
            _unitOfWork = unitOfWork;
            _logger = logger;
            _yearMasterRepo = yearMasterRepo;
            _policyConfigurationService = policyConfigurationService;
            _rateableValueCalculatorService = rateableValueCalculatorService;
            _financeYearProvider = financeYearProvider;
            _propertyContextLoaderService = propertyContextLoaderService;
            _ruleApplierService = ruleApplierService;
            _persistenceService = persistenceService;
            _timeProvider = timeProvider;
            _rvCalculationCleanupService = rvCalculationCleanupService;
            _taxApplicabilityService = taxApplicabilityService;
            _signatureService = signatureService;
            _dynamicTaxConfigReader = dynamicTaxConfigReader;
            _dynamicTaxAmountResolver = dynamicTaxAmountResolver;
            _fieldFlattener = fieldFlattener;
            _rulesFieldRepo = rulesFieldRepo;
            _evalMasterRepo = evalMasterRepo;
            _serviceProvider = serviceProvider;
            _section129AppRepo = section129AppRepo;
        }

        public async Task<RateableValueResponseDto> CalculateAndSaveAsync(int propertyId, bool forceRecalculate = false)
        {
            var operationStopwatch = Stopwatch.StartNew();
            _logger.LogInformation("Starting RV tax calculation for PropertyId={PropertyId}", propertyId);

            try
            {
                int financeYear = _financeYearProvider.GetCurrentFinanceYear();

                // Fast path: skip ComputeCoreAsync's expensive queries entirely when nothing
                // relevant has changed since the last run. Reuses the already-merged
                // social-attribute view from the property context (current property + "main"
                // property for Apartment/Industry partitions) instead of re-querying
                // PropertySocialDetails scoped to just this propertyId, which would miss inherited
                // attribute changes.
                var propertyContext = await _propertyContextLoaderService.LoadPropertyContextAsync(propertyId, financeYear);

                if (propertyContext.Details.Count == 0)
                {
                    return new RateableValueResponseDto
                    {
                        PropertyId = propertyId,
                        FinanceYear = propertyContext.Parameters.FinanceYear,
                        TotalRateableValue = 0
                    };
                }

                var exemptedTaxIdSet = await _taxApplicabilityService.GetExemptedTaxIdsAsync(propertyId);
                // Folded into the signature so an admin editing the Dynamic Tax Register (condition
                // rows, master mappings, hybrid config, rule definitions) invalidates every
                // property's cached fast-path result, not just properties whose own data changed —
                // otherwise CalculateAndSaveAsync would keep returning the pre-edit persisted result
                // forever for an unrelated property.
                var dynamicTaxConfigFingerprint = await _dynamicTaxConfigReader.GetConfigFingerprintAsync();
                var signatureHash = RVCalculationSignatureBuilder.GenerateSignature(
                    financeYear, propertyContext.Property, propertyContext.PropertyAssessment, propertyContext.Details,
                    propertyContext.Renters, exemptedTaxIdSet, propertyContext.Certificates,
                    propertyContext.Parameters.SocialAttributes, dynamicTaxConfigFingerprint);

                if (!forceRecalculate)
                {
                    var existingSignature = await _signatureService.GetAsync(propertyId);
                    if (existingSignature != null && existingSignature.SignatureHash == signatureHash)
                    {
                        var (existingResultsRows, existingTaxDetailRows, existingPolicyRows) =
                            await _persistenceService.GetExistingActiveResultsAsync(propertyId);

                        if (existingResultsRows.Count > 0)
                        {
                            var fastPathActiveTaxes = await _masterDataService.GetActiveTaxesAsync();
                            var fastPathFloors = await _masterDataService.GetActiveFloorsAsync();
                            var fastPathConstructionTypes = await _masterDataService.GetActiveConstructionTypesAsync();
                            var fastPathTypeOfUses = await _masterDataService.GetActiveTypeOfUsesAsync();
                            var fastPathSubTypeOfUses = await _masterDataService.GetActiveSubTypeOfUsesAsync();
                            var fastPathSubFloors = await _masterDataService.GetActiveSubFloorsAsync();

                            var existingTaxMasterCache = new TaxGetterCache<TaxMasterEntity>(
                                fastPathActiveTaxes,
                                x => x.Id,
                                x => string.IsNullOrWhiteSpace(x.TaxNameAlias) ? x.TaxName : x.TaxNameAlias!,
                                x => x.TaxCategoryMaster?.CategoryCode ?? string.Empty);

                            var fastPathConfig = await _dynamicTaxConfigReader.LoadAsync(
                                fastPathActiveTaxes.Select(x => x.Id).ToList());

                            var existingResponse = RateableValueResponseMapper.Map(
                                propertyId, financeYear, propertyContext.Details, existingResultsRows, existingTaxDetailRows, existingPolicyRows,
                                fastPathFloors, fastPathConstructionTypes, fastPathTypeOfUses, fastPathSubTypeOfUses, fastPathSubFloors,
                                propertyContext.Renters, propertyContext.Certificates, existingTaxMasterCache, fastPathConfig);

                            _logger.LogInformation(
                                "RV calculation skipped for PropertyId={PropertyId}: input signature unchanged. Duration={DurationMs}ms",
                                propertyId, operationStopwatch.ElapsedMilliseconds);

                            return existingResponse;
                        }
                    }
                }

                var core = await ComputeCoreAsync(propertyId, financeYear);

                var details = core.PropertyContext.Details;
                var renters = core.PropertyContext.Renters;
                var certificates = core.PropertyContext.Certificates;
                var newResultsRows = core.NewResultsRows;
                var newTaxDetailRows = core.NewTaxDetailRows;
                var totalRv = core.TotalRv;

                // Persist results rows and tax-detail rows in a single transaction.
                await _unitOfWork.BeginTransactionAsync();
                try
                {
                    await _persistenceService.ReplaceExistingResultsAsync(propertyId, newResultsRows, newTaxDetailRows);

                    _logger.LogInformation(
                        "Persisting {ResultsRowCount} results rows and {TaxDetailCount} tax detail rows for PropertyId={PropertyId}",
                        newResultsRows.Count, newTaxDetailRows.Count, propertyId);

                    // Save rule application trace logs
                    foreach (var detail in details)
                    {
                        var appliedRules = core.RuleTracesCache.TryGetValue(detail.Id, out var traceList)
                            ? traceList
                            : new List<RuleApplicationTraceEntry>();

                        await _persistenceService.SaveRuleApplicationLogAsync(
                            propertyId,
                            financeYear,
                            detail.Id,
                            appliedRules,
                            "RV",
                            core.Now);
                    }

                    var savedPolicyRecords = await _persistenceService.SavePolicyAndTransmastRVAsync(
                        propertyId, financeYear, core.YearMasterId, newResultsRows, newTaxDetailRows, totalRv,
                        core.EducationTaxMaster?.Id, core.EmploymentTaxMaster?.Id);

                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();

                    _logger.LogInformation(
                        "Policy and TransmastRV rows saved for PropertyId={PropertyId}", propertyId);

                    // If Section 129A is applied for this property, automatically step forward through
                    // the stage schedule up to the current finance year and stamp TransMast.
                    // RVPersistenceService already deactivated the prior Section129 TransMast rows above
                    // (ExecuteUpdateAsync, auto-committed), so a restaging failure here would leave the
                    // property on plain NETTAX with Section129A silently lost. We do NOT swallow the
                    // exception — failure propagates so the caller sees Add Taxes as failed and can retry.
                    if (_serviceProvider != null && _section129AppRepo != null)
                    {
                        var hasSection129 = await _section129AppRepo.GetQueryable()
                            .AnyAsync(a => a.PropertyId == propertyId && a.IsApplied && a.IsActive && !a.MarkedForDeletion);

                        if (hasSection129)
                        {
                            var section129Service = _serviceProvider.GetService<ISection129Service>();
                            if (section129Service != null)
                            {
                                _logger.LogInformation(
                                    "PropertyId={PropertyId} has Section 129A applied. Triggering auto recalculation.",
                                    propertyId);
                                await section129Service.RecalculateAsync(propertyId, isFromRateableValueService: true);
                            }
                        }
                    }

                    // Signature bookkeeping happens in its own save AFTER the RV calculation above has
                    // already committed successfully, and is best-effort. RVCalculationSignature has a
                    // unique index on PropertyId with a read-then-write upsert, so two concurrent
                    // recalculations for the same property can both see no row and both try to insert,
                    // racing on that index. Doing this here, in isolation, means such a race only costs
                    // this one signature update (the next request simply sees a stale/missing signature
                    // and correctly redoes the work) instead of rolling back RV results that were
                    // already computed correctly and just committed above.
                    try
                    {
                        await _signatureService.UpsertAsync(propertyId, signatureHash, core.Now);
                        await _unitOfWork.SaveChangesAsync();
                    }
                    catch (DbUpdateException ex)
                    {
                        _unitOfWork.DiscardChanges();
                        _logger.LogWarning(ex,
                            "Failed to persist RV calculation signature for PropertyId={PropertyId} (likely a concurrent " +
                            "recalculation for the same property); the next request will simply recalculate.",
                            propertyId);
                    }
                    catch (Exception ex)
                    {
                        _unitOfWork.DiscardChanges();
                        _logger.LogWarning(ex,
                            "Failed to persist RV calculation signature for PropertyId={PropertyId}; the next request will simply recalculate.",
                            propertyId);
                    }

                    // 13. Build response from in-memory data
                    var taxMasterCache = new TaxGetterCache<TaxMasterEntity>(
                        core.ActiveTaxes,
                        x => x.Id,
                        x => string.IsNullOrWhiteSpace(x.TaxNameAlias) ? x.TaxName : x.TaxNameAlias!,
                        x => x.TaxCategoryMaster?.CategoryCode ?? string.Empty);  // Pass category code for filtering

                    var response = RateableValueResponseMapper.Map(
                        propertyId, financeYear, details, newResultsRows, newTaxDetailRows, savedPolicyRecords,
                        core.Floors, core.ConstructionTypes, core.TypeOfUses, core.SubTypeOfUses, core.SubFloors,
                        renters.ToList(), certificates, taxMasterCache, core.DynamicTaxConfig);

                    LogMetric("TaxCalculation.TotalRV", (double)response.TotalRateableValue, new Dictionary<string, string>
                        { { "PropertyId", propertyId.ToString() } });

                    _logger.LogInformation(
                        "RV calculation completed for PropertyId={PropertyId}, TotalRV={TotalRV}, Duration={DurationMs}ms",
                        propertyId, response.TotalRateableValue,
                        operationStopwatch.ElapsedMilliseconds);

                    return response;
                }
                catch (Exception ex)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    _logger.LogError(ex,
                        "Failed to save RV results for PropertyId={PropertyId}. Transaction rolled back.",
                        propertyId);
                    throw;
                }
            }
            catch (Exception ex)
            {
                operationStopwatch.Stop();

                LogMetric("TaxCalculation.Failed", 1, new Dictionary<string, string>
                {
                    { "PropertyId",  propertyId.ToString() },
                    { "ErrorType",   ex.GetType().Name },
                    { "DurationMs",  operationStopwatch.ElapsedMilliseconds.ToString() }
                });

                _logger.LogError(ex,
                    "RV calculation failed for PropertyId={PropertyId} after {DurationMs}ms",
                    propertyId, operationStopwatch.ElapsedMilliseconds);

                throw;
            }
        }

        public async Task<RetrospectiveRatePreviewDto> PreviewTotalTaxAsync(int propertyId, int financeYear)
        {
            var core = await ComputeCoreAsync(propertyId, financeYear);

            return new RetrospectiveRatePreviewDto
            {
                PropertyId = propertyId,
                FinanceYear = financeYear,
                TotalRateableValue = core.TotalRv,
                TotalAnnualRentalValue = RvTaxTotals.SumAnnualRentalValue(core.NewResultsRows),
                // Totalled the way RVPersistenceService saves the TaxTotal row. Summing the tax detail rows
                // would count the property-level education / employment tax once per detail.
                TotalTaxAmount = RvTaxTotals.SumAsSaved(
                    core.NewTaxDetailRows, core.NewResultsRows, core.EducationTaxMaster?.Id, core.EmploymentTaxMaster?.Id)
            };
        }

        /// <summary>
        /// Computes base values, rates and tax rows for <paramref name="propertyId"/> at
        /// <paramref name="financeYear"/> — identical logic/master-data sources for any year, past
        /// or current. Read-only: builds in-memory rows only, never calls
        /// <see cref="IRVPersistenceService"/>. Shared by <see cref="CalculateAndSaveAsync"/>
        /// (which persists the result for the current finance year) and
        /// <see cref="PreviewTotalTaxAsync"/> (which never persists, for any finance year).
        /// </summary>
        private async Task<RvComputationResult> ComputeCoreAsync(int propertyId, int financeYear)
        {
            // 2. Load property context (contains property, details, assessment, renters, occupancies, social attributes)
            var propertyContext = await _propertyContextLoaderService.LoadPropertyContextAsync(propertyId, financeYear);
            var property = propertyContext.Property;
            var details = propertyContext.Details;
            var propertyAssessment = propertyContext.PropertyAssessment;
            var renters = propertyContext.Renters;
            var certificates = propertyContext.Certificates;

            if (!details.Any())
            {
                return new RvComputationResult(
                    propertyContext, new List<RVCalculationResultsEntity>(), new List<RVCalculationTaxDetailsEntity>(),
                    0m, 0, null, null, new Dictionary<int, List<RuleApplicationTraceEntry>>(),
                    new List<FloorEntity>(), new List<ConstructionTypeEntity>(), new List<TypeOfUseEntity>(),
                    new List<SubTypeOfUseEntity>(), new List<SubFloorEntity>(), new List<TaxMasterEntity>(),
                    _timeProvider.GetLocalNow().DateTime, DynamicTaxConfigSnapshot.Empty);
            }

            var constructionYearValue = propertyContext.Parameters.ConstructionYearValue;
            var yearRangeRVId = propertyContext.Parameters.YearRangeRVId;

            LogMetric("Property.DetailCount", details.Count, new Dictionary<string, string>
            {
                { "PropertyId", propertyId.ToString() }
            });

            // 3. Load master data — sequential; TaxMasterDataService uses IMemoryCache
            _logger.LogDebug("Loading master data for PropertyId={PropertyId}, WardId={WardId}",
                propertyId, property.WardId);

            var typeOfUses = await _masterDataService.GetActiveTypeOfUsesAsync();
            var subTypeOfUses = await _masterDataService.GetActiveSubTypeOfUsesAsync();
            var floors = await _masterDataService.GetActiveFloorsAsync();
            var subFloors = await _masterDataService.GetActiveSubFloorsAsync();
            var constructionTypes = await _masterDataService.GetActiveConstructionTypesAsync();
            var rateSectionId = await _masterDataService.GetRateSectionIdForWardAsync(property.WardId);
            var rates = await _masterDataService.GetRatesForSectionAsync(rateSectionId);
            var depreciations = await _masterDataService.GetActiveDepreciationsAsync();
            var yearRanges = await _masterDataService.GetActiveYearRangesAsync();
            var activeTaxes = await _masterDataService.GetActiveTaxesAsync();
            var propertyCategories = await _masterDataService.GetActivePropertyCategoriesAsync() ?? new List<PropertyCategoryEntity>();

            // Taxes explicitly disabled for this property via ApplyTaxesMaster (UI: "which tax should
            // not apply to this property"). An active, non-deleted entry means the tax is exempted —
            // its amount must be zeroed out in the calculation result below.
            var exemptedTaxIdSet = await _taxApplicabilityService.GetExemptedTaxIdsAsync(propertyId);

            // Plot / OpenPlot rule: only Plot-category properties whose selected type of use is
            // OpenPlot (and non-Plot properties whose type of use is NOT OpenPlot) get taxed.
            bool isPlotProperty = propertyCategories.Any(c =>
                c.Id == property.CategoryId &&
                string.Equals(c.PropertyCategoryName, "Plot", StringComparison.OrdinalIgnoreCase));

            _logger.LogInformation(
                "Master data loaded for PropertyId={PropertyId}: " +
                "TypeOfUses={TypeOfUseCount}, Taxes={TaxCount}, Rates={RateCount}, " +
                "RateSectionId={RateSectionId}, WardId={WardId}",
                propertyId, typeOfUses.Count, activeTaxes.Count, rates.Count,
                rateSectionId, property.WardId);

            if (activeTaxes.Count == 0)
                _logger.LogWarning(
                    "No active taxes found in TaxMaster for PropertyId={PropertyId}. " +
                    "No tax rows will be generated.", propertyId);

            if (rates.Count == 0)
                _logger.LogWarning(
                    "No rates found for RateSectionId={RateSectionId} (WardId={WardId}). " +
                    "All base rates will be zero for PropertyId={PropertyId}.",
                    rateSectionId, property.WardId, propertyId);

            // 4. Load tax-related master data
            // Note: We now keep ALL tax percentages and filter per-detail using YearRangeRVIdForDetail
            // to support properties with mixed assessment years across details.
            var allTaxPercentages = await _masterDataService.GetActiveTaxPercentagesAsync();
            var educationTaxSlabs = await _masterDataService.GetActiveEducationTaxSlabsAsync();
            var employmentTaxSlabs = await _masterDataService.GetActiveEmploymentTaxSlabsAsync();

            _logger.LogInformation(
                "Tax data for PropertyId={PropertyId}: " +
                "PropertyYearRangeId={YearRangeId}, TaxPercentages(total)={AllPct}, " +
                "EducationSlabs={EduSlabs}, EmploymentSlabs={EmpSlabs}",
                propertyId, yearRangeRVId, allTaxPercentages.Count,
                educationTaxSlabs.Count, employmentTaxSlabs.Count);

            // 4b. Load Dynamic Tax Register configuration for the taxes in play. Read fresh each
            // run (not through the master-data memory cache) because an admin editing the
            // register screen expects the next calculation to reflect the save.
            var dynamicTaxConfig = (await _dynamicTaxConfigReader.LoadAsync(
                activeTaxes.Select(t => t.Id).ToList())) ?? DynamicTaxConfigSnapshot.Empty;

            _logger.LogInformation(
                "Dynamic tax configuration loaded for PropertyId={PropertyId}: " +
                "ConditionRuleTaxes={ConditionTaxes}, MasterMappingTaxes={MasterTaxes}, " +
                "HybridConfigs={HybridConfigs}, TotalRows={TotalRows}",
                propertyId, dynamicTaxConfig.ConditionRulesByTax.Count,
                dynamicTaxConfig.MasterMappingsByTax.Count,
                dynamicTaxConfig.HybridConfigByTax.Count, dynamicTaxConfig.TotalRowCount);

            // 5. Resolve finance year range and year master record
            var financeYearRange = yearRanges.FirstOrDefault(x =>
                x.FromYear <= financeYear && x.ToYear >= financeYear && x.IsActive);

            if (financeYearRange == null)
                _logger.LogWarning(
                    "AssessmentYearRangeMasterRV has no range covering FinanceYear={FinanceYear} for PropertyId={PropertyId}. " +
                    "Property details will be returned with zero tax instead of failing the request.",
                    financeYear, propertyId);

            // Only a same-year row may back this calculation's FinanceYearId — RVPersistenceService
            // writes this ID to TransMast.FinanceYearId and deactivates existing rows under it, so
            // falling back to an arbitrary active/first YearMaster would associate this calculation
            // with a DIFFERENT year and could overwrite that other year's TransMast data.
            var yearMaster = await _yearMasterRepo.GetQueryable()
                .FirstOrDefaultAsync(y => y.Year == financeYear && y.IsActive)
                ?? await _yearMasterRepo.GetQueryable()
                .FirstOrDefaultAsync(y => y.Year == financeYear);

            if (yearMaster == null)
                _logger.LogWarning(
                    "Year {FinanceYear} not found in YearMaster table for PropertyId={PropertyId}. " +
                    "TransMast rows cannot be saved without a valid FinanceYearId, but PolicyTaxDetails " +
                    "and the calculated response will still be produced with zero/no tax as applicable.",
                    financeYear, propertyId);

            int yearMasterId = yearMaster?.Id ?? 0;

            // 6. Load policy configuration
            var policyDefaults = new Dictionary<string, string>
            {
                { RateableValuePolicyConstants.RateableValueAreaType,                  RateableValuePolicyConstants.DefaultAreaType },
                { RateableValuePolicyConstants.RateMasterAreaUnit,                     RateableValuePolicyConstants.DefaultAreaUnit },
                { RateableValuePolicyConstants.RateMonthlyOrYearly,                    RateableValuePolicyConstants.DefaultRatePeriod },
                { RateableValuePolicyConstants.EducationEmploymentTaxCalculationMethod, RateableValuePolicyConstants.DefaultEducationEmploymentTaxCalculationMethod },
                { RateableValuePolicyConstants.MaintenanceRateKey,                     RateableValuePolicyConstants.DefaultMaintenanceRate }
            };
            var policyValues = await _policyConfigurationService.GetPolicyValuesAsync(policyDefaults);
            var policyOptions = RateableValuePolicyOptions.FromPolicies(policyValues, _logger);

            _logger.LogDebug(
                "RV Policy: AreaType={AreaType}, AreaUnit={AreaUnit}, RatePeriod={RatePeriod}, " +
                "EducationEmploymentTaxCalculationMethod={TaxCalcMethod}, Maintenance={Maintenance}%",
                policyOptions.AreaType, policyOptions.AreaUnit, policyOptions.RatePeriod,
                policyOptions.EducationEmploymentTaxCalculationMethod, policyOptions.MaintenanceRatePercent);

            // Resolve PropertyRuleEvaluationMaster ID map for parameter-specific rule execution
            var evalMasterMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            if (_evalMasterRepo != null)
            {
                try
                {
                    var targetKeys = new[] { "Rate", "Rent", "Maintenance" };
                    var masters = await _evalMasterRepo.GetQueryable()
                        .Where(x => x.IsActive && (targetKeys.Contains(x.ParameterCode) || targetKeys.Contains(x.ParameterName)))
                        .AsNoTracking()
                        .ToListAsync();
                    foreach (var m in masters)
                    {
                        if (!string.IsNullOrWhiteSpace(m.ParameterCode))
                            evalMasterMap[m.ParameterCode.Trim()] = m.Id;
                        if (!string.IsNullOrWhiteSpace(m.ParameterName))
                            evalMasterMap[m.ParameterName.Trim()] = m.Id;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[RuleEngine-RV] Unable to load PropertyRuleEvaluationMaster table. Falling back to string ValueKey matching.");
                }
            }

            int? rateEvalMasterId = evalMasterMap.TryGetValue("Rate", out var rId) ? rId : (int?)null;
            int? rentEvalMasterId = evalMasterMap.TryGetValue("Rent", out var rnId) ? rnId : (int?)null;
            int? maintEvalMasterId = evalMasterMap.TryGetValue("Maintenance", out var mId) ? mId : (int?)null;

            // 7. Pre-compute selected areas for all details
            var selectedAreas = RateableValuePolicyHelper.GetSelectedAreasForProperty(details, policyOptions);

            _logger.LogDebug("Calculating base values for {DetailCount} property details, FinanceYear={FinanceYear}, YearMasterId={YearMasterId}",
                details.Count, financeYear, yearMasterId);

            // 8. Calculate base values (sequential)
            var baseResultsCache = new Dictionary<int, RVCalculationResultsEntity>();
            var ruleTracesCache = new Dictionary<int, List<RuleApplicationTraceEntry>>();

            foreach (var detail in details)
            {
                decimal? ruleAdjustedRate = null;
                decimal? ruleAdjustedRent = null;
                decimal? ruleAdjustedMaintenancePercent = null;
                var detailAppliedRules = new List<RuleApplicationTraceEntry>();

                var detailTypeOfUse = typeOfUses.FirstOrDefault(x => x.Id == detail.TypeOfUseId);

                var detailYearRangeRVId = propertyContext.DetailYearRangeRVIdMap.TryGetValue(
                    detail.Id,
                    out var yearRangeId)
                    ? yearRangeId
                    : propertyContext.Parameters.YearRangeRVId;

                if (detailTypeOfUse != null)
                {
                    var masterRate = rates.FirstOrDefault(x =>
                        x.TaxZoneId == property.TaxZoneId &&
                        x.ConstructionTypeId == detail.ConstructionTypeId &&
                        x.TypeOfUseGroupId == detailTypeOfUse.TypeOfUseGroupId &&
                        x.YearRangeRVId == detailYearRangeRVId &&
                        x.IsActive);

                    decimal masterRatePerUnit = RateableValueCalculator.GetRatePerUnit(masterRate, policyOptions);
                    var clonedContext = propertyContext.CloneForDetail(detail, detailTypeOfUse);
                    if (masterRate != null && masterRatePerUnit >= 0)
                    {
                        _logger.LogDebug(
                            "[RuleEngine-RV] Executing RV rules for PropertyDetailsId={DetailId}: MasterRate={MasterRate} ({Unit}) " +
                            "YearRangeRVId={YearRangeId}",
                            detail.Id, masterRatePerUnit, policyOptions.IsSqFeetUnit ? "sqft" : "sqm", detailYearRangeRVId);

                        // Execute Rate parameter rules
                        var applierContext = new RuleApplierContext
                        {
                            PropertyContext = clonedContext,
                            InitialValue = masterRatePerUnit,
                            Category = "RV",
                            ValueKey = "Rate",
                            PropertyRuleEvaluationMasterId = rateEvalMasterId
                        };

                        var ruleResult = await _ruleApplierService.ApplyRulesAsync(applierContext);
                        if (ruleResult.AppliedRules != null && ruleResult.AppliedRules.Any())
                        {
                            detailAppliedRules.AddRange(ruleResult.AppliedRules);
                        }

                        if (ruleResult.FinalValue != masterRatePerUnit)
                        {
                            ruleAdjustedRate = ruleResult.FinalValue;
                        }
                    }
                    else
                    {
                        _logger.LogWarning(
                            "[RuleEngine-RV] Skipping rule execution for PropertyDetailsId={DetailId}: " +
                            "masterRate is null or zero. Using base rate.",
                            detail.Id);
                    }

                    // Execute Rent parameter rules if property floor is rented
                    if (detail.IsRenter == true && renters != null)
                    {
                        var renterRow = renters
                            .Where(r => r.PropertyDetailsId == detail.Id && r.IsActive && !r.MarkedForDeletion)
                            .OrderByDescending(r => r.CreatedDate)
                            .FirstOrDefault();

                        if (renterRow != null)
                        {
                            double yearlyRentValue = renterRow.FinalYearlyRent > 0
                                ? renterRow.FinalYearlyRent.Value
                                : ((renterRow.RentMonthly ?? 0d) * 12d);

                            if (yearlyRentValue > 0)
                            {
                                var rentApplierContext = new RuleApplierContext
                                {
                                    PropertyContext = clonedContext,
                                    InitialValue = (decimal)yearlyRentValue,
                                    Category = "RV",
                                    ValueKey = "Rent",
                                    PropertyRuleEvaluationMasterId = rentEvalMasterId
                                };

                                var rentRuleResult = await _ruleApplierService.ApplyRulesAsync(rentApplierContext);
                                if (rentRuleResult.AppliedRules != null && rentRuleResult.AppliedRules.Any())
                                {
                                    detailAppliedRules.AddRange(rentRuleResult.AppliedRules);
                                }

                                ruleAdjustedRent = rentRuleResult.FinalValue;
                            }
                        }
                    }

                    // Execute Maintenance parameter rules on Maintenance Rate Percentage
                    var maintApplierContext = new RuleApplierContext
                    {
                        PropertyContext = clonedContext,
                        InitialValue = policyOptions.MaintenanceRatePercent,
                        Category = "RV",
                        ValueKey = "Maintenance",
                        PropertyRuleEvaluationMasterId = maintEvalMasterId
                    };

                    var maintRuleResult = await _ruleApplierService.ApplyRulesAsync(maintApplierContext);
                    if (maintRuleResult.AppliedRules != null && maintRuleResult.AppliedRules.Any())
                    {
                        detailAppliedRules.AddRange(maintRuleResult.AppliedRules);
                    }

                    if (maintRuleResult.FinalValue != policyOptions.MaintenanceRatePercent)
                    {
                        if (maintRuleResult.FinalValue < 0m || maintRuleResult.FinalValue > 100m)
                        {
                            _logger.LogWarning(
                                "[RuleEngine-RV] Ignoring invalid Maintenance%={MaintenancePercent} for PropertyDetailsId={DetailId}. Expected 0..100.",
                                maintRuleResult.FinalValue, detail.Id);
                        }
                        else
                        {
                            ruleAdjustedMaintenancePercent = maintRuleResult.FinalValue;
                        }
                    }

                    if (detailAppliedRules.Any())
                    {
                        ruleTracesCache[detail.Id] = detailAppliedRules;
                    }
                }

                var selectedArea = selectedAreas.TryGetValue(detail.Id, out var area) ? area : 0m;
                baseResultsCache[detail.Id] = _rateableValueCalculatorService.CalculateBaseValues(
                    detail, financeYear, property.TaxZoneId, property.WardId,
                    typeOfUses, rates, depreciations, yearRanges, renters ?? new List<RenterMastEntity>(),
                    selectedArea, policyOptions, ruleAdjustedRate, detailYearRangeRVId, ruleAdjustedRent,
                   isPlotProperty, ruleAdjustedMaintenancePercent);
            }

            _logger.LogInformation(
                "Base values calculated for PropertyId={PropertyId}: {CachedCount} detail(s). " +
                "FinanceYear={FinanceYear}, FinanceYearRangeId={FinanceYearRangeId}",
                propertyId, baseResultsCache.Count, financeYear, (object?)financeYearRange?.Id ?? "NULL");

        // 9. Build standard tax rows (excluding education and employment)
        var taxTotalId = activeTaxes
            .Where(t => string.Equals(t.TaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase))
            .Select(t => (int?)t.Id)
            .FirstOrDefault();
        var regularTaxes = activeTaxes
            .Where(t => !IsEducationTax(t) && !IsEmploymentTax(t) &&
                        !string.Equals(t.TaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase))
            .ToList();

        // Multiple taxes can each reference TaxTotal (ResultBase = OTHER_TAX, ReferenceTaxId =
        // TaxTotal's TaxId) as their percentage base. DynamicTaxOrdering only guarantees a
        // TaxTotal-referencing tax runs after taxes that DON'T reference TaxTotal — it does not
        // order multiple TaxTotal-referencing taxes relative to EACH OTHER, so a single pass would
        // have each one read a different, incomplete partial sum depending on incidental tie-break



        // order. Splitting into two passes fixes this: pass 1 computes every tax that does NOT
        // reference TaxTotal (so TaxTotal is fully known afterwards), then pass 2 computes every
        // tax that DOES reference TaxTotal against that final, stable total.
        bool ReferencesTaxTotal(TaxMasterEntity t) =>
            taxTotalId.HasValue &&
            dynamicTaxConfig.ConditionRulesFor(t.Id).Any(r =>
                string.Equals(r.ResultBase, DynamicTaxResultBases.OtherTax, StringComparison.OrdinalIgnoreCase) &&
                r.ReferenceTaxId == taxTotalId.Value);

        // A tax that references, via OTHER_TAX, some OTHER regular tax which itself (directly or
        // transitively) references TaxTotal has the exact same problem as referencing TaxTotal
        // directly: DynamicTaxOrdering only orders dependencies WITHIN the list it's given (see its
        // pass1Taxes/pass2Taxes calls below), and pass 1 runs to completion before pass 2 starts —
        // so a pass-1 tax depending on a pass-2 tax would have that edge silently dropped (the
        // referenced tax isn't in pass 1's id set), run with no ordering constraint, and read a
        // "not yet computed" lookup that DynamicTaxAmountResolver treats as 0. Promote every regular
        // tax that transitively depends on a TaxTotal-referencing tax into pass 2 too, so nothing in
        // pass 1 can end up depending on a value pass 1 itself never computes.
        var pass2TaxIds = new HashSet<int>(regularTaxes.Where(ReferencesTaxTotal).Select(t => t.Id));
        bool pass2SetGrew = true;
        while (pass2SetGrew)
        {
            pass2SetGrew = false;
            foreach (var tax in regularTaxes)
            {
                if (pass2TaxIds.Contains(tax.Id))
                {
                    continue;
                }

                var dependsOnPass2Tax = dynamicTaxConfig.ConditionRulesFor(tax.Id).Any(r =>
                    string.Equals(r.ResultBase, DynamicTaxResultBases.OtherTax, StringComparison.OrdinalIgnoreCase) &&
                    r.ReferenceTaxId.HasValue &&
                    pass2TaxIds.Contains(r.ReferenceTaxId.Value));

                if (dependsOnPass2Tax)
                {
                    pass2TaxIds.Add(tax.Id);
                    pass2SetGrew = true;
                }
            }
        }

        var pass1Taxes = regularTaxes.Where(t => !pass2TaxIds.Contains(t.Id)).ToList();
        var pass2Taxes = regularTaxes.Where(t => pass2TaxIds.Contains(t.Id)).ToList();

        // A tax priced as a PERCENT of another tax (ResultBase = OTHER_TAX) reads an amount
        // produced in THIS run, so it must be computed after the tax it references — the
        // plain foreach below carries no ordering guarantee on its own. Neither pass references
        // TaxTotal within itself (pass 1 by construction, pass 2 is resolved via the fixed-point
        // total below instead of via computedAmountsByDetailTax), so taxTotalId is not passed here.
        pass1Taxes = DynamicTaxOrdering.Order(pass1Taxes, dynamicTaxConfig, _logger);
        pass2Taxes = DynamicTaxOrdering.Order(pass2Taxes, dynamicTaxConfig, _logger);

            var eduTaxCount = activeTaxes.Count(IsEducationTax);
            var empTaxCount = activeTaxes.Count(IsEmploymentTax);

            // Condition rows are evaluated against the same flattened field dictionary the rule
            // engine uses. Loaded once per run, and only when some tax actually needs conditions.
            var needsConditionFields = regularTaxes.Any(t =>
                t.CalculationModeMaster?.UsesConditionConfig == true ||
                t.CalculationModeMaster?.UsesHybridConfig == true);

            var activeRulesFields = needsConditionFields
                ? await _rulesFieldRepo.GetQueryable().AsNoTracking().Where(f => f.IsActive).ToListAsync()
                : new List<RulesFieldEntity>();

            _logger.LogInformation(
                "Tax classification for PropertyId={PropertyId}: " +
                "Regular={Regular}, Education={Edu}, Employment={Emp}. " +
                "CategoryCode check: first tax CategoryCode='{Code}'",
                propertyId, regularTaxes.Count, eduTaxCount, empTaxCount,
                activeTaxes.FirstOrDefault()?.TaxCategoryMaster?.CategoryCode ?? "NULL(nav not loaded)");

            // Build one results row per PropertyDetailsId, and store per-tax amounts as separate tax-detail rows.
            var newResultsRows = new List<RVCalculationResultsEntity>();
            var newTaxDetailRows = new List<RVCalculationTaxDetailsEntity>();
            // Reuse the same results row across regular and special (education/employment) tax calculations.
            var detailResultsRowCache = new Dictionary<int, RVCalculationResultsEntity>();
            var now = _timeProvider.GetLocalNow().DateTime;

            // Backs ResultBase = OTHER_TAX: the amount each tax produced for the detail currently
            // being priced. Keyed by (detail, tax) so a reference resolves against the same
            // detail, not a sibling floor's amount.
            var computedAmountsByDetailTax = new Dictionary<(int DetailId, int TaxId), decimal>();

            // PER_UNIT counts (e.g. number of toilets) are recorded once per property, so a given
            // condition ROW's charge is applied on the first detail it resolves on only — see
            // DynamicTaxAmount.PropertyWideContributions. Keyed by (TaxId, RuleId) rather than just
            // TaxId: two distinct PER_UNIT rows for the same tax can each apply to a different detail
            // (e.g. a floor-1-only rule and a separate floor-2-only rule), and deduping by tax alone
            // would silently drop every row after the first one seen for that tax.
            var propertyWideChargedRuleIds = new HashSet<(int TaxId, int RuleId)>();

            var propertyTotalRv = details.Sum(d => baseResultsCache.TryGetValue(d.Id, out var b) ? (b.RateableValue ?? 0m) : 0m);
            var propertyTotalAlv = details.Sum(d => baseResultsCache.TryGetValue(d.Id, out var b) ? Convert.ToDecimal(b.AnnualRentalValue ?? 0d) : 0m);
            var activeDetails = details.Where(d => d.IsActive != false).ToList();
            var propertyTotalCarpetAreaSqMeter = activeDetails.Sum(d => Convert.ToDecimal(d.CarpetAreaSqMeter ?? 0d));
            var propertyTotalCarpetAreaSqFeet = activeDetails.Sum(d => Convert.ToDecimal(d.CarpetAreaSqFeet ?? 0d));
            var propertyTotalBuiltupAreaSqFeet = activeDetails.Sum(d => Convert.ToDecimal(d.BuiltupAreaSqFeet ?? 0d));
            var propertyTotalBuiltupAreaSqMeter = activeDetails.Sum(d => Convert.ToDecimal(d.BuiltupAreaSqMeter ?? 0d));

            // Merge target property's in-memory base calculation results into sibling snapshot so building-based
            // thresholds and dynamic tax rules evaluate against the complete and up-to-date building total.
            var siblingRv = propertyContext.Parameters.SiblingTotalRateableValue;
            var siblingAlv = propertyContext.Parameters.SiblingTotalAnnualRentalValue;

            propertyContext.Parameters.BuildingTotalRateableValue = siblingRv + propertyTotalRv;
            propertyContext.Parameters.BuildingTotalAnnualRentalValue = siblingAlv + propertyTotalAlv;

            var detailFieldValuesCache = new Dictionary<int, Dictionary<string, object>>();

            // Precompute floor totals for FLOOR_BASED assessment rules
            var floorTotalsByFloorId = details
                .GroupBy(d => d.FloorId ?? 0)
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var floorDetailsList = g.ToList();
                        var floorBuiltupSqFt = (decimal)floorDetailsList.Sum(d => d.BuiltupAreaSqFeet ?? 0.0);
                        var floorBuiltupSqM = (decimal)floorDetailsList.Sum(d => d.BuiltupAreaSqMeter ?? 0.0);
                        var floorCarpetSqFt = (decimal)floorDetailsList.Sum(d => d.CarpetAreaSqFeet ?? 0.0);
                        var floorCarpetSqM = (decimal)floorDetailsList.Sum(d => d.CarpetAreaSqMeter ?? 0.0);
                        var floorRv = floorDetailsList.Sum(d => baseResultsCache.TryGetValue(d.Id, out var br) ? (br.RateableValue ?? 0m) : 0m);
                        var floorAlv = floorDetailsList.Sum(d => baseResultsCache.TryGetValue(d.Id, out var br) ? Convert.ToDecimal(br.AnnualRentalValue ?? 0.0) : 0m);

                        return new
                        {
                            Count = floorDetailsList.Count,
                            BuiltupSqFt = floorBuiltupSqFt,
                            BuiltupSqM = floorBuiltupSqM,
                            CarpetSqFt = floorCarpetSqFt,
                            CarpetSqM = floorCarpetSqM,
                            RateableValue = floorRv,
                            AnnualRentalValue = floorAlv
                        };
                    });

        // Computes and persists tax-detail rows for `taxesToCompute`, one per detail. Extracted
        // so it can be run twice (pass 1: taxes not referencing TaxTotal; pass 2: taxes that do)
        // with a different ReferenceTaxAmountLookup for OTHER_TAX resolution — see the taxTotalId
        // split above. `referenceTaxAmountLookup` is invoked per-detail, exactly as the original
        // single-pass closure captured `detail.Id` fresh on every inner-loop iteration.
        void ComputeTaxesForDetail(
            List<TaxMasterEntity> taxesToCompute,
            Func<int, int, decimal?> referenceTaxAmountLookup)
        {
            foreach (var tax in taxesToCompute)
            {
                foreach (var detail in details)
                {
                    var baseResult = baseResultsCache[detail.Id];

                    // Get detail's year range ID (same as base calculation loop)
                    var detailYearRangeRVId = propertyContext.DetailYearRangeRVIdMap.TryGetValue(
                        detail.Id,
                        out var yearRangeId)
                        ? yearRangeId
                        : propertyContext.Parameters.YearRangeRVId;

                    if (detailYearRangeRVId == 0)
                        _logger.LogWarning(
                            "YearRangeRVId not found for PropertyDetailsId={PropertyDetailsId}, AssessmentYear={AssessmentYear}. " +
                            "baseResult is already a zero CreateZeroResult; persisting zero tax rows for all regular taxes.",
                            detail.Id, detail.AssessmentYear);

                    IReadOnlyDictionary<string, object> GetDetailFieldValues()
                    {
                        if (detailFieldValuesCache.TryGetValue(detail.Id, out var cached))
                        {
                            return cached;
                        }

                        var detailTypeOfUse = typeOfUses.FirstOrDefault(t => t.Id == detail.TypeOfUseId);

                        if (detailTypeOfUse == null || detailTypeOfUse.TypeOfUseGroupId <= 0)
                        {
                            _logger.LogWarning(
                                "PropertyDetailsId={PropertyDetailsId} has no resolved TypeOfUseGroup — " +
                                "condition-based taxes cannot be evaluated for it and will persist zero.",
                                detail.Id);
                            var empty = new Dictionary<string, object>();
                            detailFieldValuesCache[detail.Id] = empty;
                            return empty;
                        }

                        var fieldValues = _fieldFlattener.Flatten(
                            propertyContext.CloneForDetail(detail, detailTypeOfUse), activeRulesFields);
                        var rv = baseResult.RateableValue ?? 0m;
                        var alv = Convert.ToDecimal(baseResult.AnnualRentalValue ?? 0d);
                        fieldValues["RateableValue"] = rv;
                        fieldValues["Rateable Value"] = rv;
                        fieldValues["RV"] = rv;
                        fieldValues["AnnualRentalValue"] = alv;
                        fieldValues["Annual Rental Value"] = alv;
                        fieldValues["ALV"] = alv;
                        fieldValues["ARV"] = alv;
                        detailFieldValuesCache[detail.Id] = fieldValues;
                        return fieldValues;
                    }

                    TaxCalculationResult calculationResult;

                    var usesDynamicConfig =
                        tax.CalculationModeMaster != null &&
                        (tax.CalculationModeMaster.UsesConditionConfig ||
                         tax.CalculationModeMaster.UsesMasterConfig ||
                         tax.CalculationModeMaster.UsesHybridConfig);

                    if (usesDynamicConfig)
                    {
                        // Only flatten for modes that actually evaluate conditions — a
                        // MASTER_BASED tax keys off ids alone, and asking for field values
                        // would both clone the context needlessly and emit a
                        // "cannot evaluate conditions" warning for a tax that has none.
                        var needsFields =
                            tax.CalculationModeMaster!.UsesConditionConfig ||
                            tax.CalculationModeMaster.UsesHybridConfig;

                        var floorTotals = floorTotalsByFloorId.GetValueOrDefault(detail.FloorId ?? 0);

                        var resolution = _dynamicTaxAmountResolver.Resolve(new DynamicTaxResolutionContext
                        {
                            Tax = tax,
                            RateableValue = baseResult.RateableValue ?? 0m,
                            AnnualRentalValue = Convert.ToDecimal(baseResult.AnnualRentalValue ?? 0d),
                            PropertyTotalRateableValue = propertyTotalRv,
                            PropertyTotalAnnualRentalValue = propertyTotalAlv,
                            PropertyTotalBuiltupAreaSqFeet = propertyTotalBuiltupAreaSqFeet,
                            PropertyTotalBuiltupAreaSqMeter = propertyTotalBuiltupAreaSqMeter,
                            PropertyTotalCarpetAreaSqFeet = propertyTotalCarpetAreaSqFeet,
                            PropertyTotalCarpetAreaSqMeter = propertyTotalCarpetAreaSqMeter,
                            BuildingTotalRateableValue = propertyContext.Parameters.BuildingTotalRateableValue,
                            BuildingTotalAnnualRentalValue = propertyContext.Parameters.BuildingTotalAnnualRentalValue,
                            FloorTotalBuiltupAreaSqFeet = floorTotals?.BuiltupSqFt ?? (decimal)(detail.BuiltupAreaSqFeet ?? 0.0),
                            FloorTotalBuiltupAreaSqMeter = floorTotals?.BuiltupSqM ?? (decimal)(detail.BuiltupAreaSqMeter ?? 0.0),
                            FloorTotalCarpetAreaSqFeet = floorTotals?.CarpetSqFt ?? (decimal)(detail.CarpetAreaSqFeet ?? 0.0),
                            FloorTotalCarpetAreaSqMeter = floorTotals?.CarpetSqM ?? (decimal)(detail.CarpetAreaSqMeter ?? 0.0),
                            FloorTotalRateableValue = floorTotals?.RateableValue ?? (baseResult.RateableValue ?? 0m),
                            FloorTotalAnnualRentalValue = floorTotals?.AnnualRentalValue ?? Convert.ToDecimal(baseResult.AnnualRentalValue ?? 0.0),
                            DetailBuiltupAreaSqFeet = (decimal)(detail.BuiltupAreaSqFeet ?? 0.0),
                            DetailBuiltupAreaSqMeter = (decimal)(detail.BuiltupAreaSqMeter ?? 0.0),
                            FloorDetailCount = floorTotals?.Count ?? 1,
                            DetailYearRangeRVId = detailYearRangeRVId,
                            TypeOfUseId = detail.TypeOfUseId,
                            PropertyTypeId = property.PropertyTypeId,
                            OwnerTypeId = propertyAssessment?.OwnerTypeId,
                            FieldValues = needsFields
                                ? GetDetailFieldValues()
                                : new Dictionary<string, object>(),
                            Config = dynamicTaxConfig,
                            ReferenceTaxAmountLookup = referencedTaxId =>
                                referenceTaxAmountLookup(detail.Id, referencedTaxId)
                        });

                        var amount = resolution.Amount;

                        // Charge each contributing PER_UNIT row's property-wide portion once, on the
                        // first detail that resolves IT — not once per tax. A row that matches
                        // several details (the common "counted once per property" case) is still
                        // only charged the first time; a DIFFERENT row for the same tax that matches
                        // a different detail is charged too, rather than being silently dropped.
                        foreach (var (ruleId, ruleAmount) in resolution.PropertyWideContributions)
                        {
                            if (ruleAmount != 0m && propertyWideChargedRuleIds.Add((tax.Id, ruleId)))
                            {
                                amount += ruleAmount;
                            }
                        }

                        if (!resolution.Resolved)
                        {
                            // Same contract as a missing TaxPercentageMasterRV row below: keep the
                            // tax head present with a zero amount rather than dropping it.
                            _logger.LogWarning(
                                "No dynamic tax configuration resolved for TaxId={TaxId} ({TaxCode}), " +
                                "mode={ModeCode}, PropertyDetailsId={PropertyDetailsId}, " +
                                "YearRangeRVId={YearRangeId}: {Reason}. Persisting zero tax.",
                                tax.Id, tax.TaxCode, tax.CalculationModeMaster?.ModeCode,
                                detail.Id, detailYearRangeRVId, resolution.Reason);
                        }

                        calculationResult = RateableValueTaxCalculator.ApplyDynamicTax(
                            baseResult, tax, amount, resolution.Percentage);
                    }
                    else
                    {
                        // Filter tax percentages by the detail's assessment year range (or property-level fallback)
                        var taxPct = allTaxPercentages.FirstOrDefault(x =>
                            x.YearRangeRVId == detailYearRangeRVId &&
                            x.TaxId == tax.Id &&
                            x.TypeOfUseId == detail.TypeOfUseId);

                        // regularTaxes already excludes Education/Employment/TaxTotal (handled separately
                        // downstream), so it's safe to always persist a row here even with no configured
                        // percentage — it just computes to a zero amount — instead of omitting the tax
                        // entirely from the response.
                        if (taxPct == null)
                        {
                            _logger.LogWarning(
                                "TaxPercentage not found for TaxId={TaxId} ({TaxCode}), " +
                                "TypeOfUseId={TypeOfUseId}, YearRangeRVId={YearRangeId}. Persisting zero tax.",
                                tax.Id, tax.TaxCode, detail.TypeOfUseId, detailYearRangeRVId);
                        }

                        calculationResult = RateableValueTaxCalculator.ApplyTax(baseResult, tax, taxPct);
                    }

                    // Property-level exemption via ApplyTaxesMaster overrides any configured percentage.
                    if (exemptedTaxIdSet.Contains(tax.Id))
                    {
                        calculationResult.TaxDetail.TaxAmount = 0m;
                    }

                    // Recorded AFTER the exemption so an OTHER_TAX reference to an exempted tax
                    // sees the zero that was actually charged, not the pre-exemption amount.
                    computedAmountsByDetailTax[(detail.Id, tax.Id)] =
                        calculationResult.TaxDetail.TaxAmount ?? 0m;

                    // Create results row ONCE per detail using shared cache
                    if (!detailResultsRowCache.ContainsKey(detail.Id))
                    {
                        var detailResultsRow = calculationResult.ResultsRow;
                        detailResultsRow.IsActive = true;
                        detailResultsRow.MarkedForDeletion = false;
                        detailResultsRow.CreatedDate = now;
                        detailResultsRow.UpdatedDate = now;
                        detailResultsRowCache[detail.Id] = detailResultsRow;
                        newResultsRows.Add(detailResultsRow);
                    }

                    // All tax details for this detail reference the SAME results row from shared cache
                    calculationResult.TaxDetail.RVCalculationResults = detailResultsRowCache[detail.Id];
                    calculationResult.TaxDetail.IsActive = true;
                    calculationResult.TaxDetail.MarkedForDeletion = false;
                    calculationResult.TaxDetail.MarkedForDeletionDate = null;
                    calculationResult.TaxDetail.CreatedDate = now;
                    calculationResult.TaxDetail.UpdatedDate = now;
                    newTaxDetailRows.Add(calculationResult.TaxDetail);
                }
            }
        }

        // Pass 1: every regular tax that does NOT reference TaxTotal. OTHER_TAX references among
        // these resolve purely against computedAmountsByDetailTax, same as the original single pass.
        ComputeTaxesForDetail(pass1Taxes, (detailId, referencedTaxId) =>
            computedAmountsByDetailTax.TryGetValue((detailId, referencedTaxId), out var v) ? v : (decimal?)null);

        // TaxTotal is not a single computed entry — it's the sum of every regular tax computed for
        // the detail so far. After pass 1, every non-TaxTotal-referencing regular tax has been
        // computed for every detail, so this sum is now final and stable (a fixed point), unlike
        // the old in-progress running sum that pass-2 taxes used to read mid-loop.
        var finalTaxTotalByDetail = details.ToDictionary(
            d => d.Id,
            d => computedAmountsByDetailTax.Where(kv => kv.Key.DetailId == d.Id).Sum(kv => kv.Value));

        // Pass 2: every regular tax that DOES reference TaxTotal. Each one now reads the same
        // final total rather than whatever partial sum happened to exist when it ran.
        ComputeTaxesForDetail(pass2Taxes, (detailId, referencedTaxId) =>
            taxTotalId.HasValue && referencedTaxId == taxTotalId.Value
                ? finalTaxTotalByDetail[detailId]
                : (computedAmountsByDetailTax.TryGetValue((detailId, referencedTaxId), out var v) ? v : (decimal?)null));

        // 10. Education and Employment tax — grouped by property type (R/C)
        // Only include details that have valid year range IDs (exclude detailYearRangeRVId == 0)
        var validDetailsForSpecialTax = details
            .Where(d =>
            {
                var detailYearRangeRVId = propertyContext.DetailYearRangeRVIdMap.TryGetValue(
                    d.Id,
                    out var yearRangeId)
                    ? yearRangeId
                    : propertyContext.Parameters.YearRangeRVId;

                    return detailYearRangeRVId != 0;  // Exclude zero (AssessmentYear not found)
                })
                .ToList();

            // Per-TypeOfUse applicability flags (TypeOfUseMaster.StateEduTaxApplicable /
            // StateEmpTaxApplicable). A detail whose TypeOfUse has the flag = 0 adds nothing to
            // that tax's base and gets no row for that tax. A TypeOfUse missing from the active
            // list keeps the previous behaviour (applicable).
            bool IsStateEduTaxApplicable(PropertyDetailsEntity d) =>
                typeOfUses.FirstOrDefault(x => x.Id == d.TypeOfUseId)?.StateEduTaxApplicable ?? true;
            bool IsStateEmpTaxApplicable(PropertyDetailsEntity d) =>
                typeOfUses.FirstOrDefault(x => x.Id == d.TypeOfUseId)?.StateEmpTaxApplicable ?? true;

            // Get distinct property types, then normalize: C and I are grouped together as "C"
            var propertyTypesRaw = validDetailsForSpecialTax
                .Select(d => typeOfUses.FirstOrDefault(x => x.Id == d.TypeOfUseId)?.Type)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct()
                .ToList();

            // Normalize: C and I types are grouped together
            var propertyTypesForTax = propertyTypesRaw
                .Select(t => (t?.Equals("I", StringComparison.OrdinalIgnoreCase) ?? false) ? "C" : t)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct()
                .ToList();

            var educationTaxMaster = activeTaxes.FirstOrDefault(IsEducationTax);
            var employmentTaxMaster = activeTaxes.FirstOrDefault(IsEmploymentTax);

            // A TypeOfUse with no TaxPercentageMasterRV rows for any regular tax used to mean "not
            // configured for taxation at all" — but a regular tax can now be priced entirely through
            // the Dynamic Tax Register (CONDITION_BASED/MASTER_BASED/HYBRID) with no
            // TaxPercentageMasterRV row at all. Education/Employment (which are slab-based, not
            // percentage-based) must still respect "this TypeOfUse is actually taxed", so both
            // configuration mechanisms are checked here — not just the legacy table.
            bool IsTypeOfUseConfiguredForTax(PropertyDetailsEntity d)
            {
                var yearRangeRVIdForDetail = propertyContext.DetailYearRangeRVIdMap.TryGetValue(d.Id, out var yr)
                    ? yr
                    : propertyContext.Parameters.YearRangeRVId;

                if (regularTaxes.Any(t => allTaxPercentages.Any(x =>
                    x.TaxId == t.Id &&
                    x.TypeOfUseId == d.TypeOfUseId &&
                    x.YearRangeRVId == yearRangeRVIdForDetail)))
                {
                    return true;
                }

                return regularTaxes.Any(t => IsDynamicallyConfiguredForDetail(t, d, yearRangeRVIdForDetail));
            }

            // A regular tax priced through the Dynamic Tax Register counts as "configured" for this
            // detail's TypeOfUse when it actually has rows that could apply to it:
            //  - CONDITION_BASED/HYBRID: any active condition row exists for the tax. Condition rows
            //    match on arbitrary field values (not necessarily TypeOfUseId), so their mere
            //    existence — same looseness as the legacy check above, which doesn't verify the rate
            //    is nonzero either — is enough to say the tax applies to some properties.
            //  - MASTER_BASED/HYBRID: a TaxMasterMapping row exists for THIS property/detail's actual
            //    master key (PropertyType/OwnerType/TypeOfUse, whichever the tax's rule names) at this
            //    detail's year range.
            bool IsDynamicallyConfiguredForDetail(TaxMasterEntity tax, PropertyDetailsEntity d, int yearRangeRVIdForDetail)
            {
                var calcMode = tax.CalculationModeMaster;
                if (calcMode == null || (!calcMode.UsesConditionConfig && !calcMode.UsesMasterConfig && !calcMode.UsesHybridConfig))
                {
                    return false;
                }

                if ((calcMode.UsesConditionConfig || calcMode.UsesHybridConfig) &&
                    dynamicTaxConfig.ConditionRulesFor(tax.Id).Count > 0)
                {
                    return true;
                }

                if (calcMode.UsesMasterConfig || calcMode.UsesHybridConfig)
                {
                    var masterKey = ResolveMasterKeyForDetail(dynamicTaxConfig.RuleFor(tax.RuleDefinitionId)?.AttachedReference, d);
                    if (masterKey != null &&
                        dynamicTaxConfig.MasterMappingsFor(tax.Id).Any(m =>
                            m.AssessmentYearRangeId == yearRangeRVIdForDetail &&
                            string.Equals(m.MasterKey?.Trim(), masterKey, StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }
                }

                return false;
            }

            // Mirrors DynamicTaxAmountResolver.ResolveMasterKeyId's master-source classification —
            // duplicated rather than shared because that method takes a full DynamicTaxResolutionContext
            // (RV/ALV/field values), none of which this presence-only check needs.
            string? ResolveMasterKeyForDetail(string? masterSource, PropertyDetailsEntity d)
            {
                if (string.IsNullOrWhiteSpace(masterSource)) return null;
                var src = masterSource.Trim().Replace(" ", string.Empty).ToLowerInvariant();

                if (src.Contains("propertytype") || src.Contains("propertycategory") || src.Contains("property"))
                    return property.PropertyTypeId > 0 ? property.PropertyTypeId.ToString() : null;

                if (src.Contains("ownertype") || src.Contains("owner"))
                    return propertyAssessment?.OwnerTypeId is int ownerTypeId && ownerTypeId > 0 ? ownerTypeId.ToString() : null;

                if (src.Contains("typeofuse") || src.Contains("use"))
                    return d.TypeOfUseId > 0 ? d.TypeOfUseId.ToString() : null;

                return null;
            }

            foreach (var propType in propertyTypesForTax)
            {
                // Include details that match the property type OR (if type is C, include both C and I),
                // and that have at least one configured regular tax rate for their TypeOfUse.
                var detailsOfType = validDetailsForSpecialTax
                    .Where(d =>
                    {
                        var detailType = typeOfUses.FirstOrDefault(x => x.Id == d.TypeOfUseId)?.Type;
                        if (string.Equals(propType, "C", StringComparison.OrdinalIgnoreCase))
                        {
                            // For C type, include both C and I
                            return string.Equals(detailType, "C", StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(detailType, "I", StringComparison.OrdinalIgnoreCase);
                        }
                        else
                        {
                            // For other types, exact match
                            return string.Equals(detailType, propType, StringComparison.OrdinalIgnoreCase);
                        }
                    })
                    .Where(IsTypeOfUseConfiguredForTax)
                    .ToList();

                // Calculate education/employment tax base based on policy: RV or ALV (default)
                bool isCalculatedOnRV = string.Equals(
                    policyOptions.EducationEmploymentTaxCalculationMethod,
                    RateableValuePolicyConstants.RV,
                    StringComparison.OrdinalIgnoreCase);

                decimal TaxBaseOf(List<PropertyDetailsEntity> ds) => isCalculatedOnRV
                    ? ds.Sum(d => baseResultsCache[d.Id].RateableValue ?? 0m)
                    : ds.Sum(d => (decimal)(baseResultsCache[d.Id].AnnualRentalValue ?? 0d));

                // Separate detail sets / bases so each tax honours its own TypeOfUse flag.
                var educationDetails = detailsOfType.Where(IsStateEduTaxApplicable).ToList();
                var employmentDetails = detailsOfType.Where(IsStateEmpTaxApplicable).ToList();
                decimal educationTaxBase = TaxBaseOf(educationDetails);
                decimal employmentTaxBase = TaxBaseOf(employmentDetails);

                _logger.LogInformation(
                    "[EducationEmploymentTax] PropertyType={PropertyType}, Policy={PolicyValue}, " +
                    "IsCalculatedOnRV={IsCalculatedOnRV}, EducationTaxBase={EducationTaxBase} ({EducationDetails} details), " +
                    "EmploymentTaxBase={EmploymentTaxBase} ({EmploymentDetails} details)",
                    propType, policyOptions.EducationEmploymentTaxCalculationMethod, isCalculatedOnRV,
                    educationTaxBase, educationDetails.Count, employmentTaxBase, employmentDetails.Count);

                if (educationTaxMaster != null)
                {
                    var slab = educationTaxSlabs.FirstOrDefault(x =>
                        IsSlabMatch(educationTaxBase, x.MinAmount, x.MaxAmount) &&
                        (string.IsNullOrWhiteSpace(x.Type) ||
                         string.Equals(x.Type, propType, StringComparison.OrdinalIgnoreCase)));

                    if (slab != null)
                    {
                        var pct = slab.Rate ?? 0m;
                        var amt = Math.Round(educationTaxBase * pct / 100m, 0, MidpointRounding.AwayFromZero);
                        if (exemptedTaxIdSet.Contains(educationTaxMaster.Id))
                            amt = 0m;
                        foreach (var d in educationDetails)
                        {
                            var calculationResult = BuildSpecialTaxRow(
                                baseResultsCache[d.Id], educationTaxMaster, propType!, pct, amt,
                                isEducation: true, now);

                            // Create ResultsRow ONCE per detail, reuse for all taxes of this detail
                            if (!detailResultsRowCache.ContainsKey(d.Id))
                            {
                                var resultRow = calculationResult.ResultsRow;
                                resultRow.IsActive = true;
                                resultRow.MarkedForDeletion = false;
                                resultRow.CreatedDate = now;
                                resultRow.UpdatedDate = now;
                                detailResultsRowCache[d.Id] = resultRow;
                                newResultsRows.Add(resultRow);
                            }

                            // Set education tax amount on cached ResultsRow based on property type
                            var cachedRow = detailResultsRowCache[d.Id];
                            if (string.Equals(propType, "R", StringComparison.OrdinalIgnoreCase))
                                cachedRow.REducationTax = amt;
                            else if (string.Equals(propType, "C", StringComparison.OrdinalIgnoreCase))
                                cachedRow.CEducationTax = amt;

                            // Reuse the cached ResultsRow instance for all tax details of this detail
                            calculationResult.TaxDetail.RVCalculationResults = cachedRow;
                            newTaxDetailRows.Add(calculationResult.TaxDetail);
                        }
                    }
                }

                if (employmentTaxMaster != null)
                {
                    var slab = employmentTaxSlabs.FirstOrDefault(x =>
                        IsSlabMatch(employmentTaxBase, x.MinAmount, x.MaxAmount) &&
                        (string.IsNullOrWhiteSpace(x.Type) ||
                         string.Equals(x.Type, propType, StringComparison.OrdinalIgnoreCase)));

                    if (slab != null)
                    {
                        var pct = slab.Rate ?? 0m;
                        var amt = Math.Round(employmentTaxBase * pct / 100m, 0, MidpointRounding.AwayFromZero);
                        if (exemptedTaxIdSet.Contains(employmentTaxMaster.Id))
                            amt = 0m;
                        foreach (var d in employmentDetails)
                        {
                            var calculationResult = BuildSpecialTaxRow(
                                baseResultsCache[d.Id], employmentTaxMaster, propType!, pct, amt,
                                isEducation: false, now);

                            // Create ResultsRow ONCE per detail, reuse for all taxes of this detail
                            if (!detailResultsRowCache.ContainsKey(d.Id))
                            {
                                var resultRow = calculationResult.ResultsRow;
                                resultRow.IsActive = true;
                                resultRow.MarkedForDeletion = false;
                                resultRow.CreatedDate = now;
                                resultRow.UpdatedDate = now;
                                detailResultsRowCache[d.Id] = resultRow;
                                newResultsRows.Add(resultRow);
                            }

                            // Employment tax is only applicable for C (Commercial) type properties
                            if (string.Equals(propType, "C", StringComparison.OrdinalIgnoreCase))
                            {
                                var cachedRow = detailResultsRowCache[d.Id];
                                cachedRow.CEmploymentTax = amt;

                                // Reuse the cached ResultsRow instance for all tax details of this detail
                                calculationResult.TaxDetail.RVCalculationResults = cachedRow;
                                newTaxDetailRows.Add(calculationResult.TaxDetail);
                            }
                        }
                    }
                }
            }

            // 11. Total RV across all details
            // Calculate total RV from unique details (first result per detail) to match response mapper
            // Group by PropertyDetailsId once to avoid O(n²) complexity from repeated Where scans
            decimal totalRv = newResultsRows
                .GroupBy(r => r.PropertyDetailsId)
                .Sum(g => g.FirstOrDefault()?.RateableValue ?? 0m);

            _logger.LogInformation(
                "Row summary for PropertyId={PropertyId}: ResultsRows={Results}, TaxDetailRows={TaxDetails}, TotalRV={TotalRv}",
                propertyId, newResultsRows.Count, newTaxDetailRows.Count, totalRv);

            if (newResultsRows.Count == 0)
                _logger.LogWarning(
                    "PropertyId={PropertyId}: 0 results rows generated. " +
                    "Likely causes: no active taxes, no matching TaxPercentages for YearRangeId={YearRangeId}, " +
                    "or no rates for RateSectionId={RateSectionId}.",
                    propertyId, yearRangeRVId, rateSectionId);

            return new RvComputationResult(
                propertyContext, newResultsRows, newTaxDetailRows, totalRv, yearMasterId,
                educationTaxMaster, employmentTaxMaster, ruleTracesCache,
                floors, constructionTypes, typeOfUses, subTypeOfUses, subFloors, activeTaxes, now, dynamicTaxConfig);
        }

        private static bool IsEducationTax(TaxMasterEntity tax) =>
            string.Equals(
                tax.TaxCategoryMaster?.CategoryCode, "EDU",
                StringComparison.OrdinalIgnoreCase);

        private static bool IsEmploymentTax(TaxMasterEntity tax) =>
            string.Equals(
                tax.TaxCategoryMaster?.CategoryCode, "EMP",
                StringComparison.OrdinalIgnoreCase);

        private static bool IsSlabMatch(decimal value, decimal? min, decimal? max)
        {
            var minOk = !min.HasValue || value >= min.Value;
            var maxOk = !max.HasValue || value <= max.Value;
            return minOk && maxOk;
        }

        /// <summary>
        /// Updated to return TaxCalculationResult with separated entities.
        /// Builds both the results row and tax detail row for education/employment taxes.
        /// </summary>
        private static TaxCalculationResult BuildSpecialTaxRow(
            RVCalculationResultsEntity baseResult,
            TaxMasterEntity taxMaster,
            string propType,
            decimal percentage,
            decimal amount,
            bool isEducation,
            DateTime now)
        {
            bool isR = string.Equals(propType, "R", StringComparison.OrdinalIgnoreCase);
            bool isC = string.Equals(propType, "C", StringComparison.OrdinalIgnoreCase);

            var resultsRow = new RVCalculationResultsEntity
            {
                PropertyId = baseResult.PropertyId,
                PropertyDetailsId = baseResult.PropertyDetailsId,
                MonthlyRate = baseResult.MonthlyRate,
                YearlyRate = baseResult.YearlyRate,
                YearlyRent = baseResult.YearlyRent,
                Depreciation = baseResult.Depreciation,
                DepreciationPer = baseResult.DepreciationPer,
                AppliedOn = baseResult.AppliedOn,
                AnnualRentalValue = baseResult.AnnualRentalValue,
                Maintenance = baseResult.Maintenance,
                RateableValue = baseResult.RateableValue,
                TotalAreaSqMtr = baseResult.TotalAreaSqMtr,
                RAreaSqMtr = isR ? baseResult.TotalAreaSqMtr : 0d,
                CAreaSqlMtr = isC ? baseResult.TotalAreaSqMtr : 0d
            };

            var taxDetail = new RVCalculationTaxDetailsEntity
            {
                TaxId = taxMaster.Id,
                TaxPercentage = percentage,
                TaxAmount = amount,
                IsActive = true,
                MarkedForDeletion = false,
                MarkedForDeletionDate = null,
                CreatedDate = now,
                UpdatedDate = now
            };

            return new TaxCalculationResult
            {
                ResultsRow = resultsRow,
                TaxDetail = taxDetail
            };
        }

        private void LogMetric(string metricName, double value, Dictionary<string, string>? properties = null)
        {
            _logger.LogInformation("[Metric] {MetricName} = {Value} {@Properties}",
                metricName, value, properties ?? new Dictionary<string, string>());
        }

        /// <summary>
        /// Bundle of everything <see cref="CalculateAndSaveAsync"/> needs to persist + build a
        /// response, and everything <see cref="PreviewTotalTaxAsync"/> needs to total a tax amount
        /// — computed once by <see cref="ComputeCoreAsync"/> so the two paths can never drift apart.
        /// </summary>
        private sealed record RvComputationResult(
            PropertyCalculationContext PropertyContext,
            List<RVCalculationResultsEntity> NewResultsRows,
            List<RVCalculationTaxDetailsEntity> NewTaxDetailRows,
            decimal TotalRv,
            int YearMasterId,
            TaxMasterEntity? EducationTaxMaster,
            TaxMasterEntity? EmploymentTaxMaster,
            Dictionary<int, List<RuleApplicationTraceEntry>> RuleTracesCache,
            List<FloorEntity> Floors,
            List<ConstructionTypeEntity> ConstructionTypes,
            List<TypeOfUseEntity> TypeOfUses,
            List<SubTypeOfUseEntity> SubTypeOfUses,
            List<SubFloorEntity> SubFloors,
            List<TaxMasterEntity> ActiveTaxes,
            DateTime Now,
            DynamicTaxConfigSnapshot DynamicTaxConfig);
    }
}