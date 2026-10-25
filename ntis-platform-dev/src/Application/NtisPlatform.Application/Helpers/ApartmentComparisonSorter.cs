using System.Globalization;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;

namespace NtisPlatform.Application.Helpers;

/// <summary>
/// Orders the units of the apartment comparison screen by one column of one of its three tables.
/// The value of a column is the value the screen shows for it (the UI mapper's rules: the first filled field wins,
/// "-" is empty, the floor sorts G, 1, 2, 10, a property number sorts naturally S1, S2, S10), so the order the user
/// sees is the order of the values he reads. Empty values come last in either direction; equal values keep their order.
/// </summary>
public static class ApartmentComparisonSorter
{
    private static readonly string[] ImageCodes = { "PROPERTY_PHOTO", "PROPERTY_FRONT" };
    private static readonly string[] PlanCodes = { "PLAN_PHOTO", "PROPERTY_PLAN" };

    private static readonly Dictionary<string, Func<UnitFacts, SortValue>> UnitColumns =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["prop"] = f => SortValue.OfText(f.Prop),
            ["flat"] = f => SortValue.OfText(f.Flat),
            ["wgFl"] = f => FloorValue(f.WgFl),
            ["type"] = f => SortValue.OfText(f.Type),
            ["bhk"] = f => SortValue.OfText(f.Bhk),
            ["cty"] = f => SortValue.OfText(f.Cty),
            ["ayr"] = f => NumberFromText(f.Ayr),
            ["cyr"] = f => NumberFromText(f.Cyr),
            ["use"] = f => SortValue.OfText(f.Use),
            ["cpt"] = f => SortValue.OfNumber(f.Cpt),
            ["bua"] = f => SortValue.OfNumber(f.Bua),
            ["ocNo"] = f => SortValue.OfText(f.OcNo),
            ["ocDate"] = f => f.OcDate.HasValue ? SortValue.OfNumber(f.OcDate.Value.Date.Ticks) : SortValue.Empty,
            ["renter"] = f => SortValue.OfText(f.Renter),
            ["rent"] = f => SortValue.OfNumber(f.Rent),
            ["alv"] = f => SortValue.OfNumber(f.Alv),
            ["rv"] = f => SortValue.OfNumber(f.Rv),
            ["cv"] = f => SortValue.OfNumber(f.Cv),
            ["tax"] = f => SortValue.OfNumber(f.Tax),
            ["img"] = f => SortValue.OfNumber(f.HasImage ? 1 : 0),
            ["plan"] = f => SortValue.OfNumber(f.HasPlan ? 1 : 0)
        };

    private static readonly Dictionary<string, Func<ApartmentQCPropertyDifferenceDto, SortValue>> DifferenceColumns =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["carpetFt"] = d => SortValue.OfNumber(d.CarpetAreaSqFeetDiff),
            ["carpetMtr"] = d => SortValue.OfNumber(d.CarpetAreaSqMeterDiff),
            ["buaFt"] = d => SortValue.OfNumber(d.BuiltupAreaSqFeetDiff),
            ["buaMtr"] = d => SortValue.OfNumber(d.BuiltupAreaSqMeterDiff),
            ["rv"] = d => SortValue.OfNumber(d.RateableValueDiff ?? 0m),
            ["cv"] = d => SortValue.OfNumber(d.CapitalValueDiff),
            ["tax"] = d => SortValue.OfNumber(d.TotalTaxDiff ?? 0m),
            ["rtTax"] = d => SortValue.OfNumber(d.RetroTaxDiff ?? 0m)
        };

    public static bool IsSortable(ApartmentSortPanel panel, string column) =>
        panel == ApartmentSortPanel.Difference ? DifferenceColumns.ContainsKey(column) : UnitColumns.ContainsKey(column);

    /// <summary>The column name as the sorter spells it (the request may differ in case).</summary>
    public static string CanonicalColumn(ApartmentSortPanel panel, string column) =>
        (panel == ApartmentSortPanel.Difference ? DifferenceColumns.Keys.AsEnumerable() : UnitColumns.Keys)
            .First(k => string.Equals(k, column, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// The order of <paramref name="rows"/> under the sort, as indexes into the list. Not a sort in place: the caller keeps its own
    /// pairing of row and ids.
    /// </summary>
    public static int[] OrderOf(IReadOnlyList<ApartmentQCComparisonDto> rows, ApartmentSortSpec spec)
    {
        var values = new SortValue[rows.Count];
        for (var i = 0; i < rows.Count; i++)
        {
            values[i] = ValueOf(rows[i], spec);
        }

        // Array.Sort is not stable; the index as the last key keeps equal values in their original order.
        var order = Enumerable.Range(0, rows.Count).ToArray();
        Array.Sort(order, (x, y) =>
        {
            var byValue = Compare(values[x], values[y], spec.Descending);
            return byValue != 0 ? byValue : x.CompareTo(y);
        });
        return order;
    }

    private static SortValue ValueOf(ApartmentQCComparisonDto row, ApartmentSortSpec spec)
    {
        switch (spec.Panel)
        {
            case ApartmentSortPanel.Difference:
                return row.Difference == null ? SortValue.Empty : DifferenceColumns[spec.Column](row.Difference);
            case ApartmentSortPanel.Existing:
                return UnitColumns[spec.Column](FactsOf(row.OldSurvey));
            default:
                return UnitColumns[spec.Column](FactsOf(row.NewSurvey));
        }
    }

    // ── What each table shows for a unit (mirrors the UI mapper, so the sort follows the screen) ─────────────

    private sealed record UnitFacts(
        string Prop, string Flat, string WgFl, string Type, string Bhk, string Cty, string Ayr, string Cyr, string Use,
        decimal Cpt, decimal Bua, string OcNo, DateTime? OcDate, string Renter, decimal? Rent, decimal? Alv,
        decimal Rv, decimal Cv, decimal Tax, bool HasImage, bool HasPlan);

    private static readonly UnitFacts NoFacts = new("-", "-", "-", "-", "-", "-", "-", "-", "-", 0m, 0m, "-", null, "-", null, null, 0m, 0m, 0m, false, false);

    private static string Trim(string? text) => (text ?? string.Empty).Trim();

    /// <summary>The first non-blank of the values ("a || b" of the UI), else "-".</summary>
    private static string FirstFilled(params string?[] values) =>
        values.Select(Trim).FirstOrDefault(v => v.Length > 0) ?? "-";

    private static string PropertyText(string? propertyNo, string? oldPropertyNo, string? partition, string? flatNo)
    {
        var prop = FirstFilled(propertyNo, oldPropertyNo);
        if (prop == "-") prop = string.Empty;

        var part = Trim(partition);
        if (part == "-") part = string.Empty;

        var flat = Trim(flatNo);

        var parts = new List<string>();
        if (prop.Length > 0) parts.Add(prop);
        if (part.Length > 0 && part != prop) parts.Add(part);
        if (flat.Length > 0 && flat != "-" && flat != part && flat != prop) parts.Add(flat);
        return parts.Count > 0 ? string.Join(" - ", parts) : "-";
    }

    /// <summary>PROP NO of the survey table: the partition (the wing, or the partition of a unit); the main property number only when there is none.</summary>
    private static string SurveyPropText(string? propertyNo, string? partition)
    {
        var part = Trim(partition);
        return part.Length > 0 && part != "-" ? part : FirstFilled(propertyNo);
    }

    private static bool HasPhoto(Guid? direct, List<PropertyPhotoDocumentDto>? photos, string[] codes) =>
        direct.HasValue && direct.Value != Guid.Empty
        || (photos?.Any(p => p.DocumentGuid != Guid.Empty && codes.Contains(p.PhotoTypeCode ?? string.Empty)) ?? false);

    private static UnitFacts FactsOf(NewSurveyPropertyDto? n)
    {
        if (n == null) return NoFacts;

        var flat = n.FlatOrShopNo ?? n.FlatOrShopNoEnglish ?? n.FlatOrShopName ?? n.FlatOrShopNameEnglish;
        return new UnitFacts(
            Prop: SurveyPropText(n.PropertyNo, n.PartitionNo),
            Flat: FirstFilled(flat),
            WgFl: FirstFilled(n.FloorCode, n.Floor),
            Type: FirstFilled(n.ApartmentType),
            Bhk: FirstFilled(n.BHK),
            Cty: FirstFilled(n.ConstructionCode, n.ConstructionType),
            Ayr: FirstFilled(n.AssessmentYear),
            Cyr: FirstFilled(n.ConstructionYear),
            Use: FirstFilled(n.TypeOfUseCode, n.TypeOfUse, n.SubTypeOfUse),
            Cpt: n.CarpetASqFt ?? n.CarpetASqMtr ?? 0m,
            Bua: n.BuiltupASqFt ?? n.BuiltupASqMtr ?? 0m,
            OcNo: FirstFilled(n.OCNo),
            OcDate: n.OCDate,
            Renter: FirstFilled(n.RenterName, n.RenterNameEnglish),
            Rent: n.RentMonthly ?? n.RentYearly,
            Alv: n.ALV ?? n.AnnualRentalValue,
            Rv: n.RateableValue ?? 0m,
            Cv: n.CapitalValue ?? n.NewTaxTotalCV,
            Tax: n.NewTaxTotal,
            HasImage: HasPhoto(n.PropertyPhotoDocumentGuid, n.Photos, ImageCodes),
            HasPlan: HasPhoto(n.PlanPhotoDocumentGuid, n.Photos, PlanCodes));
    }

    private static UnitFacts FactsOf(OldSurveyPropertyDto? o)
    {
        // No old property mapped: the Existing table shows an empty row.
        if (o == null || o.Id <= 0) return NoFacts;

        var flat = o.FlatOrShopNo ?? o.FlatOrShopName;
        return new UnitFacts(
            Prop: PropertyText(o.PropertyNo, o.OldPropertyNo, o.OldPartitionNo, flat),
            Flat: FirstFilled(flat),
            WgFl: FirstFilled(o.FloorCode, o.Floor),
            Type: FirstFilled(o.OldPropertyTypeName),
            Bhk: "-",
            Cty: FirstFilled(o.ConstructionCode, o.ConstructionType),
            Ayr: FirstFilled(o.OldAssessmentYear?.ToString(CultureInfo.InvariantCulture)),
            Cyr: FirstFilled(o.ConstructionYear),
            Use: FirstFilled(o.TypeOfUseCode, o.TypeOfUse, o.SubTypeOfUse),
            Cpt: o.CarpetASqFt ?? o.ConstructionArea ?? o.CarpetASqMtr ?? 0m,
            Bua: o.BuiltupASqFt ?? o.BuiltupASqMtr ?? 0m,
            OcNo: FirstFilled(o.OCNo, o.CSN),
            OcDate: o.OCDate,
            Renter: "-",
            Rent: null,
            Alv: o.ALV ?? o.AnnualRentalValue,
            Rv: o.RateableValue ?? 0m,
            Cv: o.CapitalValue ?? 0m,
            Tax: o.TotalTax ?? 0m,
            HasImage: HasPhoto(o.PropertyPhotoDocumentGuid, o.Photos, ImageCodes),
            HasPlan: HasPhoto(o.PlanPhotoDocumentGuid, o.Photos, PlanCodes));
    }

    // ── Values and their order ───────────────────────────────────────────────────────────────────────────────

    /// <summary>A number, a text or nothing. Numbers come before texts; nothing comes last.</summary>
    private readonly struct SortValue
    {
        private SortValue(decimal? number, string? text)
        {
            Number = number;
            Text = text;
        }

        public decimal? Number { get; }
        public string? Text { get; }
        public bool IsEmpty => Number == null && Text == null;

        public static SortValue Empty => default;
        public static SortValue OfNumber(decimal? number) => new(number, null);
        public static SortValue OfNumber(long number) => new(number, null);
        public static SortValue OfText(string? text) => string.IsNullOrWhiteSpace(text) || text.Trim() == "-" ? Empty : new(null, text.Trim());
    }

    private static SortValue NumberFromText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Trim() == "-") return SortValue.Empty;
        var cleaned = text.Replace("₹", string.Empty).Replace(",", string.Empty).Replace(" ", string.Empty);
        return decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out var n) ? SortValue.OfNumber(n) : SortValue.Empty;
    }

    /// <summary>Floor codes in floor order: G first, then 1, 2, 10 ... (numbers before any other text).</summary>
    private static SortValue FloorValue(string? code)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Trim() == "-") return SortValue.Empty;
        var c = code.Trim();
        if (string.Equals(c, "g", StringComparison.OrdinalIgnoreCase)) return SortValue.OfNumber(0m);
        return decimal.TryParse(c, NumberStyles.Number, CultureInfo.InvariantCulture, out var n) ? SortValue.OfNumber(n) : SortValue.OfText(c);
    }

    private static int Compare(SortValue a, SortValue b, bool descending)
    {
        if (a.IsEmpty && b.IsEmpty) return 0;
        if (a.IsEmpty) return 1;
        if (b.IsEmpty) return -1;

        int result;
        if (a.Number.HasValue && b.Number.HasValue) result = a.Number.Value.CompareTo(b.Number.Value);
        else if (a.Number.HasValue) result = -1;
        else if (b.Number.HasValue) result = 1;
        else result = NaturalCompare(a.Text!, b.Text!);

        return descending ? -result : result;
    }

    /// <summary>Text order with digit runs compared as numbers (S2 before S10), ignoring case and accents.</summary>
    public static int NaturalCompare(string x, string y)
    {
        int i = 0, j = 0;
        while (i < x.Length && j < y.Length)
        {
            if (char.IsDigit(x[i]) && char.IsDigit(y[j]))
            {
                var si = i;
                while (i < x.Length && char.IsDigit(x[i])) i++;
                var sj = j;
                while (j < y.Length && char.IsDigit(y[j])) j++;

                var dx = x[si..i].TrimStart('0');
                var dy = y[sj..j].TrimStart('0');
                if (dx.Length != dy.Length) return dx.Length.CompareTo(dy.Length);
                var byDigits = string.CompareOrdinal(dx, dy);
                if (byDigits != 0) return byDigits;
            }
            else
            {
                var si = i;
                while (i < x.Length && !char.IsDigit(x[i])) i++;
                var sj = j;
                while (j < y.Length && !char.IsDigit(y[j])) j++;

                var byText = string.Compare(x[si..i], y[sj..j], CultureInfo.InvariantCulture, CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace);
                if (byText != 0) return byText;
            }
        }

        return (x.Length - i).CompareTo(y.Length - j);
    }
}
