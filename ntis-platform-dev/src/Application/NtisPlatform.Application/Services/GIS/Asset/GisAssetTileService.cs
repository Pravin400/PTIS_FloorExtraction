using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Features;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using NetTopologySuite.Simplify;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Interfaces.GIS;

namespace NtisPlatform.Application.Services.GIS;

/// <summary>
/// High-performance Spatial Tiling & Point-in-Polygon Engine for Asset GIS.
/// Dynamically resolves configurable styling via IGisStyleConfigService (Layer Master / appsettings / request).
/// Uses IGisAssetRepository and EF Core LINQ for sub-100ms spatial operations with zero raw ADO.NET code.
/// Features Enterprise Hybrid Caching (L1 RAM + L2 Redis) with automatic tag invalidation.
/// </summary>
public class GisAssetTileService : IGisAssetTileService
{
    private readonly IGisAssetRepository _gisAssetRepository;
    private readonly IGisStyleConfigService _gisStyleConfigService;
    private readonly ILogger<GisAssetTileService> _logger;
    private readonly HybridCache? _hybridCache;
    private static readonly GeometryFactory GeometryFactory4326 = new GeometryFactory(new PrecisionModel(), 4326);

    public GisAssetTileService(
        IGisAssetRepository gisAssetRepository,
        IGisStyleConfigService gisStyleConfigService,
        ILogger<GisAssetTileService> logger,
        HybridCache? hybridCache = null)
    {
        _gisAssetRepository = gisAssetRepository ?? throw new ArgumentNullException(nameof(gisAssetRepository));
        _gisStyleConfigService = gisStyleConfigService ?? throw new ArgumentNullException(nameof(gisStyleConfigService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _hybridCache = hybridCache;
    }

    public async Task<byte[]> GetAssetTileAsync(TileCoordDto coord, GisAssetDataRequestDto filters, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(coord);

        if (_hybridCache == null)
        {
            return await GenerateAssetTileInternalAsync(coord, filters, ct);
        }

        string statusColorsHash = filters?.StatusColors != null ? string.Join(";", filters.StatusColors.OrderBy(kv => kv.Key).Select(kv => $"{kv.Key}:{kv.Value}")) : string.Empty;
        string cacheKey = $"gis_tile_{coord.Z}_{coord.X}_{coord.Y}_{filters?.ZoneId}_{filters?.WardId}_{filters?.AssetCategoryId}_{filters?.AssetTypeId}_{filters?.DepartmentId}_{filters?.OccupancyStatus}_{filters?.EncroachmentStatus}_{filters?.KpiCode}_{filters?.SearchTerm}_{filters?.LayerCode}_{filters?.DefaultColor}_{statusColorsHash}";

        var entryOptions = new HybridCacheEntryOptions
        {
            Expiration = TimeSpan.FromMinutes(60),
            LocalCacheExpiration = TimeSpan.FromMinutes(15)
        };

        return await _hybridCache.GetOrCreateAsync(
            cacheKey,
            async token => await GenerateAssetTileInternalAsync(coord, filters, token),
            entryOptions,
            tags: new[] { "gis_tiles" },
            cancellationToken: ct);
    }

    private async Task<byte[]> GenerateAssetTileInternalAsync(TileCoordDto coord, GisAssetDataRequestDto? filters, CancellationToken ct)
    {
        try
        {
            // 1. Calculate geographical envelope bounds of tile
            var env = coord.ToEnvelope();
            var envelopePolygon = GeometryFactory4326.ToGeometry(env);

            // 2. Query intersecting asset geometries using pure EF Core LINQ repository
            List<GisAssetGeometryEntity> geometries = await _gisAssetRepository.GetIntersectingAssetGeometriesAsync(
                envelopePolygon, ct);

            if (geometries == null || geometries.Count == 0)
                return Array.Empty<byte>();

            // 3. Dynamically resolve layer style configuration (from DB Layer Master / AppSettings)
            var styleConfig = await _gisStyleConfigService.GetLayerStyleConfigAsync(
                filters?.LayerCode ?? "ASSET_LAYER", 
                filters?.DepartmentId, 
                ct);

            // 4. Construct GeoJSON FeatureCollection
            var resultCollection = new FeatureCollection();
            foreach (var item in geometries)
            {
                if (item.PolygonGeometry == null || item.PolygonGeometry.IsEmpty) continue;

                // Apply optional in-memory filter criteria if provided
                if (filters != null)
                {
                    if (filters.ZoneId.HasValue)
                    {
                        int assetZoneId = item.Asset?.Details?.ZoneId ?? 0;
                        if (assetZoneId != filters.ZoneId.Value)
                            continue;
                    }
                    if (filters.WardId.HasValue)
                    {
                        int assetWardId = item.Asset?.Details?.WardId ?? 0;
                        if (assetWardId != filters.WardId.Value)
                            continue;
                    }
                    if (filters.AssetCategoryId.HasValue && item.Asset != null && item.Asset.AssetCategoryId != filters.AssetCategoryId.Value)
                        continue;
                    if (filters.AssetTypeId.HasValue && item.Asset != null && item.Asset.AssetTypeId != filters.AssetTypeId.Value)
                        continue;
                    if (filters.DepartmentId.HasValue && item.Asset != null && item.Asset.DepartmentId != filters.DepartmentId.Value)
                        continue;
                    if (!string.IsNullOrWhiteSpace(filters.OccupancyStatus) && item.Asset != null && !string.Equals(item.Asset.OccupancyStatus, filters.OccupancyStatus, StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!string.IsNullOrWhiteSpace(filters.EncroachmentStatus) && item.Asset != null && !string.Equals(item.Asset.EncroachmentStatus, filters.EncroachmentStatus, StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!string.IsNullOrWhiteSpace(filters.SearchTerm) && item.Asset != null &&
                        !(item.Asset.AssetNo.Contains(filters.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                          item.Asset.AssetName.Contains(filters.SearchTerm, StringComparison.OrdinalIgnoreCase)))
                        continue;
                    if (!string.IsNullOrWhiteSpace(filters.KpiCode))
                    {
                        var cleanKpi = filters.KpiCode.Trim().ToUpperInvariant();
                        if (cleanKpi == "FIXED_ASSETS" && item.Asset?.AssetCategory != null && item.Asset.AssetCategory.IsMovable)
                            continue;
                        if (cleanKpi == "MOVABLE_ASSETS" && item.Asset?.AssetCategory != null && !item.Asset.AssetCategory.IsMovable)
                            continue;
                        if (cleanKpi == "ENCROACHED_ASSETS" && (string.IsNullOrWhiteSpace(item.Asset?.EncroachmentStatus) ||
                            !(item.Asset.EncroachmentStatus.Trim().Equals("FULL", StringComparison.OrdinalIgnoreCase) ||
                              item.Asset.EncroachmentStatus.Trim().Equals("PARTIAL", StringComparison.OrdinalIgnoreCase))))
                            continue;
                    }
                }

                var simplifiedGeom = SimplifyGeometry(item.PolygonGeometry, coord.Z);
                var feature = new Feature(simplifiedGeom, new AttributesTable());

                string bldgIdStr = item.BuildingId ?? string.Empty;

                // Resolve feature color dynamically based on master configuration and active rules
                string colorCode = _gisStyleConfigService.ResolveAssetColor(item, styleConfig, filters);

                feature.Attributes.Add("assetMasterId", item.AssetMasterId);
                feature.Attributes.Add("assetNo", item.Asset?.AssetNo ?? string.Empty);
                feature.Attributes.Add("assetName", item.Asset?.AssetName ?? string.Empty);
                feature.Attributes.Add("buildingId", bldgIdStr);
                feature.Attributes.Add("totalAreaSqMeter", item.TotalAreaSqMeter ?? 0);
                feature.Attributes.Add("totalAreaSqFeet", item.TotalAreaSqFeet ?? 0);
                feature.Attributes.Add("googleMapLink", item.GoogleMapLink ?? string.Empty);
                feature.Attributes.Add("link360", item.Link360 ?? string.Empty);
                feature.Attributes.Add("centroidX", item.CentroidX ?? 0);
                feature.Attributes.Add("centroidY", item.CentroidY ?? 0);
                string borderColor = !string.IsNullOrWhiteSpace(item.Asset?.AssetType?.BorderColor) 
                    ? item.Asset.AssetType.BorderColor 
                    : (!string.IsNullOrWhiteSpace(styleConfig.DefaultStrokeColor) ? styleConfig.DefaultStrokeColor : "#FFFFFF");
                feature.Attributes.Add("assetTypeId", item.Asset?.AssetTypeId ?? 0);
                feature.Attributes.Add("zoneId", item.Asset?.Details?.ZoneId ?? 0);
                feature.Attributes.Add("wardId", item.Asset?.Details?.WardId ?? 0);
                feature.Attributes.Add("colorCode", colorCode);
                feature.Attributes.Add("borderColor", borderColor);
                resultCollection.Add(feature);

                // Track A4: Hard cap of 2,000 features per tile to prevent tablet browser memory overload
                if (resultCollection.Count >= 2000)
                {
                    break;
                }
            }

            var outputSerializer = GeoJsonSerializer.Create();
            using var sw = new StringWriter();
            outputSerializer.Serialize(sw, resultCollection);
            return System.Text.Encoding.UTF8.GetBytes(sw.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating spatial asset tile at Z={Z}, X={X}, Y={Y}", coord.Z, coord.X, coord.Y);
            throw;
        }
    }

    public async Task<int?> FindAssetIdAtPointAsync(double lat, double lng, CancellationToken ct = default)
    {
        try
        {
            var point = GeometryFactory4326.CreatePoint(new Coordinate(lng, lat));
            return await _gisAssetRepository.FindAssetMasterIdAtPointAsync(point, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Asset Spatial Engine: Error finding asset at Lat={Lat}, Lng={Lng}", lat, lng);
            throw;
        }
    }

    public async Task<object?> GetAssetGeometryAsync(string targetId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(targetId)) return null;

        GisAssetGeometryEntity? geom = null;

        if (int.TryParse(targetId, out int assetMasterId))
        {
            geom = await _gisAssetRepository.GetAssetGeometryByAssetMasterIdAsync(assetMasterId, ct);
        }

        if (geom == null)
        {
            geom = await _gisAssetRepository.GetAssetGeometryByBuildingIdAsync(targetId, ct);
        }

        if (geom == null || geom.PolygonGeometry == null) return null;

        var outputSerializer = GeoJsonSerializer.Create();
        using var sw = new StringWriter();
        outputSerializer.Serialize(sw, geom.PolygonGeometry);

        return new
        {
            assetMasterId = geom.AssetMasterId,
            assetNo = geom.Asset?.AssetNo ?? string.Empty,
            assetName = geom.Asset?.AssetName ?? string.Empty,
            buildingId = geom.BuildingId,
            totalAreaSqMeter = geom.TotalAreaSqMeter,
            totalAreaSqFeet = geom.TotalAreaSqFeet,
            googleMapLink = geom.GoogleMapLink,
            link360 = geom.Link360,
            centroidX = geom.CentroidX,
            centroidY = geom.CentroidY,
            geoJson = sw.ToString()
        };
    }

    public Task<GisDebugInfoResponseDto> GetDebugInfoAsync(CancellationToken ct = default)
    {
        return Task.FromResult(new GisDebugInfoResponseDto
        {
            TotalFeatures = 0,
            LoadedTiles = 0,
            MemoryUsageBytes = GC.GetTotalMemory(false),
            ServerTime = DateTime.UtcNow,
            Status = "HEALTHY",
            Engine = "NetTopologySuite-EFCore-Asset-Spatial-Engine"
        });
    }

    public async Task ReloadStatusCacheAsync(CancellationToken ct = default)
    {
        if (_hybridCache != null)
        {
            await _hybridCache.RemoveByTagAsync("gis_tiles", ct);
            _logger.LogInformation("Evicted HybridCache tag 'gis_tiles'");
        }
    }

    public async Task<byte[]> ExportAssetPointsToExcelAsync(GisAssetDataRequestDto filters, CancellationToken ct = default)
    {
        var data = await _gisAssetRepository.GetFilteredAssetExportListAsync(
            filters?.ZoneId,
            filters?.WardId,
            filters?.AssetCategoryId,
            filters?.AssetTypeId,
            filters?.DepartmentId,
            filters?.EncroachmentStatus,
            filters?.OwnershipType,
            filters?.SearchTerm,
            filters?.KpiCode,
            filters?.FinanceYear,
            filters?.MinLat,
            filters?.MinLng,
            filters?.MaxLat,
            filters?.MaxLng,
            filters?.UlbId,
            ct);

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var worksheet = workbook.Worksheets.Add("GIS Assets");

        var headers = new[]
        {
            "Asset ID", "MPMS ID", "Asset No", "Asset Name", "Department",
            "Category", "Type", "Ownership", "Zone", "Ward", "Plot No",
            "City Survey No", "Plot Area (Sq.Ft)", "Carpet Area (Sq.Ft)", "Built-up Area (Sq.Ft)",
            "Capital Value (₹)", "Annual Revenue (₹)",
            "Encroachment", "In-Charge", "Mobile No", "Latitude", "Longitude",
            "Photos Count", "Documents Count", "Address", "Google Maps Link", "360 View Link"
        };

        for (int col = 0; col < headers.Length; col++)
        {
            var cell = worksheet.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#1E3A8A");
            cell.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
            cell.Style.Alignment.Horizontal = ClosedXML.Excel.XLAlignmentHorizontalValues.Center;
        }

        for (int row = 0; row < data.Count; row++)
        {
            var item = data[row];
            int r = row + 2;

            worksheet.Cell(r, 1).Value = item.AssetId;
            worksheet.Cell(r, 2).Value = item.MPMSID ?? "";
            worksheet.Cell(r, 3).Value = item.AssetNo ?? "";
            worksheet.Cell(r, 4).Value = item.AssetName ?? "";
            worksheet.Cell(r, 5).Value = item.Department ?? "";
            worksheet.Cell(r, 6).Value = item.AssetCategory ?? "";
            worksheet.Cell(r, 7).Value = item.AssetType ?? "";
            worksheet.Cell(r, 8).Value = item.OwnershipType ?? "";
            worksheet.Cell(r, 9).Value = item.Zone ?? "";
            worksheet.Cell(r, 10).Value = item.Ward ?? "";
            worksheet.Cell(r, 11).Value = item.PlotNo ?? "";
            worksheet.Cell(r, 12).Value = item.CitySurveyNo ?? "";
            worksheet.Cell(r, 13).Value = item.PlotAreaSqFt ?? 0m;
            worksheet.Cell(r, 14).Value = item.CarpetAreaSqFt ?? 0m;
            worksheet.Cell(r, 15).Value = item.BuiltUpAreaSqFt ?? 0m;
            worksheet.Cell(r, 16).Value = item.CapitalValue;
            worksheet.Cell(r, 17).Value = item.AnnualRevenue;
            worksheet.Cell(r, 18).Value = item.Encroachment ?? "None";
            worksheet.Cell(r, 19).Value = item.InCharge ?? "";
            worksheet.Cell(r, 20).Value = item.MobileNo ?? "";
            worksheet.Cell(r, 21).Value = item.Latitude.HasValue ? item.Latitude.Value : "";
            worksheet.Cell(r, 22).Value = item.Longitude.HasValue ? item.Longitude.Value : "";
            worksheet.Cell(r, 23).Value = item.PhotoCount;
            worksheet.Cell(r, 24).Value = item.DocumentCount;
            worksheet.Cell(r, 25).Value = item.Address ?? "";
            worksheet.Cell(r, 26).Value = item.GoogleMapLink ?? "";
            worksheet.Cell(r, 27).Value = item.Link360 ?? "";
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static Geometry SimplifyGeometry(Geometry geometry, int zoom)
    {
        if (geometry == null || geometry.IsEmpty) return geometry!;
        if (zoom >= 16) return geometry;

        // Gentle tolerance so building footprints/plots never collapse or lose shape
        double tolerance = zoom switch
        {
            <= 10 => 0.00005,
            <= 12 => 0.00002,
            <= 14 => 0.000008,
            _ => 0.000003
        };

        try
        {
            var simplified = DouglasPeuckerSimplifier.Simplify(geometry, tolerance);
            if (simplified != null && simplified.IsValid && !simplified.IsEmpty && simplified.Area > 0)
            {
                return simplified;
            }
            return geometry;
        }
        catch
        {
            return geometry;
        }
    }
}
