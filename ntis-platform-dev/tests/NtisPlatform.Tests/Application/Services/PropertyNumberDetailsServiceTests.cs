using FluentAssertions;
using Microsoft.Extensions.Logging;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Application.Services;

public class PropertyNumberDetailsServiceTests
{
    private readonly Mock<ILogger<PropertyNumberDetailsService>> _loggerMock;
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepositoryMock;
    private readonly Mock<IRepository<PropertyCategoryEntity, int>> _categoryRepositoryMock;
    private readonly Mock<IRepository<WardEntity, int>> _wardRepositoryMock;
    private readonly Mock<IRepository<WingDetailsMastEntity, int>> _wingDetailsRepositoryMock;
    private readonly Mock<IRepository<WingEntity, int>> _wingMasterRepositoryMock;

    private readonly PropertyNumberDetailsService _service;

    public PropertyNumberDetailsServiceTests()
    {
        _loggerMock = new Mock<ILogger<PropertyNumberDetailsService>>();
        _propertyRepositoryMock = new Mock<IRepository<PropertyEntity, int>>();
        _categoryRepositoryMock = new Mock<IRepository<PropertyCategoryEntity, int>>();
        _wardRepositoryMock = new Mock<IRepository<WardEntity, int>>();
        _wingDetailsRepositoryMock = new Mock<IRepository<WingDetailsMastEntity, int>>();
        _wingMasterRepositoryMock = new Mock<IRepository<WingEntity, int>>();

        _service = new PropertyNumberDetailsService(
            _loggerMock.Object,
            _propertyRepositoryMock.Object,
            _categoryRepositoryMock.Object,
            _wardRepositoryMock.Object,
            _wingDetailsRepositoryMock.Object,
            _wingMasterRepositoryMock.Object
        );
    }

    private void SetupMocks(
        List<PropertyEntity> properties,
        List<PropertyCategoryEntity> categories,
        List<WardEntity> wards,
        List<WingDetailsMastEntity>? wingDetails = null,
        List<WingEntity>? wings = null)
    {
        wingDetails ??= new List<WingDetailsMastEntity>();
        wings ??= new List<WingEntity>();

        // Fallback default dummy entities for in-memory LINQ left-join navigation
        if (!wingDetails.Exists(w => w.Id == 0))
        {
            wingDetails.Add(new WingDetailsMastEntity { Id = 0, WingMasterId = 0, IsActive = true });
        }
        if (!wings.Exists(w => w.Id == 0))
        {
            wings.Add(new WingEntity { Id = 0, WingNo = string.Empty, IsActive = true });
        }

        foreach (var p in properties)
        {
            p.WingDetailId ??= 0;
        }

        _propertyRepositoryMock.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _categoryRepositoryMock.Setup(r => r.GetQueryable()).Returns(categories.BuildMock());
        _wardRepositoryMock.Setup(r => r.GetQueryable()).Returns(wards.BuildMock());
        _wingDetailsRepositoryMock.Setup(r => r.GetQueryable()).Returns(wingDetails.BuildMock());
        _wingMasterRepositoryMock.Setup(r => r.GetQueryable()).Returns(wings.BuildMock());
    }

    [Fact]
    public async Task GetAsync_PropertyNotFound_ReturnsNull()
    {
        // Arrange
        SetupMocks(new List<PropertyEntity>(), new List<PropertyCategoryEntity>(), new List<WardEntity>());

        // Act
        var result = await _service.GetAsync(1, "Current");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_CurrentFilter_ReturnsCurrentProperty()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 1, PropertyNo = "10", IsActive = true, MarkedForDeletion = false }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Individual", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };

        SetupMocks(properties, categories, wards);

        // Act
        var result = await _service.GetAsync(1, "Current");

        // Assert
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.WardNo.Should().Be("W1");
        result.Category.Should().Be("Individual");
        result.PropertyType.Should().Be("Current");
    }

    [Fact]
    public async Task GetAsync_NextFilter_NormalProperty_ReturnsNextMainProperty()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 1, PropertyNo = "10", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 1, PropertyNo = "11", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 1, PropertyNo = "12", IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Individual", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };

        SetupMocks(properties, categories, wards);

        // Act
        var result = await _service.GetAsync(2, "Next");

        // Assert
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("12");
        result.PropertyType.Should().Be("Next");
    }

    [Fact]
    public async Task GetAsync_PreviousFilter_NormalProperty_ReturnsPreviousMainProperty()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 1, PropertyNo = "10", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 1, PropertyNo = "11", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 1, PropertyNo = "12", IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Individual", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };

        SetupMocks(properties, categories, wards);

        // Act
        var result = await _service.GetAsync(2, "Previous");

        // Assert
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.PropertyType.Should().Be("Previous");
    }

    [Fact]
    public async Task GetAsync_NextFilter_ApartmentMain_ReturnsFirstFlatOfFirstWing()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 20, IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };
        var wingDetails = new List<WingDetailsMastEntity>
        {
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, IsActive = true },
            new WingDetailsMastEntity { Id = 20, WingMasterId = 200, IsActive = true }
        };
        var wings = new List<WingEntity>
        {
            new WingEntity { Id = 100, WingNo = "A", IsActive = true },
            new WingEntity { Id = 200, WingNo = "B", IsActive = true }
        };

        SetupMocks(properties, categories, wards, wingDetails, wings);

        // Act
        var result = await _service.GetAsync(1, "Next");

        // Assert
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.FlatOrShopNo.Should().Be("101");
        result.WingNo.Should().Be("A");
        result.PropertyType.Should().Be("Next");
    }

    [Fact]
    public async Task GetAsync_NextFilter_ApartmentFlat_NextFlatInSameWing_ReturnsNextFlat()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "102", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };
        var wingDetails = new List<WingDetailsMastEntity>
        {
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, IsActive = true }
        };
        var wings = new List<WingEntity>
        {
            new WingEntity { Id = 100, WingNo = "A", IsActive = true }
        };

        SetupMocks(properties, categories, wards, wingDetails, wings);

        // Act
        var result = await _service.GetAsync(2, "Next");

        // Assert
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.FlatOrShopNo.Should().Be("102");
        result.WingNo.Should().Be("A");
        result.PropertyType.Should().Be("Next");
    }

    [Fact]
    public async Task GetAsync_NextFilter_ApartmentFlat_LastFlatInWing_ReturnsFirstFlatOfNextWing()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "102", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 20, IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };
        var wingDetails = new List<WingDetailsMastEntity>
        {
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, IsActive = true },
            new WingDetailsMastEntity { Id = 20, WingMasterId = 200, IsActive = true }
        };
        var wings = new List<WingEntity>
        {
            new WingEntity { Id = 100, WingNo = "Wing-A", IsActive = true },
            new WingEntity { Id = 200, WingNo = "Wing-B", IsActive = true }
        };

        SetupMocks(properties, categories, wards, wingDetails, wings);

        // Act - Id 2 is last flat in Wing-A (102)
        var result = await _service.GetAsync(2, "Next");

        // Assert - should return first flat of Wing-B (Id 3, Flat 101)
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.FlatOrShopNo.Should().Be("101");
        result.WingNo.Should().Be("Wing-B");
        result.PropertyType.Should().Be("Next");
    }

    [Fact]
    public async Task GetAsync_NextFilter_ApartmentFlat_LastFlatInLastWing_ReturnsNextMainProperty()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "1" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 1, PropertyNo = "11", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Individual", IsActive = true },
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };
        var wingDetails = new List<WingDetailsMastEntity>
        {
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, IsActive = true }
        };
        var wings = new List<WingEntity>
        {
            new WingEntity { Id = 100, WingNo = "A", IsActive = true }
        };

        SetupMocks(properties, categories, wards, wingDetails, wings);

        // Act - Id 2 is last flat of apartment 10
        var result = await _service.GetAsync(2, "Next");

        // Assert - should return main PropertyNo 11
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("11");
        result.PropertyType.Should().Be("Next");
    }

    [Fact]
    public async Task GetAsync_PreviousFilter_ApartmentFlat_PreviousFlatInSameWing_ReturnsPreviousFlat()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "102", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };
        var wingDetails = new List<WingDetailsMastEntity>
        {
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, IsActive = true }
        };
        var wings = new List<WingEntity>
        {
            new WingEntity { Id = 100, WingNo = "A", IsActive = true }
        };

        SetupMocks(properties, categories, wards, wingDetails, wings);

        // Act - Id 3 is Flat 102
        var result = await _service.GetAsync(3, "Previous");

        // Assert - should return Flat 101 (Id 2)
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.FlatOrShopNo.Should().Be("101");
        result.WingNo.Should().Be("A");
        result.PropertyType.Should().Be("Previous");
    }

    [Fact]
    public async Task GetAsync_PreviousFilter_ApartmentFlat_FirstFlatInWing_ReturnsLastFlatOfPreviousWing()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "102", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 3, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 20, IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };
        var wingDetails = new List<WingDetailsMastEntity>
        {
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, IsActive = true },
            new WingDetailsMastEntity { Id = 20, WingMasterId = 200, IsActive = true }
        };
        var wings = new List<WingEntity>
        {
            new WingEntity { Id = 100, WingNo = "A", IsActive = true },
            new WingEntity { Id = 200, WingNo = "B", IsActive = true }
        };

        SetupMocks(properties, categories, wards, wingDetails, wings);

        // Act - Id 3 is first flat of Wing B (Flat 101)
        var result = await _service.GetAsync(3, "Previous");

        // Assert - should return last flat of Wing A (Id 2, Flat 102)
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.FlatOrShopNo.Should().Be("102");
        result.WingNo.Should().Be("A");
        result.PropertyType.Should().Be("Previous");
    }

    [Fact]
    public async Task GetAsync_PreviousFilter_ApartmentFlat_FirstFlatInFirstWing_ReturnsMainProperty()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "101", WingDetailId = 10, IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };
        var wingDetails = new List<WingDetailsMastEntity>
        {
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, IsActive = true }
        };
        var wings = new List<WingEntity>
        {
            new WingEntity { Id = 100, WingNo = "A", IsActive = true }
        };

        SetupMocks(properties, categories, wards, wingDetails, wings);

        // Act - Id 2 is first flat of Wing A
        var result = await _service.GetAsync(2, "Previous");

        // Assert - should return main apartment property DTO with empty FlatOrShopNo
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("10");
        result.FlatOrShopNo.Should().BeEmpty();
        result.PropertyType.Should().Be("Previous");
    }

    [Fact]
    public async Task GetAsync_NextFilter_ApartmentMain_NoFlatsInAnyWing_ReturnsNextMainProperty()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new PropertyEntity { Id = 1, WardId = 1, CategoryId = 2, PropertyNo = "10", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" },
            new PropertyEntity { Id = 2, WardId = 1, CategoryId = 1, PropertyNo = "11", FlatOrShopNo = "", IsActive = true, MarkedForDeletion = false, PartitionNo = "" }
        };
        var categories = new List<PropertyCategoryEntity>
        {
            new PropertyCategoryEntity { Id = 1, PropertyCategoryName = "Individual", IsActive = true },
            new PropertyCategoryEntity { Id = 2, PropertyCategoryName = "Apartment", IsActive = true }
        };
        var wards = new List<WardEntity>
        {
            new WardEntity { Id = 1, WardNo = "W1", IsActive = true }
        };

        SetupMocks(properties, categories, wards);

        // Act - Id 1 is main apartment with no flats
        var result = await _service.GetAsync(1, "Next");

        // Assert - should jump to PropertyNo 11
        result.Should().NotBeNull();
        result!.PropertyNo.Should().Be("11");
        result.PropertyType.Should().Be("Next");
    }
}
