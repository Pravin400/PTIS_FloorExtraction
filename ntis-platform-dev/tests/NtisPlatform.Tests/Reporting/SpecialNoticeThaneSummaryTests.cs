using MockQueryable;
using Moq;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using System.Reflection;
using System.Text.Json;

namespace NtisPlatform.Tests.Reporting;

public class SpecialNoticeThaneSummaryTests
{
    [Fact]
    public void MultipleFloorsCountOnePropertyAndUseCarpetArea()
    {
        var summary = new SpecialNoticeThaneSummary(new[]
        {
            new SpecialNoticeSummaryDetail(10, 1, SpecialNoticeSummaryColumn.Residential, true, 100m, 500m),
            new SpecialNoticeSummaryDetail(10, 2, SpecialNoticeSummaryColumn.Residential, true, 50m, 250m)
        });
        Assert.Equal(1, summary.Total.PropertyCount);
        Assert.Equal(150m, summary.Total.CarpetArea);
        Assert.Equal(750m, summary.Total.RateableValue);
        Assert.Equal(3, summary.Rows.Count);
        var areaRow = System.Text.Json.JsonSerializer.SerializeToElement(summary.Rows[1]);
        Assert.Equal("Taxable Carpet Area (sq.m.)", areaRow.GetProperty("description").GetString());
        Assert.Equal(150m, areaRow.GetProperty("total").GetDecimal());
    }

    [Fact]
    public void MixedUseSplitsAmountsWithoutCountingPropertyTwiceInGrandTotal()
    {
        var summary = new SpecialNoticeThaneSummary(new[]
        {
            new SpecialNoticeSummaryDetail(10, 1, SpecialNoticeSummaryColumn.Residential, true, 100m, 500m),
            new SpecialNoticeSummaryDetail(10, 2, SpecialNoticeSummaryColumn.ResidentialNonResidential, true, 50m, 250m)
        });
        Assert.Equal(1, summary.Columns[SpecialNoticeSummaryColumn.Residential].PropertyCount);
        Assert.Equal(1, summary.Columns[SpecialNoticeSummaryColumn.ResidentialNonResidential].PropertyCount);
        Assert.Equal(1, summary.Total.PropertyCount);
        Assert.Equal(150m, summary.Total.CarpetArea);
        Assert.Equal(750m, summary.Total.RateableValue);
    }

    [Theory]
    [InlineData("R", "R", "R", "Residential")]
    [InlineData("Residential", "R", "C", "ResidentialNonResidential")]
    [InlineData("C", "C", "C", "NonResidential")]
    [InlineData("Commercial", "I", "C", "NonResidential")]
    [InlineData("Amenity", "R", "C", "Amenity")]
    public void CategoriesStaySeparate(string part, string type, string usage, string expected)
    {
        Assert.Equal(expected, SpecialNoticeThaneSummary.Classify(part, type, usage).ToString());
    }

    [Fact]
    public void NonTaxableDetailsDoNotContributeAreaOrRv()
    {
        var summary = new SpecialNoticeThaneSummary(new[]
        {
            new SpecialNoticeSummaryDetail(10, 1, SpecialNoticeSummaryColumn.Residential, false, 80m, 900m)
        });
        Assert.Equal(1, summary.Total.PropertyCount);
        Assert.Equal(0m, summary.Total.CarpetArea);
        Assert.Equal(0m, summary.Total.RateableValue);
    }

    [Fact]
    public void MissingDataIsBlankButEmptyCategoriesAreZero()
    {
        var summary = new SpecialNoticeThaneSummary(new[]
        {
            new SpecialNoticeSummaryDetail(10, 1, SpecialNoticeSummaryColumn.Residential, true, null, null)
        });
        Assert.Null(summary.Total.CarpetArea);
        Assert.Null(summary.Total.RateableValue);
        Assert.Equal(0m, summary.Columns[SpecialNoticeSummaryColumn.Amenity].RateableValue);
    }

    [Fact]
    public void DuplicateDetailsAndUnknownCategoriesFailExplicitly()
    {
        var detail = new SpecialNoticeSummaryDetail(10, 1, SpecialNoticeSummaryColumn.Residential, true, 80m, 900m);
        Assert.Throws<InvalidOperationException>(() => new SpecialNoticeThaneSummary(new[] { detail, detail }));
        Assert.Throws<InvalidOperationException>(() => SpecialNoticeThaneSummary.Classify("Unknown", null, "R"));
    }
}

public class SpecialNoticeThaneStructureOwnerTests
{
    [Theory]
    [InlineData("PROPERTY OWNER", "Regional Owner", "PROPERTY OWNER")]
    [InlineData(null, "Regional Owner", "Regional Owner")]
    [InlineData("", "Regional Owner", "Regional Owner")]
    [InlineData("-", "Regional Owner", "Regional Owner")]
    [InlineData(null, null, "-")]
    public async Task NoticeUsesPropertyOwnerRatherThanSocietyBuilder(string? english, string? regional, string expected)
    {
        var property = new PropertyEntity { Id = 104, IsActive = true, OwnerNameEnglish = english, OwnerName = regional };
        var society = new SocietyDetailsEntity
        {
            Id = 1, PropertyId = 104, IsActive = true, BuilderNameEnglish = "UNRELATED BUILDER",
            LandOwnerNameEnglish = "LAND OWNER", SocietyNameEnglish = "SOCIETY"
        };
        var policy = new Mock<IPolicyConfigurationService>();
        policy.Setup(p => p.GetPolicyValuesAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, string>());
        var constructor = typeof(SpecialNoticeThaneDataProvider).GetConstructors().Single();
        var args = constructor.GetParameters().Select(p =>
        {
            if (p.ParameterType.IsGenericType && p.ParameterType.GetGenericTypeDefinition() == typeof(IReportDataRepository<>))
            {
                var entity = p.ParameterType.GetGenericArguments()[0];
                object[] rows = entity == typeof(PropertyEntity) ? [property] : entity == typeof(SocietyDetailsEntity) ? [society] : [];
                return typeof(SpecialNoticeThaneStructureOwnerTests).GetMethod(nameof(Repository), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entity).Invoke(null, [rows]);
            }
            if (p.ParameterType == typeof(IPolicyConfigurationService)) return policy.Object;
            if (p.ParameterType == typeof(IUlbConfigService)) return Mock.Of<IUlbConfigService>();
            if (p.ParameterType == typeof(IDocumentApplicationService)) return Mock.Of<IDocumentApplicationService>();
            if (p.ParameterType == typeof(IHttpClientFactory)) return Mock.Of<IHttpClientFactory>();
            return null;
        }).ToArray();
        var provider = (SpecialNoticeThaneDataProvider)constructor.Invoke(args);
        var result = await provider.GetDataAsync(new() { ["propertyId"] = "104" });
        using var json = JsonSerializer.SerializeToDocument(result);
        var record = json.RootElement[0];
        Assert.Equal(expected, record.GetProperty("builderName").GetString());
        Assert.Equal(expected, record.GetProperty("structureOwnerName").GetString());
        Assert.Equal("LAND OWNER", record.GetProperty("landOwnerName").GetString());
        Assert.Equal("SOCIETY", record.GetProperty("societyName").GetString());
    }

    private static object Repository<T>(object[] rows) where T : class
    {
        var mock = new Mock<IReportDataRepository<T>>();
        mock.Setup(r => r.GetQueryable()).Returns(rows.Cast<T>().ToArray().BuildMock());
        return mock.Object;
    }
}
