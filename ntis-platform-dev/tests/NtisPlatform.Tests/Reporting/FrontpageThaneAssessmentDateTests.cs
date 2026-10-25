using MockQueryable;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.RetrospectiveTax;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class FrontpageThaneAssessmentDateTests
{
    [Fact]
    public async Task UsesLatestActivePropertyAssessmentAndFormatsDayMonthYear()
    {
        var older = Assessment(1, new DateTime(2025, 10, 1));
        var latest = Assessment(2, new DateTime(2025, 12, 15));
        var floor = Assessment(3, new DateTime(2026, 1, 1)); floor.CalculationMode = "FLOOR";
        var inactive = Assessment(4, new DateTime(2026, 1, 2)); inactive.IsActive = false;
        var deleted = Assessment(5, new DateTime(2026, 1, 3)); deleted.MarkedForDeletion = true;
        var otherProperty = Assessment(6, new DateTime(2026, 1, 4)); otherProperty.PropertyId = 99;

        Assert.Equal("15/12/2025", await Date(older, latest, floor, inactive, deleted, otherProperty));
    }

    [Theory]
    [InlineData("ManualReview")]
    [InlineData("Failed")]
    public async Task LatestUncalculatedRecordDoesNotFallBackToOlderCalculatedDate(string status)
    {
        var latest = Assessment(2, new DateTime(2025, 12, 15)); latest.CalculationStatus = status;
        Assert.Equal("-", await Date(Assessment(1, new DateTime(2025, 10, 1)), latest));
    }

    [Fact]
    public async Task MissingAssessmentDisplaysDash()
    {
        Assert.Equal("-", await Date());
    }

    [Fact]
    public async Task SameDateUsesHighestIdAndStatusIsCaseInsensitive()
    {
        var older = Assessment(1, new DateTime(2025, 12, 15)); older.CalculationStatus = "ManualReview";
        var latest = Assessment(2, older.AssessmentDate); latest.CalculationStatus = "calculated";
        Assert.Equal("15/12/2025", await Date(older, latest));
        latest.CalculationStatus = "Failed";
        Assert.Equal("-", await Date(older, latest));
    }

    private static RetrospectiveTaxCalculationEntity Assessment(int id, DateTime date) => new()
    {
        Id = id, PropertyId = 2259237, IsActive = true, CalculationMode = "PROPERTY",
        CalculationStatus = "Calculated", AssessmentDate = date
    };

    private static async Task<object?> Date(params RetrospectiveTaxCalculationEntity[] rows)
    {
        var policies = new Mock<IPolicyConfigurationService>();
        policies.Setup(x => x.GetPolicyValuesAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, string>());
        var provider = new FrontpageThaneDataProvider(
            Repository(new PropertyEntity { Id = 2259237, IsActive = true }), Repository<WardEntity>(),
            Repository<PropertyMapDetailEntity>(), Repository<PropertyMastOldEntity>(), Repository<SocietyDetailsEntity>(),
            Repository<PropertyDetailsEntity>(), Repository<PropertyCertificateEntity>(), Repository<PropertyCertificateTypeMasterEntity>(),
            Repository<RVCalculationResultsEntity>(), Repository<PropertyPhotoEntity>(), Repository<BuildingPlanTypeEntity>(),
            Mock.Of<IUlbConfigService>(), Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>(),
            Repository<RateEntity>(), Repository<RateSectionDetailsEntity>(), Repository<AssessmentYearRangeEntity>(),
            policies.Object, Repository(rows));
        Assert.Contains(provider.GetSchemaFields(), field => field.Path == "assessmentDate");
        var result = Assert.IsType<List<object>>(await provider.GetDataAsync(new() { ["propertyId"] = "2259237" }));
        var record = Assert.IsType<Dictionary<string, object?>>(Assert.Single(result));
        return record["assessmentDate"];
    }

    private static IReportDataRepository<T> Repository<T>(params T[] rows) where T : class
    {
        var repository = new Mock<IReportDataRepository<T>>();
        repository.Setup(x => x.GetQueryable()).Returns(rows.BuildMock());
        return repository.Object;
    }
}
