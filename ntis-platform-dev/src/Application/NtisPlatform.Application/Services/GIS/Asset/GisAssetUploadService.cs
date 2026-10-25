using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.GIS;

namespace NtisPlatform.Application.Services.GIS.Asset;

/// <summary>
/// Clean Architecture Application Service for streaming GeoJSON ingestion into AMS.GisAssetGeometry.
/// Uses IGisAssetRepository and EF Core LINQ with zero raw ADO.NET or inline SQL queries.
/// </summary>
public class GisAssetUploadService : IGisAssetUploadService
{
    private static readonly GeometryFactory _geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private readonly IGisAssetRepository _gisAssetRepository;
    private readonly IGisAssetTileService _tileService;
    private readonly IRepository<GisUploadHistoryEntity, int> _uploadHistoryRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GisAssetUploadService> _logger;
    private readonly ICurrentUserService? _currentUserService;

    public GisAssetUploadService(
        IGisAssetRepository gisAssetRepository,
        IGisAssetTileService tileService,
        IRepository<GisUploadHistoryEntity, int> uploadHistoryRepo,
        IUnitOfWork unitOfWork,
        ILogger<GisAssetUploadService> logger,
        ICurrentUserService? currentUserService = null)
    {
        _gisAssetRepository = gisAssetRepository ?? throw new ArgumentNullException(nameof(gisAssetRepository));
        _tileService = tileService ?? throw new ArgumentNullException(nameof(tileService));
        _uploadHistoryRepo = uploadHistoryRepo ?? throw new ArgumentNullException(nameof(uploadHistoryRepo));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _currentUserService = currentUserService;
    }

    public async Task<GisAssetUploadResultDto> ProcessAssetGeoJsonAsync(
        Stream fileStream,
        string fileName,
        string uploadedBy,
        string mode = "replace",
        int? ulbId = null,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(fileStream);

        var stopwatch = Stopwatch.StartNew();
        var normalizedMode = (mode ?? "replace").Trim().ToLowerInvariant();
        if (normalizedMode != "replace" && normalizedMode != "upsert")
        {
            throw new ArgumentException($"Unsupported upload mode '{mode}'. Supported modes are 'replace' and 'upsert'.", nameof(mode));
        }

        _logger.LogInformation("Asset GIS Upload: Ingesting file '{FileName}' by '{User}' (Mode: {Mode}).",
            fileName, uploadedBy, normalizedMode);

        int resolvedUserId = 1;
        if (_currentUserService != null)
        {
            try
            {
                var uid = _currentUserService.GetCurrentUserId();
                if (uid > 0) resolvedUserId = uid;
            }
            catch
            {
                // Fallback for unauthenticated test calls
            }
        }
        else if (int.TryParse(uploadedBy, out int parsedUid) && parsedUid > 0)
        {
            resolvedUserId = parsedUid;
        }

        // Fetch valid AssetMaster IDs and AssetNo mapping to guarantee zero Foreign Key constraint conflicts
        var (validAssetIds, assetNoToIdMap) = await _gisAssetRepository.GetAssetMasterValidationLookupAsync(ct);

        int totalFeatures = 0;
        int skippedCount = 0;
        var entities = new List<GisAssetGeometryEntity>();
        var seenAssetMasterIds = new HashSet<int>();
        var geoSerializer = GeoJsonSerializer.Create();

        // 1. Stream JSON token-by-token using JsonTextReader
        using (var streamReader = new StreamReader(fileStream))
        using (var jsonReader = new JsonTextReader(streamReader))
        {
            bool foundFeatures = false;
            while (jsonReader.Read())
            {
                if (ct.IsCancellationRequested) break;

                if (jsonReader.TokenType == JsonToken.PropertyName && 
                    string.Equals(jsonReader.Value?.ToString(), "features", StringComparison.OrdinalIgnoreCase))
                {
                    foundFeatures = true;
                    break;
                }
            }

            if (!foundFeatures)
            {
                throw new InvalidDataException("Invalid GeoJSON: 'features' array not found in uploaded file.");
            }

            while (jsonReader.Read() && jsonReader.TokenType != JsonToken.StartArray) { }

            while (jsonReader.Read())
            {
                ct.ThrowIfCancellationRequested();

                if (jsonReader.TokenType == JsonToken.EndArray)
                    break;

                if (jsonReader.TokenType != JsonToken.StartObject)
                    continue;

                totalFeatures++;
                JObject featureObj;
                try
                {
                    featureObj = JObject.Load(jsonReader);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse feature #{Index} in GeoJSON", totalFeatures);
                    skippedCount++;
                    continue;
                }

                // A. Resolve geometry token (support 'PolygonGeometry', 'geometry', 'geom', or inside 'properties')
                JToken? geomToken = featureObj["PolygonGeometry"]
                    ?? featureObj["polygongeometry"]
                    ?? featureObj["geometry"]
                    ?? featureObj["Geometry"]
                    ?? featureObj["geom"]
                    ?? featureObj["properties"]?["PolygonGeometry"]
                    ?? featureObj["properties"]?["polygongeometry"]
                    ?? featureObj["properties"]?["geometry"];

                if (geomToken == null)
                {
                    skippedCount++;
                    continue;
                }

                Geometry? geom = null;
                try
                {
                    using var geomReader = geomToken.CreateReader();
                    geom = geoSerializer.Deserialize<Geometry>(geomReader);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize spatial geometry for feature #{Index}", totalFeatures);
                }

                if (geom == null || geom.IsEmpty)
                {
                    skippedCount++;
                    continue;
                }

                if (!geom.IsValid)
                {
                    geom = geom.Buffer(0);
                }
                geom.SRID = 4326;
                geom = EnforceSqlGeographyOrientation(geom, _geometryFactory);

                var props = featureObj["properties"] as JObject;

                // B. Extract BuildingId / AssetNo
                string? buildingId = GetJPropertySafe(props, featureObj, 
                    "MPMS_ID", "mpms_id", "BuildingId", "buildingid", "Buil_ID", "buil_id", "GIS_ID", "gis_id", "AssetNo", "assetno", "PropertyNo", "propertyno");
                if (string.IsNullOrWhiteSpace(buildingId)) buildingId = null;

                // C. Extract and Validate AssetMasterId
                string? rawAssetMasterId = GetJPropertySafe(props, featureObj, 
                    "MPMS_OWNER", "mpms_owner", "AssetMasterId", "assetmasterid", "AssetId", "assetid", "PropertyId", "propertyid", "OwnerID", "ownerid");

                int assetMasterId = 0;
                if (int.TryParse(rawAssetMasterId, out int parsedId) && validAssetIds.Contains(parsedId))
                {
                    assetMasterId = parsedId;
                }
                else if (buildingId != null && assetNoToIdMap.TryGetValue(buildingId, out int resolvedId))
                {
                    assetMasterId = resolvedId;
                }

                if (assetMasterId <= 0)
                {
                    skippedCount++;
                    continue;
                }

                // Deduplicate in both 'replace' and 'upsert' modes to guarantee one geometry per asset
                if (!seenAssetMasterIds.Add(assetMasterId))
                {
                    skippedCount++;
                    continue;
                }

                // D. Extract Area values
                decimal? totalAreaSqMeter = ParseDecimalSafe(GetJPropertySafe(props, featureObj, 
                    "AREA_SQ_MT", "area_sq_mt", "TotalAreaSqMeter", "totalareasqmeter", "AreaSqM", "areasqm", "Area_Sqm", "area_sqm"));
                decimal? totalAreaSqFeet = ParseDecimalSafe(GetJPropertySafe(props, featureObj, 
                    "AREA_SQ_FT", "area_sq_ft", "TotalAreaSqFeet", "totalareasqfeet", "AreaSqFt", "areasqft", "Area_Sqft", "area_sqft"));

                if (!totalAreaSqMeter.HasValue && geom.Area > 0)
                {
                    totalAreaSqMeter = Math.Round((decimal)(geom.Area * 111319.5 * 111319.5 * Math.Cos(geom.Centroid.Y * Math.PI / 180.0)), 4);
                    totalAreaSqFeet = Math.Round(totalAreaSqMeter.Value * 10.7639m, 4);
                }

                // E. Centroids (Numeric Longitude / Latitude)
                decimal centroidX;
                decimal centroidY;
                var rawCx = GetJPropertySafe(props, featureObj, "LONG", "long", "Long", "longitude", "Longitude", "CentroidX", "centroidx", "CenterX", "centerx");
                var rawCy = GetJPropertySafe(props, featureObj, "LAT", "lat", "Lat", "latitude", "Latitude", "CentroidY", "centroidy", "CenterY", "centery");

                if (decimal.TryParse(rawCx, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal parsedCx))
                    centroidX = parsedCx;
                else
                    centroidX = (decimal)geom.Centroid.X;

                if (decimal.TryParse(rawCy, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal parsedCy))
                    centroidY = parsedCy;
                else
                    centroidY = (decimal)geom.Centroid.Y;

                // F. Links
                string? googleMapLink = GetJPropertySafe(props, featureObj, "GOOGLE_LIN", "google_lin", "GoogleMapLink", "googlemaplink", "GoogleMap", "googlemap");
                string? link360 = GetJPropertySafe(props, featureObj, "F360_LINK", "f360_link", "Link360", "link360", "Link", "link");

                entities.Add(new GisAssetGeometryEntity
                {
                    AssetMasterId = assetMasterId,
                    BuildingId = buildingId,
                    PolygonGeometry = geom,
                    TotalAreaSqMeter = totalAreaSqMeter,
                    TotalAreaSqFeet = totalAreaSqFeet,
                    CentroidX = centroidX,
                    CentroidY = centroidY,
                    GoogleMapLink = googleMapLink,
                    Link360 = link360,
                    MarkedForDeletion = false,
                    CreatedBy = resolvedUserId,
                    CreatedDate = DateTime.UtcNow
                });
            }
        }

        if (totalFeatures == 0)
        {
            throw new InvalidDataException("Uploaded GeoJSON file contains no features.");
        }

        if (entities.Count == 0)
        {
            throw new InvalidDataException("Uploaded file contains features, but none could be mapped to valid asset entities.");
        }

        // 2. Perform Database Persistence using Pure EF Core LINQ Repository
        if (normalizedMode == "replace")
        {
            await _gisAssetRepository.ReplaceAllGeometriesAsync(entities, ulbId, ct);
        }
        else
        {
            await _gisAssetRepository.UpsertGeometriesAsync(entities, ct);
        }

        stopwatch.Stop();

        // 3. Audit upload in GisUploadHistory via Repository
        try
        {
            var history = new GisUploadHistoryEntity
            {
                FileName = fileName,
                RecordCount = entities.Count,
                Status = entities.Count > 0 ? "COMPLETED" : "FAILED",
                Remarks = $"Imported {entities.Count} of {totalFeatures} features in mode '{normalizedMode}'",
                UploadedBy = resolvedUserId,
                CreatedBy = resolvedUserId
            };
            await _uploadHistoryRepo.AddAsync(history, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Asset GIS Upload: Non-critical upload history logging failed: {Message}", ex.Message);
        }

        // 4. Invalidate vector tile cache
        try
        {
            await _tileService.ReloadStatusCacheAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Asset GIS Upload: Tile cache refresh failed: {Message}", ex.Message);
        }

        var durationSec = Math.Round(stopwatch.Elapsed.TotalSeconds, 2);
        _logger.LogInformation("Asset GIS Upload: Completed in {Seconds}s. Total: {Total}, Imported: {Imported}, Skipped: {Skipped}",
            durationSec, totalFeatures, entities.Count, skippedCount);

        return new GisAssetUploadResultDto
        {
            Success = true,
            FileName = fileName,
            TotalFeatures = totalFeatures,
            ImportedFeatures = entities.Count,
            SkippedFeatures = skippedCount,
            Mode = normalizedMode,
            DurationSeconds = durationSec,
            Message = $"Successfully processed {entities.Count} asset polygons into AMS.GisAssetGeometry in {durationSec}s (Mode: {normalizedMode})."
        };
    }

    private static string? GetJPropertySafe(JObject? props, JObject root, params string[] names)
    {
        if (props != null)
        {
            foreach (var name in names)
            {
                var val = props.GetValue(name, StringComparison.OrdinalIgnoreCase);
                if (val != null && val.Type != JTokenType.Null)
                {
                    var str = val.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(str)) return str;
                }
            }
        }

        foreach (var name in names)
        {
            var val = root.GetValue(name, StringComparison.OrdinalIgnoreCase);
            if (val != null && val.Type != JTokenType.Null)
            {
                var str = val.ToString()?.Trim();
                if (!string.IsNullOrEmpty(str)) return str;
            }
        }

        return null;
    }

    private static decimal? ParseDecimalSafe(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        if (decimal.TryParse(input, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal val))
            return val;
        return null;
    }

    /// <summary>
    /// Enforces SQL Server Geography Left-Hand Rule:
    /// - Exterior shell MUST be oriented Counter-Clockwise (CCW).
    /// - Interior holes MUST be oriented Clockwise (CW / non-CCW).
    /// </summary>
    private static Geometry EnforceSqlGeographyOrientation(Geometry geom, GeometryFactory factory)
    {
        if (geom is Polygon poly)
        {
            return OrientPolygon(poly, factory);
        }
        else if (geom is MultiPolygon multiPoly)
        {
            var orientedPolys = new Polygon[multiPoly.NumGeometries];
            for (int i = 0; i < multiPoly.NumGeometries; i++)
            {
                orientedPolys[i] = OrientPolygon((Polygon)multiPoly.GetGeometryN(i), factory);
            }
            var result = factory.CreateMultiPolygon(orientedPolys);
            result.SRID = geom.SRID;
            return result;
        }
        else if (geom is GeometryCollection collection)
        {
            var orientedGeoms = new Geometry[collection.NumGeometries];
            for (int i = 0; i < collection.NumGeometries; i++)
            {
                orientedGeoms[i] = EnforceSqlGeographyOrientation(collection.GetGeometryN(i), factory);
            }
            var result = factory.CreateGeometryCollection(orientedGeoms);
            result.SRID = geom.SRID;
            return result;
        }

        return geom;
    }

    private static Polygon OrientPolygon(Polygon poly, GeometryFactory factory)
    {
        if (poly.IsEmpty) return poly;

        // 1. Shell MUST be CCW
        var shellCoords = poly.ExteriorRing.Coordinates;
        LinearRing shell;
        if (!NetTopologySuite.Algorithm.Orientation.IsCCW(shellCoords))
        {
            var reversedCoords = (Coordinate[])shellCoords.Clone();
            Array.Reverse(reversedCoords);
            shell = factory.CreateLinearRing(reversedCoords);
        }
        else
        {
            shell = (LinearRing)poly.ExteriorRing;
        }

        // 2. Holes MUST be CW (not CCW)
        var holes = new LinearRing[poly.NumInteriorRings];
        for (int i = 0; i < poly.NumInteriorRings; i++)
        {
            var holeRing = (LinearRing)poly.GetInteriorRingN(i);
            var holeCoords = holeRing.Coordinates;
            if (NetTopologySuite.Algorithm.Orientation.IsCCW(holeCoords))
            {
                var reversedHole = (Coordinate[])holeCoords.Clone();
                Array.Reverse(reversedHole);
                holes[i] = factory.CreateLinearRing(reversedHole);
            }
            else
            {
                holes[i] = holeRing;
            }
        }

        var fixedPoly = factory.CreatePolygon(shell, holes);
        fixedPoly.SRID = poly.SRID;
        return fixedPoly;
    }
}
