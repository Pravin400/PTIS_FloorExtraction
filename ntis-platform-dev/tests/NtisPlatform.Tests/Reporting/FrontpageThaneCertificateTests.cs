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

public class FrontpageThaneCertificateTests
{
    [Fact]
    public async Task DisplaysRelatedSocietyCcWhileBillTypeUsesOnlyPropertyCertificates()
    {
        var society = new SocietyDetailsEntity { Id = 1545826, IsActive = true };
        var property = new PropertyEntity
        {
            Id = 2259237, IsActive = true, WingDetailId = 10,
            WingDetailsMast = new WingDetailsMastEntity
            {
                Id = 10, IsActive = true, SocietyDetailsMastId = society.Id,
                SocietyDetailsMast = society
            }
        };
        var cc = new PropertyCertificateEntity(null, 1, "OCCPRE13443", entityType: "S", societyDetailId: society.Id)
            { Id = 24269, IsActive = true };
        var deletedOc = new PropertyCertificateEntity(property.Id, 2, "32424543554", markedForDeletion: true)
            { Id = 23270, IsActive = false };
        var unrelatedOc = new PropertyCertificateEntity(null, 2, "OTHER-SOCIETY", entityType: "S", societyDetailId: 99)
            { Id = 30000, IsActive = true };
        var provider = new FrontpageThaneDataProvider(
            Repository(property), Repository<WardEntity>(), Repository<PropertyMapDetailEntity>(),
            Repository<PropertyMastOldEntity>(), Repository<SocietyDetailsEntity>(), Repository<PropertyDetailsEntity>(),
            Repository(cc, deletedOc, unrelatedOc),
            Repository(new PropertyCertificateTypeMasterEntity { Id = 1, CertificateTypeCode = "CC", IsActive = true },
                new PropertyCertificateTypeMasterEntity { Id = 2, CertificateTypeCode = "OC", IsActive = true }),
            Repository<RVCalculationResultsEntity>(), Repository<PropertyPhotoEntity>(), Repository<BuildingPlanTypeEntity>(),
            Mock.Of<IUlbConfigService>(), Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>(),
            Repository<RateEntity>(), Repository<RateSectionDetailsEntity>(), Repository<AssessmentYearRangeEntity>(), Policies(),
            Repository<RetrospectiveTaxCalculationEntity>());

        var result = Assert.IsType<List<object>>(await provider.GetDataAsync(new() { ["propertyId"] = "2259237" }));
        var record = Assert.IsType<Dictionary<string, object?>>(Assert.Single(result));

        Assert.Equal("OCCPRE13443", record["commencementCertificateNo"]);
        Assert.Equal("-", record["occupancyCertificateNo"]);
        Assert.Equal("Unauthorized", record["billType"]);
    }

    [Theory]
    [InlineData("OC-1", "CC-1", "Authorized")]
    [InlineData("0", "CC-1", "Property Without OC")]
    [InlineData(" - ", "CC-1", "Property Without OC")]
    [InlineData(null, "CC-1", "Property Without OC")]
    [InlineData("", "0", "Unauthorized")]
    [InlineData(" ", "-", "Unauthorized")]
    public async Task UsesFirstPropertyCertificateEvenWhenALaterOcIsValid(
        string? firstOc, string? firstCc, string expectedBillType)
    {
        var property = new PropertyEntity { Id = 2259237, IsActive = true };
        var provider = new FrontpageThaneDataProvider(
            Repository(property), Repository<WardEntity>(), Repository<PropertyMapDetailEntity>(),
            Repository<PropertyMastOldEntity>(), Repository<SocietyDetailsEntity>(), Repository<PropertyDetailsEntity>(),
            Repository(
                new PropertyCertificateEntity(property.Id, 2, firstOc) { Id = 1, IsActive = true },
                new PropertyCertificateEntity(property.Id, 2, "LATER-OC") { Id = 2, IsActive = true },
                new PropertyCertificateEntity(property.Id, 1, firstCc) { Id = 3, IsActive = true }),
            Repository(new PropertyCertificateTypeMasterEntity { Id = 1, CertificateTypeCode = "CC", IsActive = true },
                new PropertyCertificateTypeMasterEntity { Id = 2, CertificateTypeCode = "OC", IsActive = true }),
            Repository<RVCalculationResultsEntity>(), Repository<PropertyPhotoEntity>(), Repository<BuildingPlanTypeEntity>(),
            Mock.Of<IUlbConfigService>(), Mock.Of<IDocumentApplicationService>(), Mock.Of<IHttpClientFactory>(),
            Repository<RateEntity>(), Repository<RateSectionDetailsEntity>(), Repository<AssessmentYearRangeEntity>(), Policies(),
            Repository<RetrospectiveTaxCalculationEntity>());

        var result = Assert.IsType<List<object>>(await provider.GetDataAsync(new() { ["propertyId"] = "2259237" }));
        var record = Assert.IsType<Dictionary<string, object?>>(Assert.Single(result));

        Assert.Equal(expectedBillType, record["billType"]);
        Assert.Equal("LATER-OC", record["occupancyCertificateNo"]);
        Assert.Equal(expectedBillType == "Unauthorized" ? "-" : firstCc, record["commencementCertificateNo"]);
    }

    private static IPolicyConfigurationService Policies()
    {
        var policies = new Mock<IPolicyConfigurationService>();
        policies.Setup(x => x.GetPolicyValuesAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, string>());
        return policies.Object;
    }

    private static IReportDataRepository<T> Repository<T>(params T[] rows) where T : class
    {
        var repository = new Mock<IReportDataRepository<T>>();
        repository.Setup(x => x.GetQueryable()).Returns(rows.BuildMock());
        return repository.Object;
    }
}
