using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NetTopologySuite.Geometries;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.GIS;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.GIS;
using NtisPlatform.Core.Models.GIS;
using Xunit;

namespace NtisPlatform.Tests.Application.GIS;

/// <summary>
/// Comprehensive, isolated unit tests verifying that all GIS styles, KPI colors,
/// layer boundaries, and vector tile properties are dynamically resolved from database columns.
/// </summary>
public class GisDynamicConfigAndStyleTests
{
    private readonly Mock<IRepository<GisLayerMasterEntity, int>> _mockLayerMasterRepo;
    private readonly Mock<IRepository<GisLayerJsonEntity, int>> _mockLayerJsonRepo;
    private readonly Mock<IRepository<GisUploadHistoryEntity, int>> _mockUploadHistoryRepo;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<AutoMapper.IMapper> _mockMapper;
    private readonly IMemoryCache _memoryCache;
    private readonly IConfiguration _configuration;

    public GisDynamicConfigAndStyleTests()
    {
        _mockLayerMasterRepo = new Mock<IRepository<GisLayerMasterEntity, int>>();
        _mockLayerJsonRepo = new Mock<IRepository<GisLayerJsonEntity, int>>();
        _mockUploadHistoryRepo = new Mock<IRepository<GisUploadHistoryEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<AutoMapper.IMapper>();

        _memoryCache = new MemoryCache(new MemoryCacheOptions());

        var configValues = new Dictionary<string, string?>
        {
            ["GisSettings:DefaultAssetColor"] = "#0078FF"
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
    }

    #region 1. GisStyleConfigService Dynamic Database Resolution Tests

    [Fact]
    public async Task GetLayerStyleConfigAsync_ReadsDynamicColorsDirectlyFrom_GisLayerMaster_StyleConfigJson()
    {
        // Arrange
        const string customStyleJson = @"{
            ""defaultColor"": ""#E11D48"",
            ""defaultStrokeColor"": ""#9F1239"",
            ""defaultOpacity"": 0.65,
            ""defaultStrokeWidth"": 3,
            ""statusColors"": {
                ""ENCROACHED"": ""#DC2626"",
                ""VACANT"": ""#16A34A""
            },
            ""categoryColors"": {
                ""101"": ""#2563EB""
            }
        }";

        var layerEntity = new GisLayerMasterEntity
        {
            Id = 1,
            LayerCode = "WATER_SUPPLY",
            DepartmentId = 5,
            IsActive = true,
            StyleConfigJson = customStyleJson
        };

        _mockLayerMasterRepo
            .Setup(r => r.GetAsync(It.IsAny<Expression<Func<GisLayerMasterEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GisLayerMasterEntity> { layerEntity });

        var logger = Mock.Of<ILogger<GisStyleConfigService>>();
        var service = new GisStyleConfigService(_mockLayerMasterRepo.Object, _configuration, _memoryCache, logger);

        // Act
        var config = await service.GetLayerStyleConfigAsync("WATER_SUPPLY", 5);

        // Assert: Dynamic values match exactly what is in the DB JSON column
        Assert.NotNull(config);
        Assert.Equal("#E11D48", config.DefaultColor);
        Assert.Equal("#9F1239", config.DefaultStrokeColor);
        Assert.Equal(0.65, config.DefaultOpacity);
        Assert.Equal(3, config.DefaultStrokeWidth);
        Assert.True(config.StatusColors.ContainsKey("ENCROACHED"));
        Assert.Equal("#DC2626", config.StatusColors["ENCROACHED"]);
        Assert.Equal("#16A34A", config.StatusColors["VACANT"]);
        Assert.Equal("#2563EB", config.CategoryColors[101]);
    }

    [Fact]
    public void ResolveAssetColor_DynamicallyResolves_ConfiguredStatusColor_FromDatabaseConfig()
    {
        // Arrange
        var logger = Mock.Of<ILogger<GisStyleConfigService>>();
        var service = new GisStyleConfigService(_mockLayerMasterRepo.Object, _configuration, _memoryCache, logger);

        var styleConfig = new GisLayerStyleConfigDto
        {
            DefaultColor = "#0078FF",
            StatusColors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["FULL"] = "#EF4444",     // Encroached color from DB
                ["PARTIAL"] = "#F59E0B"
            }
        };

        var assetEntity = new GisAssetGeometryEntity
        {
            AssetMasterId = 10,
            Asset = new AssetMasterEntity
            {
                Id = 10,
                EncroachmentStatus = "FULL"
            }
        };

        // Act
        var resolvedColor = service.ResolveAssetColor(assetEntity, styleConfig, null);

        // Assert
        Assert.Equal("#EF4444", resolvedColor);
    }

    [Fact]
    public void ResolveAssetColor_FallsBackTo_AssetTypeMasterColorCode_WhenNoLayerOverride()
    {
        // Arrange
        var logger = Mock.Of<ILogger<GisStyleConfigService>>();
        var service = new GisStyleConfigService(_mockLayerMasterRepo.Object, _configuration, _memoryCache, logger);

        var styleConfig = new GisLayerStyleConfigDto
        {
            DefaultColor = "#0078FF" // General layer default
        };

        var assetEntity = new GisAssetGeometryEntity
        {
            AssetMasterId = 20,
            Asset = new AssetMasterEntity
            {
                Id = 20,
                AssetType = new AssetTypeEntity
                {
                    Id = 2,
                    TypeName = "Commercial Complex",
                    ColorCode = "#8B5CF6", // Dynamic Color configured in AMS.AssetTypeMaster
                    BorderColor = "#6D28D9"
                }
            }
        };

        // Act
        var resolvedColor = service.ResolveAssetColor(assetEntity, styleConfig, null);

        // Assert: ColorCode from AMS.AssetTypeMaster is used
        Assert.Equal("#8B5CF6", resolvedColor);
    }

    #endregion

    #region 2. GisLayerMasterService GeoJSON Dynamic Enrichment & Cache Eviction Tests

    [Fact]
    public async Task GetGeoJsonAsync_EnrichesRawGeoJsonFeatures_WithDynamicColors_FromDatabaseConfig()
    {
        // Arrange
        const int layerId = 42;
        const string rawGeoJson = @"{
            ""type"": ""FeatureCollection"",
            ""features"": [
                {
                    ""type"": ""Feature"",
                    ""properties"": { ""ward_no"": 5, ""name"": ""Ward 5"" },
                    ""geometry"": { ""type"": ""Polygon"", ""coordinates"": [[[79.0, 21.0], [79.1, 21.0], [79.1, 21.1], [79.0, 21.0]]] }
                }
            ]
        }";

        const string dynamicStyleJson = @"{
            ""defaultColor"": ""#10B981"",
            ""defaultStrokeColor"": ""#047857"",
            ""defaultOpacity"": 0.40,
            ""defaultStrokeWidth"": 2.5
        }";

        var layerEntity = new GisLayerMasterEntity
        {
            Id = layerId,
            LayerCode = "WARD_BOUNDARY",
            LayerName = "Ward Boundary Layer",
            IsActive = true,
            StyleConfigJson = dynamicStyleJson
        };

        var layerJsonEntity = new GisLayerJsonEntity
        {
            LayerMasterId = layerId,
            GeoJsonData = rawGeoJson,
            IsActive = true
        };

        _mockLayerMasterRepo
            .Setup(r => r.GetByIdAsync(layerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(layerEntity);

        _mockLayerJsonRepo
            .Setup(r => r.GetAsync(It.IsAny<Expression<Func<GisLayerJsonEntity, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GisLayerJsonEntity> { layerJsonEntity });

        var logger = Mock.Of<ILogger<GisLayerMasterService>>();
        var service = new GisLayerMasterService(
            _mockLayerMasterRepo.Object,
            _mockLayerJsonRepo.Object,
            _mockUploadHistoryRepo.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            logger,
            null,
            _memoryCache);

        // Act
        var enrichedJson = await service.GetGeoJsonAsync(layerId);

        // Assert
        Assert.NotNull(enrichedJson);
        using var doc = JsonDocument.Parse(enrichedJson!);
        var root = doc.RootElement;

        // Verify top-level dynamic style
        Assert.True(root.TryGetProperty("style", out var styleElement));
        Assert.Equal("#10B981", styleElement.GetProperty("color").GetString());
        Assert.Equal("#047857", styleElement.GetProperty("strokeColor").GetString());

        // Verify feature properties contain dynamic simplestyle attributes
        var features = root.GetProperty("features");
        var featureProps = features[0].GetProperty("properties");
        Assert.Equal("#10B981", featureProps.GetProperty("fill").GetString());
        Assert.Equal("#047857", featureProps.GetProperty("stroke").GetString());
        Assert.Equal(0.40, featureProps.GetProperty("fill-opacity").GetDouble());
    }

    [Fact]
    public async Task UpdateAsync_EvictsMemoryCache_SoUpdatedDatabaseColors_TakeEffectImmediately()
    {
        // Arrange
        const int layerId = 15;
        string cacheKey = $"gis_layer_geojson_{layerId}";
        _memoryCache.Set(cacheKey, "{ \"cached\": true }");

        var existingEntity = new GisLayerMasterEntity
        {
            Id = layerId,
            LayerCode = "ZONE_LAYER",
            DepartmentId = 1,
            StyleConfigJson = "{\"defaultColor\":\"#OLD\"}"
        };

        _mockLayerMasterRepo
            .Setup(r => r.GetByIdAsync(layerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingEntity);

        _mockMapper
            .Setup(m => m.Map<GisLayerMasterDto>(It.IsAny<GisLayerMasterEntity>()))
            .Returns(new GisLayerMasterDto { Id = layerId, LayerCode = "ZONE_LAYER", DepartmentId = 1 });

        var logger = Mock.Of<ILogger<GisLayerMasterService>>();
        var service = new GisLayerMasterService(
            _mockLayerMasterRepo.Object,
            _mockLayerJsonRepo.Object,
            _mockUploadHistoryRepo.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            logger,
            null,
            _memoryCache);

        var updateDto = new UpdateGisLayerMasterDto
        {
            LayerName = "Updated Zone Layer",
            StyleConfigJson = "{\"defaultColor\":\"#NEW_COLOR\"}"
        };

        // Act
        await service.UpdateAsync(layerId, updateDto);

        // Assert: Cache entry must have been evicted
        bool existsInCache = _memoryCache.TryGetValue(cacheKey, out _);
        Assert.False(existsInCache, "Cache for layer GeoJSON should be evicted after updating layer style configuration.");
    }

    #endregion

    #region 3. Vector Tile Dynamic Styling Integration Tests

    [Fact]
    public async Task GisAssetTileService_SerializesFeatures_WithDynamicColors_ResolvedFromDatabaseConfig()
    {
        // Arrange
        var mockAssetRepo = new Mock<IGisAssetRepository>();
        var mockStyleService = new Mock<IGisStyleConfigService>();
        var logger = Mock.Of<ILogger<GisAssetTileService>>();

        var geomFactory = new GeometryFactory(new PrecisionModel(), 4326);
        var coords = new[]
        {
            new Coordinate(72.978, 19.218),
            new Coordinate(72.979, 19.218),
            new Coordinate(72.979, 19.219),
            new Coordinate(72.978, 19.219),
            new Coordinate(72.978, 19.218)
        };
        var polygon = geomFactory.CreatePolygon(coords);

        var geometryEntity = new GisAssetGeometryEntity
        {
            AssetMasterId = 101,
            PolygonGeometry = polygon,
            Asset = new AssetMasterEntity
            {
                Id = 101,
                AssetNo = "AST-101",
                AssetName = "Municipal Hospital",
                AssetTypeId = 3,
                AssetType = new AssetTypeEntity
                {
                    Id = 3,
                    TypeName = "Hospital",
                    ColorCode = "#D97706",
                    BorderColor = "#92400E"
                }
            }
        };

        mockAssetRepo
            .Setup(r => r.GetIntersectingAssetGeometriesAsync(
                It.IsAny<Geometry>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<GisAssetGeometryEntity> { geometryEntity });

        var dynamicConfig = new GisLayerStyleConfigDto
        {
            DefaultColor = "#3B82F6",
            DefaultStrokeColor = "#1D4ED8"
        };

        mockStyleService
            .Setup(s => s.GetLayerStyleConfigAsync(It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(dynamicConfig);

        mockStyleService
            .Setup(s => s.ResolveAssetColor(geometryEntity, dynamicConfig, It.IsAny<GisAssetDataRequestDto?>()))
            .Returns("#3B82F6");

        var tileService = new GisAssetTileService(mockAssetRepo.Object, mockStyleService.Object, logger, null);

        var tileCoord = new TileCoordDto { Z = 14, X = 11985, Y = 7458 };
        var requestDto = new GisAssetDataRequestDto();

        // Act
        var tileBytes = await tileService.GetAssetTileAsync(tileCoord, requestDto);

        // Assert
        Assert.NotNull(tileBytes);
        Assert.NotEmpty(tileBytes);

        var tileJson = System.Text.Encoding.UTF8.GetString(tileBytes);
        using var jsonDoc = JsonDocument.Parse(tileJson);
        var root = jsonDoc.RootElement;

        Assert.Equal("FeatureCollection", root.GetProperty("type").GetString());
        var features = root.GetProperty("features");
        Assert.True(features.GetArrayLength() > 0);

        var featureProps = features[0].GetProperty("properties");
        Assert.Equal("#3B82F6", featureProps.GetProperty("colorCode").GetString());
        Assert.Equal("#92400E", featureProps.GetProperty("borderColor").GetString());
    }

    #endregion

    #region Asset Popup Route & Parameter Parity Tests

    [Fact]
    public async Task AssetPopupDetails_WithAssetId_ReturnsSuccess()
    {
        // Arrange
        var mockTileService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetTileService>();
        var mockUploadService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetUploadService>();
        var mockKpiService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetKpiService>();
        var mockFilterService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetFilterService>();
        var mockPopupService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetPopupService>();
        var mockLogger = new Mock<ILogger<NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController>>();

        var expectedPopup = new GisAssetPopupDetailsDto
        {
            AssetId = 42,
            AssetNo = "AST-00042",
            AssetName = "Municipal Health Center",
            AssetType = "Health",
            Department = "Health Department"
        };

        mockPopupService
            .Setup(s => s.GetAssetPopupDetailsAsync(42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedPopup);

        var controller = new NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController(
            mockTileService.Object,
            mockUploadService.Object,
            mockKpiService.Object,
            mockFilterService.Object,
            mockPopupService.Object,
            mockLogger.Object);

        // Act - Call using assetId (as from /api/gis/asset/{assetId}/popup or ?assetId=42)
        var result = await controller.AssetPopupDetails(assetId: 42, ct: CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var response = Assert.IsType<NtisPlatform.Application.Models.ApiResponse<GisAssetPopupDetailsDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Items);
        Assert.Equal(42, response.Items.AssetId);
        Assert.Equal("Municipal Health Center", response.Items.AssetName);
    }

    [Fact]
    public async Task AssetPopupDetails_WithZeroOrNegative_ReturnsBadRequest()
    {
        // Arrange
        var mockTileService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetTileService>();
        var mockUploadService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetUploadService>();
        var mockKpiService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetKpiService>();
        var mockFilterService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetFilterService>();
        var mockPopupService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetPopupService>();
        var mockLogger = new Mock<ILogger<NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController>>();

        var controller = new NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController(
            mockTileService.Object,
            mockUploadService.Object,
            mockKpiService.Object,
            mockFilterService.Object,
            mockPopupService.Object,
            mockLogger.Object);

        // Act
        var result = await controller.AssetPopupDetails(0, CancellationToken.None);

        // Assert
        var badResult = Assert.IsType<Microsoft.AspNetCore.Mvc.BadRequestObjectResult>(result);
        var response = Assert.IsType<NtisPlatform.Application.Models.ApiResponse<GisAssetPopupDetailsDto>>(badResult.Value);
        Assert.False(response.Success);
    }

    #endregion

    #region Asset Dashboard RBAC & Scoping Tests

    [Fact]
    public async Task UploadAssetGeoJson_NonAdminWithoutEditAccess_Returns403Forbidden()
    {
        // Arrange
        var mockTileService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetTileService>();
        var mockUploadService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetUploadService>();
        var mockKpiService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetKpiService>();
        var mockFilterService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetFilterService>();
        var mockPopupService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetPopupService>();
        var mockLogger = new Mock<ILogger<NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController>>();
        var mockUserAccess = new Mock<NtisPlatform.Application.Interfaces.Master.IGisDepartmentUserAccessService>();
        var mockCurrentUser = new Mock<NtisPlatform.Application.Interfaces.ICurrentUserService>();

        mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(1006);

        var accessList = new List<GisDepartmentUserAccessDto>
        {
            new GisDepartmentUserAccessDto { UserId = 1006, DepartmentId = 3, UlbId = 1, CanView = true, CanEdit = false, CanExport = true }
        };
        mockUserAccess.Setup(s => s.GetAllAsync(It.IsAny<GisDepartmentUserAccessQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NtisPlatform.Application.Models.PagedResult<GisDepartmentUserAccessDto>(accessList, 1, 1, 10));

        var controller = new NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController(
            mockTileService.Object,
            mockUploadService.Object,
            mockKpiService.Object,
            mockFilterService.Object,
            mockPopupService.Object,
            mockLogger.Object,
            mockUserAccess.Object,
            mockCurrentUser.Object);

        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
            {
                User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "1006"),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "User")
                }, "TestAuth"))
            }
        };

        var mockFile = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
        mockFile.Setup(f => f.FileName).Returns("test.geojson");
        mockFile.Setup(f => f.Length).Returns(100);

        // Act
        var result = await controller.UploadAssetGeoJson(mockFile.Object, "replace", 1, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<Microsoft.AspNetCore.Mvc.ObjectResult>(result);
        Assert.Equal(Microsoft.AspNetCore.Http.StatusCodes.Status403Forbidden, statusResult.StatusCode);
    }

    [Fact]
    public async Task ExportExcel_NonAdminWithoutExportAccess_Returns403Forbidden()
    {
        // Arrange
        var mockTileService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetTileService>();
        var mockUploadService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetUploadService>();
        var mockKpiService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetKpiService>();
        var mockFilterService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetFilterService>();
        var mockPopupService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetPopupService>();
        var mockLogger = new Mock<ILogger<NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController>>();
        var mockUserAccess = new Mock<NtisPlatform.Application.Interfaces.Master.IGisDepartmentUserAccessService>();
        var mockCurrentUser = new Mock<NtisPlatform.Application.Interfaces.ICurrentUserService>();

        mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(2015);

        var accessList = new List<GisDepartmentUserAccessDto>
        {
            new GisDepartmentUserAccessDto { UserId = 2015, DepartmentId = 3, UlbId = 1, CanView = true, CanEdit = false, CanExport = false }
        };
        mockUserAccess.Setup(s => s.GetAllAsync(It.IsAny<GisDepartmentUserAccessQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NtisPlatform.Application.Models.PagedResult<GisDepartmentUserAccessDto>(accessList, 1, 1, 10));

        var controller = new NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController(
            mockTileService.Object,
            mockUploadService.Object,
            mockKpiService.Object,
            mockFilterService.Object,
            mockPopupService.Object,
            mockLogger.Object,
            mockUserAccess.Object,
            mockCurrentUser.Object);

        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
            {
                User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "2015"),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "User")
                }, "TestAuth"))
            }
        };

        // Act
        var result = await controller.ExportExcel(new GisAssetDataRequestDto { UlbId = 1 }, CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<Microsoft.AspNetCore.Mvc.ObjectResult>(result);
        Assert.Equal(Microsoft.AspNetCore.Http.StatusCodes.Status403Forbidden, statusResult.StatusCode);
    }

    [Fact]
    public async Task ExportExcel_NonAdminWithValidExportAccess_ScopesUlbAndReturnsFile()
    {
        // Arrange
        var mockTileService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetTileService>();
        var mockUploadService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetUploadService>();
        var mockKpiService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetKpiService>();
        var mockFilterService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetFilterService>();
        var mockPopupService = new Mock<NtisPlatform.Application.Interfaces.GIS.IGisAssetPopupService>();
        var mockLogger = new Mock<ILogger<NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController>>();
        var mockUserAccess = new Mock<NtisPlatform.Application.Interfaces.Master.IGisDepartmentUserAccessService>();
        var mockCurrentUser = new Mock<NtisPlatform.Application.Interfaces.ICurrentUserService>();

        mockCurrentUser.Setup(u => u.GetCurrentUserId()).Returns(1006);

        var accessList = new List<GisDepartmentUserAccessDto>
        {
            new GisDepartmentUserAccessDto { UserId = 1006, DepartmentId = 3, UlbId = 1, CanView = true, CanEdit = false, CanExport = true }
        };
        mockUserAccess.Setup(s => s.GetAllAsync(It.IsAny<GisDepartmentUserAccessQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NtisPlatform.Application.Models.PagedResult<GisDepartmentUserAccessDto>(accessList, 1, 1, 10));

        mockTileService.Setup(t => t.ExportAssetPointsToExcelAsync(It.IsAny<GisAssetDataRequestDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new byte[] { 0x50, 0x4B, 0x03, 0x04 });

        var controller = new NtisPlatform.Api.Controllers.GIS.GisAssetDashboardController(
            mockTileService.Object,
            mockUploadService.Object,
            mockKpiService.Object,
            mockFilterService.Object,
            mockPopupService.Object,
            mockLogger.Object,
            mockUserAccess.Object,
            mockCurrentUser.Object);

        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
            {
                User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "1006"),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "User")
                }, "TestAuth"))
            }
        };

        // Act - user omits UlbId
        var filterReq = new GisAssetDataRequestDto();
        var result = await controller.ExportExcel(filterReq, CancellationToken.None);

        // Assert
        var fileResult = Assert.IsType<Microsoft.AspNetCore.Mvc.FileContentResult>(result);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileResult.ContentType);
        Assert.Equal(1, filterReq.UlbId);
    }

    #endregion
}
