using MockQueryable;
using Moq;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Services.PropertyMedia;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class PropertyMediaFileMatchResolverTests
{
    private readonly Mock<IRepository<WardEntity, int>> _wardRepoMock = new();
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepoMock = new();
    private readonly Mock<IRepository<PropertyCategoryEntity, int>> _categoryRepoMock = new();
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _propertyTypeRepoMock = new();
    private readonly Mock<IRepository<PropertyPhotoTypeEntity, int>> _photoTypeRepoMock = new();

    private PropertyMediaFileMatchResolver CreateResolver()
    {
        return new PropertyMediaFileMatchResolver(
            _wardRepoMock.Object,
            _propertyRepoMock.Object,
            _categoryRepoMock.Object,
            _propertyTypeRepoMock.Object,
            _photoTypeRepoMock.Object);
    }

    private void SetupTestData()
    {
        var wards = new List<WardEntity>
        {
            new() { Id = 86, WardNo = "MM8", IsActive = true }
        };
        _wardRepoMock.Setup(r => r.GetQueryable()).Returns(wards.BuildMock());

        var categories = new List<PropertyCategoryEntity>
        {
            new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true },
            new() { Id = 2, PropertyCategoryName = "Individual", IsActive = true },
            new() { Id = 3, PropertyCategoryName = "Industry", IsActive = true },
            new() { Id = 4, PropertyCategoryName = "Plot", IsActive = true }
        };
        _categoryRepoMock.Setup(r => r.GetQueryable()).Returns(categories.BuildMock());

        var photoTypes = new List<PropertyPhotoTypeEntity>
        {
            new() { Id = 10, PhotoTypeCode = "PROPERTY_INSIDE", PhotoTypeName = "Property Inside Photo", IsActive = true },
            new() { Id = 20, PhotoTypeCode = "PROPERTY_FRONT", PhotoTypeName = "Property Front Photo", IsActive = true }
        };
        _photoTypeRepoMock.Setup(r => r.GetQueryable()).Returns(photoTypes.BuildMock());

        var properties = new List<PropertyEntity>
        {
            // Property 132 in Ward 86: Individual category (CategoryId = 2) with partitions NULL, 1, 2, 3, 4
            new() { Id = 1737919, WardId = 86, PropertyNo = "132", PartitionNo = null, CategoryId = 2, IsActive = true, MarkedForDeletion = false },
            new() { Id = 1738170, WardId = 86, PropertyNo = "132", PartitionNo = "1", CategoryId = 2, IsActive = true, MarkedForDeletion = false },
            new() { Id = 1738171, WardId = 86, PropertyNo = "132", PartitionNo = "2", CategoryId = 2, IsActive = true, MarkedForDeletion = false },
            new() { Id = 1738172, WardId = 86, PropertyNo = "132", PartitionNo = "3", CategoryId = 2, IsActive = true, MarkedForDeletion = false },
            new() { Id = 1738173, WardId = 86, PropertyNo = "132", PartitionNo = "4", CategoryId = 2, IsActive = true, MarkedForDeletion = false },

            // Property 200 in Ward 86: Apartment category (CategoryId = 1) with partition AM10
            new() { Id = 1800001, WardId = 86, PropertyNo = "200", PartitionNo = "AM10", CategoryId = 1, IsActive = true, MarkedForDeletion = false }
        };
        _propertyRepoMock.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
    }

    [Fact]
    public async Task ResolveAsync_WhenPartitionNoDoesNotExistUnderIndividualProperty_ReturnsNoMatch()
    {
        // Arrange
        SetupTestData();
        var resolver = CreateResolver();
        var files = new[] { "MM8-132-AM10-C.jpg", "MM8-132-AM11-C.jpg" };

        // Act (PhotoTypeId = 10 is "Property Inside Photo" requiring suffix 'C')
        var results = await resolver.ResolveAsync(files, photoTypeId: 10);

        // Assert: Neither AM10 nor AM11 exists in DB for Property 132, so neither should match!
        Assert.Equal(2, results.Count);

        var match1 = results.First(r => r.FileName == "MM8-132-AM10-C.jpg");
        Assert.Equal(nameof(PropertyMediaJobDetailStatus.NoMatch), match1.Status);
        Assert.Equal(nameof(PropertyMediaSkipReason.PropertyNotFound), match1.SkipReason);
        Assert.False(match1.IsMatched);

        var match2 = results.First(r => r.FileName == "MM8-132-AM11-C.jpg");
        Assert.Equal(nameof(PropertyMediaJobDetailStatus.NoMatch), match2.Status);
        Assert.Equal(nameof(PropertyMediaSkipReason.PropertyNotFound), match2.SkipReason);
        Assert.False(match2.IsMatched);
    }

    [Fact]
    public async Task ResolveAsync_WhenPartitionNoExistsUnderIndividualProperty_MatchesSpecificPartition()
    {
        // Arrange
        SetupTestData();
        var resolver = CreateResolver();
        var files = new[] { "MM8-132-1-C.jpg" };

        // Act
        var results = await resolver.ResolveAsync(files, photoTypeId: 10);

        // Assert: Partition 1 exists under Property 132 (Id = 1738170)
        Assert.Single(results);
        var result = results[0];
        Assert.True(result.IsMatched);
        Assert.Equal(nameof(PropertyMediaJobDetailStatus.Matched), result.Status);
        Assert.Equal(1738170, result.PropertyId);
        Assert.Equal("1", result.PartitionNo);
        Assert.Equal("Ward MM8 - Property 132 - 1", result.PropertyDisplay);
    }

    [Fact]
    public async Task ResolveAsync_WhenPartitionNoOmittedForIndividualProperty_MatchesUnpartitionedRecord()
    {
        // Arrange: PartitionNo is optional for Individual category
        SetupTestData();
        var resolver = CreateResolver();
        var files = new[] { "MM8-132-C.jpg" };

        // Act
        var results = await resolver.ResolveAsync(files, photoTypeId: 10);

        // Assert: Matches parent/unpartitioned Individual record (Id = 1737919)
        Assert.Single(results);
        var result = results[0];
        Assert.True(result.IsMatched);
        Assert.Equal(nameof(PropertyMediaJobDetailStatus.Matched), result.Status);
        Assert.Equal(1737919, result.PropertyId);
        Assert.Equal("Ward MM8 - Property 132", result.PropertyDisplay);
    }

    [Fact]
    public async Task ResolveAsync_WhenPartitionNoOmittedForApartmentCategory_ReturnsNoMatchBecausePartitionIsMandatory()
    {
        // Arrange: Property 200 is Apartment (CategoryId = 1). PartitionNo is mandatory!
        SetupTestData();
        var resolver = CreateResolver();
        var files = new[] { "MM8-200-C.jpg" };

        // Act
        var results = await resolver.ResolveAsync(files, photoTypeId: 10);

        // Assert: Must return NoMatch because PartitionNo is mandatory for Apartment
        Assert.Single(results);
        var result = results[0];
        Assert.False(result.IsMatched);
        Assert.Equal(nameof(PropertyMediaJobDetailStatus.NoMatch), result.Status);
        Assert.Equal(nameof(PropertyMediaSkipReason.PropertyNotFound), result.SkipReason);
    }

    [Fact]
    public async Task ResolveAsync_WhenPartitionNoProvidedForApartmentCategoryAndExists_MatchesSuccessfully()
    {
        // Arrange: Property 200 has partition AM10
        SetupTestData();
        var resolver = CreateResolver();
        var files = new[] { "MM8-200-AM10-C.jpg" };

        // Act
        var results = await resolver.ResolveAsync(files, photoTypeId: 10);

        // Assert: Matches Apartment partition AM10 (Id = 1800001)
        Assert.Single(results);
        var result = results[0];
        Assert.True(result.IsMatched);
        Assert.Equal(nameof(PropertyMediaJobDetailStatus.Matched), result.Status);
        Assert.Equal(1800001, result.PropertyId);
        Assert.Equal("AM10", result.PartitionNo);
    }

    [Fact]
    public async Task ResolveAsync_WhenSuffixMismatchesPhotoSubtype_ReturnsSuffixMismatch()
    {
        // Arrange: MM8-132-AM10-A.jpg has suffix 'A', but photoTypeId 10 requires suffix 'C'
        SetupTestData();
        var resolver = CreateResolver();
        var files = new[] { "MM8-132-AM10-A.jpg" };

        // Act
        var results = await resolver.ResolveAsync(files, photoTypeId: 10);

        // Assert
        Assert.Single(results);
        var result = results[0];
        Assert.False(result.IsMatched);
        Assert.Equal(nameof(PropertyMediaJobDetailStatus.NoMatch), result.Status);
        Assert.Equal(nameof(PropertyMediaSkipReason.SuffixMismatch), result.SkipReason);
    }
}
