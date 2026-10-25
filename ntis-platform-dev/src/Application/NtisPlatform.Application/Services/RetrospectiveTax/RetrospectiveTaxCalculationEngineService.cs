using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Interfaces;
using OperationType = NtisPlatform.Application.Enums.OperationType;

namespace NtisPlatform.Application.Services.RetrospectiveTax;

public class RetrospectiveTaxCalculationEngineService : IRetrospectiveTaxCalculationEngineService
{
    /// <summary>
    /// Fixed day-count base for prorating the earliest (partial) chargeable finance year, matching
    /// the legacy Occupation Tax engine's policy (a partial year is always prorated against 365
    /// regardless of leap status; only a FULL year's own leap day was ever added back there, which
    /// this engine does not attempt to replicate since it has no day-based full-year billing model).
    /// </summary>
    private const int FinanceYearProrationBasisDays = 365;

    /// <summary>EvidenceTypeMaster.EvidenceCode -> PropertyCertificateTypeMaster.CertificateTypeCode.</summary>
    private static readonly Dictionary<string, string> EvidenceToCertificateCode = new(StringComparer.OrdinalIgnoreCase)
    {
        ["OC"] = CertificateTypeCodes.OC,
        ["CC"] = CertificateTypeCodes.CC,
        ["ELECTRICITY"] = CertificateTypeCodes.ElectricBill,
        ["CHANGE_DETECTION"] = CertificateTypeCodes.ChangeDetection,
    };

    private readonly IRepository<RetrospectiveRuleMasterEntity, int> _ruleRepository;
    private readonly IRepository<RetrospectiveRuleEvidenceConditionEntity, int> _evidenceConditionRepository;
    private readonly IRepository<RetrospectiveRuleDateConditionEntity, int> _dateConditionRepository;
    private readonly IRepository<RetrospectiveRuleActionEntity, int> _actionRepository;
    private readonly IRepository<RetrospectivePenaltyRuleEntity, int> _penaltyRepository;
    private readonly IRepository<EvidenceTypeMasterEntity, int> _evidenceTypeRepository;
    private readonly IRepository<PropertyCertificateEntity, int> _certificateRepository;
    private readonly IRepository<PropertyCertificateTypeMasterEntity, int> _certificateTypeRepository;
    private readonly IRepository<PropertyDetailsEntity, int> _propertyDetailsRepository;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<WingDetailsMastEntity, int> _wingDetailsMastRepository;
    private readonly IRepository<SocietyDetailsEntity, int> _societyRepository;
    private readonly IRepository<RetrospectiveTaxCalculationEntity, int> _calculationRepository;
    private readonly IRepository<RetrospectiveTaxCalculationDetailEntity, int> _calculationDetailRepository;
    private readonly IRepository<PolicyTaxDetailsEntity, int> _policyTaxDetailsRepository;
    private readonly IRepository<TransMastEntity, int> _transMastRepository;
    private readonly IRepository<YearMasterEntity, int> _yearRepository;
    private readonly IRateableValueService _rateableValueService;
    private readonly IFinanceYearProvider _financeYearProvider;
    private readonly IPolicyCodeLookupService _policyCodeLookup;
    private readonly ITaxApplicabilityService _taxApplicabilityService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RetrospectiveTaxCalculationEngineService>? _logger;
    private readonly IRetrospectiveCalculationLock _calculationLock;

    public RetrospectiveTaxCalculationEngineService(
        IRepository<RetrospectiveRuleMasterEntity, int> ruleRepository,
        IRepository<RetrospectiveRuleEvidenceConditionEntity, int> evidenceConditionRepository,
        IRepository<RetrospectiveRuleDateConditionEntity, int> dateConditionRepository,
        IRepository<RetrospectiveRuleActionEntity, int> actionRepository,
        IRepository<RetrospectivePenaltyRuleEntity, int> penaltyRepository,
        IRepository<EvidenceTypeMasterEntity, int> evidenceTypeRepository,
        IRepository<PropertyCertificateEntity, int> certificateRepository,
        IRepository<PropertyCertificateTypeMasterEntity, int> certificateTypeRepository,
        IRepository<PropertyDetailsEntity, int> propertyDetailsRepository,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<WingDetailsMastEntity, int> wingDetailsMastRepository,
        IRepository<SocietyDetailsEntity, int> societyRepository,
        IRepository<RetrospectiveTaxCalculationEntity, int> calculationRepository,
        IRepository<RetrospectiveTaxCalculationDetailEntity, int> calculationDetailRepository,
        IRepository<PolicyTaxDetailsEntity, int> policyTaxDetailsRepository,
        IRepository<TransMastEntity, int> transMastRepository,
        IRepository<YearMasterEntity, int> yearRepository,
        IRateableValueService rateableValueService,
        IFinanceYearProvider financeYearProvider,
        IPolicyCodeLookupService policyCodeLookup,
        ITaxApplicabilityService taxApplicabilityService,
        IUnitOfWork unitOfWork,
        IRetrospectiveCalculationLock calculationLock,
        ILogger<RetrospectiveTaxCalculationEngineService>? logger = null)
    {
        _ruleRepository = ruleRepository;
        _evidenceConditionRepository = evidenceConditionRepository;
        _dateConditionRepository = dateConditionRepository;
        _actionRepository = actionRepository;
        _penaltyRepository = penaltyRepository;
        _evidenceTypeRepository = evidenceTypeRepository;
        _certificateRepository = certificateRepository;
        _certificateTypeRepository = certificateTypeRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _propertyRepository = propertyRepository;
        _wingDetailsMastRepository = wingDetailsMastRepository;
        _societyRepository = societyRepository;
        _calculationRepository = calculationRepository;
        _calculationDetailRepository = calculationDetailRepository;
        _policyTaxDetailsRepository = policyTaxDetailsRepository;
        _transMastRepository = transMastRepository;
        _yearRepository = yearRepository;
        _rateableValueService = rateableValueService;
        _financeYearProvider = financeYearProvider;
        _policyCodeLookup = policyCodeLookup;
        _taxApplicabilityService = taxApplicabilityService;
        _unitOfWork = unitOfWork;
        _logger = logger;
        // Not optional: the database lock is what keeps two hosts (API instances, the Worker) from calculating one property
        // at the same time. An engine that could run without it would be a billing-correctness hole that only shows up under
        // concurrency, so a host that cannot provide it fails at start-up (see AddRetrospectiveTaxEngine) instead.
        _calculationLock = calculationLock ?? throw new ArgumentNullException(nameof(calculationLock));
    }

    public async Task<RetrospectiveTaxEngineResultDto?> CalculateAndSaveAsync(
        int propertyId, int? calculatedBy, CancellationToken cancellationToken = default)
    {
        // One run per property at a time: a run reads the property's TransMast / PolicyTaxDetails rows, writes its
        // own and deactivates the rest. Two overlapping runs (calculate endpoint + queued pipeline, say) would each
        // miss the other's rows and could leave a CC row and an OC row of the same year both active. The property's
        // retrospective lock (in-process gate, then the database lock that holds across processes) is taken before
        // anything is read, so the second run starts from what the first one saved, and released when the run ends,
        // however it ends.
        //
        // The RV recalculation is the other writer of those rows (RVPersistenceService). Callers that recalculate go
        // through IRetrospectiveTaxRefresher, which takes this same lock around the recalculation AND the run and calls
        // the overload below with the lock it holds; this entry is for callers that run the engine on its own.
        await using var propertyLock = await PropertyCalculationLock.AcquireAsync(propertyId, _calculationLock, cancellationToken);
        return await CalculateAndSaveLockedAsync(propertyId, calculatedBy, cancellationToken);
    }

    public Task<RetrospectiveTaxEngineResultDto?> CalculateAndSaveAsync(
        int propertyId, int? calculatedBy, IRetrospectivePropertyLock heldLock, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(heldLock);
        if (heldLock.PropertyId != propertyId)
        {
            throw new ArgumentException(
                $"The lock held is the one of property {heldLock.PropertyId}, not of property {propertyId}.", nameof(heldLock));
        }

        if (!heldLock.IsHeld)
        {
            throw new InvalidOperationException(
                $"The retrospective lock of property {propertyId} has been released; the calculation must run while it is held.");
        }

        return CalculateAndSaveLockedAsync(propertyId, calculatedBy, cancellationToken);
    }

    /// <summary>The calculation itself; the caller holds the property's retrospective lock.</summary>
    private async Task<RetrospectiveTaxEngineResultDto?> CalculateAndSaveLockedAsync(
        int propertyId, int? calculatedBy, CancellationToken cancellationToken)
    {
        var currentFinanceYear = _financeYearProvider.GetCurrentFinanceYear();

        var evidenceTypes = await _evidenceTypeRepository.GetQueryable().Where(e => e.IsActive).ToListAsync(cancellationToken);
        var evidenceCodeById = evidenceTypes.ToDictionary(e => e.Id, e => e.EvidenceCode, EqualityComparer<int>.Default);

        var evidenceDates = await ResolveEvidenceDatesAsync(propertyId, cancellationToken);
        var constructionYear = await ResolveConstructionYearAsync(propertyId, cancellationToken);
        // Evidence-condition AVAILABLE/UNAVAILABLE checks (THA-08, PCM-06, FUR-03's "Construction
        // year AVAILABLE" condition) need this key present too, not just the TaxStartMode
        // resolution further below.
        evidenceDates["CONSTRUCTION_YEAR"] = constructionYear.HasValue ? new DateTime(constructionYear.Value, 4, 1) : null;

        _logger?.LogInformation(
            "Retrospective engine: PropertyId={PropertyId} evidence dates OC={Oc} CC={Cc} ELECTRICITY={Electricity} CHANGE_DETECTION={ChangeDetection} CONSTRUCTION_YEAR={ConstructionYear}",
            propertyId,
            evidenceDates.GetValueOrDefault("OC"), evidenceDates.GetValueOrDefault("CC"),
            evidenceDates.GetValueOrDefault("ELECTRICITY"), evidenceDates.GetValueOrDefault("CHANGE_DETECTION"),
            evidenceDates.GetValueOrDefault("CONSTRUCTION_YEAR"));

        var match = await FindMatchingRuleAsync(evidenceCodeById, evidenceDates, cancellationToken);
        if (match is null)
        {
            // "Nothing" is not literally true: the sync below still deactivates the property's leftover retro rows,
            // so the log says which part is skipped (new demand) and which still happens (cleanup, counted in the
            // sync summary line).
            _logger?.LogInformation(
                "Retrospective engine: PropertyId={PropertyId} NO rule matched -- no new demand is written; retro rows an earlier run left for this property are still deactivated (see the sync summary line for the counts).",
                propertyId);
            // No rule matches any more (certificate deleted/date cleared since a prior successful
            // run) -- a property that previously had a valid PolicyTaxDetails/TransMast row must not
            // keep showing it now that there is no computation to justify it.
            await SyncPolicyTaxAndTransMastAsync(
                propertyId, currentFinanceYear, new List<RetrospectiveTaxEngineYearDto>(),
                new Dictionary<int, (decimal RateableValue, decimal AnnualRentalValue)>(),
                new Dictionary<int, YearMasterEntity>(), calculatedBy, cancellationToken);
            return null;
        }

        var (rule, action, penalty, dateCondition) = match.Value;
        _logger?.LogInformation(
            "Retrospective engine: PropertyId={PropertyId} matched rule {RuleCode} (RuleId={RuleId}), TaxCalculationMode={Mode}, TaxStartMode={StartMode}, StartEvidenceTypeId={StartEvidence}",
            propertyId, rule.RuleCode, rule.Id, action.TaxCalculationMode, action.TaxStartMode, action.StartEvidenceTypeId);

        var chargeableStart = ResolveChargeableStartDate(
            rule, action, evidenceCodeById, evidenceDates, constructionYear, currentFinanceYear);

        if (chargeableStart is null)
        {
            // Matched rule needs an evidence date that isn't actually available — shouldn't happen
            // if evidence conditions were configured consistently with the tax-start evidence.
            throw new ValidationException(
                "AppliedRuleId",
                $"Rule '{rule.RuleCode}' matched, but its configured TaxStartMode evidence date could not be resolved.",
                OperationType.Update);
        }

        var years = BuildFinancialYears(chargeableStart.Value, currentFinanceYear);
        var earliestChargeableYear = years.Count > 0 ? years[0] : currentFinanceYear;

        var currentYearRateCache = new Dictionary<int, YearBase>();
        // The rateable value and annual rental value each finance year was priced on, so the TransMast /
        // PolicyTaxDetails rows written below can carry them (readers take RV / ALV from those columns).
        var valuesByFinanceYear = new Dictionary<int, (decimal RateableValue, decimal AnnualRentalValue)>();
        var (penaltyPercent, requiresManualReview) = ResolvePenalty(penalty, evidenceCodeById, evidenceDates);

        // An unknown mode is refused, not treated as "the other branch": a typo or a mode added to the database without
        // the engine learning it would otherwise silently bill with the wrong shape.
        var segments = action.TaxCalculationMode switch
        {
            RetrospectiveTaxCalculationModes.CcThenOcMerge =>
                BuildCcThenOcMergeSegments(action, years, earliestChargeableYear, chargeableStart.Value, evidenceCodeById, evidenceDates),
            RetrospectiveTaxCalculationModes.SingleMultiplier or RetrospectiveTaxCalculationModes.Split =>
                BuildDefaultSegments(action, years, earliestChargeableYear, chargeableStart.Value, evidenceCodeById, evidenceDates),
            _ => throw new ValidationException(
                $"{nameof(action)}.{nameof(action.TaxCalculationMode)}",
                $"Rule '{rule.RuleCode}' has an unknown TaxCalculationMode '{action.TaxCalculationMode}' (expected {RetrospectiveTaxCalculationModes.SingleMultiplier}, {RetrospectiveTaxCalculationModes.Split} or {RetrospectiveTaxCalculationModes.CcThenOcMerge}); the calculation was not run.",
                OperationType.Update),
        };

        var yearRows = new List<RetrospectiveTaxEngineYearDto>();
        foreach (var segment in segments)
        {
            var yearEnd = new DateTime(segment.FinanceYear + 1, 3, 31);
            var isFullYear = segment.FromDate == FyStart(segment.FinanceYear) && segment.ToDate == yearEnd;
            // Only a genuinely partial span is prorated against the fixed 365-day basis; a full
            // year keeps factor 1.0 even when it actually spans 366 days (its own FY-start year is
            // a leap year) -- otherwise a full leap finance year would be overcharged by 1/365.
            var prorationFactor = isFullYear
                ? 1m
                : ((segment.ToDate - segment.FromDate).Days + 1) / (decimal)FinanceYearProrationBasisDays;

            var yearBase = await ResolveYearBaseTaxAsync(propertyId, segment.FinanceYear, action.RateMode, currentFinanceYear, currentYearRateCache);
            var fullYearBaseTax = yearBase.Tax;
            valuesByFinanceYear.TryAdd(segment.FinanceYear, (yearBase.RateableValue, yearBase.AnnualRentalValue));
            var baseTax = prorationFactor == 1m
                ? fullYearBaseTax
                : Math.Round(fullYearBaseTax * prorationFactor, 2, MidpointRounding.AwayFromZero);
            var retroTax = Math.Round(baseTax * segment.Multiplier, 2, MidpointRounding.AwayFromZero);
            var penaltyAmount = penaltyPercent.HasValue
                ? Math.Round(retroTax * penaltyPercent.Value / 100m, 2, MidpointRounding.AwayFromZero)
                : 0m;

            yearRows.Add(new RetrospectiveTaxEngineYearDto
            {
                FinancialYear = FormatFinancialYear(segment.FinanceYear),
                FromDate = segment.FromDate,
                ToDate = segment.ToDate,
                RateMode = action.RateMode,
                BaseTaxAmount = baseTax,
                TaxMultiplier = segment.Multiplier,
                RetrospectiveTaxAmount = retroTax,
                PenaltyPercent = penaltyPercent,
                PenaltyAmount = penaltyAmount,
                TotalAmount = retroTax + penaltyAmount,
                PolicyFamily = segment.PolicyFamily
            });
        }

        _logger?.LogInformation(
            "Retrospective engine: PropertyId={PropertyId} chargeableStart={Start:yyyy-MM-dd}, {YearRowCount} year row(s), families={Families}",
            propertyId, chargeableStart.Value, yearRows.Count, string.Join(",", yearRows.Select(y => y.PolicyFamily).Distinct()));

        // Every year just priced needs a row in the year master: the ledger is keyed by it. A year without one used to be
        // skipped when the ledger was written, which left the property's demand understated without anybody being told.
        // It is refused now, before anything of this run is saved (no calculation header, no half-written ledger).
        var yearMasters = await ResolveYearMastersAsync(propertyId, yearRows, cancellationToken);

        var result = await PersistAsync(propertyId, rule, chargeableStart.Value, currentFinanceYear, yearRows, requiresManualReview, calculatedBy, cancellationToken);
        await SyncPolicyTaxAndTransMastAsync(propertyId, currentFinanceYear, yearRows, valuesByFinanceYear, yearMasters, calculatedBy, cancellationToken);
        return result;
    }

    private async Task<Dictionary<string, DateTime?>> ResolveEvidenceDatesAsync(int propertyId, CancellationToken cancellationToken)
    {
        var certificateTypes = await _certificateTypeRepository.GetQueryable().ToListAsync(cancellationToken);
        var certificateTypeById = certificateTypes.ToDictionary(t => t.Id);

        var certificates = await _certificateRepository.GetQueryable()
            .Where(c => c.PropertyId == propertyId && c.IsActive && !c.MarkedForDeletion && c.IssueDate != null)
            .ToListAsync(cancellationToken);

        var result = new Dictionary<string, DateTime?>(StringComparer.OrdinalIgnoreCase);
        foreach (var (evidenceCode, _) in EvidenceToCertificateCode)
        {
            result[evidenceCode] = certificates
                .Where(c => certificateTypeById.TryGetValue(c.CertificateTypeId, out var type)
                    && IsCertificateMatchingEvidence(type, evidenceCode))
                .Select(c => c.IssueDate)
                .OrderByDescending(d => d)
                .FirstOrDefault();
        }

        // A unit with no direct Property-level certificate for a given evidence type may still be
        // covered by a Wing-level or Society-level certificate applying to every unit under it (see
        // PropertyCertificateApplicationService.SaveCertificateAsync, which creates those with no
        // PropertyId of their own) -- fall back to Wing then Society before treating evidence as
        // genuinely unavailable. Only live wing and society rows count: a soft-deleted one (IsActive = 0 or
        // MarkedForDeletion = 1) must not keep contributing the certificates of a wing or a society that no longer exists.
        var missingCodes = EvidenceToCertificateCode.Where(kv => result[kv.Key] is null).ToList();
        if (missingCodes.Count == 0)
        {
            return result;
        }

        var wingDetailId = await _propertyRepository.GetQueryable()
            .Where(p => p.Id == propertyId)
            .Select(p => p.WingDetailId)
            .FirstOrDefaultAsync(cancellationToken);

        int? societyDetailId = null;

        if (wingDetailId.HasValue)
        {
            // A wing that is gone gives neither its own certificates nor its society's.
            societyDetailId = await _wingDetailsMastRepository.GetQueryable()
                .Where(w => w.Id == wingDetailId.Value && w.IsActive && !w.MarkedForDeletion)
                .Select(w => (int?)w.SocietyDetailsMastId)
                .FirstOrDefaultAsync(cancellationToken);

            if (societyDetailId.HasValue)
            {
                var wingCertificates = await _certificateRepository.GetQueryable()
                    .Where(c => c.EntityType == "W" && c.WingDetailId == wingDetailId.Value && c.IsActive && !c.MarkedForDeletion && c.IssueDate != null)
                    .ToListAsync(cancellationToken);

                foreach (var (evidenceCode, _) in missingCodes)
                {
                    result[evidenceCode] = wingCertificates
                        .Where(c => certificateTypeById.TryGetValue(c.CertificateTypeId, out var type)
                            && IsCertificateMatchingEvidence(type, evidenceCode))
                        .Select(c => c.IssueDate)
                        .OrderByDescending(d => d)
                        .FirstOrDefault();
                }
            }
        }
        else
        {
            // No wing -- this may itself be the society's own representative property (e.g. the
            // "apartment society property" with no partition), so resolve society membership that way.
            societyDetailId = await _societyRepository.GetQueryable()
                .Where(s => s.PropertyId == propertyId && s.IsActive && !s.MarkedForDeletion)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        // Fallback: If societyDetailId is not yet resolved, check sibling properties with same WardId and PropertyNo
        if (!societyDetailId.HasValue)
        {
            var targetProp = await _propertyRepository.GetQueryable()
                .Where(p => p.Id == propertyId)
                .Select(p => new { p.WardId, p.PropertyNo })
                .FirstOrDefaultAsync(cancellationToken);

            if (targetProp != null && !string.IsNullOrWhiteSpace(targetProp.PropertyNo))
            {
                var cleanPropNo = targetProp.PropertyNo.Contains('/') ? targetProp.PropertyNo.Split('/')[0].Trim() : targetProp.PropertyNo.Trim();
                var siblingPropertyIds = await _propertyRepository.GetQueryable()
                    .Where(p => p.WardId == targetProp.WardId && (p.PropertyNo == targetProp.PropertyNo || p.PropertyNo == cleanPropNo || (p.PropertyNo != null && (p.PropertyNo.StartsWith(cleanPropNo + "/") || p.PropertyNo.StartsWith(cleanPropNo + "-")))))
                    .Select(p => p.Id)
                    .ToListAsync(cancellationToken);

                if (siblingPropertyIds.Count > 0)
                {
                    societyDetailId = await _societyRepository.GetQueryable()
                        .Where(s => s.PropertyId.HasValue && siblingPropertyIds.Contains(s.PropertyId.Value) && s.IsActive && !s.MarkedForDeletion)
                        .Select(s => (int?)s.Id)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (!societyDetailId.HasValue)
                    {
                        var siblingWingDetailIds = await _propertyRepository.GetQueryable()
                            .Where(p => siblingPropertyIds.Contains(p.Id) && p.WingDetailId.HasValue)
                            .Select(p => p.WingDetailId!.Value)
                            .Distinct()
                            .ToListAsync(cancellationToken);

                        if (siblingWingDetailIds.Count > 0)
                        {
                            societyDetailId = await _wingDetailsMastRepository.GetQueryable()
                                .Where(w => siblingWingDetailIds.Contains(w.Id) && w.IsActive && !w.MarkedForDeletion)
                                .Select(w => (int?)w.SocietyDetailsMastId)
                                .FirstOrDefaultAsync(cancellationToken);
                        }
                    }
                }
            }
        }

        var stillMissingCodes = missingCodes.Where(kv => result[kv.Key] is null).ToList();

        // Every route above ends in a society id, and one read off a wing row has not been checked against the society
        // itself: a society that is gone must not lend its certificates to the units of its (live) wings.
        if (stillMissingCodes.Count > 0
            && societyDetailId is int societyId
            && await _societyRepository.GetQueryable().AnyAsync(s => s.Id == societyId && s.IsActive && !s.MarkedForDeletion, cancellationToken))
        {
            var societyCertificates = await _certificateRepository.GetQueryable()
                .Where(c => c.EntityType == "S" && c.SocietyDetailId == societyId && c.IsActive && !c.MarkedForDeletion && c.IssueDate != null)
                .ToListAsync(cancellationToken);

            foreach (var (evidenceCode, _) in stillMissingCodes)
            {
                result[evidenceCode] = societyCertificates
                    .Where(c => certificateTypeById.TryGetValue(c.CertificateTypeId, out var type)
                        && IsCertificateMatchingEvidence(type, evidenceCode))
                    .Select(c => c.IssueDate)
                    .OrderByDescending(d => d)
                    .FirstOrDefault();
            }
        }

        return result;
    }

    private static bool IsCertificateMatchingEvidence(
        PropertyCertificateTypeMasterEntity? certType,
        string evidenceCode)
    {
        if (certType == null) return false;

        var code = certType.CertificateTypeCode?.Trim() ?? string.Empty;
        var name = certType.CertificateTypeName?.Trim() ?? string.Empty;

        return evidenceCode.ToUpperInvariant() switch
        {
            "CC" => string.Equals(code, "CC", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "BCC", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "BP", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "COMMENCEMENT", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "COMPLETION", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "BUILD_COMPLETION", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "BUILDING_COMPLETION", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "BUILDING_PERMIT", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "PARTIAL_CC", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Commence", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Completion", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Plinth", StringComparison.OrdinalIgnoreCase),

            "OC" => string.Equals(code, "OC", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "OCCUPANCY", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "PARTIAL_OC", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "POSSESSION", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Occupancy", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Possession", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Bhogwata", StringComparison.OrdinalIgnoreCase),

            "ELECTRICITY" => string.Equals(code, "ELECTRIC_BILL", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "ELECTRICITY", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "ELECTRIC", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "EB", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "MSEB", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "MSEDCL", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "POWER", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Electric", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("MSEB", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Light", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Power", StringComparison.OrdinalIgnoreCase),

            "CHANGE_DETECTION" => string.Equals(code, "CHANGE_DETECTION", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "CHANGE", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(code, "DETECTION", StringComparison.OrdinalIgnoreCase)
                    || name.Contains("Change", StringComparison.OrdinalIgnoreCase),

            _ => string.Equals(code, evidenceCode, StringComparison.OrdinalIgnoreCase)
        };
    }

    private async Task<int?> ResolveConstructionYearAsync(int propertyId, CancellationToken cancellationToken)
    {
        var constructionYears = await _propertyDetailsRepository.GetQueryable()
            .Where(d => d.PropertyId == propertyId && !d.MarkedForDeletion)
            .Select(d => d.ConstructionYear)
            .ToListAsync(cancellationToken);

        var parsedYears = constructionYears
            .Select(y => int.TryParse(y, out var parsed) ? parsed : (int?)null)
            .Where(y => y.HasValue)
            .Select(y => y!.Value)
            .ToList();

        return parsedYears.Count > 0 ? parsedYears.Min() : null;
    }

    private async Task<(RetrospectiveRuleMasterEntity Rule, RetrospectiveRuleActionEntity Action, RetrospectivePenaltyRuleEntity? Penalty, RetrospectiveRuleDateConditionEntity? DateCondition)?> FindMatchingRuleAsync(
        Dictionary<int, string> evidenceCodeById,
        Dictionary<string, DateTime?> evidenceDates,
        CancellationToken cancellationToken)
    {
        var rules = await _ruleRepository.GetQueryable()
            .Where(r => r.IsActive && r.RuleStatus == "Active")
            .OrderBy(r => r.IsFallbackRule)
            .ThenBy(r => r.PriorityNo)
            .ToListAsync(cancellationToken);

        if (rules.Count == 0)
            return null;

        var ruleIds = rules.Select(r => r.Id).ToList();

        var evidenceConditions = await _evidenceConditionRepository.GetQueryable()
            .Where(c => ruleIds.Contains(c.RuleId) && c.IsActive)
            .ToListAsync(cancellationToken);
        var dateConditions = await _dateConditionRepository.GetQueryable()
            .Where(c => ruleIds.Contains(c.RuleId) && c.IsActive)
            .ToListAsync(cancellationToken);
        var actions = await _actionRepository.GetQueryable()
            .Where(a => ruleIds.Contains(a.RuleId) && a.IsActive)
            .ToListAsync(cancellationToken);
        var penalties = await _penaltyRepository.GetQueryable()
            .Where(p => ruleIds.Contains(p.RuleId) && p.IsActive)
            .ToListAsync(cancellationToken);

        var evidenceConditionsByRule = evidenceConditions.GroupBy(c => c.RuleId).ToDictionary(g => g.Key, g => g.ToList());
        var dateConditionByRule = dateConditions.GroupBy(c => c.RuleId).ToDictionary(g => g.Key, g => g.First());
        var actionByRule = actions.GroupBy(a => a.RuleId).ToDictionary(g => g.Key, g => g.First());
        var penaltyByRule = penalties.GroupBy(p => p.RuleId).ToDictionary(g => g.Key, g => g.First());

        foreach (var rule in rules)
        {
            if (!actionByRule.TryGetValue(rule.Id, out var action))
                continue; // a rule with no Action section can never be applied — skip it.

            var conditions = evidenceConditionsByRule.TryGetValue(rule.Id, out var c) ? c : new List<RetrospectiveRuleEvidenceConditionEntity>();
            if (!EvaluateEvidenceConditions(conditions, evidenceCodeById, evidenceDates))
                continue;

            var dateCondition = dateConditionByRule.TryGetValue(rule.Id, out var dc) ? dc : null;
            if (!EvaluateDateCondition(dateCondition, evidenceCodeById, evidenceDates))
                continue;

            var penalty = penaltyByRule.TryGetValue(rule.Id, out var p) ? p : null;
            return (rule, action, penalty, dateCondition);
        }

        return null;
    }

    private static DateTime? GetEvidenceDate(Dictionary<string, DateTime?> evidenceDates, string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        if (evidenceDates.TryGetValue(code, out var directDate) && directDate.HasValue) return directDate;

        var norm = code.Trim().ToUpperInvariant();
        if (norm is "OC" or "OCCUPANCY" or "PARTIAL_OC" or "POSSESSION")
            return evidenceDates.GetValueOrDefault("OC") ?? evidenceDates.GetValueOrDefault("OCCUPANCY");
        if (norm is "CC" or "COMMENCEMENT" or "COMPLETION" or "BUILD_COMPLETION" or "BUILDING_COMPLETION" or "BCC" or "BP" or "BUILDING_PERMIT" or "PARTIAL_CC")
            return evidenceDates.GetValueOrDefault("CC") ?? evidenceDates.GetValueOrDefault("COMPLETION") ?? evidenceDates.GetValueOrDefault("COMMENCEMENT");
        if (norm is "ELECTRICITY" or "ELECTRIC_BILL" or "ELECTRIC" or "EB" or "MSEB" or "MSEDCL" or "POWER")
            return evidenceDates.GetValueOrDefault("ELECTRICITY") ?? evidenceDates.GetValueOrDefault("ELECTRIC_BILL");
        if (norm is "CHANGE_DETECTION" or "CHANGE" or "DETECTION")
            return evidenceDates.GetValueOrDefault("CHANGE_DETECTION") ?? evidenceDates.GetValueOrDefault("CHANGE");
        if (norm is "CONSTRUCTION_YEAR" or "CONSTRUCTION")
            return evidenceDates.GetValueOrDefault("CONSTRUCTION_YEAR") ?? evidenceDates.GetValueOrDefault("CONSTRUCTION");

        return null;
    }

    private static bool EvaluateEvidenceConditions(
        List<RetrospectiveRuleEvidenceConditionEntity> conditions,
        Dictionary<int, string> evidenceCodeById,
        Dictionary<string, DateTime?> evidenceDates)
    {
        foreach (var condition in conditions)
        {
            if (!evidenceCodeById.TryGetValue(condition.EvidenceTypeId, out var code))
                continue;

            var date = GetEvidenceDate(evidenceDates, code);
            var isAvailable = date.HasValue;
            if (condition.EvidenceState == "AVAILABLE" && !isAvailable)
                return false;
            if (condition.EvidenceState == "UNAVAILABLE" && isAvailable)
                return false;
        }

        return true;
    }

    private static bool EvaluateDateCondition(
        RetrospectiveRuleDateConditionEntity? condition,
        Dictionary<int, string> evidenceCodeById,
        Dictionary<string, DateTime?> evidenceDates)
    {
        if (condition is null || condition.ComparatorCode == "NONE")
            return true;

        DateTime? ResolveByEvidenceType(int? evidenceTypeId) =>
            evidenceTypeId.HasValue && evidenceCodeById.TryGetValue(evidenceTypeId.Value, out var code)
                ? GetEvidenceDate(evidenceDates, code)
                : null;

        DateTime? EvidenceOrDefault(string code) => GetEvidenceDate(evidenceDates, code);

        switch (condition.ComparatorCode)
        {
            case "ELECTRICITY_BEFORE_CC":
            {
                var left = ResolveByEvidenceType(condition.LeftEvidenceTypeId) ?? EvidenceOrDefault("ELECTRICITY");
                var right = ResolveByEvidenceType(condition.RightEvidenceTypeId) ?? EvidenceOrDefault("CC");
                return left.HasValue && right.HasValue && left.Value < right.Value;
            }
            case "ELECTRICITY_AFTER_CC":
            {
                var left = ResolveByEvidenceType(condition.LeftEvidenceTypeId) ?? EvidenceOrDefault("ELECTRICITY");
                var right = ResolveByEvidenceType(condition.RightEvidenceTypeId) ?? EvidenceOrDefault("CC");
                return left.HasValue && right.HasValue && left.Value > right.Value;
            }
            case "ELECTRICITY_BEFORE_CUTOFF":
            {
                var left = EvidenceOrDefault("ELECTRICITY");
                return left.HasValue && condition.CompareDate.HasValue && left.Value < condition.CompareDate.Value;
            }
            case "ELECTRICITY_AFTER_CUTOFF":
            {
                var left = EvidenceOrDefault("ELECTRICITY");
                return left.HasValue && condition.CompareDate.HasValue && left.Value > condition.CompareDate.Value;
            }
            case "OC_OLDER_THAN_ALLOWED_PERIOD":
            {
                var oc = EvidenceOrDefault("OC");
                return oc.HasValue && condition.CompareYears.HasValue
                    && oc.Value <= DateTime.Now.AddYears(-condition.CompareYears.Value);
            }
            case "OC_WITHIN_ALLOWED_PERIOD":
            {
                var oc = EvidenceOrDefault("OC");
                return oc.HasValue && condition.CompareYears.HasValue
                    && oc.Value > DateTime.Now.AddYears(-condition.CompareYears.Value);
            }
            case "EVIDENCE_GAP_WITHIN_PERIOD":
            {
                // Gap = RightEvidenceTypeId's date minus LeftEvidenceTypeId's date (e.g. OC minus
                // CC) -- a negative or missing gap never satisfies either comparator.
                var left = ResolveByEvidenceType(condition.LeftEvidenceTypeId);
                var right = ResolveByEvidenceType(condition.RightEvidenceTypeId);
                if (!left.HasValue || !right.HasValue || !condition.CompareYears.HasValue || right.Value < left.Value)
                    return false;

                var gapInUnits = CompareGapInUnits((right.Value - left.Value).Days, condition.CompareGapUnit);
                return condition.CompareOperator switch
                {
                    "WITHIN_YEARS" => gapInUnits <= condition.CompareYears.Value,
                    "OLDER_THAN_YEARS" => gapInUnits > condition.CompareYears.Value,
                    _ => false
                };
            }
            default:
                return true;
        }
    }

    /// <summary>Converts a day gap into the configured unit (DAYS/MONTHS/YEARS, default MONTHS).</summary>
    private static int CompareGapInUnits(int gapDays, string? unit) => unit switch
    {
        "DAYS" => gapDays,
        "YEARS" => gapDays / 365,
        _ => gapDays / 30 // MONTHS (default)
    };

    /// <summary>
    /// Resolves the earliest date retrospective tax is chargeable from, per the matched rule's
    /// Action configuration and the master rule's legal statutory cap. TaxStartMode picks the
    /// evidence-driven start; RetrospectiveLimitType (or LegalCapYears) then floors it via MAX().
    /// </summary>
    private static DateTime? ResolveChargeableStartDate(
        RetrospectiveRuleMasterEntity rule,
        RetrospectiveRuleActionEntity action,
        Dictionary<int, string> evidenceCodeById,
        Dictionary<string, DateTime?> evidenceDates,
        int? constructionYear,
        int currentFinanceYear)
    {
        DateTime? startEvidenceDate = action.StartEvidenceTypeId.HasValue
            && evidenceCodeById.TryGetValue(action.StartEvidenceTypeId.Value, out var startCode)
                ? GetEvidenceDate(evidenceDates, startCode)
                : null;

        DateTime? evidenceStart = action.TaxStartMode switch
        {
            "EVIDENCE_DATE" => startEvidenceDate,
            "FY_START" => startEvidenceDate.HasValue ? FyStart(FyOf(startEvidenceDate.Value)) : null,
            "NEXT_FINANCIAL_YEAR" => startEvidenceDate.HasValue ? FyStart(FyOf(startEvidenceDate.Value) + 1) : null,
            "MONTHS_AFTER" => startEvidenceDate?.AddMonths(action.OffsetMonths ?? 0),
            "FIXED_CUTOFF" => action.CutoffDate,
            "CONSTRUCTION_YEAR" => constructionYear.HasValue ? FyStart(constructionYear.Value) : null,
            _ => null // MAX_LOOK_BACK_DATE / CONSTRUCTION_OR_CAP resolved entirely below
        };

        DateTime? limitFloor = action.RetrospectiveLimitType switch
        {
            "MAXIMUM_YEARS" => ResolveMaximumYearsLimitFloor(action, rule, currentFinanceYear),
            "FIXED_CUTOFF_DATE" => action.CutoffDate,
            "NONE" => null,
            _ => rule.LegalCapEnabled && rule.LegalCapYears > 0 ? FyStart(currentFinanceYear - rule.LegalCapYears) : null
        };

        if (action.TaxStartMode == "MAX_LOOK_BACK_DATE")
            return limitFloor ?? FyStart(currentFinanceYear);

        if (action.TaxStartMode == "CONSTRUCTION_OR_CAP")
        {
            DateTime? constructionStart = constructionYear.HasValue ? FyStart(constructionYear.Value) : null;
            // "Construction year or N years, whichever gives fewer retro years" == whichever start
            // date is LATER (more recent) between the construction date and the cap.
            if (constructionStart.HasValue && limitFloor.HasValue)
                return constructionStart.Value > limitFloor.Value ? constructionStart.Value : limitFloor.Value;
            return constructionStart ?? limitFloor;
        }

        if (evidenceStart is null)
            return null;

        return limitFloor.HasValue && limitFloor.Value > evidenceStart.Value ? limitFloor.Value : evidenceStart.Value;
    }

    private static DateTime ResolveMaximumYearsLimitFloor(
        RetrospectiveRuleActionEntity action,
        RetrospectiveRuleMasterEntity rule,
        int currentFinanceYear)
    {
        var years = action.MaximumYears
            ?? (rule.LegalCapEnabled && rule.LegalCapYears > 0 ? rule.LegalCapYears : (int?)null);

        if (!years.HasValue || years.Value <= 0)
        {
            throw new InvalidOperationException(
                $"Retrospective limit type is 'MAXIMUM_YEARS' for rule '{rule.RuleName}' (RuleId: {rule.Id}), but neither MaximumYears nor a valid LegalCapYears is configured.");
        }

        return FyStart(currentFinanceYear - years.Value);
    }

    private static DateTime FyStart(int year) => new(year, 4, 1);

    private static int FyOf(DateTime date) => date.Month >= 4 ? date.Year : date.Year - 1;

    private static List<int> BuildFinancialYears(DateTime chargeableStart, int currentFinanceYear)
    {
        var startFinanceYear = FyOf(chargeableStart);
        var years = new List<int>();
        for (var year = startFinanceYear; year <= currentFinanceYear; year++)
            years.Add(year);
        return years;
    }

    /// <summary>One billed span within a single finance year: a whole year, or (for the earliest
    /// chargeable year, and for the CC/OC merge's boundary year) a partial one.</summary>
    private readonly record struct BillingSegment(int FinanceYear, DateTime FromDate, DateTime ToDate, decimal Multiplier, string PolicyFamily);

    /// <summary>
    /// Maps an evidence code to its PolicyCodes certificate family. A rule with no start evidence at all
    /// (TaxStartMode = CONSTRUCTION_YEAR/MAX_LOOK_BACK_DATE, no StartEvidenceTypeId) resolves to DirectRetro,
    /// not to ElectricBill: such a property has no electricity bill, and the ledger must not say it has.
    /// Any other evidence code that is neither OC nor CC (the electricity bill itself) stays ElectricBill.
    /// </summary>
    private static string ResolvePolicyFamily(string? evidenceCode)
    {
        if (string.IsNullOrWhiteSpace(evidenceCode)) return PolicyCodes.DirectRetro;
        var norm = evidenceCode.Trim().ToUpperInvariant();
        if (norm is "OC" or "OCCUPANCY" or "PARTIAL_OC" or "POSSESSION") return PolicyCodes.Oc;
        if (norm is "CC" or "COMMENCEMENT" or "COMPLETION" or "BUILD_COMPLETION" or "BUILDING_COMPLETION" or "BCC" or "BP" or "BUILDING_PERMIT" or "PARTIAL_CC") return PolicyCodes.Cc;
        return PolicyCodes.ElectricBill;
    }

    /// <summary>
    /// Builds one billing segment per finance year, applying <see cref="ResolveMultiplierForYear"/>
    /// (SINGLE or SPLIT) per year and letting the earliest year start mid-year from
    /// <paramref name="chargeableStart"/> when it falls after that year's 01-Apr.
    /// </summary>
    private static List<BillingSegment> BuildDefaultSegments(
        RetrospectiveRuleActionEntity action, List<int> years, int earliestChargeableYear, DateTime chargeableStart,
        Dictionary<int, string> evidenceCodeById, Dictionary<string, DateTime?> evidenceDates)
    {
        var family = ResolvePolicyFamily(
            action.StartEvidenceTypeId.HasValue && evidenceCodeById.TryGetValue(action.StartEvidenceTypeId.Value, out var code)
                ? code
                : null);

        var segments = new List<BillingSegment>();
        foreach (var year in years)
        {
            var yearStart = FyStart(year);
            var yearEnd = new DateTime(year + 1, 3, 31);
            var fromDate = year == earliestChargeableYear && chargeableStart > yearStart ? chargeableStart : yearStart;
            var multiplier = ResolveMultiplierForYear(action, yearStart, evidenceCodeById, evidenceDates);
            segments.Add(new BillingSegment(year, fromDate, yearEnd, multiplier, family));
        }
        return segments;
    }

    /// <summary>
    /// CC-then-OC merge (TaxCalculationMode = CC_THEN_OC_MERGE): CC (the rule's own TaxStartMode
    /// evidence) governs every full finance year strictly before OC's onset year (SplitMultiplier —
    /// reusing the same field SPLIT mode uses for its "before" multiplier); OC (SplitEndEvidenceTypeId)
    /// governs its own onset year onward (AfterSplitMultiplier). The OC-onset year itself is split
    /// into up to two segments sharing that year: CC's portion from wherever CC's coverage starts in
    /// that year up to the day before OC's date, and OC's portion from OC's date to the year end —
    /// mirroring the legacy engine's ComputeCcThenOcMerge, but expressed as day-prorated segments
    /// instead of a bespoke double-engine-invocation merge.
    /// </summary>
    private static List<BillingSegment> BuildCcThenOcMergeSegments(
        RetrospectiveRuleActionEntity action, List<int> years, int earliestChargeableYear, DateTime chargeableStart,
        Dictionary<int, string> evidenceCodeById, Dictionary<string, DateTime?> evidenceDates)
    {
        var splitDate = action.SplitEndEvidenceTypeId.HasValue
            && evidenceCodeById.TryGetValue(action.SplitEndEvidenceTypeId.Value, out var splitCode)
                ? GetEvidenceDate(evidenceDates, splitCode)
                : null;

        var beforeMultiplier = action.SplitMultiplier ?? action.TaxMultiplier;
        var afterMultiplier = action.AfterSplitMultiplier ?? action.TaxMultiplier;

        var segments = new List<BillingSegment>();

        if (!splitDate.HasValue)
        {
            // The switch-over evidence (OC) isn't actually available -- nothing to merge into, so
            // every year is billed under the "before" (CC) multiplier alone.
            foreach (var year in years)
            {
                var yearStart = FyStart(year);
                var fromDate = year == earliestChargeableYear && chargeableStart > yearStart ? chargeableStart : yearStart;
                segments.Add(new BillingSegment(year, fromDate, new DateTime(year + 1, 3, 31), beforeMultiplier, PolicyCodes.Cc));
            }
            return segments;
        }

        var splitYear = FyOf(splitDate.Value);

        foreach (var year in years)
        {
            var yearStart = FyStart(year);
            var yearEnd = new DateTime(year + 1, 3, 31);
            var yearFromDate = year == earliestChargeableYear && chargeableStart > yearStart ? chargeableStart : yearStart;

            if (year < splitYear)
            {
                segments.Add(new BillingSegment(year, yearFromDate, yearEnd, beforeMultiplier, PolicyCodes.Cc));
            }
            else if (year == splitYear)
            {
                var ccPortionEnd = splitDate.Value.AddDays(-1);
                if (ccPortionEnd >= yearFromDate)
                {
                    segments.Add(new BillingSegment(year, yearFromDate, ccPortionEnd, beforeMultiplier, PolicyCodes.Cc));
                }
                segments.Add(new BillingSegment(year, splitDate.Value, yearEnd, afterMultiplier, PolicyCodes.Oc));
            }
            else
            {
                segments.Add(new BillingSegment(year, yearStart, yearEnd, afterMultiplier, PolicyCodes.Oc));
            }
        }

        return segments;
    }

    private static string FormatFinancialYear(int financeYear) => $"{financeYear}-{(financeYear + 1) % 100:D2}";

    /// <summary>What one finance year's rate preview returns: the year's tax and the values it was priced on.</summary>
    private readonly record struct YearBase(decimal Tax, decimal RateableValue, decimal AnnualRentalValue);

    private async Task<YearBase> ResolveYearBaseTaxAsync(
        int propertyId, int financeYear, string rateMode, int currentFinanceYear, Dictionary<int, YearBase> currentYearCache)
    {
        // Priced with the year's own rates, or with the current year's for every year. Anything else is refused: an unknown
        // or empty mode (legacy data, a client that overwrote it) must not quietly become YEAR_WISE.
        var yearToPrice = rateMode switch
        {
            RetrospectiveRateModes.CurrentYear => currentFinanceYear,
            RetrospectiveRateModes.YearWise => financeYear,
            _ => throw new ValidationException(
                "Action.RateMode",
                $"Unknown RateMode '{rateMode}' (expected {RetrospectiveRateModes.YearWise} or {RetrospectiveRateModes.CurrentYear}); the calculation was not run.",
                OperationType.Update),
        };

        if (currentYearCache.TryGetValue(yearToPrice, out var cached))
            return cached;

        var preview = await _rateableValueService.PreviewTotalTaxAsync(propertyId, yearToPrice);
        var yearBase = new YearBase(preview.TotalTaxAmount, preview.TotalRateableValue, preview.TotalAnnualRentalValue);
        currentYearCache[yearToPrice] = yearBase;
        return yearBase;
    }

    private static decimal ResolveMultiplierForYear(
        RetrospectiveRuleActionEntity action,
        DateTime yearFromDate,
        Dictionary<int, string> evidenceCodeById,
        Dictionary<string, DateTime?> evidenceDates)
    {
        if (action.TaxCalculationMode != RetrospectiveTaxCalculationModes.Split)
            return action.TaxMultiplier;

        DateTime? splitEndDate = action.SplitEndEvidenceTypeId.HasValue
            && evidenceCodeById.TryGetValue(action.SplitEndEvidenceTypeId.Value, out var endCode)
                ? GetEvidenceDate(evidenceDates, endCode)
                : null;

        if (!splitEndDate.HasValue)
            return action.SplitMultiplier ?? action.TaxMultiplier;

        return yearFromDate < splitEndDate.Value
            ? action.SplitMultiplier ?? action.TaxMultiplier
            : action.AfterSplitMultiplier ?? action.TaxMultiplier;
    }

    /// <summary>
    /// Resolves the penalty percent to apply to every charged year, and whether the penalty
    /// condition couldn't be conclusively evaluated (ElseAction = MANUAL_REVIEW) and needs a human
    /// to look at it before the calculation is treated as final.
    /// </summary>
    private static (decimal? PenaltyPercent, bool RequiresManualReview) ResolvePenalty(
        RetrospectivePenaltyRuleEntity? penalty,
        Dictionary<int, string> evidenceCodeById,
        Dictionary<string, DateTime?> evidenceDates)
    {
        if (penalty is null || !penalty.IsPenaltyApplicable || penalty.PenaltyMode == "NONE")
            return (null, false);

        if (penalty.PenaltyMode == "ACT_PENALTY")
            return (penalty.PenaltyPercent, false);

        // DATE_VALIDATION: resolve the source date to check, then compare it against CompareDate/CompareDateTo.
        DateTime? sourceDate = penalty.PenaltyDateSourceType switch
        {
            "EVIDENCE_DATE" => penalty.PenaltyDateEvidenceTypeId.HasValue
                && evidenceCodeById.TryGetValue(penalty.PenaltyDateEvidenceTypeId.Value, out var code)
                    ? GetEvidenceDate(evidenceDates, code)
                    : null,
            "ASSESSMENT_DATE" => DateTime.Now,
            "FIXED_DATE" => penalty.CompareDate,
            _ => null
        };

        var conditionMet = sourceDate.HasValue && penalty.CompareDate.HasValue && (penalty.PenaltyDateCondition switch
        {
            "ON_OR_AFTER" => sourceDate.Value >= penalty.CompareDate.Value,
            "AFTER" => sourceDate.Value > penalty.CompareDate.Value,
            "ON_OR_BEFORE" => sourceDate.Value <= penalty.CompareDate.Value,
            "BEFORE" => sourceDate.Value < penalty.CompareDate.Value,
            "BETWEEN" => penalty.CompareDateTo.HasValue
                && sourceDate.Value >= penalty.CompareDate.Value
                && sourceDate.Value <= penalty.CompareDateTo.Value,
            _ => false
        });

        if (conditionMet)
            return (penalty.PenaltyPercent, false);

        return penalty.ElseAction == "MANUAL_REVIEW" ? (null, true) : (null, false);
    }

    private async Task<RetrospectiveTaxEngineResultDto> PersistAsync(
        int propertyId,
        RetrospectiveRuleMasterEntity rule,
        DateTime chargeableStart,
        int currentFinanceYear,
        List<RetrospectiveTaxEngineYearDto> yearRows,
        bool requiresManualReview,
        int? calculatedBy,
        CancellationToken cancellationToken)
    {
        var now = DateTime.Now;

        var calculation = new RetrospectiveTaxCalculationEntity
        {
            PropertyId = propertyId,
            CalculationMode = "PROPERTY",
            AppliedRuleId = rule.Id,
            AssessmentDate = now,
            ChargeableStartDate = chargeableStart,
            ChargeableEndDate = new DateTime(currentFinanceYear + 1, 3, 31),
            BaseTaxAmount = yearRows.Sum(y => y.BaseTaxAmount),
            RetrospectiveTaxAmount = yearRows.Sum(y => y.RetrospectiveTaxAmount),
            PenaltyAmount = yearRows.Sum(y => y.PenaltyAmount),
            TotalAmount = yearRows.Sum(y => y.TotalAmount),
            CalculationStatus = requiresManualReview ? "ManualReview" : "Calculated",
            IsActive = true,
            CreatedBy = calculatedBy,
            CreatedDate = now
        };
        await _calculationRepository.AddAsync(calculation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var year in yearRows)
        {
            await _calculationDetailRepository.AddAsync(new RetrospectiveTaxCalculationDetailEntity
            {
                CalculationId = calculation.Id,
                PropertyId = propertyId,
                // Property-level aggregate, not split per floor — floor-wise breakup (business
                // point #3: already-taxed vs untaxed area per floor) is deferred pending a
                // property-module data model that doesn't exist yet.
                FloorId = 0,
                FinancialYear = year.FinancialYear,
                FromDate = year.FromDate,
                ToDate = year.ToDate,
                RateMode = year.RateMode,
                PercentageMode = year.RateMode,
                BaseTaxAmount = year.BaseTaxAmount,
                TaxMultiplier = year.TaxMultiplier,
                RetrospectiveTaxAmount = year.RetrospectiveTaxAmount,
                PenaltyPercent = year.PenaltyPercent,
                PenaltyAmount = year.PenaltyAmount,
                TotalAmount = year.TotalAmount,
                IsActive = true,
                CreatedBy = calculatedBy,
                CreatedDate = now
            }, cancellationToken);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new RetrospectiveTaxEngineResultDto
        {
            CalculationId = calculation.Id,
            PropertyId = propertyId,
            AppliedRuleId = rule.Id,
            AppliedRuleCode = rule.RuleCode,
            AppliedRuleName = rule.RuleName,
            ChargeableStartDate = chargeableStart,
            ChargeableEndDate = calculation.ChargeableEndDate.Value,
            // Distinct financial years, not raw row count -- the CC/OC merge's boundary year can
            // contribute two rows (a CC portion and an OC portion) for what is still one year.
            RetroYearCount = yearRows.Select(y => y.FinancialYear).Distinct().Count(),
            TotalBaseTaxAmount = calculation.BaseTaxAmount,
            TotalRetrospectiveTaxAmount = calculation.RetrospectiveTaxAmount,
            TotalPenaltyAmount = calculation.PenaltyAmount,
            GrandTotalAmount = calculation.TotalAmount,
            RequiresManualReview = requiresManualReview,
            YearWiseBreakdown = yearRows
        };
    }

    /// <summary>Full/Partial PolicyCode pair for each certificate family, matching PolicyCodes.cs.</summary>
    private static readonly Dictionary<string, (string Full, string Partial)> FamilyPolicyCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        [PolicyCodes.Oc] = (PolicyCodes.Oc, PolicyCodes.OcPartial),
        [PolicyCodes.Cc] = (PolicyCodes.Cc, PolicyCodes.CcPartial),
        [PolicyCodes.ElectricBill] = (PolicyCodes.ElectricBill, PolicyCodes.ElectricPartial),
        [PolicyCodes.DirectRetro] = (PolicyCodes.DirectRetro, PolicyCodes.DirectRetroPartial),
    };

    /// <summary>
    /// Writes (or cleans up) the property's PolicyTaxDetails/TransMast rows.
    /// <para>
    /// PolicyTaxDetails is current-state only (no FinanceYearId column), so it's still written for
    /// the CURRENT finance year alone, matching the legacy Occupation Tax engine's design.
    /// </para>
    /// <para>
    /// TransMast, by contrast, is PropertyId + FinanceYearId + CalculationType + TaxId keyed — the
    /// single source of tax demand across every year (current, migrated ULB arrears via
    /// PolicyCodes.OldArrears, and retrospective demand). One row is written per (year, TaxId) for
    /// EVERY year in <paramref name="yearRows"/>, not just the current one. Whenever a retro-policy
    /// row is about to become active for a given (FinanceYearId, TaxId), any active OLD_ARREARS row
    /// at that same key is deactivated (IsActive=false only, kept -- not MarkedForDeletion -- for
    /// audit/history) so only one demand stays active per key, matching the "OLD_ARREARS replaced by
    /// retro demand" rule.
    /// </para>
    /// <para>
    /// Each year's total is allocated across the property's existing NETTAX tax HEADS (every NETTAX
    /// PolicyTaxDetails TaxId except TAXTOTAL), proportional to each head's own current NETTAX amount
    /// (largest-remainder rounding to whole rupees; exempt heads get a zero row and take no part in the split,
    /// the year's total already charges them as zero) — a deliberate simplification of the legacy engine's
    /// GeneralTax/Component-count split model, since that model's exact shape is itself an approximation
    /// with no independent verification value here. The same current-state NETTAX weights are reused for
    /// every historical year (there is no per-year historical weighting data to use instead). The TAXTOTAL
    /// row is then written as the SUM of the head amounts, i.e. the year's total, the same shape
    /// RVPersistenceService saves for NETTAX. (TAXTOTAL used to be one of the weighted rows, which gave the
    /// heads only half of the year's total and TAXTOTAL the other half; readers that sum the TAXTOTAL
    /// rows as the retro demand then showed half of the real amount.)
    /// </para>
    /// <paramref name="yearRows"/> empty means "no valid computation" (no rule matched) — every
    /// existing family row for this property, across every year, is deactivated in that case.
    /// </summary>
    private async Task SyncPolicyTaxAndTransMastAsync(
        int propertyId, int currentFinanceYear, List<RetrospectiveTaxEngineYearDto> yearRows,
        IReadOnlyDictionary<int, (decimal RateableValue, decimal AnnualRentalValue)> valuesByFinanceYear,
        IReadOnlyDictionary<int, YearMasterEntity> yearMasters,
        int? updatedBy, CancellationToken cancellationToken)
    {
        var now = DateTime.Now;
        var currentYearLabel = FormatFinancialYear(currentFinanceYear);
        var currentYearRows = yearRows.Where(y => y.FinancialYear == currentYearLabel).OrderBy(y => y.FromDate).ToList();

        var allFamilyCodes = FamilyPolicyCodes.Values.SelectMany(v => new[] { v.Full, v.Partial }).Distinct().ToList();
        var policyCodeIds = await _policyCodeLookup.GetExistingIdsAsync(allFamilyCodes, cancellationToken);
        // Optional: OLD_ARREARS may not be seeded in every environment yet, so a missing code is
        // tolerated (nothing to replace) rather than failing the whole recalculation.
        var oldArrearsPolicyCodeId = (await _policyCodeLookup.GetExistingIdsAsync(new[] { PolicyCodes.OldArrears }, cancellationToken))
            .GetValueOrDefault(PolicyCodes.OldArrears, 0);

        var resolvedCurrentPolicyCodeId = ResolveFamilyPolicyCodeId(currentYearRows, currentFinanceYear, policyCodeIds);
        _logger?.LogInformation(
            "Retrospective engine sync: PropertyId={PropertyId} currentYearRows={CurrentYearRows}, resolvedCurrentPolicyCodeId={PolicyCodeId}, resolvedFamilyCodes={Codes}",
            propertyId, currentYearRows.Count, resolvedCurrentPolicyCodeId, string.Join(",", policyCodeIds.Keys));
        var currentYearTotal = currentYearRows.Count > 0
            ? Math.Round(currentYearRows.Sum(y => y.RetrospectiveTaxAmount), 0, MidpointRounding.AwayFromZero)
            : 0m;

        var nettaxId = await _policyCodeLookup.GetIdAsync(PolicyCodes.NetTax, cancellationToken);
        var netTaxDetails = await LoadNetTaxDetailsAsync(propertyId, nettaxId, cancellationToken);

        // Business decision: certificate demand allocates across the property's current NETTAX
        // rows, so those must exist first. If they don't (RV was never run for this property, or a
        // prior run produced nothing), calculate RV now -- rateable value, then NETTAX -- and retry
        // once, rather than silently writing no certificate demand at all.
        if (netTaxDetails.Count == 0)
        {
            await _rateableValueService.CalculateAndSaveAsync(propertyId, forceRecalculate: true);
            netTaxDetails = await LoadNetTaxDetailsAsync(propertyId, nettaxId, cancellationToken);
        }

        var exemptedTaxIds = await _taxApplicabilityService.GetExemptedTaxIdsAsync(propertyId, cancellationToken);

        // The rateable value and annual rental value to store on the retro rows: the ones the year was priced on
        // (the rate preview's), zero included. Readers (the property comparison cards, search, QC screens, the rule
        // context's building totals) take the property's RV and ALV from CalculationValue / CalculationAnnualValue of
        // the live row, so those columns must carry them (as the NETTAX rows do) and not the tax amount. A year whose
        // computed RV is genuinely zero must show zero, not the property's current NETTAX RV. Every year the engine
        // writes a row for was priced, so valuesByFinanceYear has an entry for it: a missing entry is a bug in this
        // engine, never a reason to write zero.
        (decimal RateableValue, decimal AnnualRentalValue) ValuesFor(int financeYear) =>
            valuesByFinanceYear.TryGetValue(financeYear, out var values)
                ? values
                : throw new InvalidOperationException(
                    $"Retrospective engine invariant broken: property {propertyId} has a row for finance year {financeYear} that was never priced, so its ledger row would carry no rateable value.");

        var allFamilyPolicyCodeIds = policyCodeIds.Values.Distinct().ToList();
        var existingPolicyTaxDetails = await _policyTaxDetailsRepository.GetQueryable()
            .Where(pt => pt.PropertyId == propertyId && (allFamilyPolicyCodeIds.Contains(pt.PolicyCodeId) || (resolvedCurrentPolicyCodeId.HasValue && pt.PolicyCodeId == resolvedCurrentPolicyCodeId.Value)))
            .ToListAsync(cancellationToken);

        // Every family-coded TransMast row this engine owns for this property, across ALL years —
        // the working set for both this run's upserts and the final "not written this run, must be
        // stale" cleanup below. Deliberately excludes OLD_ARREARS rows: those are never touched by
        // that cleanup (an arrears row for a year this run isn't recalculating must stay untouched,
        // not get swept up as "stale"), only by the explicit DeactivateOldArrearsAsync call below,
        // which reads its own separate list.
        var existingTransMasts = await _transMastRepository.GetQueryable()
            .Where(tm => tm.PropertyId == propertyId && tm.CalculationType == "RV" && (allFamilyPolicyCodeIds.Contains(tm.PolicyCodeId) || (resolvedCurrentPolicyCodeId.HasValue && tm.PolicyCodeId == resolvedCurrentPolicyCodeId.Value)))
            .ToListAsync(cancellationToken);

        var existingOldArrears = oldArrearsPolicyCodeId > 0
            ? await _transMastRepository.GetQueryable()
                .Where(tm => tm.PropertyId == propertyId && tm.CalculationType == "RV" && tm.PolicyCodeId == oldArrearsPolicyCodeId && tm.IsActive && !tm.MarkedForDeletion)
                .ToListAsync(cancellationToken)
            : new List<TransMastEntity>();

        // Business decision: unlike PolicyTaxDetails (where the NETTAX row and the certificate row
        // both stay active side by side), TransMast is the single-demand ledger -- a NETTAX row must
        // not stay active once a certificate-policy row occupies its (FinanceYearId, TaxId), or the
        // total-demand sum would double count. Hard removal (MarkedForDeletion = true), not the
        // audit-preserving soft deactivation OLD_ARREARS rows get.
        var existingNetTaxTransMasts = nettaxId > 0
            ? await _transMastRepository.GetQueryable()
                .Where(tm => tm.PropertyId == propertyId && tm.CalculationType == "RV" && tm.PolicyCodeId == nettaxId && tm.IsActive && !tm.MarkedForDeletion)
                .ToListAsync(cancellationToken)
            : new List<TransMastEntity>();

        var changed = false;
        var keepTaxIds = new HashSet<int>(); // PolicyTaxDetails (current-state only)
        // A TransMast retro row is identified by (FinanceYearId, TaxId, PolicyCodeId): PolicyCodeId is part of
        // the key, otherwise a year/tax that switched family (e.g. PARTIAL_CC -> PARTIAL_OC when the OC
        // certificate is added after the CC one) would keep the OLD family's row active next to the new one.
        var keepTransMastKeys = new HashSet<(int FinanceYearId, int TaxId, int PolicyCodeId)>();

        // A year whose demand is 0 (the property's floors cannot be priced for it, or every tax of it is exempt) is billed as
        // nothing: no row of 22 zero tax heads, and, for the current year, no retro row that would take the place of the
        // NETTAX row. The cleanup below then switches off any zero row an earlier run wrote for that year.
        if (resolvedCurrentPolicyCodeId.HasValue && netTaxDetails.Count > 0 && currentYearTotal > 0m)
        {
            if (!yearMasters.TryGetValue(currentFinanceYear, out var currentYearMaster))
            {
                throw new RetrospectiveYearMasterMissingException(propertyId, new[] { currentFinanceYear });
            }

            var (currentRateableValue, currentAnnualRentalValue) = ValuesFor(currentFinanceYear);

            foreach (var (taxId, amount) in BuildYearRows(netTaxDetails, currentYearTotal, exemptedTaxIds))
            {
                keepTaxIds.Add(taxId);

                await UpsertPolicyTaxDetailAsync(existingPolicyTaxDetails, propertyId, resolvedCurrentPolicyCodeId.Value, taxId, amount, currentRateableValue, updatedBy, now, cancellationToken);
                await UpsertTransMastAsync(existingTransMasts, propertyId, currentYearMaster.Id, resolvedCurrentPolicyCodeId.Value, taxId, amount, currentRateableValue, currentAnnualRentalValue, updatedBy, now, cancellationToken);
                await DeactivateOldArrearsAsync(existingOldArrears, oldArrearsPolicyCodeId, currentYearMaster.Id, taxId, updatedBy, now, cancellationToken);
                await DeactivateNetTaxTransMastAsync(existingNetTaxTransMasts, currentYearMaster.Id, taxId, updatedBy, now, cancellationToken);
                keepTransMastKeys.Add((currentYearMaster.Id, taxId, resolvedCurrentPolicyCodeId.Value));
                changed = true;
            }
        }

        // Historical years -- TransMast only (PolicyTaxDetails has no FinanceYearId to hold these).
        foreach (var yearGroup in yearRows.Where(y => y.FinancialYear != currentYearLabel).GroupBy(y => y.FinancialYear))
        {
            if (netTaxDetails.Count == 0) break;

            var financeYear = ParseFinancialYearStart(yearGroup.Key);
            var rows = yearGroup.OrderBy(y => y.FromDate).ToList();
            var resolvedPolicyCodeId = ResolveFamilyPolicyCodeId(rows, financeYear, policyCodeIds);
            if (!resolvedPolicyCodeId.HasValue) continue;

            // Nothing to bill for this year: write no zero rows (see the current year above). Any zero row an earlier run wrote
            // is switched off by the cleanup below, and an OLD_ARREARS row of the year is left alone.
            var yearTotal = Math.Round(rows.Sum(y => y.RetrospectiveTaxAmount), 0, MidpointRounding.AwayFromZero);
            if (yearTotal <= 0m) continue;

            // ResolveYearMastersAsync refused the calculation if any year had no row, so this cannot be missing here; if it
            // ever is, fail instead of skipping the year (a skipped year is demand that silently disappears).
            if (!yearMasters.TryGetValue(financeYear, out var yearMaster))
            {
                throw new RetrospectiveYearMasterMissingException(propertyId, new[] { financeYear });
            }

            var (yearRateableValue, yearAnnualRentalValue) = ValuesFor(financeYear);
            foreach (var (taxId, amount) in BuildYearRows(netTaxDetails, yearTotal, exemptedTaxIds))
            {
                await UpsertTransMastAsync(existingTransMasts, propertyId, yearMaster.Id, resolvedPolicyCodeId.Value, taxId, amount, yearRateableValue, yearAnnualRentalValue, updatedBy, now, cancellationToken);
                await DeactivateOldArrearsAsync(existingOldArrears, oldArrearsPolicyCodeId, yearMaster.Id, taxId, updatedBy, now, cancellationToken);
                await DeactivateNetTaxTransMastAsync(existingNetTaxTransMasts, yearMaster.Id, taxId, updatedBy, now, cancellationToken);
                keepTransMastKeys.Add((yearMaster.Id, taxId, resolvedPolicyCodeId.Value));
                changed = true;
            }
        }

        // Deactivate every existing family row this run did NOT just write — a property that
        // switched families (e.g. was CC, is now OC), or has no valid computation at all, must not
        // keep showing a stale row from a prior run. Scoped across every year, not just current.
        var deactivatedPolicyTaxDetails = 0;
        foreach (var pt in existingPolicyTaxDetails.Where(pt => pt.IsActive && !pt.MarkedForDeletion &&
                     !(resolvedCurrentPolicyCodeId.HasValue && pt.PolicyCodeId == resolvedCurrentPolicyCodeId.Value && keepTaxIds.Contains(pt.TaxId))))
        {
            pt.IsActive = false;
            pt.MarkedForDeletion = true;
            pt.MarkedForDeletionDate = now;
            pt.UpdatedBy = updatedBy;
            pt.UpdatedDate = now;
            await _policyTaxDetailsRepository.UpdateAsync(pt, cancellationToken);
            deactivatedPolicyTaxDetails++;
            changed = true;
        }

        // Same rule for TransMast: a family row stays active only if THIS run wrote it for the same
        // (FinanceYearId, TaxId, PolicyCodeId). A row of another family at the same year/tax (e.g. the
        // PARTIAL_CC left by an earlier run when this run writes PARTIAL_OC) is stale and is deactivated.
        // The existing rows compared against here were read while the property's retrospective lock was held (the
        // engine's own, or the one IRetrospectiveTaxRefresher holds around the RV recalculation and this run), so no
        // other calculation for this property -- in this process or in another -- can write between that read and this
        // cleanup: of two overlapping runs the second one sees the first one's rows.
        var deactivatedTransMast = 0;
        foreach (var tm in existingTransMasts.Where(tm => tm.IsActive && !tm.MarkedForDeletion && !keepTransMastKeys.Contains((tm.FinanceYearId, tm.TaxId, tm.PolicyCodeId))))
        {
            tm.IsActive = false;
            tm.MarkedForDeletion = true;
            tm.MarkedForDeletionDate = now;
            tm.UpdatedBy = updatedBy;
            tm.UpdatedDate = now;
            await _transMastRepository.UpdateAsync(tm, cancellationToken);
            deactivatedTransMast++;
            changed = true;
        }

        if (changed)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // What this run did to the property's rows, so a "NO rule matched" line (cleanup only) and a normal run
        // can both be explained from the log: rows written / kept per (year, tax, policy), and the stale rows
        // deactivated (a family that no longer applies, or every family row when no rule matched).
        _logger?.LogInformation(
            "Retrospective engine sync summary: PropertyId={PropertyId} TransMast rows written or kept={Kept}, stale PolicyTaxDetails rows deactivated={StalePolicyTaxDetails}, stale TransMast rows deactivated={StaleTransMast}, changes saved={Saved}",
            propertyId, keepTransMastKeys.Count, deactivatedPolicyTaxDetails, deactivatedTransMast, changed);
    }

    /// <summary>Resolves the OC/CC/ElectricBill family PolicyCodeId for one year's rows (Full vs Partial by whether the year's first row starts after FY-start), or null if no rows / no configured code.</summary>
    private static int? ResolveFamilyPolicyCodeId(List<RetrospectiveTaxEngineYearDto> yearRows, int financeYear, Dictionary<string, int> policyCodeIds)
    {
        if (yearRows.Count == 0) return null;

        var family = yearRows[^1].PolicyFamily;
        var isPartial = yearRows[0].FromDate > FyStart(financeYear);

        if (FamilyPolicyCodes.TryGetValue(family, out var codes))
        {
            var targetCode = isPartial ? codes.Partial : codes.Full;

            if (policyCodeIds.TryGetValue(targetCode, out var id))
                return id;

            // A database that has not got the DIRECT_RETRO rows yet keeps booking these rules under the electricity-bill
            // codes, as before, instead of writing no demand at all.
            if (string.Equals(family, PolicyCodes.DirectRetro, StringComparison.OrdinalIgnoreCase))
            {
                var legacy = FamilyPolicyCodes[PolicyCodes.ElectricBill];
                if (policyCodeIds.TryGetValue(isPartial ? legacy.Partial : legacy.Full, out var legacyId))
                    return legacyId;
            }
        }

        return null;
    }

    /// <summary>The property's active NETTAX rows, with the TaxMaster loaded so the TAXTOTAL row can be told apart from the tax heads.</summary>
    private Task<List<PolicyTaxDetailsEntity>> LoadNetTaxDetailsAsync(int propertyId, int nettaxId, CancellationToken cancellationToken) =>
        _policyTaxDetailsRepository.GetQueryable()
            .Include(pt => pt.TaxMaster)
            .Where(pt => pt.PropertyId == propertyId && pt.PolicyCodeId == nettaxId && pt.IsActive && !pt.MarkedForDeletion)
            .ToListAsync(cancellationToken);

    private static bool IsTaxTotal(PolicyTaxDetailsEntity row) =>
        string.Equals(row.TaxMaster?.TaxCode, "TAXTOTAL", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// The (TaxId, amount) rows to write for one year: the year's total split across the NETTAX tax heads that are charged,
    /// each exempt head getting a 0 row, followed by the TAXTOTAL row, which is the sum of the head amounts written.
    /// <para>
    /// <paramref name="yearTotal"/> comes from <c>PreviewTotalTaxAsync</c>, which already charges an exempt tax as zero, so
    /// the exempt heads take no part in the split: weighting them by their persisted NETTAX amount (still positive until
    /// the rateable value is recalculated after an applicability change) and zeroing them afterwards would apply the
    /// exemption twice and write a TAXTOTAL lower than the year's demand.
    /// </para>
    /// </summary>
    private static List<(int TaxId, decimal Amount)> BuildYearRows(
        List<PolicyTaxDetailsEntity> netTaxDetails, decimal yearTotal, HashSet<int> exemptedTaxIds)
    {
        var heads = netTaxDetails.Where(d => !IsTaxTotal(d)).ToList();
        var chargedHeads = heads.Where(h => !exemptedTaxIds.Contains(h.TaxId)).ToList();
        var allocated = AllocateAcrossNetTaxIds(chargedHeads, yearTotal);

        var rows = new List<(int TaxId, decimal Amount)>(heads.Count + 1);
        var chargedIndex = 0;
        foreach (var head in heads)
        {
            rows.Add((head.TaxId, exemptedTaxIds.Contains(head.TaxId) ? 0m : allocated[chargedIndex++]));
        }

        var taxTotalRow = netTaxDetails.FirstOrDefault(IsTaxTotal);
        if (taxTotalRow is not null)
        {
            rows.Add((taxTotalRow.TaxId, rows.Sum(r => r.Amount)));
        }

        return rows;
    }

    /// <summary>Largest-remainder allocation of a year's total across the given NETTAX tax heads, proportional to each head's own current NETTAX amount.</summary>
    private static IReadOnlyList<decimal> AllocateAcrossNetTaxIds(List<PolicyTaxDetailsEntity> netTaxDetails, decimal total)
    {
        var weights = netTaxDetails.Select(d => Math.Max(d.TaxAmount ?? 0m, 0m)).ToList();
        var totalWeight = weights.Sum();
        var rawShares = totalWeight > 0m
            ? weights.Select(w => total * (w / totalWeight)).ToList()
            : netTaxDetails.Select(_ => total / netTaxDetails.Count).ToList();
        return AllocateByLargestRemainder(rawShares, total);
    }

    private async Task UpsertPolicyTaxDetailAsync(
        List<PolicyTaxDetailsEntity> existingPolicyTaxDetails, int propertyId, int policyCodeId, int taxId, decimal amount, decimal rateableValue, int? updatedBy, DateTime now, CancellationToken cancellationToken)
    {
        var existingRow = existingPolicyTaxDetails.FirstOrDefault(pt => pt.TaxId == taxId && pt.PolicyCodeId == policyCodeId);
        if (existingRow is not null)
        {
            existingRow.TaxAmount = amount;
            existingRow.CalculationValue = rateableValue; // the property's RV, like the NETTAX rows -- not the tax amount
            existingRow.IsActive = true;
            existingRow.MarkedForDeletion = false;
            existingRow.MarkedForDeletionDate = null;
            existingRow.UpdatedBy = updatedBy;
            existingRow.UpdatedDate = now;
            await _policyTaxDetailsRepository.UpdateAsync(existingRow, cancellationToken);
        }
        else
        {
            existingRow = new PolicyTaxDetailsEntity
            {
                PropertyId = propertyId,
                PolicyCodeId = policyCodeId,
                TaxId = taxId,
                TaxAmount = amount,
                CalculationValue = rateableValue,
                IsActive = true,
                CreatedBy = updatedBy,
                CreatedDate = now
            };
            await _policyTaxDetailsRepository.AddAsync(existingRow, cancellationToken);
            existingPolicyTaxDetails.Add(existingRow);
        }
    }

    private async Task UpsertTransMastAsync(
        List<TransMastEntity> existingTransMasts, int propertyId, int financeYearId, int policyCodeId, int taxId, decimal amount,
        decimal rateableValue, decimal annualRentalValue, int? updatedBy, DateTime now, CancellationToken cancellationToken)
    {
        var existingTm = existingTransMasts.FirstOrDefault(tm => tm.FinanceYearId == financeYearId && tm.TaxId == taxId && tm.PolicyCodeId == policyCodeId);
        if (existingTm is not null)
        {
            // CalculationValue / CalculationAnnualValue are the property's RV / ALV (as on the NETTAX rows), not the tax amount.
            existingTm.CalculationValue = rateableValue;
            existingTm.CalculationAnnualValue = annualRentalValue;
            existingTm.TaxAmount = amount;
            existingTm.IsActive = true;
            existingTm.MarkedForDeletion = false;
            existingTm.MarkedForDeletionDate = null;
            existingTm.UpdatedBy = updatedBy;
            existingTm.UpdatedDate = now;
            await _transMastRepository.UpdateAsync(existingTm, cancellationToken);
        }
        else
        {
            var newTm = new TransMastEntity
            {
                PropertyId = propertyId,
                FinanceYearId = financeYearId,
                CalculationType = "RV",
                CalculationValue = rateableValue,
                CalculationAnnualValue = annualRentalValue,
                TaxId = taxId,
                PolicyCodeId = policyCodeId,
                TaxAmount = amount,
                IsActive = true,
                CreatedBy = updatedBy,
                CreatedDate = now,
                UpdatedBy = updatedBy,
                UpdatedDate = now
            };
            await _transMastRepository.AddAsync(newTm, cancellationToken);
            existingTransMasts.Add(newTm);
        }
    }

    /// <summary>
    /// Deactivates (IsActive=false only, never MarkedForDeletion -- kept for audit/history) an
    /// active OLD_ARREARS TransMast row at the exact (FinanceYearId, TaxId) key a retro-policy row
    /// is about to occupy, so at most one demand stays active per PropertyId+FinanceYearId+TaxId.
    /// No-op if OLD_ARREARS isn't seeded (oldArrearsPolicyCodeId == 0) or no such row exists.
    /// </summary>
    private async Task DeactivateOldArrearsAsync(
        List<TransMastEntity> existingTransMasts, int oldArrearsPolicyCodeId, int financeYearId, int taxId, int? updatedBy, DateTime now, CancellationToken cancellationToken)
    {
        if (oldArrearsPolicyCodeId <= 0) return;

        var oldArrearsRow = existingTransMasts.FirstOrDefault(tm =>
            tm.FinanceYearId == financeYearId && tm.TaxId == taxId && tm.PolicyCodeId == oldArrearsPolicyCodeId
            && tm.IsActive && !tm.MarkedForDeletion);

        if (oldArrearsRow is null) return;

        oldArrearsRow.IsActive = false;
        oldArrearsRow.UpdatedBy = updatedBy;
        oldArrearsRow.UpdatedDate = now;
        await _transMastRepository.UpdateAsync(oldArrearsRow, cancellationToken);
    }

    /// <summary>
    /// Removes (IsActive=false AND MarkedForDeletion=true -- unlike OLD_ARREARS, no audit-preserving
    /// soft state) an active NETTAX TransMast row at the exact (FinanceYearId, TaxId) key a
    /// retro-policy row is about to occupy. TransMast is the single-demand ledger, so NETTAX and a
    /// certificate policy must never both stay active for the same year+tax there -- unlike
    /// PolicyTaxDetails, where the two coexist by design. No-op if NETTAX isn't seeded or no such
    /// row exists.
    /// </summary>
    private async Task DeactivateNetTaxTransMastAsync(
        List<TransMastEntity> existingNetTaxTransMasts, int financeYearId, int taxId, int? updatedBy, DateTime now, CancellationToken cancellationToken)
    {
        var netTaxRow = existingNetTaxTransMasts.FirstOrDefault(tm => tm.FinanceYearId == financeYearId && tm.TaxId == taxId);
        if (netTaxRow is null) return;

        netTaxRow.IsActive = false;
        netTaxRow.MarkedForDeletion = true;
        netTaxRow.MarkedForDeletionDate = now;
        netTaxRow.UpdatedBy = updatedBy;
        netTaxRow.UpdatedDate = now;
        await _transMastRepository.UpdateAsync(netTaxRow, cancellationToken);
    }

    /// <summary>Inverse of FormatFinancialYear -- "2024-25" -> 2024.</summary>
    private static int ParseFinancialYearStart(string financialYearLabel) => int.Parse(financialYearLabel.Split('-')[0]);

    /// <summary>
    /// The year master row of every finance year in <paramref name="yearRows"/> (read once). Throws
    /// <see cref="RetrospectiveYearMasterMissingException"/>, naming all of them, when a year has no row of its own.
    /// </summary>
    private async Task<IReadOnlyDictionary<int, YearMasterEntity>> ResolveYearMastersAsync(
        int propertyId, IEnumerable<RetrospectiveTaxEngineYearDto> yearRows, CancellationToken cancellationToken)
    {
        var financeYears = yearRows.Select(y => ParseFinancialYearStart(y.FinancialYear)).Distinct().OrderBy(y => y).ToList();
        if (financeYears.Count == 0)
        {
            return new Dictionary<int, YearMasterEntity>();
        }

        var allYearMasters = await _yearRepository.GetQueryable().ToListAsync(cancellationToken);
        var resolved = new Dictionary<int, YearMasterEntity>();
        var withoutOwnRow = new List<int>();
        foreach (var financeYear in financeYears)
        {
            var yearMaster = MatchYearMaster(allYearMasters, financeYear);
            if (yearMaster is null)
            {
                withoutOwnRow.Add(financeYear);
            }
            else
            {
                resolved[financeYear] = yearMaster;
            }
        }

        // Two finance years must never end up on one row: the ledger is keyed by (property, year row, tax, policy), so the
        // second year would overwrite the first one's demand and the property would be billed one year short.
        foreach (var shared in resolved.GroupBy(r => r.Value.Id).Where(g => g.Count() > 1))
        {
            withoutOwnRow.AddRange(shared.Select(r => r.Key));
            foreach (var financeYear in shared.Select(r => r.Key))
            {
                resolved.Remove(financeYear);
            }
        }

        if (withoutOwnRow.Count > 0)
        {
            throw new RetrospectiveYearMasterMissingException(propertyId, withoutOwnRow.Distinct().OrderBy(y => y).ToList());
        }

        return resolved;
    }

    /// <summary>
    /// The year master row that belongs to one finance year (the year it starts in), by its start date, its year, or its
    /// year code ("2024-25", "2024/25"). A row that belongs to ANOTHER year is never used instead: the legacy engine
    /// fell back to the next year's row when a year had none, which made two years share one ledger key and hid the
    /// missing row.
    /// </summary>
    private static YearMasterEntity? MatchYearMaster(List<YearMasterEntity> allYearMasters, int financeYear)
    {
        return allYearMasters.FirstOrDefault(y =>
        {
            if (y.StartDate.HasValue && y.StartDate.Value.Year == financeYear) return true;
            if (y.Year == financeYear) return true;
            if (!string.IsNullOrEmpty(y.YearCode))
            {
                var clean = y.YearCode.Trim();
                if (clean.StartsWith($"{financeYear}-") || clean.StartsWith($"{financeYear}/") || clean.StartsWith(financeYear.ToString()))
                    return true;

                var parts = clean.Split('-', '/');
                if (parts.Length > 0 && int.TryParse(parts[0].Trim(), out var startY))
                {
                    if (startY == financeYear) return true;
                    if (startY < 100 && (2000 + startY) == financeYear) return true;
                }
            }
            return false;
        });
    }

    /// <summary>Distributes a rounded whole-rupee total across weighted raw shares so the parts sum exactly.</summary>
    private static IReadOnlyList<decimal> AllocateByLargestRemainder(IReadOnlyList<decimal> rawAmounts, decimal roundedTotal)
    {
        if (rawAmounts.Count == 0)
            return Array.Empty<decimal>();

        var floors = rawAmounts.Select(Math.Floor).ToArray();
        var remainders = rawAmounts.Select((a, i) => a - floors[i]).ToArray();
        var result = (decimal[])floors.Clone();
        var deficit = (int)(roundedTotal - floors.Sum());

        if (deficit > 0)
        {
            foreach (var i in Enumerable.Range(0, rawAmounts.Count).OrderByDescending(i => remainders[i]).Take(deficit))
                result[i] += 1;
        }
        else if (deficit < 0)
        {
            foreach (var i in Enumerable.Range(0, rawAmounts.Count).OrderBy(i => remainders[i]).Take(-deficit))
                result[i] -= 1;
        }

        return result;
    }
}
