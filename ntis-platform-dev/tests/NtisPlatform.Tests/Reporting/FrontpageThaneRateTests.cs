using System.Reflection;
using System.Text.Json;
using MockQueryable;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class FrontpageThaneRateTests
{
    [Theory]
    [InlineData("SqFeet")]
    [InlineData("SqMeter")]
    public async Task BothRatesUseOldWardConstructionRates(string unit)
    {
        var data = FrontpageThaneFixture.Data("A");
        data[typeof(RateEntity)] = [new RateEntity { IsActive = true, RateSquareFeet = 999, RateSquareMeter = 9999 }];
        var frontpage = FrontpageThaneFixture.Provider<FrontpageThaneDataProvider>(data, unit);
        var record = await FrontpageThaneFixture.FrontpageRecord(data, unit);
        Assert.Equal("2.65", record.GetProperty("RRate").GetString());
        Assert.Equal("8.75", record.GetProperty("CRate").GetString());
        Assert.Equal(unit, record.GetProperty("standardRentAreaUnit").GetString());
        foreach (var field in new[] { "RRate", "CRate" })
            Assert.Equal("string", Assert.Single(frontpage.GetSchemaFields(), f => f.Path == field).ValueType);
    }

    [Fact]
    public async Task MultipleConstructionRatesKeepTheirWardAndConstructionLabels()
    {
        var record = await FrontpageThaneFixture.FrontpageRecord(FrontpageThaneFixture.Data("C", "A"));
        Assert.Equal("126/A: 2.65; 126/C: 1.60", record.GetProperty("RRate").GetString());
        Assert.Equal("126/A: 8.75; 126/C: 5.25", record.GetProperty("CRate").GetString());
    }

    [Theory]
    [InlineData("B")]
    [InlineData("")]
    public async Task MissingConstructionDoesNotChooseAnotherRate(string code)
    {
        var record = await FrontpageThaneFixture.FrontpageRecord(FrontpageThaneFixture.Data(code));
        Assert.Equal(JsonValueKind.Null, record.GetProperty("RRate").ValueKind);
        Assert.Equal(JsonValueKind.Null, record.GetProperty("CRate").ValueKind);
    }

    [Fact]
    public async Task MissingCommercialRateDoesNotHideTheResidentialRate()
    {
        var data = FrontpageThaneFixture.Data("A");
        ((OldWardWiseRateEntity)data[typeof(OldWardWiseRateEntity)][0]).NonResidential = null;
        var record = await FrontpageThaneFixture.FrontpageRecord(data);
        Assert.Equal("2.65", record.GetProperty("RRate").GetString());
        Assert.Equal(JsonValueKind.Null, record.GetProperty("CRate").ValueKind);
    }

    [Fact]
    public async Task ConflictingRatesWithinOneWardAndConstructionStillFail()
    {
        var data = FrontpageThaneFixture.Data("A");
        var original = (OldWardWiseRateEntity)data[typeof(OldWardWiseRateEntity)][0];
        data[typeof(OldWardWiseRateEntity)] = [original,
            new OldWardWiseRateEntity { OldWardId = original.OldWardId, OldWard = original.OldWard,
                ConstructionType = new ConstructionTypeEntity { ConstructionCode = "A" }, Residential = "99", NonResidential = "99" }];
        await Assert.ThrowsAsync<InvalidOperationException>(() => FrontpageThaneFixture.Record(
            FrontpageThaneFixture.Provider<FrontpageThaneDataProvider>(data)));
    }

    [Theory]
    [InlineData(" PROPERTY OWNER ", "Regional", "PROPERTY OWNER")]
    [InlineData(null, " Regional ", "Regional")]
    [InlineData(" - ", "Regional", "Regional")]
    [InlineData("", "", "-")]
    public async Task StructureOwnerUsesPropertyOwnerRatherThanSocietyBuilder(string? english, string? regional, string expected)
    {
        var data = FrontpageThaneFixture.Data("A");
        var property = (PropertyEntity)data[typeof(PropertyEntity)][0];
        property.OwnerNameEnglish = english;
        property.OwnerName = regional;
        var record = await FrontpageThaneFixture.FrontpageRecord(data);
        Assert.Equal(expected, record.GetProperty("builderName").GetString());
        Assert.Equal(expected, record.GetProperty("structureOwnerName").GetString());
        Assert.Equal("UNCHANGED ADDRESS", record.GetProperty("addressEnglish").GetString());
    }

    [Fact]
    public async Task CurrentOldPropertyMappingOverridesTheDirectLink()
    {
        var data = FrontpageThaneFixture.Data("A");
        data[typeof(PropertyMastOldEntity)] = [new PropertyMastOldEntity { Id = 10, OldWardNo = "UNRELATED", IsActive = true },
            new PropertyMastOldEntity { Id = 11, OldWardNo = "126", OldPropertyNo = "MAPPED", IsActive = true }];
        data[typeof(PropertyMapDetailEntity)] = [new PropertyMapDetailEntity
            { PropertyIdNew = 1, PropertyIdOld = 11, IsActive = true, IsCurrent = true, Status = "ACTIVE" }];
        var record = await FrontpageThaneFixture.FrontpageRecord(data);
        Assert.Equal("2.65", record.GetProperty("RRate").GetString());
        Assert.Equal("MAPPED", record.GetProperty("oldPropertyNo").GetString());
    }
}

internal static class FrontpageThaneFixture
{
    public static Dictionary<Type, object[]> Data(params string[] codes)
    {
        var ward = new OldWardMasterEntity { Id = 1, OldWardNo = "126", OldZoneId = 7, IsActive = true };
        return new()
        {
            [typeof(PropertyEntity)] = [new PropertyEntity { Id = 1, IsActive = true, Type = "C", PropertyMastOldId = 10,
                OwnerNameEnglish = "PROPERTY OWNER", OwnerName = "Regional", AddressEnglish = "UNCHANGED ADDRESS" }],
            [typeof(PropertyMastOldEntity)] = [new PropertyMastOldEntity { Id = 10, IsActive = true, OldWardNo = "126", OldPropertyNo = "OLD" }],
            [typeof(SocietyDetailsEntity)] = [new SocietyDetailsEntity { Id = 1, PropertyId = 1, IsActive = true,
                BuilderNameEnglish = "UNRELATED BUILDER", LandOwnerNameEnglish = "LAND OWNER" }],
            [typeof(PropertyDetailsEntity)] = codes.Select((code, index) => (object)new PropertyDetailsEntity
                { Id = index + 1, PropertyId = 1, IsActive = true, AssessmentYear = index == 0 ? "2022" : "2015",
                    ConstructionType = new ConstructionTypeEntity { IsActive = true, ConstructionCode = code } }).ToArray(),
            [typeof(OldWardMasterEntity)] = [ward],
            [typeof(OldZoneMasterEntity)] = [new OldZoneMasterEntity { Id = 7, OldZoneNo = "7", Description = " UTHALSAR " }],
            [typeof(OldWardWiseRateEntity)] = [
                new OldWardWiseRateEntity { OldWard = ward, OldWardId = 1, OldZoneId = 7,
                    ConstructionType = new ConstructionTypeEntity { ConstructionCode = "A" }, Residential = "2.65", NonResidential = "8.75", CollectionWard = " OFFICE 126 " },
                new OldWardWiseRateEntity { OldWard = ward, OldWardId = 1, OldZoneId = 7,
                    ConstructionType = new ConstructionTypeEntity { ConstructionCode = "C" }, Residential = "1.60", NonResidential = "5.25", CollectionWard = "OFFICE 126" }]
        };
    }

    public static T Provider<T>(Dictionary<Type, object[]> rows, string unit = "SqFeet")
    {
        var policies = new Mock<IPolicyConfigurationService>();
        policies.Setup(p => p.GetPolicyValuesAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, string> { [RateableValuePolicyConstants.RateMasterAreaUnit] = unit });
        var constructor = typeof(T).GetConstructors().Single();
        return (T)constructor.Invoke(constructor.GetParameters().Select(p =>
        {
            if (p.ParameterType.IsGenericType && p.ParameterType.GetGenericTypeDefinition() == typeof(IReportDataRepository<>))
            {
                var entity = p.ParameterType.GetGenericArguments()[0];
                return typeof(FrontpageThaneFixture).GetMethod(nameof(Repository), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entity).Invoke(null, [rows.GetValueOrDefault(entity) ?? []]);
            }
            if (p.ParameterType == typeof(IPolicyConfigurationService)) return policies.Object;
            if (p.ParameterType == typeof(IUlbConfigService)) return Mock.Of<IUlbConfigService>();
            if (p.ParameterType == typeof(IDocumentApplicationService)) return Mock.Of<IDocumentApplicationService>();
            if (p.ParameterType == typeof(IHttpClientFactory)) return Mock.Of<IHttpClientFactory>();
            return null;
        }).ToArray());
    }

    public static async Task<JsonElement> Record(IReportDataProvider provider)
    {
        using var result = JsonSerializer.SerializeToDocument(await provider.GetDataAsync(
            new() { ["propertyId"] = "1", ["zoneId"] = "999" }));
        return result.RootElement[0].Clone();
    }

    public static async Task<JsonElement> FrontpageRecord(Dictionary<Type, object[]> data, string unit = "SqFeet")
    {
        var front = await Record(Provider<FrontpageThaneDataProvider>(data, unit));
        return front;
    }

    private static object Repository<T>(object[] rows) where T : class
    {
        var mock = new Mock<IReportDataRepository<T>>();
        mock.Setup(r => r.GetQueryable()).Returns(rows.Cast<T>().ToArray().BuildMock());
        return mock.Object;
    }
}
