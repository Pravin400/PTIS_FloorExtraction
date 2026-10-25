using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Constants;

namespace NtisPlatform.Application.Services.ReportDataProviders;

public partial class SpecialNoticeThaneDataProvider
{
    private readonly IReportDataRepository<TaxMasterMappingEntity>? _taxMasterMappingRepository;
    private readonly IReportDataRepository<PropertyTypeMasterEntity>? _propertyTypeMasterRepository;
    private readonly IReportDataRepository<EducationTaxMasterEntity>? _educationTaxMasterRepository;
    private readonly IReportDataRepository<EmploymentTaxMasterEntity>? _employmentTaxMasterRepository;

    private async Task<SpecialNoticeThaneTaxTable> BuildTaxTableAsync(int propertyId,
        Dictionary<string, string> parameters, CancellationToken ct)
    {
        // Match SystemFinanceYearProvider, which is also used by the Individual page.
        var currentYear = await _financeYearRepository.GetQueryable().AsNoTracking()
            .Where(year => year.IsActive).Select(year => (int?)year.Year).FirstOrDefaultAsync(ct)
            ?? SpecialNoticeThaneTaxTable.FinancialYear(DateTime.Today);
        if (parameters.TryGetValue("financeYear", out var suppliedYear) && !string.IsNullOrWhiteSpace(suppliedYear)
            && (!int.TryParse(suppliedYear, out var requestedYear) || (requestedYear != 0 && requestedYear != currentYear)))
            throw new ArgumentException("financeYear must match the current financial year shown on the Individual screen.");

        // Match the Individual tax panel: current-year RV ledger amounts override the annual
        // PolicyTaxDetails determination. Previous tax includes its saved retro/arrears years.
        // Assessment status/dates describe the notice, but must not hide already saved charges.
        var demand = await (
            from tm in _taxDemandRepository.GetQueryable().AsNoTracking()
            join year in _financeYearRepository.GetQueryable().AsNoTracking() on tm.FinanceYearId equals year.Id
            join tax in _taxHeadRepository.GetQueryable().AsNoTracking() on tm.TaxId equals tax.Id
            where tm.PropertyId == propertyId && tm.IsActive && !tm.MarkedForDeletion
                && tax.IsActive && tm.CalculationType == "RV"
                && (year.Year == currentYear || (year.Year < currentYear && tm.PolicyCodeMaster != null
                    && (tm.PolicyCodeMaster.IsRetroDemand || tm.PolicyCodeMaster.PolicyCode == PolicyCodes.OldArrears)))
            select new SpecialNoticeTaxDemand(tm.Id, year.Year, tm.TaxId, tm.TaxAmount)
        ).ToListAsync(ct);

        // PolicyTaxDetails is also visible before a certificate/assessment has produced ledger rows.
        // NETTAX is the annual baseline; other policy determinations must not be added to that
        // baseline or added a second time to TransMast's already prorated payable demand.
        var annualTaxes = await (
            from td in _policyTaxDetailsRepository.GetQueryable().AsNoTracking()
            join tax in _taxHeadRepository.GetQueryable().AsNoTracking() on td.TaxId equals tax.Id
            where td.PropertyId == propertyId && td.IsActive && !td.MarkedForDeletion && tax.IsActive
                && (td.PolicyCodeMaster == null || td.PolicyCodeMaster.IsActive)
            select new { td.Id, td.TaxId,
                PolicyCode = td.PolicyCodeMaster != null ? td.PolicyCodeMaster.PolicyCode : string.Empty,
                Amount = td.TaxAmount ?? 0m }
        ).ToListAsync(ct);
        var ledgerTaxIds = demand.Where(row => row.Year == currentYear).Select(row => row.TaxId).ToHashSet();
        foreach (var head in annualTaxes.Where(row => !ledgerTaxIds.Contains(row.TaxId)).GroupBy(row => row.TaxId))
        {
            var baseline = head.Where(row => string.Equals(row.PolicyCode, PolicyCodes.NetTax, StringComparison.OrdinalIgnoreCase)).ToList();
            var saved = baseline.Count > 0 ? baseline : head.ToList();
            demand.Add(new SpecialNoticeTaxDemand(saved[0].Id, currentYear, head.Key, saved.Sum(row => row.Amount)));
        }

        var heads = await LoadTaxHeadsAsync(ct);
        var rates = await LoadMasterTaxRatesAsync(heads, ct, propertyId);
        // Match the notice's latest property-level assessment without summing historical snapshots.
        // Status controls the displayed assessment dates, not already saved charges.
        var assessmentId = await _assessmentRepository.GetQueryable().AsNoTracking()
            .Where(a => a.PropertyId == propertyId && a.IsActive && !a.MarkedForDeletion
                && a.CalculationMode == "PROPERTY")
            .OrderByDescending(a => a.AssessmentDate).ThenByDescending(a => a.Id)
            .Select(a => (int?)a.Id).FirstOrDefaultAsync(ct);
        var penalties = new List<SpecialNoticeAssessmentPenalty>();
        if (assessmentId.HasValue)
        {
            var details = await _assessmentDetailRepository.GetQueryable().AsNoTracking()
                .Where(d => d.CalculationId == assessmentId.Value && d.PropertyId == propertyId
                    && d.IsActive && !d.MarkedForDeletion)
                .Select(d => new { d.FromDate, d.PenaltyAmount }).ToListAsync(ct);
            penalties = details.Select(d => new SpecialNoticeAssessmentPenalty(
                SpecialNoticeThaneTaxTable.FinancialYear(d.FromDate), d.PenaltyAmount)).ToList();
        }
        return SpecialNoticeThaneTaxTable.FromSavedDemand(currentYear, heads, demand, rates, penalties);
    }

    private Task<List<SpecialNoticeTaxHead>> LoadTaxHeadsAsync(CancellationToken ct) =>
        _taxHeadRepository.GetQueryable().AsNoTracking()
            .Select(t => new SpecialNoticeTaxHead(t.Id, t.TaxCode, t.TaxName, t.DisplayOrder,
                t.IsActive, t.CalculationModeMaster != null && t.CalculationModeMaster.UsesValueConfig,
                t.TaxCategoryMaster != null ? t.TaxCategoryMaster.CategoryCode : null)).ToListAsync(ct);

    internal async Task<Dictionary<int, SpecialNoticeTaxRates>> LoadMasterTaxRatesAsync(
        IEnumerable<SpecialNoticeTaxHead> heads, CancellationToken ct, int? propertyId = null)
    {
        var taxHeads = heads.ToList();
        // Match TOP (1) active year range ordered by Id descending in the supplied SQL.
        var yearRangeId = await _yearRangeRepository.GetQueryable().AsNoTracking()
            .Where(range => range.IsActive)
            .OrderByDescending(range => range.Id)
            .Select(range => (int?)range.Id)
            .FirstOrDefaultAsync(ct);
        var taxDetails = _taxHeadRepository.GetQueryable().AsNoTracking()
            .Where(t => t.IsActive)
            .Select(t => new
            {
                TaxId = t.Id,
                ModeCode = t.CalculationModeMaster != null ? t.CalculationModeMaster.ModeCode : null,
                AttachedReference = t.RuleDefinition != null && t.RuleDefinition.IsActive
                    ? t.RuleDefinition.AttachedReference : null
            });
        var valueRates =
            from rate in _taxPercentageRepository.GetQueryable().AsNoTracking()
            join usage in _typeOfUseRepository.GetQueryable().AsNoTracking() on rate.TypeOfUseId equals usage.Id
            join tax in taxDetails on rate.TaxId equals tax.TaxId
            where tax.ModeCode == "VALUE_BASED" && rate.YearRangeRVId == yearRangeId
                && (usage.TypeOfUseCode == "R" || usage.TypeOfUseCode == "C")
            select new { rate.TaxId, UsageType = usage.TypeOfUseCode, Rate = rate.TaxPercentage };
        var percentages = await valueRates.ToListAsync(ct);
        if (_taxMasterMappingRepository is not null)
        {
            var mappings = _taxMasterMappingRepository.GetQueryable().AsNoTracking()
                .Where(m => m.ResultMode == "PERCENT" && m.ResultBase == "RV"
                    && m.AssessmentYearRangeId == yearRangeId);
            var usageRates = await (
                from mapping in mappings
                join usage in _typeOfUseRepository.GetQueryable().AsNoTracking()
                    on Convert.ToInt32(mapping.MasterKey) equals usage.Id
                join tax in taxDetails on mapping.TaxId equals tax.TaxId
                where tax.ModeCode == "MASTER_BASED" && tax.AttachedReference == "TypeOfUse"
                    && (usage.TypeOfUseCode == "R" || usage.TypeOfUseCode == "C")
                select new { mapping.TaxId, UsageType = usage.TypeOfUseCode, Rate = mapping.ResultValue }
            ).ToListAsync(ct);
            percentages.AddRange(usageRates);
            if (_propertyTypeMasterRepository is not null)
            {
                var propertyRates = await (
                    from mapping in mappings
                    join propertyType in _propertyTypeMasterRepository.GetQueryable().AsNoTracking()
                        on Convert.ToInt32(mapping.MasterKey) equals propertyType.Id
                    join tax in taxDetails on mapping.TaxId equals tax.TaxId
                    where tax.ModeCode == "MASTER_BASED" && tax.AttachedReference == "PropertyType"
                        && (propertyType.Type == "R" || propertyType.Type == "C")
                    select new { mapping.TaxId, UsageType = propertyType.Type!, Rate = mapping.ResultValue }
                ).ToListAsync(ct);
                percentages.AddRange(propertyRates);
            }
        }

        var alv = await ResolveAlvAsync(propertyId, ct);
        var eduRates = await ResolveSlabRatesAsync(_educationTaxMasterRepository, alv,
            e => e.Type, e => e.MinAmount, e => e.MaxAmount, e => e.Rate, ct);
        var empRates = await ResolveSlabRatesAsync(_employmentTaxMasterRepository, alv,
            e => e.Type, e => e.MinAmount, e => e.MaxAmount, e => e.Rate, ct);

        var byTax = percentages.ToLookup(p => p.TaxId);
        return taxHeads.Where(h => h.IsActive).ToDictionary(h => h.Id, h =>
        {
            if (IsEducationHead(h))
                return SpecialNoticeTaxRates.From([eduRates.R], [eduRates.C]);
            if (IsEmploymentHead(h))
                return SpecialNoticeTaxRates.From([empRates.R], [empRates.C]);

            var residential = byTax[h.Id].Where(p => p.UsageType == "R").Sum(p => p.Rate);
            var commercial = byTax[h.Id].Where(p => p.UsageType == "C").Sum(p => p.Rate);
            return SpecialNoticeTaxRates.From([residential], [commercial]);
        });
    }

    private async Task<decimal> ResolveAlvAsync(int? propertyId, CancellationToken ct)
    {
        if (propertyId is not > 0) return 0m;
        // Match the supplied SQL: TOP (1) active TransMast row, without
        // preferring positive ALV or adding calculation/year/deletion filters.
        return await _taxDemandRepository.GetQueryable().AsNoTracking()
            .Where(tm => tm.PropertyId == propertyId.Value && tm.IsActive)
            .Select(tm => tm.CalculationAnnualValue).FirstOrDefaultAsync(ct) ?? 0m;
    }

    private static async Task<(decimal R, decimal C)> ResolveSlabRatesAsync<T>(
        IReportDataRepository<T>? repository, decimal alv,
        Func<T, string?> getType, Func<T, decimal?> getMin, Func<T, decimal?> getMax,
        Func<T, decimal?> getRate, CancellationToken ct) where T : class
    {
        if (repository is null) return (0m, 0m);
        var slabs = await repository.GetQueryable().AsNoTracking().ToListAsync(ct);
        // Match TYPE and inclusive BETWEEN only, followed by ISNULL(Rate, 0).
        // SingleOrDefault also rejects overlapping slabs, as SQL scalar subqueries do.
        decimal Rate(string type) => slabs
            .Where(s => string.Equals(getType(s), type, StringComparison.OrdinalIgnoreCase)
                && getMin(s).HasValue && getMax(s).HasValue
                && alv >= getMin(s)!.Value && alv <= getMax(s)!.Value)
            .Select(getRate).SingleOrDefault() ?? 0m;
        return (Rate("R"), Rate("C"));
    }

    private static bool IsEducationHead(SpecialNoticeTaxHead h)
    {
        var code = SpecialNoticeThaneTaxTable.Code(h.Code);
        return code == "STATE_EDU" || code == "STATEEDU" || code == "MAHAEDU" || code == "MAHARASHTRAEDU"
            || (!code.StartsWith("SP") && (h.Name.Contains("Education", StringComparison.OrdinalIgnoreCase) || code == "EDUCATIONTAX"));
    }

    private static bool IsEmploymentHead(SpecialNoticeTaxHead h)
    {
        var code = SpecialNoticeThaneTaxTable.Code(h.Code);
        return code == "STATE_EMP" || code == "STATEEMP" || code == "EMPLOYMENTTAX"
            || h.Name.Contains("Employment", StringComparison.OrdinalIgnoreCase);
    }
}
