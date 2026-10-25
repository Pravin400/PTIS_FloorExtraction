using NtisPlatform.Application.Services;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class ApartmentQcTopSectionPerformanceCalculatorTests
{
    private readonly ApartmentQcTopSectionPerformanceCalculator _calculator = new();

    [Fact]
    public void ComputeAdditionalRevenue_ChangePercent_IsRelativeToOldCurrentTax()
    {
        // Old tax 100, new total tax 150 -> a genuine 50% increase over the old value
        var result = _calculator.ComputeAdditionalRevenue(currentTax: 150m, retroTax: null, oldCurrentTax: 100m, pendingCurrent: null);

        Assert.Equal(50m, result.DifferenceAmount);
        Assert.Equal(50d, result.ChangePercent);
    }

    [Fact]
    public void ComputeAdditionalRevenue_OldCurrentTaxZero_ChangePercentIsZero()
    {
        // When old tax is 0 or null, ChangePercent defaults to 0 instead of null
        var result = _calculator.ComputeAdditionalRevenue(currentTax: 150m, retroTax: null, oldCurrentTax: 0m, pendingCurrent: null);

        Assert.Equal(150m, result.DifferenceAmount);
        Assert.Equal(0d, result.ChangePercent);
    }

    [Fact]
    public void ComputeAdditionalRevenue_AllNullInputs_ReturnsAllZeros()
    {
        var result = _calculator.ComputeAdditionalRevenue(currentTax: null, retroTax: null, oldCurrentTax: null, pendingCurrent: null);

        Assert.Equal(0m, result.CurrentTax);
        Assert.Equal(0m, result.RetroTax);
        Assert.Equal(0m, result.TotalTax);
        Assert.Equal(0m, result.PendingCurrent);
        Assert.Equal(0m, result.PendingDemand);
        Assert.Equal(0m, result.TotalDemand);
        Assert.Equal(0m, result.Collection);
        Assert.Equal(0m, result.TotalBalance);
        Assert.Equal(0m, result.OldCurrentTax);
        Assert.Equal(0m, result.DifferenceAmount);
        Assert.Equal(0d, result.ChangePercent);
    }

    [Fact]
    public void ComputeAdditionalRevenue_TaxDecreased_ChangePercentIsNegative()
    {
        var result = _calculator.ComputeAdditionalRevenue(currentTax: 80m, retroTax: null, oldCurrentTax: 100m, pendingCurrent: null);

        Assert.Equal(-20m, result.DifferenceAmount);
        Assert.Equal(-20d, result.ChangePercent);
    }

    [Fact]
    public void ComputeAdditionalRevenue_TaxIncreaseGreaterThan100Percent_ShowsTheActualPercent()
    {
        // Old tax 100, new total tax 350 -> the change is +250 %, not limited to +100 %.
        var result = _calculator.ComputeAdditionalRevenue(currentTax: 350m, retroTax: null, oldCurrentTax: 100m, pendingCurrent: null);

        Assert.Equal(250m, result.DifferenceAmount);
        Assert.Equal(250d, result.ChangePercent);
    }

    [Fact]
    public void ComputeAdditionalRevenue_IsTotalTaxMinusOldTax_RetroIncluded_WithTheActualPercent()
    {
        // The figures of the QA property NKPUNE01-1-A8: current 4,65,644 + retro 18,62,576 = total 23,28,220; old tax 41,107.
        var result = _calculator.ComputeAdditionalRevenue(currentTax: 465644m, retroTax: 1862576m, oldCurrentTax: 41107m, pendingCurrent: 0m);

        Assert.Equal(2328220m, result.TotalTax);
        Assert.Equal(2287113m, result.DifferenceAmount);   // 23,28,220 - 41,107
        Assert.Equal(5563.8d, result.ChangePercent);       // 2287113 / 41107 * 100, not limited to 100 %
    }

    [Fact]
    public void ComputeAdditionalRevenue_TaxDecreasedToZero_IsMinus100Percent()
    {
        // Old tax 1000, new total tax 0 -> the change is -100 %
        var result = _calculator.ComputeAdditionalRevenue(currentTax: 0m, retroTax: 0m, oldCurrentTax: 1000m, pendingCurrent: 0m);

        Assert.Equal(-1000m, result.DifferenceAmount);
        Assert.Equal(-100d, result.ChangePercent);
    }
}
