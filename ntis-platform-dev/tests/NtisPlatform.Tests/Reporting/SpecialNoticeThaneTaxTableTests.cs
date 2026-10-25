using NtisPlatform.Application.Services.ReportDataProviders;
using System.Text.Json;

namespace NtisPlatform.Tests.Reporting;

public class SpecialNoticeThaneTaxTableTests
{
    private static SpecialNoticeTaxHead[] Heads =>
    [new(1, "GEN", "General Tax", 1, true, true, "TAX"),
     new(2, "TaxTotal", "TaxTotal", 99, true, false, "TAX"),
     new(3, "SERVICE", "Service Tax", 3, true, false, "TAX"),
     new(4, "ILLEGAL", "Penalty", 4, true, false, "TAX")];

    [Fact]
    public void SplitsAllSavedYearsAndIncludesPenaltyOnceWithoutAddingStoredTotals()
    {
        var table = SpecialNoticeThaneTaxTable.FromSavedDemand(2026, Heads,
        [new(1, 2023, 1, 10m), new(2, 2025, 1, 20m), new(3, 2025, 4, 2m),
         new(4, 2025, 2, 22m), new(5, 2026, 1, 30m), new(6, 2026, 4, 3m),
         new(7, 2026, 2, 33m), new(8, 2027, 1, 999m)], new Dictionary<int, SpecialNoticeTaxRates>());
        Assert.Equal(30m, table.PreviousSubtotal);
        Assert.Equal(30m, table.CurrentSubtotal);
        Assert.Equal(32m, table.PreviousTotal);
        Assert.Equal(33m, table.CurrentTotal);
        Assert.Equal("Previous Tax Before 01/04/2026", table.PreviousHeading);
        Assert.Equal("FY 2026-27 Tax", table.CurrentHeading);
        var rows = JsonSerializer.SerializeToElement(table.Rows);
        Assert.Equal(15, rows.GetArrayLength());
        Assert.Equal(65m, rows[14].GetProperty("totalTax").GetDecimal());
        Assert.DoesNotContain(rows.EnumerateArray(), row => row.GetProperty("taxCode").GetString() == "TAXTOTAL");
    }

    [Fact]
    public void AdditionalSavedHeadsAreVisibleAndBalanceWithTheSubtotal()
    {
        var table = SpecialNoticeThaneTaxTable.FromSavedDemand(2026, Heads,
            [new(1, 2025, 3, 5m), new(2, 2026, 3, 25m)], new Dictionary<int, SpecialNoticeTaxRates>());
        var rows = JsonSerializer.SerializeToElement(table.Rows).EnumerateArray().ToArray();
        var service = Assert.Single(rows, row => row.GetProperty("taxCode").GetString() == "SERVICE");
        Assert.Equal("Service Tax", service.GetProperty("taxName").GetString());
        Assert.Equal(5m, service.GetProperty("previousTax").GetDecimal());
        Assert.Equal(25m, service.GetProperty("currentTax").GetDecimal());
        Assert.Equal(table.CurrentSubtotal, rows.Where(row => row.GetProperty("rowType").GetString() == "tax")
            .Sum(row => row.GetProperty("currentTax").GetDecimal()));
        Assert.Equal(16, rows.Length);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void SanitationMasterControlsVisibilityWhenPropertyHasNoSavedTaxes(bool active)
    {
        var heads = Heads.Append(new SpecialNoticeTaxHead(77, "SANITATION", "Sanitation from master",
            12, active, true, "TAX"));
        var rates = new Dictionary<int, SpecialNoticeTaxRates>
            { [77] = SpecialNoticeTaxRates.From([1m], [2m]) };
        var table = SpecialNoticeThaneTaxTable.FromSavedDemand(2026, heads, [], rates);
        var rows = JsonSerializer.SerializeToElement(table.Rows).EnumerateArray().ToArray();
        var sanitation = rows.Where(row => row.GetProperty("taxCode").GetString() == "SANITATION").ToArray();
        if (active)
        {
            var row = Assert.Single(sanitation);
            Assert.Equal("Sanitation from master", row.GetProperty("taxName").GetString());
            Assert.Equal(1m, row.GetProperty("residentialRate").GetDecimal());
            Assert.Equal(2m, row.GetProperty("nonResidentialRate").GetDecimal());
            Assert.Equal(0m, row.GetProperty("currentTax").GetDecimal());
            Assert.Equal(0m, row.GetProperty("previousTax").GetDecimal());
        }
        else Assert.Empty(sanitation);
        Assert.Equal(0m, table.CurrentTotal);
        Assert.Equal(0m, table.PreviousTotal);
    }

    [Theory]
    [InlineData(0, 33)]
    [InlineData(2, 35)]
    public void SavedAssessmentPenaltyIsAddedOnceIndependentlyOfIllegalDemand(decimal illegal, decimal expected)
    {
        var table = SpecialNoticeThaneTaxTable.FromSavedDemand(2026, Heads,
            [new(1, 2025, 1, 20m), new(2, 2026, 1, 30m), new(3, 2026, 4, illegal),
             new(4, 2026, 2, 999m)], new Dictionary<int, SpecialNoticeTaxRates>(),
            [new(2025, 4m), new(2026, 1m), new(2026, 2m), new(2027, 999m)]);

        Assert.Equal(20m, table.PreviousSubtotal);
        Assert.Equal(4m, table.PreviousPenalty);
        Assert.Equal(24m, table.PreviousTotal);
        Assert.Equal(30m, table.CurrentSubtotal);
        Assert.Equal(3m + illegal, table.CurrentPenalty);
        Assert.Equal(expected, table.CurrentTotal);
        var rows = JsonSerializer.SerializeToElement(table.Rows).EnumerateArray().ToArray();
        Assert.Equal(15, rows.Length);
        var penalty = Assert.Single(rows, row => row.GetProperty("rowType").GetString() == "penalty");
        Assert.Equal(3m + illegal, penalty.GetProperty("currentTax").GetDecimal());
        Assert.Equal(table.CurrentSubtotal, rows.Where(row => row.GetProperty("rowType").GetString() == "tax")
            .Sum(row => row.GetProperty("currentTax").GetDecimal()));
        Assert.Equal(expected + 24m, rows[^1].GetProperty("totalTax").GetDecimal());
    }

    [Fact]
    public void MultipleSavedPolicyContributionsAreSummedPerHeadWithoutRoundingAgain()
    {
        var table = SpecialNoticeThaneTaxTable.FromSavedDemand(2026, Heads,
            [new(1, 2026, 1, 10.25m), new(2, 2026, 1, 10.25m)], new Dictionary<int, SpecialNoticeTaxRates>());
        Assert.Equal(20.50m, table.CurrentTotal);
        Assert.Equal(20.50m, JsonSerializer.SerializeToElement(table.Rows)[0].GetProperty("currentTax").GetDecimal());
    }

    [Fact]
    public void EmptySavedDataShowsAnEmptyBreakup()
    {
        var table = SpecialNoticeThaneTaxTable.FromSavedDemand(2026, Heads, [], new Dictionary<int, SpecialNoticeTaxRates>());
        Assert.Equal(0m, table.CurrentTotal);
        Assert.Equal(0m, table.PreviousTotal);
        Assert.Equal(15, table.Rows.Count);
    }

    [Fact]
    public void UnknownTaxHeadsCannotBeSilentlyHidden()
    {
        Assert.Throws<InvalidOperationException>(() => SpecialNoticeThaneTaxTable.FromSavedDemand(
            2026, Heads, [new(1, 2026, 999, 25m)], new Dictionary<int, SpecialNoticeTaxRates>()));
    }

    [Fact]
    public void StoredSummaryNeverChangesVisibleHeadAmounts()
    {
        var table = SpecialNoticeThaneTaxTable.FromSavedDemand(2026, Heads,
            [new(1, 2026, 1, 25m), new(2, 2026, 2, 999m)], new Dictionary<int, SpecialNoticeTaxRates>());
        Assert.Equal(25m, table.CurrentTotal);
    }

    [Fact]
    public void DifferentPercentagesAreDisplayedWithoutChoosingOne()
    {
        var rates = SpecialNoticeTaxRates.From([10m, 13m, 10m], []);
        Assert.Null(rates.Residential);
        Assert.Equal("10 / 13", rates.ResidentialText);
        Assert.Equal("-", rates.CommercialText);
        Assert.Equal(0m, SpecialNoticeTaxRates.From([0m], []).Residential);
    }
}
public class SpecialNoticeThaneAssessmentPeriodTests
{
    [Fact]
    public void ScreenshotPeriodCountsBothEndpoints()
    {
        var result = SpecialNoticeThaneAssessmentPeriod.Resolve("Calculated",
            new DateTime(2023, 7, 13), new DateTime(2027, 3, 31), Array.Empty<SpecialNoticePeriodDetail>());
        Assert.NotNull(result);
        Assert.Equal(1358, result.TotalDays);
    }

    [Fact]
    public void SameDayIsOneDayRegardlessOfTime()
    {
        var result = SpecialNoticeThaneAssessmentPeriod.Resolve("Calculated",
            new DateTime(2026, 10, 8, 23, 0, 0), new DateTime(2026, 10, 8, 1, 0, 0),
            Array.Empty<SpecialNoticePeriodDetail>());
        Assert.Equal(1, result!.TotalDays);
    }

    [Fact]
    public void MissingHeaderDatesUseDetailEnvelope()
    {
        var result = SpecialNoticeThaneAssessmentPeriod.Resolve("Calculated", null, null, new[]
        {
            new SpecialNoticePeriodDetail(new DateTime(2024, 4, 1), new DateTime(2025, 3, 31)),
            new SpecialNoticePeriodDetail(new DateTime(2023, 7, 13), new DateTime(2024, 3, 31))
        });
        Assert.Equal(new DateTime(2023, 7, 13), result!.FromDate);
        Assert.Equal(new DateTime(2025, 3, 31), result.ToDate);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("ManualReview")]
    [InlineData("Failed")]
    public void UnconfirmedCalculationDoesNotPublishDates(string? status)
    {
        Assert.Null(SpecialNoticeThaneAssessmentPeriod.Resolve(status,
            new DateTime(2023, 7, 13), new DateTime(2027, 3, 31), Array.Empty<SpecialNoticePeriodDetail>()));
    }

    [Fact]
    public void MissingAndReversedPeriodsAreHandledExplicitly()
    {
        Assert.Null(SpecialNoticeThaneAssessmentPeriod.Resolve("Calculated", null, null,
            Array.Empty<SpecialNoticePeriodDetail>()));
        Assert.Throws<InvalidOperationException>(() => SpecialNoticeThaneAssessmentPeriod.Resolve("Calculated",
            new DateTime(2027, 3, 31), new DateTime(2023, 7, 13), Array.Empty<SpecialNoticePeriodDetail>()));
    }
}
