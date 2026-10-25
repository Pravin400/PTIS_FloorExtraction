namespace NtisPlatform.Application.Helpers;

public static class WaterRateCalculationHelper
{
    public static (decimal applicableRate, string category) ResolveApplicableRate(
        decimal yearlyRate,
        decimal? monthlyRate,
        decimal? quarterlyRate)
    {
        if (monthlyRate.HasValue && monthlyRate.Value > 0 && yearlyRate == 0)
        {
            return (monthlyRate.Value, "Monthly");
        }

        if (quarterlyRate.HasValue && quarterlyRate.Value > 0 && yearlyRate == 0)
        {
            return (quarterlyRate.Value, "Quarterly");
        }

        return (yearlyRate, "Yearly");
    }

    public static decimal CalculateWaterBill(
        decimal yearlyRate,
        decimal? monthlyRate,
        decimal? quarterlyRate,
        int chargeMonths)
    {
        if (chargeMonths <= 0)
            return 0m;

        var (applicableRate, category) = ResolveApplicableRate(yearlyRate, monthlyRate, quarterlyRate);

        return category switch
        {
            "Monthly" => applicableRate * chargeMonths,
            "Quarterly" => Math.Ceiling(applicableRate / 3m * chargeMonths),
            _ => Math.Ceiling(yearlyRate / 12m * chargeMonths)
        };
    }
}
