using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Core.Entities.GIS;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GIS;

/// <summary>
/// Dynamic GIS style and color resolution service.
/// Resolves feature/polygon colors dynamically from:
/// 1. Request overrides (GisAssetDataRequestDto)
/// 2. Database layer configurations (GIS.GisLayerMaster.StyleConfigJson)
/// 3. App configuration (appsettings.json under GisSettings)
/// </summary>
public class GisStyleConfigService : IGisStyleConfigService
{
    private readonly IRepository<GisLayerMasterEntity, int> _layerMasterRepository;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GisStyleConfigService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };

    public GisStyleConfigService(
        IRepository<GisLayerMasterEntity, int> layerMasterRepository,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<GisStyleConfigService> logger)
    {
        _layerMasterRepository = layerMasterRepository ?? throw new ArgumentNullException(nameof(layerMasterRepository));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<GisLayerStyleConfigDto> GetLayerStyleConfigAsync(string? layerCode, int? departmentId, CancellationToken ct = default)
    {
        string normalizedCode = layerCode ?? "ASSET_LAYER";
        int deptId = departmentId ?? 0;
        string cacheKey = $"gis_layer_style_{deptId}_{normalizedCode}";

        if (_cache.TryGetValue(cacheKey, out GisLayerStyleConfigDto? cachedConfig) && cachedConfig != null)
        {
            return cachedConfig;
        }

        var config = new GisLayerStyleConfigDto();

        try
        {
            // 1. Attempt to load layer configuration from GIS.GisLayerMaster
            var layers = await _layerMasterRepository.GetAsync(l =>
                l.IsActive &&
                (string.IsNullOrEmpty(layerCode) || l.LayerCode == layerCode || l.LayerCode == "ASSET_LAYER") &&
                (!departmentId.HasValue || l.DepartmentId == departmentId.Value || l.DepartmentId == 0), ct);

            var targetLayer = layers
                .OrderByDescending(l => departmentId.HasValue && l.DepartmentId == departmentId.Value)
                .ThenByDescending(l => l.LayerCode == layerCode)
                .ThenByDescending(l => l.LayerCode == "ASSET_LAYER")
                .FirstOrDefault();

            if (targetLayer != null && !string.IsNullOrWhiteSpace(targetLayer.StyleConfigJson))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<GisLayerStyleConfigDto>(targetLayer.StyleConfigJson, JsonOptions);
                    if (parsed != null)
                    {
                        config = parsed;
                        config.IsExplicitlyConfigured = true;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse StyleConfigJson for LayerCode={LayerCode}. Falling back to appsettings.", targetLayer.LayerCode);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not query GIS.GisLayerMaster for LayerCode={LayerCode}. Falling back to configuration defaults.", layerCode);
        }

        // 2. Merge appsettings.json fallbacks
        ApplyConfigurationFallbacks(config);

        // 3. Cache for 5 minutes
        var cacheOptions = new Microsoft.Extensions.Caching.Memory.MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5), Size = 1 };
        _cache.Set(cacheKey, config, cacheOptions);
        return config;
    }

    public string ResolveAssetColor(GisAssetGeometryEntity entity, GisLayerStyleConfigDto styleConfig, GisAssetDataRequestDto? filters)
    {
        ArgumentNullException.ThrowIfNull(entity);
        ArgumentNullException.ThrowIfNull(styleConfig);

        var asset = entity.Asset;

        // Step 1: Check dynamic request-level status color overrides
        if (filters?.StatusColors != null && filters.StatusColors.Count > 0 && asset != null)
        {
            var match = MatchStatusInDictionary(asset, filters.StatusColors);
            if (!string.IsNullOrEmpty(match))
                return match;
        }

        if (!string.IsNullOrWhiteSpace(filters?.DefaultColor))
        {
            return filters.DefaultColor;
        }

        // Step 2: Evaluate dynamic conditional style rules (if configured in GisLayerMaster.StyleConfigJson)
        if (styleConfig.Rules != null && styleConfig.Rules.Count > 0)
        {
            foreach (var rule in styleConfig.Rules)
            {
                if (EvaluateRule(entity, rule))
                {
                    return rule.Color;
                }
            }
        }

        // Step 3: Match against configured StatusColors dictionary in GisLayerMaster.StyleConfigJson
        if (styleConfig.StatusColors != null && styleConfig.StatusColors.Count > 0 && asset != null)
        {
            var match = MatchStatusInDictionary(asset, styleConfig.StatusColors);
            if (!string.IsNullOrEmpty(match))
                return match;
        }

        // Step 4: Match against CategoryColors in GisLayerMaster.StyleConfigJson
        if (asset != null && styleConfig.CategoryColors != null && styleConfig.CategoryColors.TryGetValue(asset.AssetCategoryId, out var catColor))
        {
            return catColor;
        }

        // Step 5: Direct AssetType ColorCode from [AMS].[AssetTypeMaster]
        if (!string.IsNullOrWhiteSpace(asset?.AssetType?.ColorCode))
        {
            return asset.AssetType.ColorCode;
        }

        // Step 6: Fall back to dynamic default color configured in GisLayerMaster.StyleConfigJson
        return !string.IsNullOrWhiteSpace(styleConfig.DefaultColor) ? styleConfig.DefaultColor : "#0078FF";
    }

    private void ApplyConfigurationFallbacks(GisLayerStyleConfigDto config)
    {
        var gisSection = _configuration.GetSection("GisSettings");
        if (!gisSection.Exists()) return;

        var defaultColor = gisSection["DefaultAssetColor"];
        if (!string.IsNullOrWhiteSpace(defaultColor) && (string.IsNullOrWhiteSpace(config.DefaultColor) || config.DefaultColor == "#0078FF"))
        {
            config.DefaultColor = defaultColor;
        }

        var statusColorsSection = gisSection.GetSection("AssetStatusColors");
        if (statusColorsSection.Exists())
        {
            foreach (var child in statusColorsSection.GetChildren())
            {
                if (!string.IsNullOrWhiteSpace(child.Key) && !string.IsNullOrWhiteSpace(child.Value))
                {
                    if (!config.StatusColors.ContainsKey(child.Key))
                    {
                        config.StatusColors[child.Key] = child.Value;
                    }
                }
            }
        }
    }

    private static string? MatchStatusInDictionary(Core.Entities.Asset_Management.AssetMasterEntity asset, Dictionary<string, string> statusDict)
    {
        // 1. Check EncroachmentStatus
        if (!string.IsNullOrWhiteSpace(asset.EncroachmentStatus))
        {
            foreach (var kvp in statusDict)
            {
                if (asset.EncroachmentStatus.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase) ||
                    kvp.Key.Contains(asset.EncroachmentStatus, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Value;
                }
            }
        }

        // 2. Check OccupancyStatus
        if (!string.IsNullOrWhiteSpace(asset.OccupancyStatus))
        {
            foreach (var kvp in statusDict)
            {
                if (asset.OccupancyStatus.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase) ||
                    kvp.Key.Contains(asset.OccupancyStatus, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Value;
                }
            }
        }

        // 3. Check OwnershipType
        if (!string.IsNullOrWhiteSpace(asset.OwnershipType))
        {
            foreach (var kvp in statusDict)
            {
                if (asset.OwnershipType.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase) ||
                    kvp.Key.Contains(asset.OwnershipType, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Value;
                }
            }
        }

        return null;
    }

    private static bool EvaluateRule(GisAssetGeometryEntity entity, GisStyleRuleDto rule)
    {
        if (string.IsNullOrWhiteSpace(rule.Field) || string.IsNullOrWhiteSpace(rule.Color))
            return false;

        string? fieldValue = GetEntityFieldValue(entity, rule.Field);
        string expectedValue = rule.Value ?? string.Empty;
        string op = rule.Operator?.Trim().ToLowerInvariant() ?? "equals";

        return op switch
        {
            "equals" or "=" or "==" => string.Equals(fieldValue, expectedValue, StringComparison.OrdinalIgnoreCase),
            "!=" or "notequals" => !string.Equals(fieldValue, expectedValue, StringComparison.OrdinalIgnoreCase),
            "contains" => fieldValue != null && fieldValue.Contains(expectedValue, StringComparison.OrdinalIgnoreCase),
            "startswith" => fieldValue != null && fieldValue.StartsWith(expectedValue, StringComparison.OrdinalIgnoreCase),
            "endswith" => fieldValue != null && fieldValue.EndsWith(expectedValue, StringComparison.OrdinalIgnoreCase),
            "empty" or "isnull" => string.IsNullOrWhiteSpace(fieldValue),
            "notempty" or "isnotnull" => !string.IsNullOrWhiteSpace(fieldValue),
            "in" => expectedValue.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                                 .Any(v => string.Equals(v, fieldValue, StringComparison.OrdinalIgnoreCase)),
            _ => string.Equals(fieldValue, expectedValue, StringComparison.OrdinalIgnoreCase)
        };
    }

    private static string? GetEntityFieldValue(GisAssetGeometryEntity entity, string fieldName)
    {
        var asset = entity.Asset;

        return fieldName.ToLowerInvariant() switch
        {
            "encroachmentstatus" => asset?.EncroachmentStatus,
            "occupancystatus" => asset?.OccupancyStatus,
            "ownershiptype" => asset?.OwnershipType,
            "assetcategoryid" => asset?.AssetCategoryId.ToString(),
            "assettypeid" => asset?.AssetTypeId.ToString(),
            "assetconditionid" => asset?.AssetConditionId?.ToString(),
            "assetno" => asset?.AssetNo,
            "assetname" => asset?.AssetName,
            "buildingid" => entity.BuildingId,
            _ => null
        };
    }
}
