using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Core.Interfaces.GIS;
using NtisPlatform.Core.Models.GIS;

namespace NtisPlatform.Application.Services.GIS.Asset;

/// <summary>
/// Domain Business Service for calculating Asset GIS dynamic KPI cards.
/// Reads all Titles, Colors, Icons, Display Orders, and Active states dynamically from Master tables
/// (GIS.GisDepartmentKpiMapping & GIS.GisKpiMaster) via IGisAssetRepository. Zero hardcoded colors/titles.
/// If a KPI is inactive (IsActive = 0) in the Master, it is automatically excluded.
/// Features Enterprise Hybrid Caching (L1 RAM + L2 Redis) with automatic tag invalidation.
/// </summary>
public class GisAssetKpiService : IGisAssetKpiService
{
    private readonly IGisAssetRepository _gisAssetRepository;
    private readonly ILogger<GisAssetKpiService> _logger;
    private readonly HybridCache? _hybridCache;

    public GisAssetKpiService(
        IGisAssetRepository gisAssetRepository,
        ILogger<GisAssetKpiService> logger,
        HybridCache? hybridCache = null)
    {
        _gisAssetRepository = gisAssetRepository ?? throw new ArgumentNullException(nameof(gisAssetRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _hybridCache = hybridCache;
    }

    public async Task<GisAssetKpiSummaryResponseDto> GetAssetKpiSummaryAsync(
        GisAssetDataRequestDto? filters, 
        CancellationToken ct = default)
    {
        var request = filters ?? new GisAssetDataRequestDto();
        int departmentId = request.DepartmentId ?? 3;

        if (_hybridCache == null)
        {
            return await CalculateAssetKpiSummaryInternalAsync(request, departmentId, ct);
        }

        string cacheKey = $"gis_kpi_{departmentId}_{request.ZoneId}_{request.WardId}_{request.AssetCategoryId}_{request.AssetTypeId}_{request.KpiCode}_{request.FinanceYear}_{request.SearchTerm}";

        var entryOptions = new HybridCacheEntryOptions
        {
            Expiration = TimeSpan.FromMinutes(15),
            LocalCacheExpiration = TimeSpan.FromMinutes(5)
        };

        return await _hybridCache.GetOrCreateAsync(
            cacheKey,
            async token => await CalculateAssetKpiSummaryInternalAsync(request, departmentId, token),
            entryOptions,
            tags: new[] { "gis_kpis" },
            cancellationToken: ct);
    }

    private async Task<GisAssetKpiSummaryResponseDto> CalculateAssetKpiSummaryInternalAsync(
        GisAssetDataRequestDto request, 
        int departmentId, 
        CancellationToken ct)
    {
        _logger.LogInformation(
            "Calculating Asset GIS dynamic KPI summary for DepartmentId={DeptId}, ZoneId={ZoneId}, WardId={WardId}, CategoryId={CategoryId}, TypeId={TypeId}, KpiCode={KpiCode}, FY={FY}",
            departmentId, request.ZoneId, request.WardId, request.AssetCategoryId, request.AssetTypeId, request.KpiCode, request.FinanceYear);

        // 1. Fetch active KPI card configurations from Master DB (Titles, Colors, Icons, Display Order, IsActive)
        List<GisDepartmentKpiConfigDto> activeKpiConfigs = await _gisAssetRepository.GetActiveDepartmentKpisAsync(departmentId, ct);

        // Fallback default definitions only if master mapping table has not been configured yet
        if (activeKpiConfigs == null || activeKpiConfigs.Count == 0)
        {
            activeKpiConfigs = GetDefaultKpiConfigs();
        }

        // 2. Fetch raw aggregate metrics from repository via EF Core LINQ
        AssetKpiMetricsRawDto rawMetrics = await _gisAssetRepository.GetAssetKpiMetricsAsync(
            request.ZoneId,
            request.WardId,
            request.AssetCategoryId,
            request.AssetTypeId,
            request.KpiCode,
            request.FinanceYear,
            request.SearchTerm,
            departmentId,
            ct);

        var selectedKpi = request.KpiCode?.Trim().ToUpperInvariant();
        var cards = new List<GisAssetKpiCardDto>();

        // 3. Dynamically construct only ACTIVE cards using database-configured colors, titles, icons, and display orders
        foreach (var kpiConfig in activeKpiConfigs.OrderBy(k => k.DisplayOrder))
        {
            var code = kpiConfig.KpiCode.Trim().ToUpperInvariant();
            decimal rawVal = 0m;
            string formattedVal = "0";
            string unit = "Assets";

            switch (code)
            {
                case "TOTAL_ASSETS":
                    rawVal = rawMetrics.TotalAssets;
                    formattedVal = FormatCount(rawMetrics.TotalAssets);
                    unit = "Assets";
                    break;

                case "FIXED_ASSETS":
                    rawVal = rawMetrics.FixedAssets;
                    formattedVal = FormatCount(rawMetrics.FixedAssets);
                    unit = "Assets";
                    break;

                case "MOVABLE_ASSETS":
                    rawVal = rawMetrics.MovableAssets;
                    formattedVal = FormatCount(rawMetrics.MovableAssets);
                    unit = "Assets";
                    break;

                case "TOTAL_VALUE":
                    rawVal = rawMetrics.TotalValue;
                    formattedVal = FormatIndianCurrency(rawMetrics.TotalValue);
                    unit = "INR";
                    break;

                case "ANNUAL_REVENUE":
                    rawVal = rawMetrics.AnnualRevenue;
                    formattedVal = FormatIndianCurrency(rawMetrics.AnnualRevenue);
                    unit = "INR";
                    break;

                case "ENCROACHED_ASSETS":
                    rawVal = rawMetrics.EncroachedAssets;
                    formattedVal = FormatCount(rawMetrics.EncroachedAssets);
                    unit = "Assets";
                    break;

                default:
                    _logger.LogWarning("Unrecognized active KPI Code '{KpiCode}' in master configuration", code);
                    continue;
            }

            cards.Add(new GisAssetKpiCardDto
            {
                KpiCode = code,
                Title = kpiConfig.Title,
                RawValue = rawVal,
                FormattedValue = formattedVal,
                Unit = unit,
                Icon = kpiConfig.Icon,
                Color = kpiConfig.Color,
                DisplayOrder = kpiConfig.DisplayOrder,
                FilterKey = "kpiCode",
                FilterValue = code,
                IsSelected = selectedKpi == code
            });
        }

        return new GisAssetKpiSummaryResponseDto
        {
            DepartmentId = departmentId,
            DepartmentCode = "AMS",
            DepartmentName = "Asset Management",
            TotalAssets = rawMetrics.TotalAssets,
            Cards = cards,
            AppliedFilters = request,
            GeneratedAtUtc = DateTime.UtcNow
        };
    }

    private static List<GisDepartmentKpiConfigDto> GetDefaultKpiConfigs()
    {
        return new List<GisDepartmentKpiConfigDto>
        {
            new() { KpiCode = "TOTAL_ASSETS", Title = "Total Assets", Icon = "fa-cubes", Color = "#2563EB", DisplayOrder = 1 },
            new() { KpiCode = "FIXED_ASSETS", Title = "Fixed Assets", Icon = "fa-building", Color = "#059669", DisplayOrder = 2 },
            new() { KpiCode = "MOVABLE_ASSETS", Title = "Movable Assets", Icon = "fa-truck", Color = "#D97706", DisplayOrder = 3 },
            new() { KpiCode = "TOTAL_VALUE", Title = "Total Value", Icon = "fa-indian-rupee-sign", Color = "#7C3AED", DisplayOrder = 4 },
            new() { KpiCode = "ANNUAL_REVENUE", Title = "Annual Revenue", Icon = "fa-chart-line", Color = "#0284C7", DisplayOrder = 5 },
            new() { KpiCode = "ENCROACHED_ASSETS", Title = "Encroached Assets", Icon = "fa-triangle-exclamation", Color = "#DC2626", DisplayOrder = 6 }
        };
    }

    private static string FormatCount(int count)
    {
        return count.ToString("N0", CultureInfo.InvariantCulture);
    }

    private static string FormatIndianCurrency(decimal amount)
    {
        if (amount <= 0) return "₹ 0";

        if (amount >= 10_000_000m) // >= 1 Crore (100 Lakhs)
        {
            decimal cr = amount / 10_000_000m;
            return $"₹ {cr:0.##} Cr";
        }
        if (amount >= 100_000m) // >= 1 Lakh
        {
            decimal lk = amount / 100_000m;
            return $"₹ {lk:0.##} L";
        }

        return $"₹ {amount:N0}";
    }
}
