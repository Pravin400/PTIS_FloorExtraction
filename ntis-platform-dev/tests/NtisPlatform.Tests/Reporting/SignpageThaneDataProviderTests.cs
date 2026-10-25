using System.Globalization;
using MockQueryable;
using NtisPlatform.Application.DTOs.Auth;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class SignpageThaneDataProviderTests
{
    [Theory]
    [InlineData(null, "Commercial", "Commercial")]
    [InlineData(null, null, null)]
    public async Task DescriptionUsesSameEnglishFallbackAsFrontpage(string? description, string? english, string? expected)
    {
        var property = new PropertyEntity
        {
            Id = 104, IsActive = true,
            PropertyTypeMaster = new PropertyTypeMasterEntity
            {
                PropertyDescription = description, PropertyDescriptionEnglish = english
            }
        };
        var provider = new SignpageThaneDataProvider(Repository(property), Repository<WardEntity>(),
            Repository<PropertyMapDetailEntity>(), Repository<PropertyMastOldEntity>(),
            Repository<PropertyDetailsEntity>(), Repository<RVCalculationResultsEntity>(),
            Mock.Of<IUlbConfigService>(), Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>());
        var result = Assert.IsType<List<object>>(await provider.GetDataAsync(new() { ["propertyId"] = "104" }));
        var record = Assert.IsType<Dictionary<string, object?>>(Assert.Single(result));
        Assert.Equal(expected, record["propertyDescription"]);
        Assert.Null(record["upicId"]);
    }

    [Fact]
    public async Task LogoUsesConfiguredDocumentAndReflectsConfigurationChanges()
    {
        var guid = Guid.NewGuid();
        var config = new Mock<IUlbConfigService>();
        config.SetupSequence(c => c.GetUlbConfigAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UlbConfigDto { UlbName = "THANE MUNICIPAL CORPORATION", UlbLogo = $"/api/UlbImageMaster/{guid}/view" })
            .ReturnsAsync(new UlbConfigDto { UlbName = "Updated ULB Name", UlbLogo = "data:image/png;base64,AwQ=" });
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        documents.Setup(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((Stream?)new MemoryStream(new byte[] { 1, 2 }), "logo.png", "image/png"));

        var first = await StatementRecord("R", "R", 100m, configuration: config.Object, documents: documents.Object);
        var second = await StatementRecord("R", "R", 100m, configuration: config.Object, documents: documents.Object);
        Assert.Equal("data:image/png;base64,AQI=", first["ulbLogo"]);
        Assert.Equal("data:image/png;base64,AwQ=", second["ulbLogo"]);
        Assert.Equal("THANE MUNICIPAL CORPORATION", first["ulbName"]);
        Assert.Equal("Updated ULB Name", second["ulbName"]);
        documents.Verify(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MissingConfiguredLogoReturnsNull()
    {
        var record = await StatementRecord("R", "R", 100m);
        Assert.Null(record["ulbLogo"]);
        Assert.Null(record["ulbName"]);
    }

    [Fact]
    public async Task PrintedDateUsesIndianTimeAndSpecialNoticeDateFormat()
    {
        var before = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromMinutes(330))
            .ToString("dd-MM-yyyy", CultureInfo.InvariantCulture);
        var record = await StatementRecord("R", "R", 100m);
        var after = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromMinutes(330))
            .ToString("dd-MM-yyyy", CultureInfo.InvariantCulture);
        Assert.Contains(Assert.IsType<string>(record["printDate"]), new[] { before, after });
    }

    [Fact]
    public void GetSchemaFields_ContainsRequestedFields()
    {
        var provider = new SignpageThaneDataProvider(
            Repository<PropertyEntity>(),
            Repository<WardEntity>(),
            Repository<PropertyMapDetailEntity>(),
            Repository<PropertyMastOldEntity>(),
            Repository<PropertyDetailsEntity>(),
            Repository<RVCalculationResultsEntity>(), Mock.Of<IUlbConfigService>(), Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>());

        var fields = provider.GetSchemaFields().Select(f => f.Path).ToHashSet(StringComparer.Ordinal);

        var expectedFields = new[]
        {
            "ulbName", "ulbLogo", "printDate", "upicId", "propertyDescription", "oldWardNo", "newWardNo", "oldPropertyNo", "newPropertyNo", "wingNo", "propertyAddress", "builderName",
            "structureOwnerName", "wardOffice", "collectionOffice",
            "cTotalProperty", "cTotalCarpetArea", "cTotalRateableValue",
            "aminityTotalProperty", "aminityTotalCarpetArea", "aminityTotalRateableValue",
            "rTotalProperty", "rTotalCarpetArea", "rTotalRateableValue",
            "rcTotalProperty", "rcTotalCarpetArea", "rcTotalRateableValue",
            "totalProperty", "totalCarpetArea", "totalRateableValue",
            "RATotalRatableValue", "CATotalRatableValue", "TotalRatableValue", "MarathiTotalRatebleValue"
        };

        foreach (var expected in expectedFields)
        {
            Assert.Contains(expected, fields);
        }
        Assert.Equal(expectedFields.Length, provider.GetSchemaFields().Count);
        Assert.Equal(fields.Count, fields.Distinct(StringComparer.OrdinalIgnoreCase).Count());
    }

    [Fact]
    public async Task GetDataAsync_MapsSummaryAndPropertyIdentityCorrectly()
    {
        var property = new PropertyEntity
        {
            Id = 101,
            PropertyNo = "PROP-101",
            UPICId = "WE040033000",
            AddressEnglish = "Thane West, Maharashtra",
            OwnerNameEnglish = "PROPERTY OWNER",
            SocietyDetailsMast = new List<SocietyDetailsEntity>
            {
                new() { Id = 10, PropertyId = 101, BuilderName = "Apex Builders Ltd", IsActive = true },
                new() { Id = 11, PropertyId = 101, BuilderName = "Deleted builder", IsActive = true, MarkedForDeletion = true },
                new() { Id = 12, PropertyId = 101, BuilderName = "Inactive builder", IsActive = false }
            },
            WardId = 5,
            Type = "R",
            IsActive = true,
            PropertyTypeMaster = new PropertyTypeMasterEntity
            {
                PartType = "R", Type = "R",
                PropertyDescription = "Residential", PropertyDescriptionEnglish = "English description"
            }
        };

        var ward = new WardEntity
        {
            Id = 5,
            WardNo = "W-05",
            IsActive = true
        };

        var mapDetail = new PropertyMapDetailEntity
        {
            PropertyIdNew = 101,
            PropertyIdOld = 901,
            IsActive = true,
            IsCurrent = true,
            Status = "ACTIVE"
        };

        var oldProp = new PropertyMastOldEntity
        {
            Id = 901,
            OldWardNo = "OLD-W-01",
            OldPropertyNo = "OLD-PROP-99",
            IsActive = true
        };

        var propDetails = new[]
        {
            new PropertyDetailsEntity
            {
                Id = 1,
                PropertyId = 101,
                CarpetAreaSqMeter = 50,
                IsTaxable = true,
                IsActive = true,
                TypeOfUse = new TypeOfUseEntity { Type = "R" }
            },
            new PropertyDetailsEntity
            {
                Id = 2,
                PropertyId = 101,
                CarpetAreaSqMeter = 20,
                IsTaxable = true,
                IsActive = true,
                TypeOfUse = new TypeOfUseEntity { Type = "C" }
            }
        };

        var rvResults = new[]
        {
            new RVCalculationResultsEntity
            {
                Id = 1,
                PropertyId = 101,
                PropertyDetailsId = 1,
                RateableValue = 1500m,
                CreatedDate = new DateTime(2026, 1, 1),
                IsActive = true
            },
            new RVCalculationResultsEntity
            {
                Id = 2,
                PropertyId = 101,
                PropertyDetailsId = 2,
                RateableValue = 800m,
                IsActive = true
            },
            new RVCalculationResultsEntity
            {
                Id = 3, PropertyId = 101, PropertyDetailsId = 1, RateableValue = 9900m,
                CreatedDate = new DateTime(2025, 1, 1), IsActive = true
            },
            new RVCalculationResultsEntity
            {
                Id = 4, PropertyId = 101, PropertyDetailsId = 2, RateableValue = 9900m,
                CreatedDate = new DateTime(2026, 2, 1), IsActive = false
            }
        };

        var provider = new SignpageThaneDataProvider(
            Repository(property),
            Repository(ward),
            Repository(mapDetail),
            Repository(oldProp),
            Repository(propDetails),
            Repository(rvResults), Mock.Of<IUlbConfigService>(), Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>());

        var result = Assert.IsType<List<object>>(await provider.GetDataAsync(new() { ["propertyId"] = "101" }));
        var record = Assert.IsType<Dictionary<string, object?>>(Assert.Single(result));

        Assert.Equal("OLD-W-01", record["oldWardNo"]);
        Assert.Equal("W-05", record["newWardNo"]);
        Assert.Equal("OLD-PROP-99", record["oldPropertyNo"]);
        Assert.Equal("PROP-101", record["newPropertyNo"]);
        Assert.Equal("Thane West, Maharashtra", record["propertyAddress"]);
        Assert.Equal("PROPERTY OWNER", record["builderName"]);
        Assert.Equal("WE040033000", record["upicId"]);
        Assert.Equal("Residential", record["propertyDescription"]);

        // Residential
        Assert.Equal(1, record["rTotalProperty"]);
        Assert.Equal(50m, record["rTotalCarpetArea"]);
        Assert.Equal(1500m, record["rTotalRateableValue"]);

        // Residential Non-Residential (RC)
        Assert.Equal(1, record["rcTotalProperty"]);
        Assert.Equal(20m, record["rcTotalCarpetArea"]);
        Assert.Equal(800m, record["rcTotalRateableValue"]);

        // Grand Total
        Assert.Equal(1, record["totalProperty"]);
        Assert.Equal(70m, record["totalCarpetArea"]);
        Assert.Equal(2300m, record["totalRateableValue"]);
        Assert.Equal(1500m, record["RATotalRatableValue"]);
        Assert.Equal(800m, record["CATotalRatableValue"]);
        Assert.Equal(2300m, record["TotalRatableValue"]);
        Assert.Equal("दोन हजार तीनशे रुपये फक्त", record["MarathiTotalRatebleValue"]);
    }

    [Fact]
    public async Task GetDataAsync_WhenPropertyOwnerIsMissing_ReturnsDash()
    {
        var property = new PropertyEntity
        {
            Id = 102,
            PropertyNo = "PROP-102",
            IsActive = true
        };

        var provider = new SignpageThaneDataProvider(
            Repository(property),
            Repository<WardEntity>(),
            Repository<PropertyMapDetailEntity>(),
            Repository<PropertyMastOldEntity>(),
            Repository<PropertyDetailsEntity>(),
            Repository<RVCalculationResultsEntity>(), Mock.Of<IUlbConfigService>(), Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>());

        var result = Assert.IsType<List<object>>(await provider.GetDataAsync(new() { ["propertyId"] = "102" }));
        var record = Assert.IsType<Dictionary<string, object?>>(Assert.Single(result));

        Assert.Equal("-", record["builderName"]);
        Assert.False(record.ContainsKey("BuilderName"));
    }

    [Theory]
    [InlineData("R", "R", 100, 0)]
    [InlineData("R", "C", 0, 100)]
    [InlineData("C", "C", 0, 100)]
    [InlineData("Amenity", "C", 0, 100)]
    public async Task StatementGroupsResidentialCommercialRcAndAmenity(string part, string usage, int residential, int commercial)
    {
        var record = await StatementRecord(part, usage, 100m);
        Assert.Equal((decimal)residential, record["RATotalRatableValue"]);
        Assert.Equal((decimal)commercial, record["CATotalRatableValue"]);
        Assert.Equal(100m, record["TotalRatableValue"]);
        Assert.Equal("शंभर रुपये फक्त", record["MarathiTotalRatebleValue"]);
    }

    [Fact]
    public async Task MissingSavedRvDoesNotCreateZeroAmountInWords()
    {
        var record = await StatementRecord("R", "R", null);
        Assert.Null(record["RATotalRatableValue"]);
        Assert.Null(record["TotalRatableValue"]);
        Assert.Null(record["MarathiTotalRatebleValue"]);
    }

    [Fact]
    public async Task NonTaxableDetailIsExcludedFromStatement()
    {
        var record = await StatementRecord("R", "R", 100m, taxable: false);
        Assert.Equal(0m, record["TotalRatableValue"]);
        Assert.Equal("शून्य रुपये फक्त", record["MarathiTotalRatebleValue"]);
    }

    private static async Task<Dictionary<string, object?>> StatementRecord(string part, string usage, decimal? rv, bool taxable = true, IUlbConfigService? configuration = null, IDocumentApplicationService? documents = null)
    {
        var property = new PropertyEntity
        {
            Id = 103, IsActive = true, Type = part,
            PropertyTypeMaster = new PropertyTypeMasterEntity { PartType = part, Type = part }
        };
        var detail = new PropertyDetailsEntity
        {
            Id = 1, PropertyId = 103, IsActive = true, IsTaxable = taxable, CarpetAreaSqMeter = 10,
            TypeOfUse = new TypeOfUseEntity { Type = usage }
        };
        var savedRv = rv.HasValue ? new[]
        {
            new RVCalculationResultsEntity { Id = 1, PropertyId = 103, PropertyDetailsId = 1, IsActive = true, RateableValue = rv }
        } : Array.Empty<RVCalculationResultsEntity>();
        var provider = new SignpageThaneDataProvider(Repository(property), Repository<WardEntity>(),
            Repository<PropertyMapDetailEntity>(), Repository<PropertyMastOldEntity>(), Repository(detail), Repository(savedRv), configuration ?? Mock.Of<IUlbConfigService>(), documents ?? Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>());
        var result = Assert.IsType<List<object>>(await provider.GetDataAsync(new() { ["propertyId"] = "103" }));
        return Assert.IsType<Dictionary<string, object?>>(Assert.Single(result));
    }

    private static IReportDataRepository<T> Repository<T>(params T[] rows) where T : class
    {
        var repository = new Mock<IReportDataRepository<T>>();
        repository.Setup(x => x.GetQueryable()).Returns(rows.BuildMock());
        return repository.Object;
    }
}
