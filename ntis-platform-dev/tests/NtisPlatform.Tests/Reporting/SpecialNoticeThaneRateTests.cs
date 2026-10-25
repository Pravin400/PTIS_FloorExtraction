using NtisPlatform.Application.Services.ReportDataProviders;

namespace NtisPlatform.Tests.Reporting;

public class SpecialNoticeThaneRateTests
{
    [Fact]
    public void DifferentAssessmentYearsDisplayBothRatesInYearOrder()
    {
        Assert.Equal("2015: 236.81; 2022: 1420.84",
            SpecialNoticeThaneDataProvider.ResolveStandardRentDisplay(
                new[] { (2022, 1, (decimal?)1420.84m), (2015, 1, (decimal?)236.81m) }, "C"));
    }

    [Fact]
    public void ConflictingRatesWithinTheSameContextStillFail()
    {
        Assert.Throws<InvalidOperationException>(() => SpecialNoticeThaneDataProvider.ResolveStandardRentDisplay(
            new[] { (2022, 1, (decimal?)2.85m), (2022, 1, (decimal?)3.10m) }, "C"));
    }

    [Fact]
    public void SharedRatePreservesExistingNumericField()
    {
        Assert.Equal(2.85m, Assert.IsType<decimal>(SpecialNoticeThaneDataProvider.ResolveStandardRentDisplay(
            new[] { (2015, 1, (decimal?)2.85m), (2022, 1, (decimal?)2.85m) }, "C")));
    }

    [Fact]
    public void MultipleConstructionContextsInOneYearAreDistinguished()
    {
        Assert.Equal("2022 (construction 1): 2.85; 2022 (construction 2): 3.10",
            SpecialNoticeThaneDataProvider.ResolveStandardRentDisplay(
                new[] { (2022, 2, (decimal?)3.10m), (2022, 1, (decimal?)2.85m) }, "C"));
    }

    [Fact]
    public void IncompleteContextDoesNotProduceAPartialDisplay()
    {
        Assert.Null(SpecialNoticeThaneDataProvider.ResolveStandardRentDisplay(
            new[] { (2015, 1, (decimal?)236.81m), (2022, 1, (decimal?)null) }, "C"));
    }

    [Fact]
    public void SameRateAcrossContextsCanBeDisplayedOnce()
    {
        Assert.Equal(2.85m, SpecialNoticeThaneDataProvider.ResolveStandardRentRate(
            new decimal?[] { 2.85m, 2.85m }, "R"));
    }

    [Fact]
    public void DifferentRatesCannotBeSilentlyCollapsed()
    {
        Assert.Throws<InvalidOperationException>(() => SpecialNoticeThaneDataProvider.ResolveStandardRentRate(
            new decimal?[] { 2.85m, 3.10m }, "R"));
    }

    [Fact]
    public void MissingRateStaysMissingRatherThanBecomingZero()
    {
        Assert.Null(SpecialNoticeThaneDataProvider.ResolveStandardRentRate(Array.Empty<decimal?>(), "C"));
        Assert.Null(SpecialNoticeThaneDataProvider.ResolveStandardRentRate(new decimal?[] { 2.85m, null }, "R"));
        Assert.Equal(0m, SpecialNoticeThaneDataProvider.ResolveStandardRentRate(new decimal?[] { 0m }, "R"));
    }
}

public class SpecialNoticeThaneOldWardRateTests
{
    private static readonly SpecialNoticeThaneDataProvider.OldWardRentRow[] Rows =
    [
        new("126", "A", "2.65", "8.75"),
        new("126", "C", "1.60", "5.25"),
        new("126", "E", "1.30", "4.40"),
        new("127", "A", "99", "99")
    ];

    [Theory]
    [InlineData("A", false, "2.65")]
    [InlineData("A", true, "8.75")]
    [InlineData("C", false, "1.60")]
    [InlineData("C", true, "5.25")]
    [InlineData("E", false, "1.30")]
    [InlineData("E", true, "4.40")]
    public void SelectsTheMatchingWardAndConstructionRate(string code, bool commercial, string expected)
    {
        var actual = SpecialNoticeThaneDataProvider.ResolveOldWardRentDisplay(["126"], [code], Rows, commercial);
        Assert.Equal(expected, Assert.IsType<string>(actual));
    }

    [Fact]
    public void MultipleConstructionTypesDisplayTheirOwnRates()
        => Assert.Equal("126/A: 2.65; 126/C: 1.60", SpecialNoticeThaneDataProvider.ResolveOldWardRentDisplay(
            ["126"], ["C", "A"], Rows, false));

    [Fact]
    public void MissingWardOrConstructionDoesNotUseAnotherRow()
    {
        Assert.Null(SpecialNoticeThaneDataProvider.ResolveOldWardRentDisplay(["128"], ["A"], Rows, false));
        Assert.Null(SpecialNoticeThaneDataProvider.ResolveOldWardRentDisplay(["126"], ["B"], Rows, false));
    }

    [Fact]
    public void ConflictingRatesForTheSameWardAndConstructionStillFail()
        => Assert.Throws<InvalidOperationException>(() => SpecialNoticeThaneDataProvider.ResolveOldWardRentDisplay(
            ["126"], ["A"], Rows.Append(new("126", "A", "9.99", "8.75")), false));
}
