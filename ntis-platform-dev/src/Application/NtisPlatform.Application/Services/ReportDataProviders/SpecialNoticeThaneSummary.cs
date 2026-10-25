namespace NtisPlatform.Application.Services.ReportDataProviders;

internal enum SpecialNoticeSummaryColumn
{
    NonResidential, Amenity, Residential, ResidentialNonResidential
}

internal sealed record SpecialNoticeSummaryDetail(
    int PropertyId, int DetailId, SpecialNoticeSummaryColumn Column,
    bool IsTaxable, decimal? CarpetArea, decimal? RateableValue);

internal sealed record SpecialNoticeSummaryTotals(
    int PropertyCount, decimal? CarpetArea, decimal? RateableValue);

internal sealed class SpecialNoticeThaneSummary
{
    public static SpecialNoticeSummaryColumn Classify(string? partType, string? propertyType, string? usageType)
    {
        var part = partType?.Trim().ToUpperInvariant();
        var type = propertyType?.Trim().ToUpperInvariant();
        var usage = usageType?.Trim().ToUpperInvariant();
        if (part == "AMENITY" || type == "AMENITY") return SpecialNoticeSummaryColumn.Amenity;
        var residential = part is "R" or "RESIDENTIAL" or "NIVASI" or "निवासी"
            || type is "R" or "N" or "RESIDENTIAL";
        var commercial = part is "C" or "COMMERCIAL" or "NON-RESIDENTIAL" or "ANIVASI" or "अनिवासी"
            || type is "C" or "I" or "I-C" or "R-C" or "COMMERCIAL";
        if (residential)
        {
            if (usage is "C" or "I" or "I-C" or "R-C") return SpecialNoticeSummaryColumn.ResidentialNonResidential;
            if (usage is "R" or "N" or "RESIDENTIAL") return SpecialNoticeSummaryColumn.Residential;
        }
        else if (commercial) return SpecialNoticeSummaryColumn.NonResidential;
        throw new InvalidOperationException($"Unsupported Special Notice summary classification: PartType='{partType}', PropertyType='{propertyType}', UsageType='{usageType}'.");
    }

    public IReadOnlyDictionary<SpecialNoticeSummaryColumn, SpecialNoticeSummaryTotals> Columns { get; }
    public SpecialNoticeSummaryTotals Total { get; }

    public SpecialNoticeThaneSummary(IEnumerable<SpecialNoticeSummaryDetail> source)
    {
        var details = source.ToList();
        if (details.GroupBy(d => new { d.PropertyId, d.DetailId }).Any(g => g.Count() > 1))
            throw new InvalidOperationException("Duplicate property details in Special Notice summary.");
        Columns = Enum.GetValues<SpecialNoticeSummaryColumn>().ToDictionary(
            column => column, column => Aggregate(details.Where(d => d.Column == column).ToList()));
        Total = Aggregate(details);
    }

    private static SpecialNoticeSummaryTotals Aggregate(IReadOnlyList<SpecialNoticeSummaryDetail> details)
    {
        var taxable = details.Where(d => d.IsTaxable).ToList();
        return new(details.Select(d => d.PropertyId).Distinct().Count(),
            Sum(taxable.Select(d => d.CarpetArea)),
            Sum(taxable.Select(d => d.RateableValue)));
    }

    private static decimal? Sum(IEnumerable<decimal?> source)
    {
        var values = source.ToList();
        return values.Any(v => !v.HasValue) ? null : values.Sum(v => v ?? 0m);
    }

    public IReadOnlyList<object> Rows => new object[]
    {
        Row("Number of Properties", value => value.PropertyCount),
        Row("Taxable Carpet Area (sq.m.)", value => value.CarpetArea),
        Row("Rateable Value Rs.", value => value.RateableValue)
    };

    private object Row(string description, Func<SpecialNoticeSummaryTotals, object?> value) => new
    {
        description,
        nonResidential = value(Columns[SpecialNoticeSummaryColumn.NonResidential]),
        amenity = value(Columns[SpecialNoticeSummaryColumn.Amenity]),
        residential = value(Columns[SpecialNoticeSummaryColumn.Residential]),
        residentialNonResidential = value(Columns[SpecialNoticeSummaryColumn.ResidentialNonResidential]),
        total = value(Total)
    };
}
