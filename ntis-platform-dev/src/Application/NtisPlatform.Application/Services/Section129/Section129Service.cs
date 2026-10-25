using Microsoft.Extensions.Logging;
using MigraDoc.DocumentObjectModel;
using MigraDoc.DocumentObjectModel.Tables;
using MigraDoc.Rendering;
using PdfSharp.Fonts;
using NtisPlatform.Application.DTOs.Section129;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.Section129;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Section129;
using NtisPlatform.Core.Models.Section129;

namespace NtisPlatform.Application.Services.Section129;

/// <summary>
/// Section 129A single-assessment screen: resolves the year-wise stage schedule by walking
/// the PolicyCodeMaster chain (§6 of the design), sources old tax/area/use from
/// PropertyMastOld via PropertyMapDetail (§7), and mirrors the applied amount into TransMast.
/// The service calls <c>IRateableValueService</c> to refresh the current-year 100%/disqualified
/// basis (one-directional, inside RecalculateThroughCurrentYearAsync). In the reverse direction,
/// <c>RateableValueService</c> invokes <see cref="RecalculateAsync(int, bool, CancellationToken)"/>
/// after every RV save for an applied property so staged TransMast and PolicyTaxDetails rows
/// remain synchronised with the new rateable value.
/// </summary>
public class Section129Service : ISection129Service
{
    static Section129Service()
    {
        // PdfSharp/MigraDoc (MIT-licensed) require an explicit font resolver for any
        // non-standard-14 font on a cross-platform build — set once per process.
        if (GlobalFontSettings.FontResolver is not Section129PdfFontResolver)
            GlobalFontSettings.FontResolver = new Section129PdfFontResolver();
    }

    private const string BaseTaxCodePolicyKey = "SECTION129_STAGE_BASE_TAXCODE";
    private const string DefaultBaseTaxCode = "General Tax";

    /// <summary>
    /// SECTION129_STAGE_BASE_TAXCODE is matched against PTIS.TaxMaster.TaxName, which for this ULB's
    /// seed data is "General Tax" (spaced) and "TaxTotal" (NOT spaced, Id=21 — confirmed directly
    /// against the DB; there is no "Tax Total" row) — but the Policy Configuration screen's editable
    /// dropdown/text field lets an officer save the policy value with inconsistent spacing/casing.
    /// Normalizing once right after reading the policy value means every downstream comparison/
    /// TaxMaster lookup sees this exact "TaxTotal" spelling regardless of how the config screen saved it.
    /// </summary>
    private static string NormalizeBaseTaxCode(string? raw)
    {
        var compact = (raw ?? string.Empty).Replace(" ", "", StringComparison.Ordinal).Trim();
        return string.Equals(compact, "TaxTotal", StringComparison.OrdinalIgnoreCase)
            ? "TaxTotal"
            : DefaultBaseTaxCode;
    }

    private static readonly Dictionary<string, decimal> StagePercentages = new(StringComparer.OrdinalIgnoreCase)
    {
        [PolicyCodes.Section129Old1] = 0m,
        [PolicyCodes.Section129Old2] = 0m,
        [PolicyCodes.Section129_20] = 20m,
        [PolicyCodes.Section129_40] = 40m,
        [PolicyCodes.Section129_60] = 60m,
        [PolicyCodes.Section129_80] = 80m,
        [PolicyCodes.Section129Final] = 100m,
    };

    private readonly ISection129Repository _repository;
    private readonly IPolicyConfigurationService _policyConfigurationService;
    private readonly IRateableValueService _rateableValueService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<Section129Service> _logger;

    public Section129Service(
        ISection129Repository repository,
        IPolicyConfigurationService policyConfigurationService,
        IRateableValueService rateableValueService,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider,
        ILogger<Section129Service> logger)
    {
        _repository = repository;
        _policyConfigurationService = policyConfigurationService;
        _rateableValueService = rateableValueService;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    public async Task<Section129ScheduleDto?> GetScheduleAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var header = await _repository.GetPropertyHeaderAsync(propertyId, cancellationToken);
        if (header == null)
            return null;

        var baseTaxCode = NormalizeBaseTaxCode(
            await _policyConfigurationService.GetPolicyValueAsync(BaseTaxCodePolicyKey, DefaultBaseTaxCode, cancellationToken));
        var baseTaxId = await _repository.GetTaxIdByCodeAsync(baseTaxCode, cancellationToken);

        var application = await _repository.GetApplicationAsync(propertyId, cancellationToken);

        // Area Inclusion Date is ward-wide and auto-fetched (WardSection129Master) — Section 129A
        // has no other way to resolve a property's start year for a property's first-ever Apply in
        // this ward. Only block when the property hasn't been applied yet (i.e. this is a fresh
        // search result): once IsApplied is true, the ward date was already validated and used at
        // Apply time, so a since-removed/missing ward row must not also block viewing, recalculating,
        // or exporting a property that already has its own schedule.
        var areaInclusionDate = await _repository.GetWardSection129InclusionDateAsync(header.WardId, cancellationToken);
        if (areaInclusionDate == null && application is not { IsApplied: true })
            throw new InvalidOperationException("Inclusion date not exists for selected property's ward");

        var oldSnapshot = await _repository.GetOldSnapshotAsync(propertyId, baseTaxCode, cancellationToken);
        var oldGpNo = await _repository.GetOldGpNoAsync(propertyId, cancellationToken);
        var areaChanged = application?.AreaChanged ?? false;
        var useChanged = application?.UseChanged ?? false;

        var scheduleRows = await _repository.GetScheduleRowsAsync(propertyId, cancellationToken);

        // The base tax a schedule was actually built against is frozen at the time each row was
        // written — if SECTION129_STAGE_BASE_TAXCODE is changed afterwards, the live config and the
        // schedule's own rows disagree. Surfaced here (not just at Recalculate time) so the screen
        // can show which tax the rule is already applied under, regardless of which action triggered the read.
        string? appliedBaseTaxCode = null;
        if (scheduleRows.Count > 0)
        {
            var existingTaxId = scheduleRows[0].TaxId;
            appliedBaseTaxCode = baseTaxId.HasValue && existingTaxId == baseTaxId.Value
                ? baseTaxCode
                : (string.Equals(baseTaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase) ? "General Tax" : "TaxTotal");
        }

        var activeYear = await _repository.GetActiveFinanceYearAsync(cancellationToken);
        var currentFinanceYearValue = activeYear?.Year ?? 0;
        decimal fullGeneralTax = 0m;
        decimal taxableValue = 0m;
        if (baseTaxId.HasValue && activeYear.HasValue)
        {
            var basisRow = await _repository.GetCurrentBasisTaxRowAsync(propertyId, activeYear.Value.YearMasterId, baseTaxId.Value, cancellationToken);
            fullGeneralTax = basisRow?.TaxAmount ?? 0m;
            taxableValue = basisRow?.CalculationValue ?? 0m;
        }

        // Once Section 129A has actually staged a year, TransMast's own base-tax row no longer holds
        // the regular/full 100% amount — RecalculateThroughCurrentYearAsync overwrites it with the
        // staged (reduced) applicable amount at the same (PropertyId, FinanceYearId, TaxId) key. The
        // persisted schedule row's FullBasisTaxAmount is the one place that snapshot survives
        // untouched, so prefer it here — this is "Municipal Total Tax at 100%" on the screen, and it
        // must never reflect the post-staging TransMast figure.
        var currentScheduleRow = scheduleRows.FirstOrDefault(r => r.IsCurrent);
        if (currentScheduleRow != null)
            fullGeneralTax = currentScheduleRow.FullBasisTaxAmount;

        decimal generalTaxRate = 0m;
        if (baseTaxId.HasValue && header.TypeOfUseId.HasValue && TryParseAssessmentYear(header.AssessmentYear, out var assessmentYearValue))
        {
            var yearRangeId = await _repository.GetYearRangeIdForAssessmentYearAsync(assessmentYearValue, cancellationToken);
            if (yearRangeId.HasValue)
                generalTaxRate = await _repository.GetTaxPercentageAsync(baseTaxId.Value, header.TypeOfUseId.Value, yearRangeId.Value, cancellationToken) ?? 0m;
        }

        var rows = new List<Section129ScheduleRowDto>();
        var srNo = 1;
        foreach (var row in scheduleRows)
        {
            var isDisqualified = row.IsPropertyChangeDisqualified;
            var isOldStage = !isDisqualified && (string.Equals(row.PolicyCode, PolicyCodes.Section129Old1, StringComparison.OrdinalIgnoreCase) ||
                               string.Equals(row.PolicyCode, PolicyCodes.Section129Old2, StringComparison.OrdinalIgnoreCase));

            rows.Add(new Section129ScheduleRowDto
            {
                SrNo = srNo++,
                FinanceYearId = row.FinanceYearId,
                FinancialYear = FormatFinancialYear(row.FinanceYearValue),
                Stage = isDisqualified ? "Regular Assessment" : row.PolicyName,
                MunicipalPct = isDisqualified ? 100m : (isOldStage ? null : row.TaxPercentage),
                StageTax = isDisqualified ? row.FullBasisTaxAmount : row.StageTaxAmount,
                OldGpTax = row.OldTaxAmount,
                ApplicableTax = row.TaxAmount,
                TotalDemand = row.TaxAmount,
                DifferenceFrom100 = isDisqualified ? 0m : row.FullBasisTaxAmount - row.TaxAmount,
                RuleApplied = isDisqualified
                    ? "129A Not Applicable - Property Changed"
                    : row.TaxAmount == row.OldTaxAmount && row.OldTaxAmount >= row.StageTaxAmount
                        ? "Which is More: Old GP Tax"
                        : "Which is More: Municipal Stage Tax",
                Status = row.IsCurrent ? "Current" : row.FinanceYearValue < currentFinanceYearValue ? "Completed" : "Future"
            });
        }

        var policyChain = await _repository.GetSection129PolicyChainAsync(cancellationToken);
        var stages = BuildDynamicStages(policyChain.Values.ToList(), rows);

        var caseStatus = application is not { IsApplied: true }
            ? "NotApplied"
            : rows.Count == 0 ? "Applied" : "Calculated";

        // Area Inclusion Date was already resolved above (and verified non-null) right after the
        // header load. The property's own OC Date is only surfaced once the rule has already been
        // applied; on the very first Apply screen it stays hidden.
        var isApplied = application is { IsApplied: true };
        var ocDate = isApplied ? await _repository.GetOcDateAsync(propertyId, cancellationToken) : null;

        return new Section129ScheduleDto
        {
            PropertyId = propertyId,
            WardId = header.WardId,
            BaseTaxCode = baseTaxCode,
            AppliedBaseTaxCode = appliedBaseTaxCode,
            CurrentFinancialYear = activeYear.HasValue ? FormatFinancialYear(activeYear.Value.Year) : null,
            Upic = header.Upic,
            OldGpNo = oldGpNo,
            OwnerName = header.OwnerName,
            Address = header.MoujaName != null ? $"{header.Address}, {header.MoujaName}" : header.Address,
            UseType = header.UseTypeGroupName ?? string.Empty,
            Zone = header.ZoneDescription != null ? $"Ward {header.WardNo}, {header.ZoneDescription}" : $"Ward {header.WardNo}",
            IsApplied = application?.IsApplied ?? false,
            AssessmentYear = header.AssessmentYear,
            AppliedDate = application?.AppliedDate,
            AreaInclusionDate = areaInclusionDate,
            OcDate = ocDate,
            UseOcDateBasis = application?.UseOcDateBasis ?? false,
            OldTax = oldSnapshot.OldTaxTotal,
            FullGeneralTax = fullGeneralTax,
            TaxableValue = taxableValue,
            GeneralTaxRate = generalTaxRate,
            AreaChanged = areaChanged,
            UseChanged = useChanged,
            OtherStructuralChange = application?.OtherStructuralChange ?? false,
            OtherStructuralChangeEffectiveDate = application?.OtherStructuralChangeEffectiveDate,
            ChangeDetailsRemark = application?.ChangeDetailsRemark,
            CaseStatus = caseStatus,
            Remarks = application?.Remark,
            Rows = rows,
            Stages = stages
        };
    }

    /// <summary>
    /// Resolves the officer-entered "Old Gram Panchayat Number" search box to a property and
    /// returns its schedule — same reverse-lookup shape as the UPIC search, but matched against
    /// PropertyMastOld.OldEgovNo. Accepts a comma-separated list of old GP numbers (an officer may
    /// paste more than one for a merged property) as well as a single value; matches if ANY of the
    /// given values corresponds to a mapped old row. Returns null when nothing matches.
    /// </summary>
    public async Task<Section129OldGpNoSearchResultDto> SearchByOldGpNoAsync(string oldGpNoRaw, CancellationToken cancellationToken = default)
    {
        var candidates = (oldGpNoRaw ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (candidates.Count == 0)
            return Section129OldGpNoSearchResultDto.NotFound;

        var lookup = await _repository.GetPropertyIdByOldGpNoAsync(candidates, cancellationToken);
        switch (lookup.Status)
        {
            case Section129OldGpNoLookupStatus.Ambiguous:
                return Section129OldGpNoSearchResultDto.Ambiguous;
            case Section129OldGpNoLookupStatus.NotMapped:
                return Section129OldGpNoSearchResultDto.NotMapped;
            case Section129OldGpNoLookupStatus.NotFound:
                return Section129OldGpNoSearchResultDto.NotFound;
        }

        if (lookup.PropertyId == null)
            return Section129OldGpNoSearchResultDto.NotFound;

        var schedule = await GetScheduleAsync(lookup.PropertyId.Value, cancellationToken);
        return schedule == null ? Section129OldGpNoSearchResultDto.NotFound : Section129OldGpNoSearchResultDto.Found(schedule);
    }

    public async Task<List<Section129WardPropertyOptionDto>> GetWardPropertiesAsync(int wardId, CancellationToken cancellationToken = default)
    {
        var rows = await _repository.GetWardPropertiesAsync(wardId, cancellationToken);
        return rows.Select(r => new Section129WardPropertyOptionDto
        {
            PropertyId = r.PropertyId,
            PropertyNo = r.PropertyNo,
            PartitionNo = r.PartitionNo,
            Upic = r.Upic
        }).ToList();
    }

    private static List<Section129StageDto> BuildDynamicStages(List<PolicyCodeMasterEntity> policyCodes, List<Section129ScheduleRowDto> rows)
    {
        var result = new List<Section129StageDto>();
        var currentStageRow = rows.FirstOrDefault(r => string.Equals(r.Status, "Current", StringComparison.OrdinalIgnoreCase));

        bool hasOldGpStep = false;
        int ordinal = 3;

        var orderedPolicies = policyCodes.OrderBy(p => p.DisplayOrder).ToList();

        foreach (var policy in orderedPolicies)
        {
            var code = policy.PolicyCode ?? string.Empty;
            if (code.StartsWith("SECTION_129_OLD_", StringComparison.OrdinalIgnoreCase))
            {
                if (hasOldGpStep)
                    continue;

                hasOldGpStep = true;
                bool isOldCurrent = currentStageRow != null &&
                    (currentStageRow.MunicipalPct == null || currentStageRow.MunicipalPct == 0m);
                bool isOldCompleted = currentStageRow != null &&
                    currentStageRow.MunicipalPct != null && currentStageRow.MunicipalPct > 0m;

                result.Add(new Section129StageDto
                {
                    Code = "OLD_GP",
                    DisplayName = "Old GP",
                    Subtitle = "First 2 financial years",
                    Percentage = 0m,
                    IsCurrent = isOldCurrent,
                    IsCompleted = isOldCompleted
                });
                continue;
            }

            decimal pct = GetStagePercentage(code);

            string displayName = pct > 0m ? $"{pct:G29}%" : policy.PolicyName;
            string subtitle = policy.IsFinalStage ? "Thereafter" : GetYearOrdinalLabel(ordinal++);

            bool isCurrent = currentStageRow != null && currentStageRow.MunicipalPct == pct;
            bool isCompleted = currentStageRow != null && currentStageRow.MunicipalPct != null && currentStageRow.MunicipalPct > pct;

            result.Add(new Section129StageDto
            {
                Code = code,
                DisplayName = displayName,
                Subtitle = subtitle,
                Percentage = pct,
                IsCurrent = isCurrent,
                IsCompleted = isCompleted
            });
        }

        return result;
    }

    private static string GetYearOrdinalLabel(int ordinal)
    {
        return ordinal switch
        {
            1 => "First year",
            2 => "Second year",
            3 => "Third year",
            4 => "Fourth year",
            5 => "Fifth year",
            6 => "Sixth year",
            7 => "Seventh year",
            8 => "Eighth year",
            _ => $"{ordinal}th year"
        };
    }

    public async Task<Section129ScheduleDto?> ApplyAsync(int propertyId, Section129ApplyRequestDto request, CancellationToken cancellationToken = default)
    {
        var header = await _repository.GetPropertyHeaderAsync(propertyId, cancellationToken);
        if (header == null)
            return null;

        var now = _timeProvider.GetLocalNow().DateTime;

        ValidateChangeFacts(
            request.AreaChanged, request.UseChanged, request.OtherStructuralChange,
            request.OtherStructuralChangeEffectiveDate, request.ChangeDetailsRemark);

        var scheduleRowsExisted = (await _repository.GetScheduleRowsAsync(propertyId, cancellationToken)).Count > 0;

        var basisBlocked = await CheckBasisCalculatedAsync(propertyId, scheduleRowsExisted, cancellationToken);
        if (basisBlocked != null)
            return basisBlocked;

        var application = await _repository.GetOrCreateApplicationAsync(propertyId, now, cancellationToken);
        application.IsApplied = true;
        application.AppliedDate = now;
        application.AreaChanged = request.AreaChanged;
        application.UseChanged = request.UseChanged;
        application.OtherStructuralChange = request.OtherStructuralChange;
        application.OtherStructuralChangeEffectiveDate = request.OtherStructuralChangeEffectiveDate;
        application.ChangeDetailsRemark = request.ChangeDetailsRemark;
        application.Remark = request.Remarks;

        // The OC-Date checkbox. A flip wipes any existing schedule and re-freezes the start year from
        // the new anchor (see SwitchBasisAsync).
        var basisSwitched = await SwitchBasisAsync(application, header.WardId, request.UseOcDateBasis, scheduleRowsExisted, now, cancellationToken);

        if (request.StartFinanceYearIdOverride.HasValue)
            application.StartFinanceYearIdOverride = request.StartFinanceYearIdOverride;

        // First-ever Apply (no override given, no schedule rows written yet): resolve the Section
        // 129A start year from the ward-wide Area Inclusion Date (auto-fetched, not officer-entered)
        // and freeze it into StartFinanceYearIdOverride so every later recalculation (bulk, single,
        // or RV-engine-triggered) keeps using this same start year without re-resolving it.
        if (!basisSwitched && !application.StartFinanceYearIdOverride.HasValue && !scheduleRowsExisted)
        {
            var anchorDate = await ResolveBasisDateAsync(propertyId, header.WardId, application.UseOcDateBasis, cancellationToken);
            var resolvedStartYearId = await ResolveStartYearIdFromDateAsync(anchorDate, cancellationToken);
            if (resolvedStartYearId.HasValue)
                application.StartFinanceYearIdOverride = resolvedStartYearId;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Sweep any pre-existing OLD_ARREARS pending-dues rows at/after the resolved start year
        // into a single consolidated bucket at (startYear - 1) before the fill-forward loop writes
        // its own Section129-stage rows starting at the start year — idempotent, safe to run on
        // every Apply (a re-run after the sweep already happened finds nothing left to sweep).
        if (application.StartFinanceYearIdOverride.HasValue)
        {
            var startYearValue = await _repository.GetFinanceYearValueAsync(application.StartFinanceYearIdOverride.Value, cancellationToken);
            if (startYearValue.HasValue)
            {
                await _repository.SweepPreStartYearOldArrearsAsync(propertyId, startYearValue.Value, now, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        // A re-Apply on a property that already had a schedule (and no basis flip) refreshes through
        // the RV engine like a manual Recalculate does; after a basis flip the rows were wiped, so
        // there is no stale staged basis left and the schedule is rebuilt from scratch.
        await RebuildScheduleAsync(
            propertyId, header, application,
            scheduleRowsExisted: scheduleRowsExisted || basisSwitched,
            now, cancellationToken);

        return await GetScheduleAsync(propertyId, cancellationToken);
    }

    public Task<Section129ScheduleDto?> RecalculateAsync(int propertyId, CancellationToken cancellationToken = default)
        => RecalculateCoreAsync(propertyId, request: null, isFromRateableValueService: false, cancellationToken);

    public Task<Section129ScheduleDto?> RecalculateAsync(
        int propertyId,
        Section129RecalculateRequestDto? request,
        CancellationToken cancellationToken = default)
        => RecalculateCoreAsync(propertyId, request, isFromRateableValueService: false, cancellationToken);

    public Task<Section129ScheduleDto?> RecalculateAsync(
        int propertyId,
        bool isFromRateableValueService,
        CancellationToken cancellationToken = default)
        => RecalculateCoreAsync(propertyId, request: null, isFromRateableValueService, cancellationToken);

    private async Task<Section129ScheduleDto?> RecalculateCoreAsync(
        int propertyId,
        Section129RecalculateRequestDto? request,
        bool isFromRateableValueService,
        CancellationToken cancellationToken)
    {
        var header = await _repository.GetPropertyHeaderAsync(propertyId, cancellationToken);
        if (header == null)
            return null;

        var application = await _repository.GetApplicationAsync(propertyId, cancellationToken);
        if (application == null || !application.IsApplied)
        {
            return await GetScheduleAsync(propertyId, cancellationToken);
        }

        var now = _timeProvider.GetLocalNow().DateTime;

        // The RV engine's own post-save hook: re-sync the schedule from the NETTAX basis it just
        // wrote. Never forces another RV run (that is what triggered this call) and never takes
        // officer input.
        if (isFromRateableValueService)
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                await RecalculateThroughCurrentYearAsync(propertyId, header, application, now, isFromRateableValueService: true, cancellationToken);
                await _unitOfWork.CommitTransactionAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync(cancellationToken);
                _logger.LogError(ex, "Section 129A recalculation failed for PropertyId={PropertyId}", propertyId);
                throw;
            }

            return await GetScheduleAsync(propertyId, cancellationToken);
        }

        var scheduleRowsExisted = (await _repository.GetScheduleRowsAsync(propertyId, cancellationToken)).Count > 0;

        // SECTION129_STAGE_BASE_TAXCODE may have been changed (General Tax <-> Tax Total) after this
        // property's schedule was already built — GetScheduleAsync's AppliedBaseTaxCode reflects
        // what the existing rows are actually staged against, vs BaseTaxCode (the live config).
        // Recalculating now would start writing new years under the NEW base tax while every prior
        // year stays under the OLD one — the same property's schedule would end up straddling two
        // different anchor tax heads. Block and tell the officer which one the rule is already
        // applied under, instead of silently mixing them.
        if (scheduleRowsExisted)
        {
            var preview = await GetScheduleAsync(propertyId, cancellationToken);
            if (preview != null && preview.AppliedBaseTaxCode != null &&
                !string.Equals(preview.AppliedBaseTaxCode, preview.BaseTaxCode, StringComparison.OrdinalIgnoreCase))
            {
                preview.RecalculateBlockedReason = "BaseTaxCodeChanged";
                return preview;
            }
        }

        if (request != null)
        {
            ValidateChangeFacts(
                request.AreaChanged, request.UseChanged, request.OtherStructuralChange,
                request.OtherStructuralChangeEffectiveDate, request.ChangeDetailsRemark);
        }

        var basisBlocked = await CheckBasisCalculatedAsync(propertyId, scheduleRowsExisted, cancellationToken);
        if (basisBlocked != null)
            return basisBlocked;

        // Persist the officer's Property-Change-Check edits and OC-Date checkbox first, so they
        // actually take effect on this recalculation instead of being silently ignored.
        var basisSwitched = false;
        if (request != null)
        {
            application.AreaChanged = request.AreaChanged;
            application.UseChanged = request.UseChanged;
            application.OtherStructuralChange = request.OtherStructuralChange;
            application.OtherStructuralChangeEffectiveDate = request.OtherStructuralChangeEffectiveDate;
            application.ChangeDetailsRemark = request.ChangeDetailsRemark;

            basisSwitched = await SwitchBasisAsync(application, header.WardId, request.UseOcDateBasis, scheduleRowsExisted, now, cancellationToken);
        }

        application.UpdatedDate = now;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // After a basis flip the start year moved, so re-run the OLD_ARREARS sweep against it
        // (idempotent — a no-op when nothing sits at/after the new start year).
        if (basisSwitched && application.StartFinanceYearIdOverride.HasValue)
        {
            var startYearValue = await _repository.GetFinanceYearValueAsync(application.StartFinanceYearIdOverride.Value, cancellationToken);
            if (startYearValue.HasValue)
            {
                await _repository.SweepPreStartYearOldArrearsAsync(propertyId, startYearValue.Value, now, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        // The wipe left no staged rows behind, so a basis flip is rebuilt through the same RV-refresh
        // path as any other already-applied property (it just starts from an empty schedule).
        await RebuildScheduleAsync(
            propertyId, header, application,
            scheduleRowsExisted: scheduleRowsExisted || basisSwitched,
            now, cancellationToken);

        return await GetScheduleAsync(propertyId, cancellationToken);
    }

    /// <summary>
    /// Builds the same CSV the single-assessment screen's client used to build locally (see
    /// legacy `handleExportCsv`/`toCsv` in the frontend): header rows (UPIC, Owner, blank line,
    /// column titles) followed by one row per schedule row — identical columns, values and
    /// formatting, now produced server-side from the authoritative schedule instead of whatever
    /// happened to already be in the browser's state.
    /// </summary>
    public async Task<string?> GetScheduleCsvAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var schedule = await GetScheduleAsync(propertyId, cancellationToken);
        if (schedule == null)
            return null;

        var lines = new List<string>
        {
            CsvRow("UPIC", schedule.Upic),
            CsvRow("Owner", schedule.OwnerName),
            string.Empty,
            CsvRow("Financial Year", "Stage", "Percentage", "Calculated Stage Tax", "Old GP General Tax",
                "Applicable General Tax", "Total Demand", "Difference from 100%", "Status")
        };

        foreach (var row in schedule.Rows)
        {
            var pctLabel = row.MunicipalPct == null ? "—" : $"{FormatCsvNumber(row.MunicipalPct.Value)}%";
            lines.Add(CsvRow(
                row.FinancialYear,
                row.Stage,
                pctLabel,
                FormatCsvNumber(row.StageTax),
                FormatCsvNumber(row.OldGpTax),
                FormatCsvNumber(row.ApplicableTax),
                FormatCsvNumber(row.TotalDemand),
                FormatCsvNumber(row.DifferenceFrom100),
                row.Status));
        }

        return string.Join("\n", lines);
    }

    private static string CsvRow(params string[] values)
        => string.Join(",", values.Select(v => $"\"{v.Replace("\"", "\"\"")}\""));

    /// <summary>
    /// Builds the Section 129A year-wise schedule as an A4-landscape PDF (server-side, via
    /// PdfSharp/MigraDoc — MIT-licensed, no revenue-tiered dual license), or null when the
    /// property doesn't exist. The header row is marked as MigraDoc's <c>HeadingFormat</c> so it
    /// repeats on every page, and each data row disables splitting across a page boundary.
    /// </summary>
    public async Task<byte[]?> GetSchedulePdfAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var schedule = await GetScheduleAsync(propertyId, cancellationToken);
        if (schedule == null)
            return null;

        var isTaxTotal = string.Equals(schedule.BaseTaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase);

        var document = new Document();
        document.Info.Title = "Section 129A General Tax Schedule";

        var normalStyle = document.Styles[StyleNames.Normal]!;
        normalStyle.Font.Name = Section129PdfFontResolver.FamilyName;
        normalStyle.Font.Size = 8;

        var section = document.AddSection();
        section.PageSetup.Orientation = Orientation.Landscape;
        section.PageSetup.PageFormat = PageFormat.A4;
        section.PageSetup.TopMargin = Unit.FromCentimeter(1.2);
        section.PageSetup.BottomMargin = Unit.FromCentimeter(1.2);
        section.PageSetup.LeftMargin = Unit.FromCentimeter(1);
        section.PageSetup.RightMargin = Unit.FromCentimeter(1);

        var title = section.AddParagraph("Section 129A Year-wise Assessment Schedule");
        title.Format.Font.Size = 14;
        title.Format.Font.Bold = true;
        title.Format.Alignment = ParagraphAlignment.Center;
        title.Format.SpaceAfter = Unit.FromPoint(2);

        var subtitleText = string.Join(" — ", new[] { schedule.Upic, schedule.OwnerName, schedule.Address }
            .Where(s => !string.IsNullOrWhiteSpace(s)));
        if (!string.IsNullOrWhiteSpace(subtitleText))
        {
            var subtitle = section.AddParagraph(subtitleText);
            subtitle.Format.Font.Size = 9;
            subtitle.Format.Font.Color = Colors.DimGray;
            subtitle.Format.Alignment = ParagraphAlignment.Center;
            subtitle.Format.SpaceAfter = Unit.FromPoint(10);
        }

        var table = section.AddTable();
        table.Borders.Width = 0.5;
        table.Borders.Color = Color.FromRgb(209, 213, 219);
        table.Rows.LeftIndent = 0;

        var columnWidths = new (string Header, double WidthPt)[]
        {
            ("Sr. No.", 30),
            ("Financial Year", 55),
            ("Stage", 90),
            (isTaxTotal ? "Municipal Total Tax %" : "Municipal Tax %", 55),
            ("Calculated Stage Tax", 65),
            (isTaxTotal ? "Old GP Total Tax" : "Old GP Tax", 65),
            (isTaxTotal ? "Applicable Total Tax" : "Applicable Tax", 65),
            ("Total Demand", 65),
            ("Difference from 100%", 65),
            ("Rule Applied", 110),
            ("Status", 55),
        };

        foreach (var (_, widthPt) in columnWidths)
            table.AddColumn(Unit.FromPoint(widthPt));

        var headerRow = table.AddRow();
        headerRow.HeadingFormat = true; // repeats on every page
        headerRow.Format.Font.Bold = true;
        headerRow.Format.Font.Color = Colors.White;
        headerRow.Format.Alignment = ParagraphAlignment.Center;
        headerRow.Shading.Color = Color.FromRgb(79, 70, 229);
        for (var i = 0; i < columnWidths.Length; i++)
            headerRow.Cells[i].AddParagraph(columnWidths[i].Header);

        for (var rowIndex = 0; rowIndex < schedule.Rows.Count; rowIndex++)
        {
            var row = schedule.Rows[rowIndex];
            var dataRow = table.AddRow();
            // No KeepWith here: MigraDoc already keeps each row's own (possibly wrapped) content
            // together without it. Chaining KeepWith across every row instead glues the WHOLE
            // table into one unbreakable block — once that doesn't fit the remaining space on the
            // current page, MigraDoc defers the entire block to the next page, leaving the
            // current one blank (and, separately, throws if KeepWith is left set on the very last
            // row — TableRenderer.CalcLastConnectedRowDirect looks one row past the table's end).
            dataRow.Format.Alignment = ParagraphAlignment.Center;
            if (rowIndex % 2 != 0)
                dataRow.Shading.Color = Color.FromRgb(249, 250, 251);

            var pctLabel = row.MunicipalPct == null ? "—" : $"{FormatCsvNumber(row.MunicipalPct.Value)}%";
            var values = new[]
            {
                row.SrNo.ToString(),
                row.FinancialYear,
                row.Stage,
                pctLabel,
                FormatCsvNumber(row.StageTax),
                FormatCsvNumber(row.OldGpTax),
                FormatCsvNumber(row.ApplicableTax),
                FormatCsvNumber(row.TotalDemand),
                FormatCsvNumber(row.DifferenceFrom100),
                row.RuleApplied,
                row.Status,
            };
            for (var i = 0; i < values.Length; i++)
                dataRow.Cells[i].AddParagraph(values[i]);
        }

        var renderer = new PdfDocumentRenderer { Document = document };
        renderer.RenderDocument();

        using var ms = new MemoryStream();
        renderer.PdfDocument.Save(ms, false);
        return ms.ToArray();
    }

    /// <summary>
    /// Mirrors JavaScript's default Number-to-string conversion (no forced decimal places, no
    /// trailing zeros, no thousands separators) so the CSV's numeric cells look exactly like the
    /// ones the frontend used to produce directly from the JSON-deserialized row values.
    /// </summary>
    private static string FormatCsvNumber(decimal value) => ((double)value).ToString(System.Globalization.CultureInfo.InvariantCulture);

    /// <summary>
    /// The fill-forward loop (§6/Lifecycle §3): finds the last resolved stage on file (or seeds
    /// SECTION_129_OLD_1 at the property's start year when none exists yet), then walks
    /// ResolveNextStage one finance year at a time through the current finance year, writing
    /// PropertySection129Schedule + TransMast for every year in between. <paramref name="now"/> is
    /// the single timestamp for every row this call writes.
    /// </summary>
    private async Task RecalculateThroughCurrentYearAsync(
        int propertyId,
        Section129PropertyHeaderRow header,
        PropertySection129ApplicationEntity application,
        DateTime now,
        bool isFromRateableValueService = false,
        CancellationToken cancellationToken = default)
    {
        var baseTaxCode = NormalizeBaseTaxCode(
            await _policyConfigurationService.GetPolicyValueAsync(BaseTaxCodePolicyKey, DefaultBaseTaxCode, cancellationToken));
        var baseTaxId = await _repository.GetTaxIdByCodeAsync(baseTaxCode, cancellationToken)
            ?? throw new InvalidOperationException($"TaxMaster code '{baseTaxCode}' (from PolicyConfiguration '{BaseTaxCodePolicyKey}') not found.");

        var chain = await _repository.GetSection129PolicyChainAsync(cancellationToken);
        var chainByCode = chain.Values.ToDictionary(c => c.PolicyCode, StringComparer.OrdinalIgnoreCase);

        if (!chainByCode.TryGetValue(PolicyCodes.Section129Old1, out var seedPolicyCode))
            throw new InvalidOperationException($"PolicyCodeMaster row '{PolicyCodes.Section129Old1}' not found — seed this master data first.");

        var activeYear = await _repository.GetActiveFinanceYearAsync(cancellationToken);
        if (activeYear == null)
        {
            _logger.LogWarning("No CORE.YearMaster row is flagged IsActive=1; Section 129A recalculation skipped for PropertyId={PropertyId}", propertyId);
            return;
        }
        var currentFinanceYearValue = activeYear.Value.Year;
        var currentYearMasterId = activeYear.Value.YearMasterId;

        var existingRows = await _repository.GetScheduleRowsAsync(propertyId, cancellationToken);

        // Defense in depth: RecalculateCoreAsync's manual (officer-facing) path already blocks this
        // with a friendly RecalculateBlockedReason before ever reaching here, but the RV-engine's own
        // post-save hook (isFromRateableValueService=true) calls straight into this method with no
        // earlier gate. If SECTION129_STAGE_BASE_TAXCODE changed since this property's schedule was
        // built, fail loudly rather than silently writing new years under a different base tax than
        // every prior year — mixing anchors mid-schedule would corrupt it. Propagates to fail the
        // triggering RV/"Add Taxes" run, same as every other hard failure in this method.
        if (existingRows.Count > 0 && existingRows[0].TaxId != baseTaxId)
        {
            var existingBaseTaxCode = string.Equals(baseTaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase)
                ? "General Tax" : "TaxTotal";
            throw new InvalidOperationException(
                $"Section 129A is already applied for PropertyId={propertyId} using '{existingBaseTaxCode}', but the " +
                $"configured SECTION129_STAGE_BASE_TAXCODE is now '{baseTaxCode}'. Recalculation is blocked to avoid " +
                "mixing bases within the same schedule.");
        }

        var yearsToWrite = new List<(int YearValue, PolicyCodeMasterEntity PolicyCode)>();
        PolicyCodeMasterEntity lastPolicyCode;
        int nextYearValue;

        // Past years already on file whose disqualified flag no longer matches the officer's current
        // Property-Change-Check facts (e.g. Area/Use/Other Change just set to Yes with an effective
        // date in 2020, or just set back to No). The additive loop below never revisits a year before
        // the last one written, so without this a change effective in an earlier year would only ever
        // reach the current year. Each stale year is re-written at its OWN stored stage, with 100%
        // forced from the effective year onward (or the staged amount restored, on a revert).
        var staleRowsByYear = new Dictionary<int, Section129ScheduleRowProjection>();
        foreach (var existing in existingRows.Where(r => r.FinanceYearValue < currentFinanceYearValue).OrderBy(r => r.FinanceYearValue))
        {
            if (existing.IsPropertyChangeDisqualified != IsPropertyChangeEffective(application, existing.FinanceYearValue) &&
                chain.ContainsKey(existing.PolicyCodeId))
            {
                staleRowsByYear[existing.FinanceYearValue] = existing;
            }
        }

        if (existingRows.Count > 0)
        {
            foreach (var (staleYear, staleRow) in staleRowsByYear)
                yearsToWrite.Add((staleYear, chain[staleRow.PolicyCodeId]));

            var lastRow = existingRows.OrderByDescending(r => r.FinanceYearValue).First();
            lastPolicyCode = chain.TryGetValue(lastRow.PolicyCodeId, out var lp) ? lp : seedPolicyCode;

            if (lastRow.FinanceYearValue == currentFinanceYearValue)
            {
                // The current year was already resolved (e.g. Apply already ran this year).
                // Re-add it WITHOUT advancing the chain, so a later RV recalculation for this same
                // year — which may have just reverted TransMast's staged row back to the plain
                // NETTAX figure (RVPersistenceService's own TransMast deactivation has no
                // PolicyCodeId filter, so it wipes any active RV row for this year regardless of
                // code) — gets TransMast/PolicyTaxDetails re-synced to the SAME already-resolved
                // stage, instead of being silently left reverted for the rest of the year.
                yearsToWrite.Add((currentFinanceYearValue, lastPolicyCode));
                nextYearValue = currentFinanceYearValue + 1;
            }
            else
            {
                nextYearValue = lastRow.FinanceYearValue + 1;
            }
        }
        else
        {
            var startYearMasterId = application.StartFinanceYearIdOverride
                ?? await _repository.ResolveStartFinanceYearIdAsync(propertyId, cancellationToken);

            if (startYearMasterId == null)
            {
                _logger.LogWarning(
                    "Cannot resolve a start finance year for PropertyId={PropertyId} (PropertyDetails.AssessmentYear unparseable and no StartFinanceYearIdOverride set); Section 129A recalculation skipped.",
                    propertyId);
                return;
            }

            var startYearValue = await _repository.GetFinanceYearValueAsync(startYearMasterId.Value, cancellationToken) ?? currentFinanceYearValue;
            yearsToWrite.Add((startYearValue, seedPolicyCode));
            lastPolicyCode = seedPolicyCode;
            nextYearValue = startYearValue + 1;
        }

        while (nextYearValue <= currentFinanceYearValue)
        {
            lastPolicyCode = ResolveNextStage(lastPolicyCode, chain);
            yearsToWrite.Add((nextYearValue, lastPolicyCode));
            nextYearValue++;
        }

        if (yearsToWrite.Count == 0)
            return;

        var oldSnapshot = await _repository.GetOldSnapshotAsync(propertyId, baseTaxCode, cancellationToken);

        // Only General Tax or TaxTotal (whichever SECTION129_STAGE_BASE_TAXCODE selects) is ever
        // independently staged. Education/Employment are no longer staged as their own lines —
        // they're only touched as components of the anchor's pro-rata distribution below
        // (automatically, via TaxMaster.OldTaxStatus=1 — no special-casing of their tax ids
        // needed). Populated regardless of which tax is the anchor — GetTaxTotalComponentTaxIdsAsync
        // is generic (every OldTaxStatus=1 head except the anchor itself) despite its name.
        var useTaxTotal = string.Equals(baseTaxCode, "TaxTotal", StringComparison.OrdinalIgnoreCase);

        var componentTaxIds = await _repository.GetTaxTotalComponentTaxIdsAsync(baseTaxId, cancellationToken);
        var genTaxId = await _repository.GetTaxIdByCodeAsync("General Tax", cancellationToken);

        // In General Tax mode, TaxTotal is not the staging anchor, so its TransMast row is never
        // updated by the loop below — leaving it at the pre-staging full NETTAX figure. Resolve its
        // Id once here so we can recompute and overwrite it each year in the loop. In TaxTotal mode
        // baseTaxId already IS TaxTotal, so no separate lookup is needed.
        var taxTotalId = useTaxTotal ? baseTaxId : await _repository.GetTaxIdByCodeAsync("TaxTotal", cancellationToken);

        // GetTaxTotalComponentTaxIdsAsync only excludes whichever id it was CALLED WITH (baseTaxId) —
        // in General Tax mode that's GEN's id, not Tax Total's, and Tax Total itself carries
        // OldTaxStatus=1 like every real component head. Left unfiltered, Tax Total would be staged
        // and distributed as if it were an ordinary component, then the sync block below would sum
        // Tax Total's own (just-written) TransMast value back into its own recomputed total —
        // inflating it every year. Tax Total mode is unaffected: taxTotalId == baseTaxId there, and
        // GetTaxTotalComponentTaxIdsAsync already excluded it.
        if (taxTotalId.HasValue)
            componentTaxIds = componentTaxIds.Where(id => id != taxTotalId.Value).ToList();

        // Best-effort fallback when a past year's own NETTAX basis was never computed (RV never ran
        // for that year) — reuse the current year's basis rather than persist a zero.
        var basisRow = await _repository.GetCurrentBasisTaxRowAsync(propertyId, currentYearMasterId, baseTaxId, cancellationToken);
        decimal? fallbackBasis = basisRow?.TaxAmount;
        decimal fallbackTaxableValue = basisRow?.CalculationValue ?? 0m;
        decimal? fallbackAnnualValue = basisRow?.CalculationAnnualValue;

        // Same idea as fallbackBasis above, but per component tax head — backfilled/pending years
        // never had their own NETTAX run, so GetCurrentBasisTaxAmountsAsync returns nothing for
        // them; reusing the current year's real per-head proportions lets every year get a full
        // tax-head breakdown (still summing to the same staged total) instead of just the anchor.
        var fallbackComponentBasis = componentTaxIds.Count > 0
            ? await _repository.GetCurrentBasisTaxAmountsAsync(propertyId, currentYearMasterId, componentTaxIds, cancellationToken)
            : new Dictionary<int, decimal>();

        // Old-property id(s) this property maps to (split/merge-aware) — used below to look up
        // real legacy per-head amounts (ptis.TransMastOld) for a backfilled year, before falling
        // back further to the standard TaxPercentageMasterRV split.
        var oldPropertyIds = componentTaxIds.Count > 0
            ? await _repository.GetOldPropertyIdsAsync(propertyId, cancellationToken)
            : new List<int>();

        foreach (var (yearValue, policyCode) in yearsToWrite)
        {
            var yearMasterId = await _repository.GetYearMasterIdAsync(yearValue, cancellationToken);
            if (yearMasterId == null)
            {
                _logger.LogWarning("No YearMaster row for finance year {FinanceYear}; skipping Section 129A row for PropertyId={PropertyId}", yearValue, propertyId);
                continue;
            }

            var rawPct = GetStagePercentage(policyCode.PolicyCode);
            var disqualified = IsPropertyChangeEffective(application, yearValue);
            var pct = disqualified ? 100m : rawPct;
            var isFullYear = policyCode.IsFinalStage || pct >= 100m;
            var applyFullTax = disqualified || isFullYear;
            var isCurrentActualYear = yearMasterId.Value == currentYearMasterId;

            // At 100% (final stage or a disqualifying property change), for the CURRENT year only,
            // force a live RV recalculation first so "100%" means exactly what regular taxation
            // would produce right now, per tax head — not a stale or approximated figure. Past
            // years that already resolved to 100% are left as whatever was computed when they were
            // current; there is no on-demand recompute for an arbitrary historical year.
            if (applyFullTax && isCurrentActualYear && !isFromRateableValueService)
            {
                await _rateableValueService.CalculateAndSaveAsync(propertyId, forceRecalculate: true);
            }

            var yearBasisRow = await _repository.GetCurrentBasisTaxRowAsync(propertyId, yearMasterId.Value, baseTaxId, cancellationToken);
            // A stale past year is re-staged from the full-basis snapshot its own schedule row kept —
            // the active TransMast figure for that year is the previously STAGED amount, and reading it
            // as "the 100% basis" would ratchet the result down.
            var isStaleRewrite = staleRowsByYear.TryGetValue(yearValue, out var staleRow);
            var basis = isStaleRewrite
                ? staleRow!.FullBasisTaxAmount
                : yearBasisRow?.TaxAmount ?? fallbackBasis ?? 0m;
            var yearTaxableValue = yearBasisRow?.CalculationValue ?? fallbackTaxableValue;
            var yearAnnualValue = yearBasisRow?.CalculationAnnualValue ?? fallbackAnnualValue;

            var stageTaxAmount = disqualified ? basis : Math.Round(basis * pct / 100m, 2, MidpointRounding.AwayFromZero);
            var rawApplicableTax = applyFullTax ? basis : Math.Max(oldSnapshot.OldTaxTotal, stageTaxAmount);

            // When TaxTotal is the staging basis, the anchor and every component it distributes
            // across must be whole rupees (no paise) while still summing exactly to the anchor —
            // so the anchor itself is rounded to a whole rupee first, here, before it's used either
            // as the TaxTotal row's own amount below or as the distribution target just after.
            var applicableTax = useTaxTotal
                ? Math.Round(rawApplicableTax, 0, MidpointRounding.AwayFromZero)
                : rawApplicableTax;

            Dictionary<int, decimal>? distributed = null;

            // Tax Total mode distributes every year (unchanged, already proven correct). General
            // Tax mode now also distributes, but only for years OTHER than the current one — the
            // current year's other heads are left exactly as the plain NETTAX engine already wrote
            // them (unchanged, real per-head data governs it correctly there); only backfilled/
            // pending years, which previously got nothing but the anchor row, now get a full
            // proportional breakdown too.
            bool shouldDistribute = componentTaxIds.Count > 0 && (useTaxTotal || !isCurrentActualYear);
            if (shouldDistribute)
            {
                // Three-tier fallback for a year with no real same-year TransMast history of its
                // own (always true for backfilled/pending years): (1) real legacy per-head amounts
                // from ptis.TransMastOld for this property's old-side mapping at this exact year,
                // (2) the standard ptis.TaxPercentageMasterRV percentage split for this property's
                // TypeOfUseId/assessment-year-range, (3) only if both are genuinely absent, the
                // current year's real per-head proportions (last-resort safety net so a backfilled
                // year is never left with just the anchor row).
                // A stale past year's same-year TransMast heads are the previously staged amounts, not
                // full ones, so skip that tier and fall through to the legacy/standard-split tiers —
                // exactly how the year was first backfilled.
                var componentBasis = isStaleRewrite
                    ? new Dictionary<int, decimal>()
                    : await _repository.GetCurrentBasisTaxAmountsAsync(propertyId, yearMasterId.Value, componentTaxIds, cancellationToken);

                if (componentBasis.Count == 0 && oldPropertyIds.Count > 0)
                {
                    componentBasis = await _repository.GetTransMastOldAmountsAsync(oldPropertyIds, yearMasterId.Value, componentTaxIds, cancellationToken);
                }

                if (componentBasis.Count == 0 && header.TypeOfUseId.HasValue)
                {
                    var yearRangeId = await _repository.GetYearRangeIdForAssessmentYearAsync(yearValue, cancellationToken);
                    if (yearRangeId.HasValue)
                    {
                        var rvSplit = new Dictionary<int, decimal>();
                        foreach (var taxId in componentTaxIds)
                        {
                            var taxPct = await _repository.GetTaxPercentageAsync(taxId, header.TypeOfUseId.Value, yearRangeId.Value, cancellationToken);
                            if (taxPct.HasValue && taxPct.Value > 0m)
                                rvSplit[taxId] = basis * taxPct.Value / 100m;
                        }
                        if (rvSplit.Count > 0)
                            componentBasis = rvSplit;
                    }
                }

                if (componentBasis.Count == 0)
                    componentBasis = fallbackComponentBasis;

                // 100%/disqualified: no relief in effect, each head is simply its own current full
                // amount (ratio 1). Otherwise: the same reduction the aggregate itself just got.
                var ratio = applyFullTax ? 1m : (basis > 0m ? applicableTax / basis : 0m);

                // Floor every component to a whole rupee (never round to 2dp — the officer-facing
                // TaxAmount must never show paise here), then fold the entire whole-rupee leftover
                // into GEN so the heads sum EXACTLY to the whole-rupee TaxTotal anchor above.
                distributed = new Dictionary<int, decimal>();
                var runningSum = 0m;
                foreach (var (taxId, fullAmount) in componentBasis)
                {
                    var amount = Math.Floor(fullAmount * ratio);
                    distributed[taxId] = amount;
                    runningSum += amount;
                }

                var residual = applicableTax - runningSum;
                if (residual != 0m && distributed.Count > 0)
                {
                    var targetId = genTaxId.HasValue && distributed.ContainsKey(genTaxId.Value)
                        ? genTaxId.Value
                        : distributed.Keys.First();
                    distributed[targetId] += residual;
                }
            }

            var write = new Section129ScheduleRowWrite(
                PropertyId: propertyId,
                PropertyDetailsId: header.PropertyDetailsId
                    ?? throw new InvalidOperationException($"Property {propertyId} has no active property details."),
                FinanceYearId: yearMasterId.Value,
                PolicyCodeId: policyCode.Id,
                TaxId: baseTaxId,
                TaxPercentage: pct,
                OldTaxAmount: oldSnapshot.OldTaxTotal,
                FullBasisTaxAmount: basis,
                StageTaxAmount: stageTaxAmount,
                TaxAmount: applicableTax,
                IsCurrent: isCurrentActualYear,
                IsPropertyChangeDisqualified: disqualified);

            await _repository.UpsertScheduleRowAsync(write, now, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _repository.UpsertTransMastAsync(
                propertyId,
                yearMasterId.Value,
                baseTaxId,
                policyCode.Id,
                applicableTax,
                yearTaxableValue,
                yearAnnualValue,
                now,
                cancellationToken);

            if (distributed != null)
            {
                foreach (var (taxId, amount) in distributed)
                {
                    await _repository.UpsertTransMastAsync(
                        propertyId,
                        yearMasterId.Value,
                        taxId,
                        policyCode.Id,
                        amount,
                        yearTaxableValue,
                        yearAnnualValue,
                        now,
                        cancellationToken);
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // In General Tax mode the TaxTotal TransMast row was not part of the writes above —
            // it still holds the pre-staging full NETTAX figure. Now that the anchor (General Tax)
            // and any distributed component rows are committed, read them back from TransMast and
            // recompute TaxTotal as their sum, then overwrite its row. This keeps TransMast
            // internally consistent for every reader (job detail, demand notice, etc.), not just
            // for the Section129 schedule screen which reads the anchor row directly.
            decimal? newTaxTotalAmount = null;
            if (!useTaxTotal && taxTotalId.HasValue && componentTaxIds.Count > 0)
            {
                var allHeadIds = componentTaxIds.Append(baseTaxId).ToList();
                var headAmounts = await _repository.GetCurrentBasisTaxAmountsAsync(
                    propertyId, yearMasterId.Value, allHeadIds, cancellationToken);
                newTaxTotalAmount = headAmounts.Values.Sum();

                await _repository.UpsertTransMastAsync(
                    propertyId,
                    yearMasterId.Value,
                    taxTotalId.Value,
                    policyCode.Id,
                    newTaxTotalAmount.Value,
                    yearTaxableValue,
                    yearAnnualValue,
                    now,
                    cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            // PolicyTaxDetails has no year dimension (unlike TransMast) — it only ever holds a
            // single "current" snapshot, so only the actual current year's figures ever get
            // reflected there; past/backfilled years in this loop are intentionally skipped.
            if (isCurrentActualYear)
            {
                await _repository.SupersedePolicyTaxDetailAsync(
                    propertyId, baseTaxId, policyCode.Id, applicableTax, yearTaxableValue,
                    chain.Keys, now, cancellationToken);

                if (distributed != null)
                {
                    foreach (var (taxId, amount) in distributed)
                    {
                        await _repository.SupersedePolicyTaxDetailAsync(
                            propertyId, taxId, policyCode.Id, amount, yearTaxableValue,
                            chain.Keys, now, cancellationToken);
                    }
                }

                // Mirror the TaxTotal update into PolicyTaxDetails for the current year so the
                // "current" PolicyTaxDetails snapshot also reflects the adjusted total — not the
                // pre-staging full figure that RVPersistenceService last wrote there.
                if (!useTaxTotal && taxTotalId.HasValue && newTaxTotalAmount.HasValue)
                {
                    await _repository.SupersedePolicyTaxDetailAsync(
                        propertyId, taxTotalId.Value, policyCode.Id, newTaxTotalAmount.Value,
                        yearTaxableValue, chain.Keys, now, cancellationToken);
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        await _repository.ClearIsCurrentFlagsAsync(propertyId, currentYearMasterId, cancellationToken);
    }

    /// <summary>
    /// Resolves the anchor date a Section 129A schedule starts from: the ward-wide Area Inclusion
    /// Date (WardSection129Master) by default, or — when the officer ticked the OC-Date
    /// checkbox — this property's own Occupancy Certificate date. Returns null only for the ward
    /// basis when the ward has no date configured (the loop then falls back to
    /// PropertyDetails.AssessmentYear). Throws for the OC basis when the property has no OC date,
    /// since silently falling back would build the schedule on the wrong anchor.
    /// </summary>
    private async Task<DateTime?> ResolveBasisDateAsync(
        int propertyId, int wardId, bool useOcDateBasis, CancellationToken cancellationToken)
    {
        if (!useOcDateBasis)
            return await _repository.GetWardSection129InclusionDateAsync(wardId, cancellationToken);

        var ocDate = await _repository.GetOcDateAsync(propertyId, cancellationToken);
        if (ocDate == null)
        {
            // Mapped to HTTP 400 by PropertyApiExceptionFilter.
            throw new InvalidOperationException(
                "No Occupancy Certificate date is available for this property, so the OC Date basis cannot be used.");
        }

        return ocDate;
    }

    /// <summary>Converts an anchor date to its finance year (April-start) YearMaster id, or null if there's no such YearMaster row.</summary>
    private async Task<int?> ResolveStartYearIdFromDateAsync(DateTime? anchorDate, CancellationToken cancellationToken)
    {
        if (anchorDate == null)
            return null;

        var financeYearValue = anchorDate.Value.Month >= 4 ? anchorDate.Value.Year : anchorDate.Value.Year - 1;
        return await _repository.GetYearMasterIdAsync(financeYearValue, cancellationToken);
    }

    /// <summary>
    /// Applies the OC-Date checkbox to the (tracked) application row, and — when the OC basis is
    /// already active — also re-checks whether the property's OC certificate date itself has since
    /// changed (an officer can correct/replace an OC certificate after Section 129A was applied; the
    /// schedule must follow that correction, not stay frozen at whatever it first resolved to). A
    /// no-op (returns false) only when the checkbox value is unchanged AND the resolved anchor year
    /// still matches what's already stored. The ward-date basis is NOT re-checked on every call —
    /// it's a shared, ward-wide setting, not a per-property fact an officer is actively correcting,
    /// so it stays a one-time freeze from first Apply (or from the flip itself). On an actual
    /// change, resolves the new anchor date first (throwing before any mutation if the OC basis is
    /// requested and no OC date exists), wipes the existing SECTION_129_*
    /// schedule/TransMast/PolicyTaxDetails rows when any exist — the schedule's start year itself is
    /// moving, which the additive fill-forward loop was never designed to do retroactively — and
    /// re-freezes the start year from the new anchor.
    /// </summary>
    private async Task<bool> SwitchBasisAsync(
        PropertySection129ApplicationEntity application,
        int wardId,
        bool useOcDateBasis,
        bool scheduleRowsExist,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var basisFlagChanged = useOcDateBasis != application.UseOcDateBasis;
        if (!basisFlagChanged && !useOcDateBasis)
            return false; // Ward-date basis, unchanged — frozen since first Apply/last flip.

        var anchorDate = await ResolveBasisDateAsync(application.PropertyId, wardId, useOcDateBasis, cancellationToken);

        if (!basisFlagChanged)
        {
            // Still on the OC-Date basis — re-resolve its current finance year and compare against
            // what's frozen. Identical OC date (the common case, every ordinary Recalculate click)
            // resolves to the same year, so this is a cheap no-op; only a genuine OC date correction
            // changes the resolved year and triggers the wipe-and-rebuild below.
            var currentAnchorYearId = await ResolveStartYearIdFromDateAsync(anchorDate, cancellationToken);
            if (currentAnchorYearId == application.StartFinanceYearIdOverride)
                return false;
        }

        if (scheduleRowsExist)
        {
            var chain = await _repository.GetSection129PolicyChainAsync(cancellationToken);
            await _repository.ResetSection129ScheduleAsync(application.PropertyId, chain.Keys.ToList(), now, cancellationToken);
        }

        application.UseOcDateBasis = useOcDateBasis;
        application.StartFinanceYearIdOverride = await ResolveStartYearIdFromDateAsync(anchorDate, cancellationToken);
        return true;
    }

    private static void ValidateChangeFacts(
        bool areaChanged, bool useChanged, bool otherStructuralChange, DateTime? effectiveDate, string? changeDetailsRemark)
    {
        if ((areaChanged || useChanged || otherStructuralChange) &&
            (!effectiveDate.HasValue || string.IsNullOrWhiteSpace(changeDetailsRemark)))
        {
            // Mapped to HTTP 400 by PropertyApiExceptionFilter.
            throw new InvalidOperationException(
                "Change Effective Date and Change Details are required when Increase in Area, Change of Use, " +
                "or Other Structural / Assessment Change is set to Yes.");
        }
    }

    /// <summary>
    /// Rebuilds/refreshes the schedule after the application row has been saved. When schedule rows
    /// already existed (or were just wiped by an OC-basis flip), the plain RV engine is force-run
    /// first: that rewrites a genuinely fresh NETTAX basis and — because the property is applied —
    /// triggers this service's own RV-originated recalculation hook, which restages every year from
    /// that fresh basis. The loop must NOT also be run from here afterwards, because by then the
    /// hook has already replaced the NETTAX TransMast row with the staged figure and a second pass
    /// would read that staged figure as "the 100% basis" and ratchet it down. Only when no schedule
    /// rows exist at all (first-ever Apply) does the loop run directly, off the NETTAX row the last
    /// RV run left behind.
    /// </summary>
    private async Task RebuildScheduleAsync(
        int propertyId,
        Section129PropertyHeaderRow header,
        PropertySection129ApplicationEntity application,
        bool scheduleRowsExisted,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var rvAlreadyRefreshed = false;
        if (scheduleRowsExisted)
        {
            await _rateableValueService.CalculateAndSaveAsync(propertyId, forceRecalculate: true);

            var rowsAfterRefresh = await _repository.GetScheduleRowsAsync(propertyId, cancellationToken);
            if (rowsAfterRefresh.Count > 0)
                return;

            // The RV-originated hook did not rebuild anything (e.g. RV skipped the property). Fall
            // through to the direct loop — the RV figures were just refreshed above, so it must not
            // force another RV run itself.
            _logger.LogWarning(
                "RV refresh did not restage the Section 129A schedule for PropertyId={PropertyId}; running the fill-forward loop directly.",
                propertyId);
            rvAlreadyRefreshed = true;
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await RecalculateThroughCurrentYearAsync(propertyId, header, application, now, isFromRateableValueService: rvAlreadyRefreshed, cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            _logger.LogError(ex, "Section 129A recalculation failed for PropertyId={PropertyId}", propertyId);
            throw;
        }
    }

    /// <summary>§6: if the last stage is final (100%), it repeats; otherwise advance via NextPolicyCodeId.</summary>
    private static PolicyCodeMasterEntity ResolveNextStage(PolicyCodeMasterEntity lastPolicyCode, Dictionary<int, PolicyCodeMasterEntity> chain)
    {
        if (lastPolicyCode.IsFinalStage)
            return lastPolicyCode;

        if (lastPolicyCode.NextPolicyCodeId.HasValue && chain.TryGetValue(lastPolicyCode.NextPolicyCodeId.Value, out var next))
            return next;

        return lastPolicyCode;
    }

    private async Task<Section129ScheduleDto?> CheckBasisCalculatedAsync(
        int propertyId,
        bool scheduleRowsExisted,
        CancellationToken cancellationToken)
    {
        string baseTaxCodeForGuard = DefaultBaseTaxCode;
        if (_policyConfigurationService != null)
        {
            var rawPolicy = await _policyConfigurationService.GetPolicyValueAsync(
                BaseTaxCodePolicyKey, DefaultBaseTaxCode, cancellationToken);
            baseTaxCodeForGuard = NormalizeBaseTaxCode(rawPolicy);
        }

        int? baseTaxIdForGuard = null;
        if (_repository != null)
        {
            baseTaxIdForGuard = await _repository.GetTaxIdByCodeAsync(baseTaxCodeForGuard, cancellationToken);
            var oldSnapshot = await _repository.GetOldSnapshotAsync(propertyId, baseTaxCodeForGuard, cancellationToken);
            if (oldSnapshot != null && oldSnapshot.OldTaxTotal <= 0m)
            {
                throw new InvalidOperationException("Not eligible to apply rule, as property has 0 old tax");
            }
        }

        decimal fullGeneralTax = 0m;
        if (scheduleRowsExisted && _repository != null)
        {
            var scheduleRows = await _repository.GetScheduleRowsAsync(propertyId, cancellationToken);
            var currentScheduleRow = scheduleRows.FirstOrDefault(r => r.IsCurrent) ?? scheduleRows.LastOrDefault();
            if (currentScheduleRow != null)
            {
                fullGeneralTax = Math.Max(currentScheduleRow.FullBasisTaxAmount, currentScheduleRow.TaxAmount);
            }
        }
        else if (_repository != null)
        {
            var activeYearForGuard = await _repository.GetActiveFinanceYearAsync(cancellationToken);
            if (!activeYearForGuard.HasValue)
            {
                return null;
            }

            if (baseTaxIdForGuard.HasValue)
            {
                var basisRowForGuard = await _repository.GetCurrentBasisTaxRowAsync(
                    propertyId, activeYearForGuard.Value.YearMasterId, baseTaxIdForGuard.Value, cancellationToken);
                fullGeneralTax = basisRowForGuard?.TaxAmount ?? 0m;
            }
        }

        if (fullGeneralTax <= 0m)
        {
            throw new InvalidOperationException("Not eligible to apply rule, as property has 0 tax");
        }

        return null;
    }

    private static bool IsPropertyChangeEffective(PropertySection129ApplicationEntity application, int yearValue)
    {
        var hasChange = application.AreaChanged || application.UseChanged || application.OtherStructuralChange;
        if (!hasChange)
            return false;

        if (application.OtherStructuralChangeEffectiveDate is not { } effectiveDate)
            return true;

        // A change effective partway through FY (April-start) year Y applies from year Y onward.
        var effectiveFinanceYear = effectiveDate.Month >= 4 ? effectiveDate.Year : effectiveDate.Year - 1;
        return yearValue >= effectiveFinanceYear;
    }

    private static decimal GetStagePercentage(string code)
    {
        if (StagePercentages.TryGetValue(code, out var p))
            return p;

        var match = System.Text.RegularExpressions.Regex.Match(code, @"\d+");
        if (match.Success && decimal.TryParse(match.Value, out var parsedPct))
            return parsedPct;

        return 0m;
    }

    private static string FormatFinancialYear(int? year)
    {
        if (year == null)
            return string.Empty;

        return $"{year}-{(year.Value + 1) % 100:D2}";
    }

    /// <summary>Extracts a 4-digit year from PropertyDetails.AssessmentYear, tolerating both "2020" and "2020-21" — same leniency as ISection129Repository.ResolveStartFinanceYearIdAsync.</summary>
    private static bool TryParseAssessmentYear(string? assessmentYear, out int year)
    {
        year = 0;
        if (string.IsNullOrWhiteSpace(assessmentYear))
            return false;

        var match = System.Text.RegularExpressions.Regex.Match(assessmentYear, @"\d{4}");
        return match.Success && int.TryParse(match.Value, out year);
    }
}
