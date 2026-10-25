using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Core.Interfaces.GIS;
using NtisPlatform.Core.Models.GIS;

namespace NtisPlatform.Application.Services.GIS.Asset;

/// <summary>
/// Application service responsible for assembling and formatting all 21 data points for the Asset GIS Map Popup.
/// </summary>
public class GisAssetPopupService : IGisAssetPopupService
{
    private readonly IGisAssetRepository _repository;
    private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache? _memoryCache;
    private readonly ILogger<GisAssetPopupService> _logger;
    private static readonly CultureInfo IndianCulture = new("en-IN");

    public GisAssetPopupService(
        IGisAssetRepository repository,
        ILogger<GisAssetPopupService> logger,
        Microsoft.Extensions.Caching.Memory.IMemoryCache? memoryCache = null)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _memoryCache = memoryCache;
    }

    public async Task<GisAssetPopupDetailsDto?> GetAssetPopupDetailsAsync(int assetId, CancellationToken ct = default)
    {
        if (assetId <= 0)
        {
            _logger.LogWarning("Invalid AssetId {AssetId} provided to GetAssetPopupDetailsAsync", assetId);
            return null;
        }

        string cacheKey = $"gis_asset_popup_{assetId}";
        if (_memoryCache != null && _memoryCache.TryGetValue(cacheKey, out GisAssetPopupDetailsDto? cached) && cached != null)
        {
            return cached;
        }

        var details = await _repository.GetAssetPopupDetailsAsync(assetId, ct);
        if (details == null)
        {
            _logger.LogInformation("Asset with Id {AssetId} not found for GIS popup", assetId);
            return null;
        }

        details.FormattedCapitalValue = FormatIndianCurrency(details.CapitalValue);
        details.FormattedAnnualRevenue = FormatIndianCurrency(details.AnnualRevenue);
        if (details.MonthlyRent.HasValue && details.MonthlyRent.Value > 0)
        {
            details.FormattedMonthlyRent = $"₹ {details.MonthlyRent.Value.ToString("N0", IndianCulture)}";
        }

        if (_memoryCache != null)
        {
            var cacheOptions = new Microsoft.Extensions.Caching.Memory.MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(2),
                Size = 1
            };
            _memoryCache.Set(cacheKey, details, cacheOptions);
        }

        return details;
    }

    private static string FormatIndianCurrency(decimal amount)
    {
        if (amount <= 0) return "₹ 0";

        // Crores: >= 10,000,000 (1 Cr)
        if (amount >= 10_000_000m)
        {
            decimal cr = amount / 10_000_000m;
            return cr == Math.Floor(cr)
                ? $"₹ {cr:0} Cr"
                : $"₹ {cr:0.##} Cr";
        }

        // Lakhs: >= 100,000 (1 Lakh)
        if (amount >= 100_000m)
        {
            decimal lakh = amount / 100_000m;
            return lakh == Math.Floor(lakh)
                ? $"₹ {lakh:0} L"
                : $"₹ {lakh:0.##} L";
        }

        // Thousands / Standard format
        return $"₹ {amount.ToString("N0", IndianCulture)}";
    }
}
