using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Services.PropertyMedia;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

public class PropertyMediaDashboardServiceTests
{
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepoMock = new();
    private readonly Mock<IRepository<PropertyPhotoEntity, int>> _photoRepoMock = new();
    private readonly Mock<IRepository<PropertyPhotoTypeEntity, int>> _photoTypeRepoMock = new();
    private readonly Mock<IRepository<WardEntity, int>> _wardRepoMock = new();
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _propTypeRepoMock = new();
    private readonly Mock<IRepository<ZoneEntity, int>> _zoneRepoMock = new();
    private readonly Mock<IRepository<PropertyMediaJobEntity, int>> _mediaJobRepoMock = new();
    private readonly Mock<IRepository<PropertyWorkflowDetailsEntity, int>> _workflowRepoMock = new();
    private readonly Mock<IRepository<UserEntity, int>> _userRepoMock = new();
    private readonly Mock<IPropertyMediaDownloadService> _downloadServiceMock = new();
    private readonly Mock<IRepository<PropertySocialDetailsEntity, int>> _socialDetailsRepoMock = new();
    private readonly Mock<IRepository<SocialAttributeEntity, int>> _socialAttrRepoMock = new();
    private readonly Mock<IRepository<WaterConnectionMasterEntity, int>> _waterConnRepoMock = new();

    private PropertyMediaDashboardService CreateService()
    {
        return new PropertyMediaDashboardService(
            _propertyRepoMock.Object,
            _photoRepoMock.Object,
            _photoTypeRepoMock.Object,
            _wardRepoMock.Object,
            _propTypeRepoMock.Object,
            _zoneRepoMock.Object,
            _mediaJobRepoMock.Object,
            _workflowRepoMock.Object,
            _userRepoMock.Object,
            _downloadServiceMock.Object,
            _socialDetailsRepoMock.Object,
            _socialAttrRepoMock.Object,
            _waterConnRepoMock.Object);
    }

    [Fact]
    public async Task GetDetailedCoverageAsync_CalculatesApplicableSeparatelyPerPhotoType()
    {
        // Arrange properties:
        // Prop 1: Standard Individual property
        // Prop 2: Apartment unit with Wing
        // Prop 3: Apartment Society parent (no partition)
        // Prop 4: Property with Solar Water Heater
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, PropertyNo = "1", CategoryId = 2, IsActive = true, MarkedForDeletion = false },
            new PropertyEntity { Id = 2, PropertyNo = "2", CategoryId = 1, PartitionNo = "A1", WingDetailId = 10, IsActive = true, MarkedForDeletion = false },
            new PropertyEntity { Id = 3, PropertyNo = "3", CategoryId = 1, PartitionNo = null, IsActive = true, MarkedForDeletion = false },
            new PropertyEntity { Id = 4, PropertyNo = "4", CategoryId = 2, IsActive = true, MarkedForDeletion = false }
        };

        var photoTypes = new List<PropertyPhotoTypeEntity>
        {
            new PropertyPhotoTypeEntity { Id = 1, PhotoTypeCode = "PROPERTY_FRONT", PhotoTypeName = "Property Front Photo", PhotoScope = "PROPERTY", IsActive = true, DisplayOrder = 1 },
            new PropertyPhotoTypeEntity { Id = 2, PhotoTypeCode = "WING_BUILDING", PhotoTypeName = "Wing Building Photo", PhotoScope = "WING", IsActive = true, DisplayOrder = 2 },
            new PropertyPhotoTypeEntity { Id = 3, PhotoTypeCode = "SOCIETY_PLACE", PhotoTypeName = "Society Place Photo", PhotoScope = "SOCIETY", IsActive = true, DisplayOrder = 3 },
            new PropertyPhotoTypeEntity { Id = 1013, PhotoTypeCode = "SWH", PhotoTypeName = "Solar Water Heater", PhotoScope = null, IsActive = true, DisplayOrder = 4 }
        };

        // Prop 4 has Solar Water Heater enabled (Attribute 20)
        var socialAttrs = new List<SocialAttributeEntity>
        {
            new SocialAttributeEntity { Id = 20, PhotoTypeId = 1013, SocialAttributeCode = "HAS_SOLAR_WAT_HEATER", SocialAttributeName = "Solar Water Heater", IsActive = true }
        };

        var socialDetails = new List<PropertySocialDetailsEntity>
        {
            new PropertySocialDetailsEntity { Id = 101, PropertyId = 4, SocialAttributeId = 20, BitValue = true, IsActive = true, MarkedForDeletion = false }
        };

        // Existing photos: Prop 4 has 1 Solar Water Heater photo
        var photos = new List<PropertyPhotoEntity>
        {
            PropertyPhotoEntity.Create(4, 1013)
        };

        _propertyRepoMock.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _photoTypeRepoMock.Setup(r => r.GetQueryable()).Returns(photoTypes.BuildMock());
        _photoRepoMock.Setup(r => r.GetQueryable()).Returns(photos.BuildMock());
        _socialAttrRepoMock.Setup(r => r.GetQueryable()).Returns(socialAttrs.BuildMock());
        _socialDetailsRepoMock.Setup(r => r.GetQueryable()).Returns(socialDetails.BuildMock());
        _waterConnRepoMock.Setup(r => r.GetQueryable()).Returns(new List<WaterConnectionMasterEntity>().BuildMock());
        _propTypeRepoMock.Setup(r => r.GetQueryable()).Returns(new List<PropertyTypeMasterEntity>().BuildMock());

        var service = CreateService();
        var queryParams = new PropertyMediaCoverageQueryParameters();

        // Act
        var result = await service.GetDetailedCoverageAsync(queryParams, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.Count);

        // 1. Property Front Photo: Applicable to all 4 active properties
        var frontPhoto = result.First(r => r.PhotoTypeCode == "PROPERTY_FRONT");
        Assert.Equal(4, frontPhoto.Applicable);
        Assert.Equal(0, frontPhoto.Available);
        Assert.Equal(4, frontPhoto.Missing);

        // 2. Wing Photo: Applicable only to Prop 2 (has WingDetailId) -> count = 1
        var wingPhoto = result.First(r => r.PhotoTypeCode == "WING_BUILDING");
        Assert.Equal(1, wingPhoto.Applicable);
        Assert.Equal(0, wingPhoto.Available);
        Assert.Equal(1, wingPhoto.Missing);

        // 3. Society Photo: Applicable only to Prop 3 (Apartment Category with no partition) -> count = 1
        var societyPhoto = result.First(r => r.PhotoTypeCode == "SOCIETY_PLACE");
        Assert.Equal(1, societyPhoto.Applicable);
        Assert.Equal(0, societyPhoto.Available);
        Assert.Equal(1, societyPhoto.Missing);

        // 4. Solar Water Heater: Applicable only to Prop 4 (has Social Detail) -> count = 1, Available = 1, Missing = 0
        var solarPhoto = result.First(r => r.PhotoTypeCode == "SWH");
        Assert.Equal(1, solarPhoto.Applicable);
        Assert.Equal(1, solarPhoto.Available);
        Assert.Equal(0, solarPhoto.Missing);
        Assert.Equal("100%", solarPhoto.CoveragePercentage);
    }
}
