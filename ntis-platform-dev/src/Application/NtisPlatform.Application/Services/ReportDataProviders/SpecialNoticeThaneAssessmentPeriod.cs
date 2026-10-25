namespace NtisPlatform.Application.Services.ReportDataProviders;

internal sealed record SpecialNoticePeriodDetail(DateTime FromDate, DateTime ToDate);
internal sealed record SpecialNoticeAssessmentPeriod(DateTime FromDate, DateTime ToDate, int TotalDays);

internal static class SpecialNoticeThaneAssessmentPeriod
{
    public static SpecialNoticeAssessmentPeriod? Resolve(
        string? status, DateTime? from, DateTime? to, IEnumerable<SpecialNoticePeriodDetail> details)
    {
        if (!string.Equals(status, "Calculated", StringComparison.OrdinalIgnoreCase)) return null;
        if (!from.HasValue || !to.HasValue)
        {
            var periods = details.ToList();
            if (periods.Any(p => p.ToDate.Date < p.FromDate.Date))
                throw new InvalidOperationException("Invalid Special Notice assessment detail period.");
            if (periods.Count > 0)
            {
                from ??= periods.Min(p => p.FromDate);
                to ??= periods.Max(p => p.ToDate);
            }
        }
        if (!from.HasValue || !to.HasValue) return null;
        var start = from.Value.Date;
        var end = to.Value.Date;
        if (end < start)
            throw new InvalidOperationException("Special Notice assessment To Date precedes From Date.");
        return new(start, end, (end - start).Days + 1);
    }
}
