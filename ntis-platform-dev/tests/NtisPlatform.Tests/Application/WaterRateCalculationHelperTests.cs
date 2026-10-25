using NtisPlatform.Application.Helpers;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class WaterRateCalculationHelperTests
{
    [Fact]
    public void ResolveApplicableRate_WhenYearlyRateProvided_ReturnsYearly()
    {
        var (rate, category) = WaterRateCalculationHelper.ResolveApplicableRate(1200m, null, null);
        Assert.Equal(1200m, rate);
        Assert.Equal("Yearly", category);
    }

    [Fact]
    public void ResolveApplicableRate_WhenYearlyRateAndMonthlyRateProvided_PrefersYearly()
    {
        var (rate, category) = WaterRateCalculationHelper.ResolveApplicableRate(1200m, 100m, null);
        Assert.Equal(1200m, rate);
        Assert.Equal("Yearly", category);
    }

    [Fact]
    public void ResolveApplicableRate_WhenOnlyMonthlyRateProvided_ReturnsMonthly()
    {
        var (rate, category) = WaterRateCalculationHelper.ResolveApplicableRate(0m, 150m, null);
        Assert.Equal(150m, rate);
        Assert.Equal("Monthly", category);
    }

    [Fact]
    public void ResolveApplicableRate_WhenOnlyQuarterlyRateProvided_ReturnsQuarterly()
    {
        var (rate, category) = WaterRateCalculationHelper.ResolveApplicableRate(0m, null, 450m);
        Assert.Equal(450m, rate);
        Assert.Equal("Quarterly", category);
    }

    [Fact]
    public void ResolveApplicableRate_WhenAllRatesZero_ReturnsYearlyZero()
    {
        var (rate, category) = WaterRateCalculationHelper.ResolveApplicableRate(0m, 0m, 0m);
        Assert.Equal(0m, rate);
        Assert.Equal("Yearly", category);
    }

    [Fact]
    public void CalculateWaterBill_FullYearWithYearlyRate_CalculatesFullBill()
    {
        var bill = WaterRateCalculationHelper.CalculateWaterBill(1200m, null, null, 12);
        Assert.Equal(1200m, bill);
    }

    [Fact]
    public void CalculateWaterBill_PartialYearWithYearlyRate_CalculatesProRataBill()
    {
        var bill = WaterRateCalculationHelper.CalculateWaterBill(1200m, null, null, 6);
        Assert.Equal(600m, bill);
    }

    [Fact]
    public void CalculateWaterBill_MonthlyRate_CalculatesMonthlyBill()
    {
        var bill = WaterRateCalculationHelper.CalculateWaterBill(0m, 100m, null, 12);
        Assert.Equal(1200m, bill);

        var partialBill = WaterRateCalculationHelper.CalculateWaterBill(0m, 100m, null, 5);
        Assert.Equal(500m, partialBill);
    }

    [Fact]
    public void CalculateWaterBill_QuarterlyRate_CalculatesQuarterlyBill()
    {
        var bill = WaterRateCalculationHelper.CalculateWaterBill(0m, null, 300m, 6);
        Assert.Equal(600m, bill);

        var partialBill = WaterRateCalculationHelper.CalculateWaterBill(0m, null, 300m, 4);
        Assert.Equal(400m, partialBill);
    }

    [Fact]
    public void CalculateWaterBill_ZeroOrNegativeMonths_ReturnsZero()
    {
        Assert.Equal(0m, WaterRateCalculationHelper.CalculateWaterBill(1200m, null, null, 0));
        Assert.Equal(0m, WaterRateCalculationHelper.CalculateWaterBill(1200m, null, null, -1));
    }
}
