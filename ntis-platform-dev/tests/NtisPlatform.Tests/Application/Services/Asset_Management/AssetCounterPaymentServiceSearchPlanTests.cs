using NtisPlatform.Application.DTOs.Asset_Management.AssetCounterPayment;
using NtisPlatform.Application.Services.Asset_Management;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Tests for <see cref="AssetCounterPaymentService.BuildSearchPlan"/> — how the counter search box
/// text is identified as mobile / asset id / shop no / asset no / name, and in what order the
/// fields are tried. Pure logic, no database.
/// </summary>
public class AssetCounterPaymentServiceSearchPlanTests
{
    private static List<string> Steps(string? text)
        => AssetCounterPaymentService.BuildSearchPlan(text).Select(s => $"{s.Field}:{s.MatchType}").ToList();

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void BlankText_ReturnsEmptyPlan(string? text)
    {
        Assert.Empty(AssetCounterPaymentService.BuildSearchPlan(text));
    }

    [Theory]
    [InlineData("9876543210")]
    [InlineData("98765 43210")]
    [InlineData("+91-9876543210")]
    [InlineData("+91 98765 43210")]
    [InlineData("919876543210")]
    [InlineData("09876543210")]
    public void MobileNumber_TriesTenantMobileFirst_WithBareTenDigits(string text)
    {
        var first = AssetCounterPaymentService.BuildSearchPlan(text)[0];

        Assert.Equal(CounterPaymentSearchField.TenantMobile, first.Field);
        Assert.Equal(CounterPaymentMatchType.Exact, first.MatchType);
        Assert.Equal("9876543210", first.Value);
    }

    [Fact]
    public void MobileNumber_HasNoAssetIdOrPartialMobileStep()
    {
        var steps = Steps("9876543210");

        Assert.DoesNotContain($"{CounterPaymentSearchField.AssetId}:{CounterPaymentMatchType.Exact}", steps);
        Assert.DoesNotContain($"{CounterPaymentSearchField.TenantMobile}:{CounterPaymentMatchType.Partial}", steps);
    }

    [Theory]
    [InlineData("5876543210")] // Indian mobiles start 6-9
    [InlineData("987654321")]  // 9 digits
    public void NotAMobileNumber_HasNoExactMobileStep(string text)
    {
        Assert.DoesNotContain($"{CounterPaymentSearchField.TenantMobile}:{CounterPaymentMatchType.Exact}", Steps(text));
    }

    [Fact]
    public void ShortNumber_TriesAssetIdThenShopNoThenAssetNo_ExactOnlyPlusAssetNoPartial()
    {
        Assert.Equal(
            new[]
            {
                $"{CounterPaymentSearchField.AssetId}:{CounterPaymentMatchType.Exact}",
                $"{CounterPaymentSearchField.ShopNo}:{CounterPaymentMatchType.Exact}",
                $"{CounterPaymentSearchField.AssetNo}:{CounterPaymentMatchType.Exact}",
                $"{CounterPaymentSearchField.AssetNo}:{CounterPaymentMatchType.Partial}"
            },
            Steps("125"));
    }

    [Fact]
    public void NumberWithLeadingZero_IsNotAnAssetId()
    {
        Assert.DoesNotContain($"{CounterPaymentSearchField.AssetId}:{CounterPaymentMatchType.Exact}", Steps("0125"));
    }

    [Fact]
    public void NumberTooLargeForInt_IsNotAnAssetId()
    {
        Assert.DoesNotContain($"{CounterPaymentSearchField.AssetId}:{CounterPaymentMatchType.Exact}", Steps("99999999999"));
    }

    [Fact]
    public void DigitRunOfFiveOrMore_TriesPartialMobile()
    {
        Assert.Contains($"{CounterPaymentSearchField.TenantMobile}:{CounterPaymentMatchType.Partial}", Steps("43210"));
        Assert.DoesNotContain($"{CounterPaymentSearchField.TenantMobile}:{CounterPaymentMatchType.Partial}", Steps("4321"));
    }

    [Fact]
    public void AssetCode_TriesExactCodesThenPartialCodeThenNames()
    {
        Assert.Equal(
            new[]
            {
                $"{CounterPaymentSearchField.ShopNo}:{CounterPaymentMatchType.Exact}",
                $"{CounterPaymentSearchField.AssetNo}:{CounterPaymentMatchType.Exact}",
                $"{CounterPaymentSearchField.AssetNo}:{CounterPaymentMatchType.Partial}",
                $"{CounterPaymentSearchField.TenantName}:{CounterPaymentMatchType.Partial}",
                $"{CounterPaymentSearchField.ShopName}:{CounterPaymentMatchType.Partial}",
                $"{CounterPaymentSearchField.AssetName}:{CounterPaymentMatchType.Partial}"
            },
            Steps("AMC-BLD-SHP-0001"));
    }

    [Fact]
    public void Name_IncludesTenantShopAndAssetNameSteps()
    {
        var steps = Steps("Ramesh");

        Assert.Contains($"{CounterPaymentSearchField.TenantName}:{CounterPaymentMatchType.Partial}", steps);
        Assert.Contains($"{CounterPaymentSearchField.ShopName}:{CounterPaymentMatchType.Partial}", steps);
        Assert.Contains($"{CounterPaymentSearchField.AssetName}:{CounterPaymentMatchType.Partial}", steps);
        Assert.DoesNotContain($"{CounterPaymentSearchField.AssetId}:{CounterPaymentMatchType.Exact}", steps);
    }

    [Fact]
    public void TextShorterThanPartialMinimum_OnlyTriesExactCodes()
    {
        Assert.Equal(
            new[]
            {
                $"{CounterPaymentSearchField.ShopNo}:{CounterPaymentMatchType.Exact}",
                $"{CounterPaymentSearchField.AssetNo}:{CounterPaymentMatchType.Exact}"
            },
            Steps("G1"));
    }

    [Fact]
    public void Text_IsTrimmedAndInnerWhitespaceCollapsed()
    {
        var plan = AssetCounterPaymentService.BuildSearchPlan("  Ram   Kumar ");

        Assert.All(plan, s => Assert.Equal("Ram Kumar", s.Value));
    }
}
