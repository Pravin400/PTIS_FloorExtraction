using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Core.Models.AutomationDashboard;

namespace NtisPlatform.Api.Controllers;

public partial class AutomationDashboardController
{
    // ─────────────────────────────────────────────────────────────────────────
    //  PropertyMast-based categories
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns total and per-zone counts of properties whose Mobile Number is missing.
    /// Supports optional zone filtering via <paramref name="zoneNo"/>.
    /// </summary>
    [HttpGet("MissingDetails/mobile-no")]
    public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<MissingDetailsSummaryResponseDto>>>> GetMissingMobileNo(
        [FromQuery] string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _missingDetailsService.GetMissingMobileNoAsync(zoneNo, cancellationToken);
            return OkItem(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Missing Mobile No data (zoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    /// <summary>
    /// Returns total and per-zone counts of properties whose Owner Name is missing.
    /// Supports optional zone filtering via <paramref name="zoneNo"/>.
    /// </summary>
    [HttpGet("MissingDetails/owner-name")]
    public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<MissingDetailsSummaryResponseDto>>>> GetMissingOwnerName(
        [FromQuery] string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _missingDetailsService.GetMissingOwnerNameAsync(zoneNo, cancellationToken);
            return OkItem(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Missing Owner Name data (zoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    /// <summary>
    /// Returns total and per-zone counts of properties whose Address is missing.
    /// Supports optional zone filtering via <paramref name="zoneNo"/>.
    /// </summary>
    [HttpGet("MissingDetails/address")]
    public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<MissingDetailsSummaryResponseDto>>>> GetMissingAddress(
        [FromQuery] string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _missingDetailsService.GetMissingAddressAsync(zoneNo, cancellationToken);
            return OkItem(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Missing Address data (zoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    /// <summary>
    /// Returns total and per-zone counts of properties whose Occupier Name is missing.
    /// Supports optional zone filtering via <paramref name="zoneNo"/>.
    /// </summary>
    [HttpGet("MissingDetails/occupier-name")]
    public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<MissingDetailsSummaryResponseDto>>>> GetMissingOccupierName(
        [FromQuery] string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _missingDetailsService.GetMissingOccupierNameAsync(zoneNo, cancellationToken);
            return OkItem(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Missing Occupier Name data (zoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    /// <summary>
    /// Returns total and per-zone counts of properties whose Shop / Flat Name is missing.
    /// Supports optional zone filtering via <paramref name="zoneNo"/>.
    /// </summary>
    [HttpGet("MissingDetails/shopname")]
    public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<MissingDetailsSummaryResponseDto>>>> GetMissingShopName(
        [FromQuery] string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _missingDetailsService.GetMissingShopNameAsync(zoneNo, cancellationToken);
            return OkItem(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Missing Shop Name data (zoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Registered Property Data (PropertyMastOld vs PropertyMapDetail)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns Registered Property Data (Total Old Properties, Merged Properties, Missing Old Properties)
    /// with total summary cards and zone-wise breakdown. Supports optional zone filtering via <paramref name="zoneNo"/>.
    /// Accessible via both "RegisteredPropertyData" and "MissingRegisteredPropertyData".
    /// </summary>
    [HttpGet("MissingDetails/registered-property-data")]
    public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<RegisteredPropertySummaryResponseDto>>>> GetRegisteredPropertyData(
        [FromQuery] string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _missingDetailsService.GetRegisteredPropertyDataAsync(zoneNo, cancellationToken);
            return OkItem(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Registered Property Data (zoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Photo & Plan
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns Photo and Plan missing statistics grouped by zone.
    /// Supports optional zone filtering via <paramref name="zoneNo"/>.
    /// </summary>
    [HttpGet("MissingDetails/photo-plan")]
    public async Task<ActionResult<AutomationDashboardItemsResponse<IReadOnlyList<MissingPhotoPlanDto>>>> GetMissingPhotoPlan(
        [FromQuery] string? zoneNo = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _missingDetailsService.GetMissingPhotoPlanAsync(zoneNo, cancellationToken);
            return OkItem(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Missing Photo & Plan data (zoneNo={ZoneNo})", zoneNo);
            throw;
        }
    }
}
