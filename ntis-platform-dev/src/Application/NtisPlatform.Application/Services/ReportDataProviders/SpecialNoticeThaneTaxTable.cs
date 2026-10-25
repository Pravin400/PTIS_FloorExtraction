using System.Globalization;

namespace NtisPlatform.Application.Services.ReportDataProviders;

internal sealed record SpecialNoticeTaxHead(int Id, string Code, string Name, int DisplayOrder,
    bool IsActive, bool UsesPercentage, string? CategoryCode);
internal sealed record SpecialNoticeTaxDemand(int Id, int Year, int TaxId, decimal Amount);
internal sealed record SpecialNoticeAssessmentPenalty(int Year, decimal Amount);
internal sealed record SpecialNoticeTaxRates(decimal? Residential, decimal? Commercial, string ResidentialText, string CommercialText)
{
    public static SpecialNoticeTaxRates From(IEnumerable<decimal?> residential, IEnumerable<decimal?> commercial)
    {
        static (decimal?, string) Format(IEnumerable<decimal?> source)
        {
            var values = source.Where(v => v.HasValue).Select(v => v!.Value).Distinct().OrderBy(v => v).ToList();
            return (values.Count == 1 ? values[0] : null,
                values.Count == 0 ? "-" : string.Join(" / ", values.Select(v => v.ToString("0.##", CultureInfo.InvariantCulture))));
        }
        var r = Format(residential);
        var c = Format(commercial);
        return new(r.Item1, c.Item1, r.Item2, c.Item2);
    }
}

internal sealed class SpecialNoticeThaneTaxTable
{
    // Fixed headings and order from the original Special Notice Thane RPT.
    private static readonly string[] NoticeCodes =
        ["GEN", "SP_EDU", "WATER_BEN", "LIGHT", "TREE", "BIG_BUILD", "SP_WATER", "STATE_EMP", "STATE_EDU", "ROAD", "SEWAGE", "FIRE"];
    private static readonly string[] NoticeNames =
        ["General Tax", "Education Tax", "Water Benefit Tax", "Sewage Tax", "Tree Cess", "Big Residential Tax",
         "Special Con. Tax", "Employment Guarantee Cess (GOM)", "Education Cess (GOM)", "Road Tax", "Sewage benefit Tax", "Fire Tax"];
    public IReadOnlyList<object> Rows { get; }
    public decimal PreviousSubtotal { get; }
    public decimal CurrentSubtotal { get; }
    public decimal PreviousPenalty { get; }
    public decimal CurrentPenalty { get; }
    public decimal PreviousTotal => PreviousSubtotal + PreviousPenalty;
    public decimal CurrentTotal => CurrentSubtotal + CurrentPenalty;
    public string PreviousHeading { get; }
    public string CurrentHeading { get; }

    internal static int FinancialYear(DateTime date) => date.Month >= 4 ? date.Year : date.Year - 1;
    internal static string Code(string? code) => string.Concat((code ?? string.Empty).Where(c => !char.IsWhiteSpace(c))).ToUpperInvariant();

    internal static SpecialNoticeThaneTaxTable FromSavedDemand(int currentYear,
        IEnumerable<SpecialNoticeTaxHead> heads, IEnumerable<SpecialNoticeTaxDemand> demand,
        IReadOnlyDictionary<int, SpecialNoticeTaxRates> rates,
        IEnumerable<SpecialNoticeAssessmentPenalty>? assessmentPenalties = null) =>
        new(currentYear, heads, demand, rates, assessmentPenalties ?? []);

    private SpecialNoticeThaneTaxTable(int currentYear, IEnumerable<SpecialNoticeTaxHead> heads,
        IEnumerable<SpecialNoticeTaxDemand> source, IReadOnlyDictionary<int, SpecialNoticeTaxRates> rates,
        IEnumerable<SpecialNoticeAssessmentPenalty> assessmentPenalties)
    {
        var catalog = heads.ToDictionary(head => head.Id);
        var demand = source.Where(row => row.Year <= currentYear).ToList();
        if (demand.Any(row => !catalog.ContainsKey(row.TaxId)))
            throw new InvalidOperationException("A saved tax demand refers to an unknown tax head.");

        // Multiple certificate policies can contribute to one head/year. TaxTotal is a stored
        // summary, never another charge; calculate totals from the displayed heads only.
        var amounts = demand.Where(row => Code(catalog[row.TaxId].Code) != "TAXTOTAL")
            .GroupBy(row => row.TaxId).ToDictionary(group => group.Key, group => (
                Previous: group.Where(row => row.Year < currentYear).Sum(row => row.Amount),
                Current: group.Where(row => row.Year == currentYear).Sum(row => row.Amount)));
        var previousIllegal = amounts.Where(row => Code(catalog[row.Key].Code) == "ILLEGAL").Sum(row => row.Value.Previous);
        var currentIllegal = amounts.Where(row => Code(catalog[row.Key].Code) == "ILLEGAL").Sum(row => row.Value.Current);
        // ILLEGAL allocations are already in demand; assessment penalties are saved separately
        // and are never allocated by SyncPolicyTaxAndTransMastAsync. Keep the two sources distinct:
        // remove only the ledger charge from the subtotal, then add each penalty exactly once.
        var savedPenalties = assessmentPenalties.Where(row => row.Year <= currentYear).ToList();
        PreviousPenalty = previousIllegal + savedPenalties.Where(row => row.Year < currentYear).Sum(row => row.Amount);
        CurrentPenalty = currentIllegal + savedPenalties.Where(row => row.Year == currentYear).Sum(row => row.Amount);
        PreviousSubtotal = amounts.Values.Sum(row => row.Previous) - previousIllegal;
        CurrentSubtotal = amounts.Values.Sum(row => row.Current) - currentIllegal;
        PreviousHeading = $"Previous Tax Before 01/04/{currentYear}";
        CurrentHeading = $"FY {currentYear}-{(currentYear + 1) % 100:00} Tax";
        var rows = new List<object>();
        var serial = 0;
        foreach (var code in NoticeCodes)
        {
            var head = catalog.Values.FirstOrDefault(head => Code(head.Code) == code);
            var amount = head is null ? default : amounts.GetValueOrDefault(head.Id);
            rows.Add(Row("tax", ++serial, code, NoticeNames[serial - 1],
                head is null ? null : rates.GetValueOrDefault(head.Id), amount.Previous, amount.Current));
        }
        // Show the active sanitation master even before a property has saved charges.
        // Every other additional saved head remains visible so the breakup balances.
        foreach (var head in catalog.Values.Where(head => (amounts.ContainsKey(head.Id)
                     || (head.IsActive && Code(head.Code) == "SANITATION"))
                     && Code(head.Code) != "ILLEGAL" && !NoticeCodes.Contains(Code(head.Code)))
                     .OrderBy(head => head.DisplayOrder).ThenBy(head => head.Id))
        {
            var amount = amounts.GetValueOrDefault(head.Id);
            rows.Add(Row("tax", ++serial, Code(head.Code), head.Name, rates.GetValueOrDefault(head.Id),
                amount.Previous, amount.Current));
        }
        rows.Add(Row("subtotal", null, null, "Total Rs.", null, PreviousSubtotal, CurrentSubtotal));
        var penalty = catalog.Values.FirstOrDefault(head => Code(head.Code) == "ILLEGAL");
        rows.Add(Row("penalty", ++serial, null, "MMC Sec 267 (A) Penalty",
            penalty is null ? null : rates.GetValueOrDefault(penalty.Id), PreviousPenalty, CurrentPenalty));
        rows.Add(Row("grandTotal", null, null, "Total Rs.", null, PreviousTotal, CurrentTotal));
        Rows = rows;
    }
    private static object Row(string rowType, int? serialNo, string? taxCode, string taxName,
        SpecialNoticeTaxRates? rate, decimal previousTax, decimal currentTax) => new
    {
        rowType, serialNo, taxCode, taxName,
        residentialRate = rate?.Residential, nonResidentialRate = rate?.Commercial,
        residentialRateText = rate?.ResidentialText ?? "-", nonResidentialRateText = rate?.CommercialText ?? "-",
        previousTax, currentTax, totalTax = previousTax + currentTax
    };
}
