using System.Reflection;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Document;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.ReportDataProviders;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Reporting;

public class PrarupYadiReportMediaTests
{
    [Theory]
    [InlineData("1", 1, true)]
    [InlineData("2", 1, false)]
    [InlineData("1", 2, false)]
    public async Task SharedPlanMatchesApartmentScopeAndKeepsFrontPhoto(string unitType, int category, bool expectPlan)
    {
        var property = new PropertyEntity
        {
            Id = 2258062, WardId = 10, PropertyNo = "100", IsActive = true,
            CategoryId = category, Type = unitType, WingDetailId = 12,
            WingDetailsMast = new WingDetailsMastEntity { Id = 12, SocietyDetailsMastId = 11, IsActive = true },
        };
        var front = Photo(property.Id, "PROPERTY_FRONT", 40004);
        var shared = Photo(null, "PROPERTY_PLAN", 40003);
        var documents = new Mock<IDocumentApplicationService>();
        documents.Setup(service => service.GetDocumentContentsByBindingsAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<long>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyCollection<int> ids, long _, CancellationToken _) =>
                ids.ToDictionary(id => id, id => new BoundDocumentContentDto
                { BindingId = id, Content = BitConverter.GetBytes(id), ContentMimeType = "image/png" }));
        var provider = Provider([property], [front, shared], [], documents.Object);

        var images = await Images(provider, property.Id);
        Assert.Equal("data:image/png;base64," + Convert.ToBase64String(BitConverter.GetBytes(40004)), images.Photo);
        Assert.Equal(expectPlan
            ? "data:image/png;base64," + Convert.ToBase64String(BitConverter.GetBytes(40003)) : null, images.Plan);
        documents.Verify(service => service.GetDocumentContentsByBindingsAsync(
            It.Is<IReadOnlyCollection<int>>(ids => ids.Contains(40004) && ids.Contains(40003) == expectPlan),
            It.IsAny<long>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LegacyPlanIsMatchedByWardAndPropertyNumber()
    {
        var property = new PropertyEntity { Id = 10, WardId = 2, PropertyNo = "A", IsActive = true };
        var plan = new BuildingPlanTypeEntity
        { Id = 1, WardId = 2, PropertyNo = "A", IsActive = true, DocumentBindingId = 77 };
        var documentGuid = Guid.NewGuid();
        var documents = new Mock<IDocumentApplicationService>();
        documents.Setup(service => service.GetDocumentContentsByBindingsAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<long>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, BoundDocumentContentDto>
            { [77] = new() { BindingId = 77, DocumentGuid = documentGuid } });
        var images = await Images(Provider([property], [], [plan], documents.Object), property.Id);
        Assert.Null(images.Photo);
        Assert.Equal(documentGuid.ToString(), images.Plan);
    }

    [Theory]
    [InlineData(true, false, true)]
    [InlineData(false, false, false)]
    [InlineData(true, true, false)]
    public async Task DirectSocietyRelationUsesOnlyActiveUndeletedSocieties(bool active, bool deleted, bool expectPlan)
    {
        var property = new PropertyEntity
        {
            Id = 10, WardId = 2, PropertyNo = "A", IsActive = true, CategoryId = 1, Type = "1",
            SocietyDetailsMast = [new SocietyDetailsEntity
                { Id = 11, PropertyId = 10, IsActive = active, MarkedForDeletion = deleted }]
        };
        var documents = new Mock<IDocumentApplicationService>();
        documents.Setup(service => service.GetDocumentContentsByBindingsAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<long>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, BoundDocumentContentDto>
            { [40003] = new() { BindingId = 40003, Content = [1, 2], ContentMimeType = "image/png" } });

        var images = await Images(Provider([property], [Photo(null, "PROPERTY_PLAN", 40003)], [], documents.Object), property.Id);

        Assert.Equal(expectPlan ? "data:image/png;base64,AQI=" : null, images.Plan);
    }

    private static PropertyPhotoEntity Photo(int? propertyId, string code, int bindingId)
    {
        var photo = PropertyPhotoEntity.CreateWithDetails(propertyId, 1,
            propertyId.HasValue ? "P" : "W", 11, 12,
            documentBindingId: bindingId, displayOrder: 1, type: "1");
        typeof(PropertyPhotoEntity).GetProperty(nameof(PropertyPhotoEntity.PhotoType))!
            .SetValue(photo, new PropertyPhotoTypeEntity { PhotoTypeCode = code });
        return photo;
    }

    private static IReportDataRepository<T> Repository<T>(IEnumerable<T> rows) where T : class
    {
        var repository = new Mock<IReportDataRepository<T>>();
        repository.Setup(r => r.GetQueryable()).Returns(rows.ToList().BuildMock());
        return repository.Object;
    }

    private static PrarupYadiDataProvider Provider(PropertyEntity[] properties, PropertyPhotoEntity[] photos,
        BuildingPlanTypeEntity[] plans, IDocumentApplicationService documents) => new(
        propertyRepository: Repository(properties), propertyImagesRepository: Repository<PropertyImagesMastEntity>([]),
        propertyOldRepository: null!, zoneRepository: null!, wardRepository: null!,
        societyRepository: Repository(properties.SelectMany(p => p.SocietyDetailsMast ?? [])),
        transRepository: null!, taxRepository: null!,
        yearRepository: null!, propertyDetailsRepository: null!, ulbMasterRepository: null!,
        PropertyTypeMasterRepository: null!, reportRequestRepository: null!, userRepository: null!,
        floorRepository: null!, constructionTypeRepository: null!, societyDetailsRepository: null!,
        rvCalculationResultsRepository: null!, typeOfUseRepository: null!, renterMastRepository: null!,
        propertyPhotoRepository: Repository(photos), documentService: documents, ulbConfigService: null!,
        buildingPlanRepository: Repository(plans));

    private static async Task<(string? Photo, string? Plan)> Images(PrarupYadiDataProvider provider, int id)
    {
        var method = typeof(PrarupYadiDataProvider).GetMethod("LoadPropertyImagesAsync", BindingFlags.NonPublic | BindingFlags.Instance)!;
        var task = (Task)method.Invoke(provider, [new List<int> { id }, CancellationToken.None])!;
        await task;
        var result = task.GetType().GetProperty("Result")!.GetValue(task)!;
        var image = result.GetType().GetProperty("Item")!.GetValue(result, [id])!;
        return ((string?)image.GetType().GetProperty("PropertyPhoto")!.GetValue(image),
            (string?)image.GetType().GetProperty("BuildingPlanPhoto")!.GetValue(image));
    }
}
