using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Application.Services.GIS.Asset;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.GIS;
using Xunit;

namespace NtisPlatform.Tests.Application.GIS;

public class GisAssetUploadServiceTests
{
    private readonly Mock<IGisAssetRepository> _mockAssetRepo;
    private readonly Mock<IGisAssetTileService> _mockTileService;
    private readonly Mock<IRepository<GisUploadHistoryEntity, int>> _mockUploadHistoryRepo;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ILogger<GisAssetUploadService>> _mockLogger;
    private readonly Mock<ICurrentUserService> _mockCurrentUser;
    private readonly GisAssetUploadService _service;

    public GisAssetUploadServiceTests()
    {
        _mockAssetRepo = new Mock<IGisAssetRepository>();
        _mockTileService = new Mock<IGisAssetTileService>();
        _mockUploadHistoryRepo = new Mock<IRepository<GisUploadHistoryEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockLogger = new Mock<ILogger<GisAssetUploadService>>();
        _mockCurrentUser = new Mock<ICurrentUserService>();

        _mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(1);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _service = new GisAssetUploadService(
            _mockAssetRepo.Object,
            _mockTileService.Object,
            _mockUploadHistoryRepo.Object,
            _mockUnitOfWork.Object,
            _mockLogger.Object,
            _mockCurrentUser.Object);
    }

    [Fact]
    public async Task ProcessAssetGeoJsonAsync_NullStream_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            _service.ProcessAssetGeoJsonAsync(null!, "test.geojson", "1", "replace"));
    }

    [Fact]
    public async Task ProcessAssetGeoJsonAsync_InvalidMode_ThrowsArgumentException()
    {
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.ProcessAssetGeoJsonAsync(stream, "test.geojson", "1", "invalid_mode"));
    }

    [Fact]
    public async Task ProcessAssetGeoJsonAsync_EmptyFeatureCollection_ThrowsInvalidDataException()
    {
        const string geoJson = @"{
            ""type"": ""FeatureCollection"",
            ""features"": []
        }";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(geoJson));

        _mockAssetRepo.Setup(r => r.GetAssetMasterValidationLookupAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((new HashSet<int> { 101 }, new Dictionary<string, int> { ["BLD-101"] = 101 }));

        await Assert.ThrowsAsync<InvalidDataException>(() =>
            _service.ProcessAssetGeoJsonAsync(stream, "test.geojson", "1", "replace"));
    }

    [Fact]
    public async Task ProcessAssetGeoJsonAsync_ValidGeoJson_ReplaceMode_PersistsAndReturnsResult()
    {
        const string geoJson = @"{
            ""type"": ""FeatureCollection"",
            ""features"": [
                {
                    ""type"": ""Feature"",
                    ""properties"": {
                        ""AssetMasterId"": 101,
                        ""BUILDING_I"": ""BLD-101"",
                        ""AREA_SQ_MT"": 250.5,
                        ""LAT"": 19.2184,
                        ""LONG"": 72.9781
                    },
                    ""geometry"": {
                        ""type"": ""Polygon"",
                        ""coordinates"": [[[72.978, 19.218], [72.979, 19.218], [72.979, 19.219], [72.978, 19.219], [72.978, 19.218]]]
                    }
                }
            ]
        }";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(geoJson));

        _mockAssetRepo.Setup(r => r.GetAssetMasterValidationLookupAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((new HashSet<int> { 101 }, new Dictionary<string, int> { ["BLD-101"] = 101 }));

        _mockAssetRepo.Setup(r => r.ReplaceAllGeometriesAsync(It.IsAny<List<GisAssetGeometryEntity>>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _service.ProcessAssetGeoJsonAsync(stream, "test.geojson", "1", "replace", ulbId: 1);

        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal(1, result.TotalFeatures);
        Assert.Equal(1, result.ImportedFeatures);
        Assert.Equal(0, result.SkippedFeatures);
        Assert.Equal("replace", result.Mode);

        _mockAssetRepo.Verify(r => r.ReplaceAllGeometriesAsync(
            It.Is<List<GisAssetGeometryEntity>>(list => list.Count == 1 && list[0].AssetMasterId == 101),
            1,
            It.IsAny<CancellationToken>()), Times.Once);

        _mockTileService.Verify(t => t.ReloadStatusCacheAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUploadHistoryRepo.Verify(u => u.AddAsync(It.IsAny<GisUploadHistoryEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessAssetGeoJsonAsync_ValidGeoJson_UpsertMode_CallsUpsertGeometries()
    {
        const string geoJson = @"{
            ""type"": ""FeatureCollection"",
            ""features"": [
                {
                    ""type"": ""Feature"",
                    ""properties"": {
                        ""AssetNo"": ""BLD-102""
                    },
                    ""geometry"": {
                        ""type"": ""Polygon"",
                        ""coordinates"": [[[72.978, 19.218], [72.979, 19.218], [72.979, 19.219], [72.978, 19.219], [72.978, 19.218]]]
                    }
                }
            ]
        }";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(geoJson));

        _mockAssetRepo.Setup(r => r.GetAssetMasterValidationLookupAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((new HashSet<int> { 102 }, new Dictionary<string, int> { ["BLD-102"] = 102 }));

        _mockAssetRepo.Setup(r => r.UpsertGeometriesAsync(It.IsAny<List<GisAssetGeometryEntity>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _service.ProcessAssetGeoJsonAsync(stream, "upsert.geojson", "1", "upsert");

        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal(1, result.TotalFeatures);
        Assert.Equal(1, result.ImportedFeatures);
        Assert.Equal("upsert", result.Mode);

        _mockAssetRepo.Verify(r => r.UpsertGeometriesAsync(
            It.Is<List<GisAssetGeometryEntity>>(list => list.Count == 1 && list[0].AssetMasterId == 102),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessAssetGeoJsonAsync_DuplicateFeatures_DeduplicatesAndIncrementsSkippedCount()
    {
        const string geoJson = @"{
            ""type"": ""FeatureCollection"",
            ""features"": [
                {
                    ""type"": ""Feature"",
                    ""properties"": { ""AssetMasterId"": 101 },
                    ""geometry"": {
                        ""type"": ""Polygon"",
                        ""coordinates"": [[[72.978, 19.218], [72.979, 19.218], [72.979, 19.219], [72.978, 19.219], [72.978, 19.218]]]
                    }
                },
                {
                    ""type"": ""Feature"",
                    ""properties"": { ""AssetMasterId"": 101 },
                    ""geometry"": {
                        ""type"": ""Polygon"",
                        ""coordinates"": [[[72.978, 19.218], [72.979, 19.218], [72.979, 19.219], [72.978, 19.219], [72.978, 19.218]]]
                    }
                }
            ]
        }";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(geoJson));

        _mockAssetRepo.Setup(r => r.GetAssetMasterValidationLookupAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((new HashSet<int> { 101 }, new Dictionary<string, int> { ["BLD-101"] = 101 }));

        _mockAssetRepo.Setup(r => r.ReplaceAllGeometriesAsync(It.IsAny<List<GisAssetGeometryEntity>>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _service.ProcessAssetGeoJsonAsync(stream, "dup.geojson", "1", "replace");

        Assert.Equal(2, result.TotalFeatures);
        Assert.Equal(1, result.ImportedFeatures);
        Assert.Equal(1, result.SkippedFeatures);
    }
}
