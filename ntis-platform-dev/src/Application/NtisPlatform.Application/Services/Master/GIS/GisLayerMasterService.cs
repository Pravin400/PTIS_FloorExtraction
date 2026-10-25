using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class GisLayerMasterService : BaseCommonCrudService<
    GisLayerMasterEntity, 
    GisLayerMasterDto, 
    CreateGisLayerMasterDto, 
    UpdateGisLayerMasterDto, 
    GisLayerMasterQueryParameters, 
    int>, IGisLayerMasterService
{
    private readonly IRepository<GisLayerJsonEntity, int> _layerJsonRepo;
    private readonly IRepository<GisUploadHistoryEntity, int> _uploadHistoryRepo;
    private readonly ICurrentUserService? _currentUserService;
    private readonly ILogger<GisLayerMasterService> _logger;
    private readonly IMemoryCache? _memoryCache;

    public GisLayerMasterService(
        IRepository<GisLayerMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
        _layerJsonRepo = null!;
        _uploadHistoryRepo = null!;
        _logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<GisLayerMasterService>.Instance;
        _currentUserService = null;
        _memoryCache = null;
    }

    public GisLayerMasterService(
        IRepository<GisLayerMasterEntity, int> repository,
        IRepository<GisLayerJsonEntity, int> layerJsonRepo,
        IRepository<GisUploadHistoryEntity, int> uploadHistoryRepo,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<GisLayerMasterService> logger,
        ICurrentUserService? currentUserService = null,
        IMemoryCache? memoryCache = null)
        : base(repository, unitOfWork, mapper)
    {
        _layerJsonRepo = layerJsonRepo ?? throw new ArgumentNullException(nameof(layerJsonRepo));
        _uploadHistoryRepo = uploadHistoryRepo ?? throw new ArgumentNullException(nameof(uploadHistoryRepo));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _currentUserService = currentUserService;
        _memoryCache = memoryCache;
    }

    public async Task<GisUploadResultDto> UploadGeoJsonAsync(
        int layerMasterId, 
        Stream fileStream, 
        string fileName, 
        long fileSizeBytes, 
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(fileStream);

        var layer = await _repository.GetByIdAsync(layerMasterId, ct);
        if (layer == null)
            throw new KeyNotFoundException($"Layer with ID {layerMasterId} does not exist in GisLayerMaster.");

        // Read stream using buffered UTF-8 reader to handle large GeoJSON files without high memory pressure
        string geoJsonContent;
        using (var reader = new StreamReader(fileStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 65536, leaveOpen: true))
        {
            geoJsonContent = await reader.ReadToEndAsync(ct);
        }

        if (string.IsNullOrWhiteSpace(geoJsonContent))
            throw new ArgumentException("Uploaded GeoJSON content is empty.");

        // Count features efficiently
        int featureCount = 0;
        int idx = 0;
        while (true)
        {
            int found1 = geoJsonContent.IndexOf("\"type\": \"Feature\"", idx, StringComparison.OrdinalIgnoreCase);
            int found2 = geoJsonContent.IndexOf("\"type\":\"Feature\"", idx, StringComparison.OrdinalIgnoreCase);
            int nextFound = -1;
            if (found1 != -1 && found2 != -1) nextFound = Math.Min(found1, found2);
            else if (found1 != -1) nextFound = found1;
            else if (found2 != -1) nextFound = found2;

            if (nextFound == -1) break;
            featureCount++;
            idx = nextFound + 16;
        }

        // Save or update GisLayerJson
        var existingJsonList = await _layerJsonRepo.GetAsync(x => x.LayerMasterId == layerMasterId, ct);
        var existingJson = existingJsonList?.FirstOrDefault();

        if (existingJson != null)
        {
            existingJson.GeoJsonData = geoJsonContent;
            existingJson.UpdatedBy = 0;
            existingJson.UpdatedDate = DateTime.Now;
            await _layerJsonRepo.UpdateAsync(existingJson, ct);
        }
        else
        {
            var newEntity = new GisLayerJsonEntity
            {
                LayerMasterId = layerMasterId,
                GeoJsonData = geoJsonContent,
                IsActive = true,
                CreatedBy = 0,
                CreatedDate = DateTime.Now
            };
            await _layerJsonRepo.AddAsync(newEntity, ct);
        }

        await _unitOfWork.SaveChangesAsync(ct);

        // Audit upload in GisUploadHistory
        try
        {
            int currentUserId = 1; // Default fallback to Admin (Id: 1 in CORE.UserMaster) when unauthenticated
            if (_currentUserService != null)
            {
                try
                {
                    int resolved = _currentUserService.GetCurrentUserId();
                    if (resolved > 0) currentUserId = resolved;
                }
                catch
                {
                    // Unauthenticated fallback
                }
            }

            var uploadHistory = new GisUploadHistoryEntity
            {
                FileName = fileName,
                FileSizeBytes = fileSizeBytes,
                RecordCount = featureCount > 0 ? featureCount : 1,
                UploadedBy = currentUserId,
                Status = "COMPLETED",
                Remarks = $"GeoJSON uploaded for Layer '{layer.LayerName}' ({layer.LayerCode})",
                IsActive = true,
                CreatedBy = currentUserId,
                CreatedDate = DateTime.Now
            };
            await _uploadHistoryRepo.AddAsync(uploadHistory, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not write to GisUploadHistory (non-critical): {Message}", ex.Message);
        }

        // Invalidate GIS Cache so that fresh boundaries render immediately
        if (_memoryCache != null)
        {
            try
            {
                string cacheKey = $"gis_layer_geojson_{layerMasterId}";
                _memoryCache.Remove(cacheKey);
                _logger.LogInformation("Evicted GIS cache for Layer {LayerMasterId}", layerMasterId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to invalidate GIS cache after layer upload: {Message}", ex.Message);
            }
        }

        return new GisUploadResultDto
        {
            LayerMasterId = layerMasterId,
            LayerCode = layer.LayerCode,
            LayerName = layer.LayerName,
            FileName = fileName,
            FileSizeBytes = fileSizeBytes,
            FeatureCount = featureCount
        };
    }

    public async Task<GisUploadResultDto> UploadGeoJsonFileAsync(
        int layerMasterId, 
        Microsoft.AspNetCore.Http.IFormFile file, 
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("No file uploaded. Please select a valid .geojson or .json file.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".geojson" && ext != ".json")
        {
            throw new ArgumentException("Invalid file type. Only .geojson or .json spatial files are supported.");
        }

        using var stream = file.OpenReadStream();
        return await UploadGeoJsonAsync(layerMasterId, stream, file.FileName, file.Length, ct);
    }

    public async Task<string?> GetGeoJsonAsync(int layerMasterId, CancellationToken ct = default)
    {
        string cacheKey = $"gis_layer_geojson_{layerMasterId}";
        if (_memoryCache != null && _memoryCache.TryGetValue(cacheKey, out string? cached) && !string.IsNullOrWhiteSpace(cached))
        {
            return cached;
        }

        var list = await _layerJsonRepo.GetAsync(x => x.LayerMasterId == layerMasterId, ct);
        var geoJson = list?.FirstOrDefault()?.GeoJsonData;

        if (string.IsNullOrWhiteSpace(geoJson))
        {
            return null;
        }

        // Dynamically enrich GeoJSON features and root with layer's configured StyleConfigJson if present
        try
        {
            var layer = await _repository.GetByIdAsync(layerMasterId, ct);
            if (layer != null && !string.IsNullOrWhiteSpace(layer.StyleConfigJson))
            {
                geoJson = EnrichGeoJsonWithStyle(geoJson, layer.StyleConfigJson);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to enrich GeoJSON with style for LayerId={LayerId}. Returning raw GeoJSON.", layerMasterId);
        }

        if (_memoryCache != null && !string.IsNullOrWhiteSpace(geoJson))
        {
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24),
                SlidingExpiration = TimeSpan.FromHours(1),
                Size = Math.Max(1, geoJson.Length / 1024)
            };
            _memoryCache.Set(cacheKey, geoJson, cacheOptions);
        }

        return geoJson;
    }

    public override async Task<GisLayerMasterDto?> UpdateAsync(int id, UpdateGisLayerMasterDto updateDto, CancellationToken cancellationToken = default)
    {
        var result = await base.UpdateAsync(id, updateDto, cancellationToken);
        
        // Invalidate GIS caches immediately so updated boundary colors and style configs reflect instantly
        if (_memoryCache != null && result != null)
        {
            try
            {
                _memoryCache.Remove($"gis_layer_geojson_{id}");
                _memoryCache.Remove($"gis_layer_style_0_{result.LayerCode}");
                _memoryCache.Remove($"gis_layer_style_{result.DepartmentId}_{result.LayerCode}");
                _logger.LogInformation("Evicted GIS cache for Layer {LayerId} ({LayerCode}) after update", id, result.LayerCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to invalidate GIS cache after layer update: {Message}", ex.Message);
            }
        }

        return result;
    }

    public override async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var result = await base.DeleteAsync(id, cancellationToken);
        if (_memoryCache != null)
        {
            try
            {
                _memoryCache.Remove($"gis_layer_geojson_{id}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to invalidate GIS cache after layer delete: {Message}", ex.Message);
            }
        }
        return result;
    }

    private static string EnrichGeoJsonWithStyle(string geoJson, string styleConfigJson)
    {
        try
        {
            var styleConfig = System.Text.Json.JsonSerializer.Deserialize<GisLayerStyleConfigDto>(
                styleConfigJson, 
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (styleConfig == null) return geoJson;

            // Using System.Text.Json.Nodes for zero-dependency, streaming/efficient in-memory JSON modification
            var node = System.Text.Json.Nodes.JsonNode.Parse(geoJson);
            if (node is System.Text.Json.Nodes.JsonObject rootObj)
            {
                // 1. Add/update top-level style node
                var styleNode = new System.Text.Json.Nodes.JsonObject
                {
                    ["color"] = styleConfig.DefaultColor,
                    ["fillColor"] = styleConfig.DefaultColor,
                    ["fillOpacity"] = styleConfig.DefaultOpacity,
                    ["strokeColor"] = styleConfig.DefaultStrokeColor,
                    ["strokeWidth"] = styleConfig.DefaultStrokeWidth
                };
                rootObj["style"] = styleNode;

                // 2. If GeoJSON has a features array, enrich feature properties with standard simplestyle attributes
                if (rootObj["features"] is System.Text.Json.Nodes.JsonArray featuresArray)
                {
                    foreach (var f in featuresArray)
                    {
                        if (f is System.Text.Json.Nodes.JsonObject featObj)
                        {
                            if (featObj["properties"] is not System.Text.Json.Nodes.JsonObject props)
                            {
                                props = new System.Text.Json.Nodes.JsonObject();
                                featObj["properties"] = props;
                            }

                            // Dynamic simplestyle attributes: fill, stroke, color, opacity
                            props["fill"] = styleConfig.DefaultColor;
                            props["fill-color"] = styleConfig.DefaultColor;
                            props["fill-opacity"] = styleConfig.DefaultOpacity;
                            props["stroke"] = styleConfig.DefaultStrokeColor;
                            props["stroke-width"] = styleConfig.DefaultStrokeWidth;
                            props["color"] = styleConfig.DefaultColor;
                            props["borderColor"] = styleConfig.DefaultStrokeColor;
                        }
                    }
                }

                return rootObj.ToJsonString(new System.Text.Json.JsonSerializerOptions { WriteIndented = false });
            }
        }
        catch
        {
            // If parsing fails for any reason, return the raw geoJson safely
        }

        return geoJson;
    }
}
