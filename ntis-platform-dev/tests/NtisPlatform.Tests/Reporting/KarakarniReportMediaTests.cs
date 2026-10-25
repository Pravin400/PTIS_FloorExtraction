using System.Reflection;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Auth;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class KarakarniReportMediaTests
{
    private static readonly KarakarniMediaScope Apartment = new(2258062, 1544809, 1544740, "1", true);
    private static readonly KarakarniMediaBinding Front = new(24524, 2258062, 1544809, 1544740, null, "PROPERTY_FRONT", 3, 40004);
    private static readonly KarakarniMediaBinding SharedPlan = new(24525, null, 1544809, 1544740, "1", "PROPERTY_PLAN", 1, 40003);

    [Fact]
    public void ApartmentPhotoAndSharedBasePlanHaveSeparateBindings()
    {
        KarakarniMediaBinding[] images = [Front, SharedPlan];
        Assert.Equal(40004, KarakarniReportMedia.SelectPropertyPhoto(Apartment, images));
        Assert.Equal(40003, KarakarniReportMedia.SelectPlan(Apartment, images));
    }

    [Fact]
    public void PropertyPlanOverridesSharedPlanAtTheSameDisplayOrder()
    {
        var specific = SharedPlan with { Id = 24520, PropertyId = Apartment.PropertyId, BindingId = 40010 };
        Assert.Equal(40010, KarakarniReportMedia.SelectPlan(Apartment, [SharedPlan, specific]));
    }

    [Fact]
    public void SharedBasePlanPrecedesPropertySpecificSecondPlan()
    {
        var second = SharedPlan with { PropertyId = Apartment.PropertyId, DisplayOrder = 2, BindingId = 40010 };
        Assert.Equal(40003, KarakarniReportMedia.SelectPlan(Apartment, [second, SharedPlan]));
    }

    [Fact]
    public void SharedPlanMustMatchUnitTypeAndSocietyOrWing()
    {
        Assert.Equal(0, KarakarniReportMedia.SelectPlan(Apartment,
            [SharedPlan with { UnitType = "2" }, SharedPlan with { SocietyId = 99, WingId = 99 }]));
        Assert.Equal(40003, KarakarniReportMedia.SelectPlan(Apartment, [SharedPlan with { WingId = null }]));
        Assert.Equal(40003, KarakarniReportMedia.SelectPlan(Apartment, [SharedPlan with { SocietyId = null }]));
    }

    [Fact]
    public void IndividualAndAmenityPropertiesDoNotInheritSharedPlans()
    {
        Assert.Equal(0, KarakarniReportMedia.SelectPlan(Apartment with { AllowSharedPlan = false }, [SharedPlan]));
        Assert.Equal(0, KarakarniReportMedia.SelectPlan(Apartment with { UnitType = null }, [SharedPlan]));
        Assert.Equal(0, KarakarniReportMedia.SelectPlan(Apartment, [SharedPlan with { DisplayOrder = 2 }]));
    }

    [Fact]
    public void SignatureOrFrontPhotoCannotFillThePlanSlot()
    {
        Assert.Equal(0, KarakarniReportMedia.SelectPlan(Apartment, [Front]));
        Assert.Equal(0, KarakarniReportMedia.SelectPropertyPhoto(Apartment,
            [Front with { PhotoTypeCode = "OWNER_SIGNATURE" }, SharedPlan]));
    }

    [Theory]
    [InlineData("PHOTO_PLAN")]
    [InlineData("PLAN_PHOTO")]
    public void DirectPropertyPlanWorksWithoutAnApartmentScope(string code)
    {
        var plan = SharedPlan with { PropertyId = Apartment.PropertyId, UnitType = null, PhotoTypeCode = code };
        Assert.Equal(40003, KarakarniReportMedia.SelectPlan(Apartment with { AllowSharedPlan = false }, [plan]));
    }

    [Fact]
    public async Task ReportUsesHeaderLogoAndRefreshesItForTheNextReport()
    {
        var masters = new Mock<IReportDataRepository<ULBMasterEntity>>();
        masters.Setup(r => r.GetQueryable()).Returns(new[] {
            new ULBMasterEntity { Id = 1, IsActive = true, UlbLogo = "data:image/png;base64,OLD", UlbCode = "TH001", UlbName = "Thane" }
        }.BuildMock());
        var configuration = new Mock<IUlbConfigService>();
        var currentLogo = "data:image/png;base64,HEADER1";
        configuration.Setup(s => s.GetUlbConfigAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new UlbConfigDto { UlbId = 1, UlbLogo = currentLogo });
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var provider = new KarakarniDataProvider(
            propertyRepository: null!, wardRepository: null!, societyRepository: null!,
            typeOfUseRepository: null!, propertyDetailsRepository: null!, floorRepository: null!,
            constructionTypeRepository: null!, transmastRepository: null!, taxMastRepository: null!,
            ulbMasterRepository: masters.Object, userRepository: null!, yearRepository: null!,
            propertyTypeRepository: null!, rvResultsRepository: null!, wingRepository: null!,
            propertyPhotoRepository: null!, buildingPlanRepository: null!, propertyMastOldRepository: null!,
            documentApplicationService: Mock.Of<IDocumentApplicationService>(), cache: cache,
            currentTenant: Mock.Of<ICurrentTenantService>(), logger: NullLogger<KarakarniDataProvider>.Instance,
            ulbConfigService: configuration.Object);
        var method = typeof(KarakarniDataProvider).GetMethod("GetUlbAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        async Task<string?> ReadLogo()
        {
            var task = (Task)method.Invoke(provider, [CancellationToken.None])!;
            await task;
            var snapshot = task.GetType().GetProperty("Result")!.GetValue(task)!;
            return (string?)snapshot.GetType().GetProperty("UlbLogo")!.GetValue(snapshot);
        }
        Assert.Equal(currentLogo, await ReadLogo());
        currentLogo = "data:image/png;base64,HEADER2";
        Assert.Equal(currentLogo, await ReadLogo());
    }
}
