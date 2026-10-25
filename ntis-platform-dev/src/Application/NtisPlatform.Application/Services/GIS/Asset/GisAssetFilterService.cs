using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Core.Interfaces.GIS;
using NtisPlatform.Core.Models.GIS;

namespace NtisPlatform.Application.Services.GIS.Asset;

/// <summary>
/// Domain Business Service for generating dynamic, cascading filter schemas for Asset GIS.
/// Queries lookups and active filter configurations via IGisAssetRepository.
/// If a filter is deactivated (IsActive = 0) in the Master, it is excluded from the returned filters list.
/// Features Enterprise Hybrid Caching (L1 RAM + L2 Redis) with automatic tag invalidation.
/// </summary>
public class GisAssetFilterService : IGisAssetFilterService
{
    private readonly IGisAssetRepository _gisAssetRepository;
    private readonly ILogger<GisAssetFilterService> _logger;
    private readonly HybridCache? _hybridCache;

    public GisAssetFilterService(
        IGisAssetRepository gisAssetRepository,
        ILogger<GisAssetFilterService> logger,
        HybridCache? hybridCache = null)
    {
        _gisAssetRepository = gisAssetRepository ?? throw new ArgumentNullException(nameof(gisAssetRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _hybridCache = hybridCache;
    }

    public async Task<List<GisAssetFilterGroupDto>> GetAssetFilterGroupsAsync(
        int? zoneId, 
        int? assetCategoryId, 
        int? departmentId = null,
        CancellationToken ct = default)
    {
        int targetDepartmentId = departmentId.GetValueOrDefault(3);

        if (_hybridCache == null)
        {
            return await GetAssetFilterGroupsInternalAsync(zoneId, assetCategoryId, targetDepartmentId, ct);
        }

        string cacheKey = $"gis_filters_{targetDepartmentId}_{zoneId}_{assetCategoryId}";

        var entryOptions = new HybridCacheEntryOptions
        {
            Expiration = TimeSpan.FromMinutes(120),
            LocalCacheExpiration = TimeSpan.FromMinutes(30)
        };

        return await _hybridCache.GetOrCreateAsync(
            cacheKey,
            async token => await GetAssetFilterGroupsInternalAsync(zoneId, assetCategoryId, targetDepartmentId, token),
            entryOptions,
            tags: new[] { "gis_filters" },
            cancellationToken: ct);
    }

    private async Task<List<GisAssetFilterGroupDto>> GetAssetFilterGroupsInternalAsync(
        int? zoneId, 
        int? assetCategoryId, 
        int departmentId,
        CancellationToken ct)
    {
        _logger.LogInformation("Retrieving dynamic Asset GIS filter groups with DepartmentId={DeptId}, ZoneId={ZoneId}, AssetCategoryId={AssetCategoryId}", departmentId, zoneId, assetCategoryId);

        // 1. Fetch active configured filters from master tables (GIS.GisDepartmentFilterMapping & GIS.GisFilterMaster)
        List<GisDepartmentFilterConfigDto> activeFilterConfigs = await _gisAssetRepository.GetActiveDepartmentFiltersAsync(departmentId, ct);

        if (activeFilterConfigs == null || activeFilterConfigs.Count == 0)
        {
            activeFilterConfigs = GetDefaultFilterConfigs();
        }

        // 2. Fetch cascading lookup options from database via repository
        var (zones, wards, categories, types) = await _gisAssetRepository.GetFilterLookupsAsync(zoneId, assetCategoryId, ct);

        var groups = new List<GisAssetFilterGroupDto>();

        // 3. Assemble only active filter groups ordered by DisplayOrder
        foreach (var filterConfig in activeFilterConfigs.OrderBy(f => f.DisplayOrder))
        {
            var key = filterConfig.FilterKey.Trim();

            switch (key.ToLowerInvariant())
            {
                case "zoneid":
                    groups.Add(new GisAssetFilterGroupDto
                    {
                        FilterKey = "zoneId",
                        FilterLabel = filterConfig.FilterLabel,
                        ControlType = filterConfig.ControlType,
                        ApiSourceUrl = filterConfig.ApiSourceUrl,
                        DisplayOrder = filterConfig.DisplayOrder,
                        Options = zones.Select(z => new GisAssetFilterOptionDto
                        {
                            Id = z.Id,
                            Name = z.Name
                        }).ToList()
                    });
                    break;

                case "wardid":
                    groups.Add(new GisAssetFilterGroupDto
                    {
                        FilterKey = "wardId",
                        FilterLabel = filterConfig.FilterLabel,
                        ControlType = filterConfig.ControlType,
                        ApiSourceUrl = filterConfig.ApiSourceUrl,
                        DisplayOrder = filterConfig.DisplayOrder,
                        Options = wards.Select(w => new GisAssetFilterOptionDto
                        {
                            Id = w.Id,
                            Name = w.Name,
                            ParentId = w.ZoneId
                        }).ToList()
                    });
                    break;

                case "assetcategoryid":
                    groups.Add(new GisAssetFilterGroupDto
                    {
                        FilterKey = "assetCategoryId",
                        FilterLabel = filterConfig.FilterLabel,
                        ControlType = filterConfig.ControlType,
                        ApiSourceUrl = filterConfig.ApiSourceUrl,
                        DisplayOrder = filterConfig.DisplayOrder,
                        Options = categories.Select(c => new GisAssetFilterOptionDto
                        {
                            Id = c.Id,
                            Name = c.Name,
                            Code = c.Code
                        }).ToList()
                    });
                    break;

                case "assettypeid":
                    groups.Add(new GisAssetFilterGroupDto
                    {
                        FilterKey = "assetTypeId",
                        FilterLabel = filterConfig.FilterLabel,
                        ControlType = filterConfig.ControlType,
                        ApiSourceUrl = filterConfig.ApiSourceUrl,
                        DisplayOrder = filterConfig.DisplayOrder,
                        Options = types.Select(t => new GisAssetFilterOptionDto
                        {
                            Id = t.Id,
                            Name = t.Name,
                            Code = t.Code,
                            ParentId = t.CategoryId,
                            ColorCode = t.ColorCode,
                            BorderColor = t.BorderColor ?? "#FFFFFF",
                            AssetWardNo = t.AssetWardNo
                        }).ToList()
                    });
                    break;

                default:
                    _logger.LogWarning("Unrecognized active Filter Key '{FilterKey}' in master configuration", key);
                    break;
            }
        }

        return groups;
    }

    private static List<GisDepartmentFilterConfigDto> GetDefaultFilterConfigs()
    {
        return new List<GisDepartmentFilterConfigDto>
        {
            new() { FilterKey = "zoneId", FilterLabel = "Zone", ControlType = "DROPDOWN", DisplayOrder = 1 },
            new() { FilterKey = "wardId", FilterLabel = "Ward", ControlType = "DROPDOWN", DisplayOrder = 2 },
            new() { FilterKey = "assetCategoryId", FilterLabel = "Asset Category", ControlType = "DROPDOWN", DisplayOrder = 3 },
            new() { FilterKey = "assetTypeId", FilterLabel = "Asset Type", ControlType = "DROPDOWN", DisplayOrder = 4 }
        };
    }
}
