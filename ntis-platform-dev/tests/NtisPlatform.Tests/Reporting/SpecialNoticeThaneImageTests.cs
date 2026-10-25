using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Auth;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class SpecialNoticeThaneImageTests
{
    [Fact]
    public async Task PhotoAndPlanSharingABindingAreLoadedAndConvertedOnce()
    {
        var property = new PropertyEntity { Id = 10, WardId = 2, PropertyNo = "A", IsActive = true };
        var documents = new Mock<IDocumentApplicationService>();
        var provider = Provider(property, [Photo(10, "PROPERTY_FRONT", 70)],
            [new() { Id = 1, WardId = 2, PropertyNo = "A", IsActive = true, DocumentBindingId = 70 }], documents);
        var images = await provider.LoadNoticeImagesAsync(10, CancellationToken.None);
        Assert.Equal("Available", images.Photo.Status);
        Assert.Same(images.Photo, images.Plan);
        documents.Verify(d => d.GetDocumentContentsByBindingsAsync(
            It.Is<IReadOnlyCollection<int>>(ids => ids.Count == 1 && ids.Contains(70)),
            SpecialNoticeThaneDataProvider.MaxNoticeImageBytes, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("1", 1, true)]
    [InlineData("2", 1, false)]
    [InlineData("1", 2, false)]
    public async Task FrontPhotoAndSharedPlanStayWithinPropertyScope(string type, int category, bool expectPlan)
    {
        var property = new PropertyEntity
        {
            Id = 10, WardId = 2, PropertyNo = "A", IsActive = true, Type = type, CategoryId = category,
            WingDetailId = 12,
            WingDetailsMast = new WingDetailsMastEntity { Id = 12, SocietyDetailsMastId = 11, IsActive = true }
        };
        var provider = Provider(property, [Photo(10, "PROPERTY_FRONT", 70), Photo(null, "PROPERTY_PLAN", 71),
            Photo(999, "PROPERTY_FRONT", 72)], []);
        var images = await provider.LoadNoticeImagesAsync(10, CancellationToken.None);
        Assert.Equal("data:image/png;base64,RgAAAA==", images.Photo.DataUrl);
        Assert.Equal(expectPlan ? "data:image/png;base64,RwAAAA==" : null, images.Plan.DataUrl);
    }

    [Fact]
    public async Task LegacyPlanMatchesBothWardAndPropertyNumber()
    {
        var property = new PropertyEntity { Id = 10, WardId = 2, PropertyNo = "A", IsActive = true };
        var provider = Provider(property, [],
            [new() { Id = 1, WardId = 2, PropertyNo = "A", IsActive = true, DocumentBindingId = 70 },
             new() { Id = 2, WardId = 3, PropertyNo = "A", IsActive = true, DocumentBindingId = 71 },
             new() { Id = 3, WardId = 2, PropertyNo = "B", IsActive = true, DocumentBindingId = 72 }]);
        var images = await provider.LoadNoticeImagesAsync(10, CancellationToken.None);
        Assert.Equal("Not uploaded", images.Photo.Status);
        Assert.Equal("data:image/png;base64,RgAAAA==", images.Plan.DataUrl);
    }

    [Fact]
    public void InvalidMissingAndOversizedFilesDoNotBecomeImageUrls()
    {
        var guid = Guid.NewGuid();
        var pdf = SpecialNoticeThaneDataProvider.NoticeImage.From(new() { DocumentGuid = guid, MimeType = "application/pdf", Content = [1] });
        Assert.Null(pdf.DataUrl);
        Assert.Equal("Document is not an image", pdf.Status);
        var missing = SpecialNoticeThaneDataProvider.NoticeImage.From(new() { MimeType = "image/png", ReadErrorCode = "Unavailable" });
        Assert.Equal("Image file is unavailable", missing.Status);
        var oversized = SpecialNoticeThaneDataProvider.NoticeImage.From(new() { MimeType = "image/png", ReadErrorCode = "TooLarge" });
        Assert.Null(oversized.DataUrl);
        Assert.Contains("larger", oversized.Status);
    }

    private static PropertyPhotoEntity Photo(int? propertyId, string code, int bindingId)
    {
        var photo = PropertyPhotoEntity.CreateWithDetails(propertyId, 1,
            propertyId.HasValue ? "P" : "W", 11, 12, documentBindingId: bindingId, displayOrder: 1, type: "1");
        typeof(PropertyPhotoEntity).GetProperty(nameof(PropertyPhotoEntity.PhotoType))!
            .SetValue(photo, new PropertyPhotoTypeEntity { PhotoTypeCode = code });
        return photo;
    }

    private static IReportDataRepository<T> Repository<T>(IEnumerable<T> rows) where T : class
    {
        var mock = new Mock<IReportDataRepository<T>>();
        mock.Setup(r => r.GetQueryable()).Returns(rows.ToList().BuildMock());
        return mock.Object;
    }

    private static SpecialNoticeThaneDataProvider Provider(PropertyEntity property, PropertyPhotoEntity[] photos,
        BuildingPlanTypeEntity[] plans, Mock<IDocumentApplicationService>? documents = null)
    {
        documents ??= new Mock<IDocumentApplicationService>();
        documents.Setup(d => d.GetDocumentContentsByBindingsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<long>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyCollection<int> ids, long _, CancellationToken _) =>
                ids.ToDictionary(id => id, id => new BoundDocumentContentDto
                { Content = BitConverter.GetBytes(id), ContentMimeType = "image/png" }));
        var dependencies = new Dictionary<string, object>
        {
            ["propertyRepository"] = Repository(new[] { property }),
            ["societyRepository"] = Repository<SocietyDetailsEntity>([]),
            ["photoRepository"] = Repository(photos), ["planRepository"] = Repository(plans),
            ["documentService"] = documents.Object
        };
        var constructor = typeof(SpecialNoticeThaneDataProvider).GetConstructors().Single();
        return (SpecialNoticeThaneDataProvider)constructor.Invoke(constructor.GetParameters()
            .Select(p => dependencies.GetValueOrDefault(p.Name!)).ToArray());
    }
}

public class SpecialNoticeThaneLogoTests
{
    [Fact]
    public async Task UsesEffectiveHeaderLogoAndEmbedsLocalDocument()
    {
        var guid = Guid.NewGuid();
        var documents = new Mock<IDocumentApplicationService>();
        documents.Setup(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((Stream?)new MemoryStream([1, 2]), "logo.png", "image/png"));
        var image = await Provider($"/api/UlbImageMaster/{guid}/view", documents.Object)
            .LoadNoticeLogoAsync(CancellationToken.None);
        Assert.Equal("data:image/png;base64,AQI=", image.DataUrl);
        Assert.Equal("Available", image.Status);
        Assert.Equal(guid.ToString(), image.DocumentGuid);
    }

    [Fact]
    public async Task EmbeddedLogoNeedsNoDocumentRead()
    {
        var documents = new Mock<IDocumentApplicationService>(MockBehavior.Strict);
        var image = await Provider("data:image/png;base64,AQI=", documents.Object).LoadNoticeLogoAsync(CancellationToken.None);
        Assert.Equal("data:image/png;base64,AQI=", image.DataUrl);
    }

    [Theory]
    [InlineData(null, "Not uploaded")]
    [InlineData("", "Not uploaded")]
    [InlineData("unsupported/path", "Unsupported logo reference")]
    public async Task MissingLogoDoesNotUseAnUnrelatedDefault(string? reference, string status)
    {
        var image = await Provider(reference, Mock.Of<IDocumentApplicationService>()).LoadNoticeLogoAsync(CancellationToken.None);
        Assert.Null(image.DataUrl);
        Assert.Equal(status, image.Status);
    }

    [Fact]
    public async Task NonImageLogoDocumentIsRejected()
    {
        var guid = Guid.NewGuid();
        var documents = new Mock<IDocumentApplicationService>();
        documents.Setup(d => d.ViewDocumentAsync(guid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((Stream?)new MemoryStream([1, 2]), "logo.pdf", "application/pdf"));
        var image = await Provider(guid.ToString(), documents.Object).LoadNoticeLogoAsync(CancellationToken.None);
        Assert.Null(image.DataUrl);
        Assert.Equal("Document is not an image", image.Status);
    }

    private static SpecialNoticeThaneDataProvider Provider(string? logo, IDocumentApplicationService documents)
    {
        var config = new Mock<IUlbConfigService>();
        config.Setup(c => c.GetUlbConfigAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UlbConfigDto { UlbLogo = logo });
        var constructor = typeof(SpecialNoticeThaneDataProvider).GetConstructors().Single();
        return (SpecialNoticeThaneDataProvider)constructor.Invoke(constructor.GetParameters().Select(p =>
            p.Name == "ulbConfigService" ? (object)config.Object : p.Name == "documentService" ? documents : null).ToArray());
    }
}
