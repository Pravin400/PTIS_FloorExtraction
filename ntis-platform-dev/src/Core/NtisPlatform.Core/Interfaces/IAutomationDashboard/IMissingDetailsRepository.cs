using NtisPlatform.Core.Models.AutomationDashboard;

namespace NtisPlatform.Core.Interfaces.IAutomationDashboard;

/// <summary>
/// Repository interface for Missing Details dashboard operations.
/// All PropertyMast-based missing-data queries are declared here.
/// Photo and Plan logic will be added in Phase 2 without touching existing methods.
/// </summary>
public interface IMissingDetailsRepository
{
    /// <summary>
    /// Reads active zones for grouping (all zones or single zone if zoneNo is specified).
    /// Returns tuples of (ZoneId, ZoneNo, ZoneName) ordered by ZoneNo.
    /// </summary>
    Task<List<(int ZoneId, string ZoneNo, string ZoneName)>> ReadZonesAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active properties (per zone) where MobileNo
    /// is NULL, empty, or whitespace-only. Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMissingMobileNoByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active properties (per zone) where OwnerName
    /// is NULL, empty, or whitespace-only. Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMissingOwnerNameByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active properties (per zone) where Address
    /// is NULL, empty, or whitespace-only. Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMissingAddressByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active properties (per zone) where OccupierName
    /// is NULL, empty, or whitespace-only. Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMissingOccupierNameByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active properties (per zone) where FlatOrShopName
    /// is NULL, empty, or whitespace-only. Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMissingShopNameByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns total old properties from PropertyMastOld per zone.
    /// Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadTotalOldPropertiesByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns mapped/merged properties from PropertyMapDetail per zone.
    /// Uses PropertyMapDetail -> PropertyMast -> WardMaster -> ZoneMaster.
    /// Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMergedPropertiesByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reads total counts for registered property data (Total Old Properties, Total Merged Properties).
    /// Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<(int TotalOldProperties, int TotalMergedProperties)> ReadRegisteredPropertyTotalsAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active properties (per zone) missing a PROPERTY_FRONT photo in PropertyPhoto.
    /// Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMissingPhotoByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of active properties (per zone) missing a PROPERTY_PLAN photo in PropertyPhoto.
    /// Supports optional zone filtering by ZoneNo.
    /// </summary>
    Task<Dictionary<int, int>> ReadMissingPlanByZoneAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);
}
