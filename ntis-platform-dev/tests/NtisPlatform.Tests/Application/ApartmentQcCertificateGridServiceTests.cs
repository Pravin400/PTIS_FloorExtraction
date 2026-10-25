using Moq;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services;
using Xunit;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Service-level regression tests for <see cref="ApartmentQcCertificateGridService"/>.
/// Documents the intended routing precedence when different query-parameter combinations
/// are supplied. Each test verifies which repository method the service dispatches to.
/// </summary>
public class ApartmentQcCertificateGridServiceTests
{
    private readonly Mock<IApartmentQcTopSectionRepository> _topSectionRepoMock = new();
    private readonly Mock<IApartmentQcCertificateGridRepository> _gridRepoMock = new();

    private ApartmentQcCertificateGridService CreateService()
        => new(_topSectionRepoMock.Object, _gridRepoMock.Object);

    // ──────────────────────────────────────────────────────────────────────
    // 1. PropertyId only → Single-unit path (includes floor-level certificates)
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_PropertyIdOnly_RoutesToSingleUnitPath()
    {
        // Arrange — PropertyId alone (no SocietyId, no WingDetailsId, no WardId+PropertyNo)
        var query = new ApartmentQcTopSectionQueryParameters { PropertyId = 42 };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _gridRepoMock
            .Setup(r => r.GetGridForUnitAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — single-unit, not apartment-wide
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(42, It.IsAny<CancellationToken>()), Times.Once);
        _gridRepoMock.Verify(r => r.GetGridForWingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. SocietyId + PropertyId → Apartment-wide path (SocietyId passed through)
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_SocietyIdAndPropertyId_RoutesToApartmentWideWithExplicitSocietyId()
    {
        // Arrange
        var query = new ApartmentQcTopSectionQueryParameters { PropertyId = 42, SocietyId = 5 };
        var resolvedProperty = new PropertyTopSectionRawData { Id = 42, WardId = 77, PropertyNo = "116" };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedProperty);
        _gridRepoMock
            .Setup(r => r.GetGridAsync(77, "116", 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — apartment-wide with explicit SocietyId
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridForWingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridAsync(77, "116", 5, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 3. PartitionNo only (no SocietyId) → Single-unit path
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_PartitionNoOnly_RoutesToSingleUnitPath()
    {
        // Arrange
        var query = new ApartmentQcTopSectionQueryParameters
        {
            WardId = 77,
            PropertyNo = "116",
            PartitionNo = "A2"
        };
        var resolvedProperty = new PropertyTopSectionRawData { Id = 99, WardId = 77, PropertyNo = "116" };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedProperty);
        _gridRepoMock
            .Setup(r => r.GetGridForUnitAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — single-unit, not apartment-wide
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(99, It.IsAny<CancellationToken>()), Times.Once);
        _gridRepoMock.Verify(r => r.GetGridAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 4. Upic only (no SocietyId) → Single-unit path
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_UpicOnly_RoutesToSingleUnitPath()
    {
        // Arrange
        var query = new ApartmentQcTopSectionQueryParameters { Upic = "UPIC-12345" };
        var resolvedProperty = new PropertyTopSectionRawData { Id = 88, WardId = 77, PropertyNo = "116" };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedProperty);
        _gridRepoMock
            .Setup(r => r.GetGridForUnitAsync(88, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — single-unit, not apartment-wide
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(88, It.IsAny<CancellationToken>()), Times.Once);
        _gridRepoMock.Verify(r => r.GetGridAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 5. Standalone WingDetailsId (no SocietyId, no PropertyId) → Wing path
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_StandaloneWingDetailsId_RoutesToWingPath()
    {
        // Arrange
        var query = new ApartmentQcTopSectionQueryParameters { WingDetailsId = 10 };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _gridRepoMock
            .Setup(r => r.GetGridForWingAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — wing path, not apartment or unit
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForWingAsync(10, It.IsAny<CancellationToken>()), Times.Once);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 6. SocietyId + PartitionNo → Apartment-wide (SocietyId suppresses single-unit)
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_SocietyIdWithPartitionNo_RoutesToApartmentWidePath()
    {
        // Arrange — even though PartitionNo is present, SocietyId suppresses the single-unit path
        var query = new ApartmentQcTopSectionQueryParameters
        {
            SocietyId = 5,
            WardId = 77,
            PropertyNo = "116",
            PartitionNo = "A2"
        };
        var resolvedProperty = new PropertyTopSectionRawData { Id = 99, WardId = 77, PropertyNo = "116" };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedProperty);
        _gridRepoMock
            .Setup(r => r.GetGridAsync(77, "116", 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — apartment-wide even with PartitionNo, because SocietyId is present
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridAsync(77, "116", 5, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 7. SocietyId + Upic → Apartment-wide (SocietyId suppresses single-unit)
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_SocietyIdWithUpic_RoutesToApartmentWidePath()
    {
        // Arrange — even though Upic is present, SocietyId suppresses the single-unit path
        var query = new ApartmentQcTopSectionQueryParameters
        {
            SocietyId = 5,
            Upic = "UPIC-12345"
        };
        var resolvedProperty = new PropertyTopSectionRawData { Id = 88, WardId = 77, PropertyNo = "116" };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedProperty);
        _gridRepoMock
            .Setup(r => r.GetGridAsync(77, "116", 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — apartment-wide
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridAsync(77, "116", 5, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 8. No identifiers → Returns null
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_NoIdentifiers_ReturnsNull()
    {
        // Arrange — PartitionNo alone without WardId+PropertyNo is not a single-unit request,
        // and GetPropertyAsync returns null when no identifier resolves
        var query = new ApartmentQcTopSectionQueryParameters();

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertyTopSectionRawData?)null);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert
        Assert.Null(result);
        _gridRepoMock.Verify(r => r.GetGridForUnitAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridForWingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _gridRepoMock.Verify(r => r.GetGridAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 9. Property resolves but has null PropertyNo → Returns null
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_ResolvedPropertyWithNullPropertyNo_ReturnsNull()
    {
        // Arrange — SocietyId + PropertyId routes to apartment-wide path, where null PropertyNo returns null
        var query = new ApartmentQcTopSectionQueryParameters { PropertyId = 42, SocietyId = 5 };
        var resolvedProperty = new PropertyTopSectionRawData { Id = 42, WardId = 77, PropertyNo = null! };

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedProperty);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — null PropertyNo means we can't build an apartment-wide query
        Assert.Null(result);
        _gridRepoMock.Verify(r => r.GetGridAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 10. WingDetailsId + PropertyId (no SocietyId) → Apartment-wide (not wing-only)
    // ──────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGridAsync_WingDetailsIdWithPropertyId_RoutesToApartmentNotWingOnly()
    {
        // Arrange — WingDetailsId is present but so is PropertyId, so it's not "standalone wing"
        var query = new ApartmentQcTopSectionQueryParameters { PropertyId = 42, WingDetailsId = 10 };
        var resolvedProperty = new PropertyTopSectionRawData { Id = 42, WardId = 77, PropertyNo = "116" };
        var expectedGrid = new ApartmentQcCertificateGridDto();

        _topSectionRepoMock
            .Setup(r => r.GetPropertyAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolvedProperty);
        _gridRepoMock
            .Setup(r => r.GetGridAsync(77, "116", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedGrid);

        // Act
        var service = CreateService();
        var result = await service.GetGridAsync(query);

        // Assert — apartment-wide, not wing-only
        Assert.Same(expectedGrid, result);
        _gridRepoMock.Verify(r => r.GetGridForWingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
