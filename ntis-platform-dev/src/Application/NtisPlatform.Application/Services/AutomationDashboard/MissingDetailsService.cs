using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Interfaces.AutomationDashboard;
using NtisPlatform.Core.Interfaces.IAutomationDashboard;
using NtisPlatform.Core.Models.AutomationDashboard;

namespace NtisPlatform.Application.Services.AutomationDashboard;

/// <summary>
/// Application service for Missing Details dashboard.
/// Orchestrates repository reads and assembles zone-wise summary responses.
/// Supports optional zone-wise filtering across all categories.
/// Follows the same service-orchestration pattern used by GeoSequencingStageService.
/// </summary>
public class MissingDetailsService : IMissingDetailsService
{
    private readonly IMissingDetailsRepository _repository;
    private readonly ILogger<MissingDetailsService> _logger;

    public MissingDetailsService(
        IMissingDetailsRepository repository,
        ILogger<MissingDetailsService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────────────────────────────────

    /// <inheritdoc/>
    public Task<MissingDetailsSummaryResponseDto> GetMissingMobileNoAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
        => BuildSummaryAsync(
            () => _repository.ReadMissingMobileNoByZoneAsync(zoneNo, cancellationToken),
            zoneNo,
            cancellationToken,
            categoryName: "MissingMobileNo");

    /// <inheritdoc/>
    public Task<MissingDetailsSummaryResponseDto> GetMissingOwnerNameAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
        => BuildSummaryAsync(
            () => _repository.ReadMissingOwnerNameByZoneAsync(zoneNo, cancellationToken),
            zoneNo,
            cancellationToken,
            categoryName: "MissingOwnerName");

    /// <inheritdoc/>
    public Task<MissingDetailsSummaryResponseDto> GetMissingAddressAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
        => BuildSummaryAsync(
            () => _repository.ReadMissingAddressByZoneAsync(zoneNo, cancellationToken),
            zoneNo,
            cancellationToken,
            categoryName: "MissingAddress");

    /// <inheritdoc/>
    public Task<MissingDetailsSummaryResponseDto> GetMissingOccupierNameAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
        => BuildSummaryAsync(
            () => _repository.ReadMissingOccupierNameByZoneAsync(zoneNo, cancellationToken),
            zoneNo,
            cancellationToken,
            categoryName: "MissingOccupierName");

    /// <inheritdoc/>
    public Task<MissingDetailsSummaryResponseDto> GetMissingShopNameAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
        => BuildSummaryAsync(
            () => _repository.ReadMissingShopNameByZoneAsync(zoneNo, cancellationToken),
            zoneNo,
            cancellationToken,
            categoryName: "MissingShopName");

    /// <inheritdoc/>
    public async Task<RegisteredPropertySummaryResponseDto> GetRegisteredPropertyDataAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var zones = await _repository.ReadZonesAsync(zoneNo, cancellationToken);
            var oldCounts = await _repository.ReadTotalOldPropertiesByZoneAsync(zoneNo, cancellationToken);
            var mergedCounts = await _repository.ReadMergedPropertiesByZoneAsync(zoneNo, cancellationToken);
            var (totalOld, totalMerged) = await _repository.ReadRegisteredPropertyTotalsAsync(zoneNo, cancellationToken);

            if (!zones.Any())
            {
                _logger.LogInformation("No active zones found for RegisteredPropertyData (ZoneNo={ZoneNo})", zoneNo);
                return new RegisteredPropertySummaryResponseDto();
            }

            var zoneRows = zones
                .Select(z =>
                {
                    oldCounts.TryGetValue(z.ZoneId, out var oldPropCount);
                    mergedCounts.TryGetValue(z.ZoneId, out var mergedPropCount);

                    return new RegisteredPropertyZoneSummaryDto
                    {
                        ZoneId = z.ZoneId,
                        ZoneNo = z.ZoneNo,
                        ZoneName = z.ZoneName,
                        TotalOldPropertyCount = oldPropCount,
                        MergeOldPropertyCount = mergedPropCount
                    };
                })
                .OrderBy(z => z.ZoneNo)
                .ToList();

            var response = new RegisteredPropertySummaryResponseDto
            {
                TotalOldPropertyCount = totalOld,
                TotalMergedProperties = totalMerged,
                Zones = zoneRows
            };

            _logger.LogInformation(
                "Retrieved RegisteredPropertyData (ZoneNo={ZoneNo}): TotalOld={TotalOld}, Merged={Merged}, Missing={Missing}",
                zoneNo, response.TotalOldPropertyCount, response.TotalMergedProperties, response.TotalMissingOldPropertyCount);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RegisteredPropertyData (ZoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<MissingPhotoPlanDto> GetMissingPhotoPlanAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var zones = await _repository.ReadZonesAsync(zoneNo, cancellationToken);
            var photoMissingCounts = await _repository.ReadMissingPhotoByZoneAsync(zoneNo, cancellationToken);
            var planMissingCounts = await _repository.ReadMissingPlanByZoneAsync(zoneNo, cancellationToken);

            if (!zones.Any())
            {
                _logger.LogInformation("No active zones found for PhotoPlan (ZoneNo={ZoneNo})", zoneNo);
                return new MissingPhotoPlanDto();
            }

            var zoneRows = zones
                .Select(z =>
                {
                    photoMissingCounts.TryGetValue(z.ZoneId, out var photoCount);
                    planMissingCounts.TryGetValue(z.ZoneId, out var planCount);

                    return new MissingPhotoPlanZoneSummaryDto
                    {
                        ZoneId = z.ZoneId,
                        ZoneNo = z.ZoneNo,
                        ZoneName = z.ZoneName,
                        PhotoMissing = photoCount,
                        PlanMissing = planCount
                    };
                })
                .OrderBy(z => z.ZoneNo)
                .ToList();

            var totalPhotoMissing = zoneRows.Sum(z => z.PhotoMissing);
            var totalPlanMissing = zoneRows.Sum(z => z.PlanMissing);

            var response = new MissingPhotoPlanDto
            {
                TotalPhotoMissing = totalPhotoMissing,
                TotalPlanMissing = totalPlanMissing,
                TotalGapFields = totalPhotoMissing + totalPlanMissing,
                Zones = zoneRows
            };

            _logger.LogInformation(
                "Retrieved PhotoPlan (ZoneNo={ZoneNo}): PhotoMissing={PhotoMissing}, PlanMissing={PlanMissing}, TotalGap={TotalGap}",
                zoneNo, response.TotalPhotoMissing, response.TotalPlanMissing, response.TotalGapFields);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving PhotoPlan (ZoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Generic summary builder.
    /// 1. Fetches active zones and the category-specific missing-count dictionary sequentially.
    /// 2. Assembles per-zone rows; zones with no missing data get a count of 0.
    /// 3. Computes the grand total.
    /// </summary>
    private async Task<MissingDetailsSummaryResponseDto> BuildSummaryAsync(
        Func<Task<Dictionary<int, int>>> fetchCountsByZone,
        string? zoneNo,
        CancellationToken cancellationToken,
        string categoryName)
    {
        try
        {
            // Execute sequentially to prevent DbContext concurrency conflicts on the scoped instance.
            var zones = await _repository.ReadZonesAsync(zoneNo, cancellationToken);
            var countsByZoneId = await fetchCountsByZone();

            if (!zones.Any())
            {
                _logger.LogInformation("No active zones found for {Category} (ZoneNo={ZoneNo})", categoryName, zoneNo);
                return new MissingDetailsSummaryResponseDto();
            }

            var zoneRows = zones
                .Select(z =>
                {
                    countsByZoneId.TryGetValue(z.ZoneId, out var count);
                    return new MissingDetailsZoneSummaryDto
                    {
                        ZoneId = z.ZoneId,
                        ZoneNo = z.ZoneNo,
                        ZoneName = z.ZoneName,
                        MissingCount = count
                    };
                })
                .OrderBy(z => z.ZoneNo)
                .ToList();

            var response = new MissingDetailsSummaryResponseDto
            {
                TotalMissing = zoneRows.Sum(z => z.MissingCount),
                Zones = zoneRows
            };

            _logger.LogInformation(
                "Retrieved {Category} (ZoneNo={ZoneNo}): TotalMissing={Total}, ZoneCount={ZoneCount}",
                categoryName, zoneNo, response.TotalMissing, response.Zones.Count);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building summary for {Category} (ZoneNo={ZoneNo})", categoryName, zoneNo);
            throw;
        }
    }
}
