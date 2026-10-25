using NtisPlatform.Core.Models.AutomationDashboard;

namespace NtisPlatform.Application.Interfaces.AutomationDashboard;

/// <summary>
/// Application-layer service interface for Missing Details dashboard.
/// One method per Missing Details category — each returns a zone-wise summary.
/// Photo and Plan will be added in Phase 2 without modifying existing methods.
/// </summary>
public interface IMissingDetailsService
{
    /// <summary>
    /// Returns total and per-zone counts of properties with a missing Mobile Number.
    /// Supports optional filtering by ZoneNo.
    /// </summary>
    Task<MissingDetailsSummaryResponseDto> GetMissingMobileNoAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns total and per-zone counts of properties with a missing Owner Name.
    /// Supports optional filtering by ZoneNo.
    /// </summary>
    Task<MissingDetailsSummaryResponseDto> GetMissingOwnerNameAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns total and per-zone counts of properties with a missing Address.
    /// Supports optional filtering by ZoneNo.
    /// </summary>
    Task<MissingDetailsSummaryResponseDto> GetMissingAddressAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns total and per-zone counts of properties with a missing Occupier Name.
    /// Supports optional filtering by ZoneNo.
    /// </summary>
    Task<MissingDetailsSummaryResponseDto> GetMissingOccupierNameAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns total and per-zone counts of properties with a missing Shop/Flat Name.
    /// Supports optional filtering by ZoneNo.
    /// </summary>
    Task<MissingDetailsSummaryResponseDto> GetMissingShopNameAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns Registered Property Data (Total Old Properties, Merged Properties, Missing Old Properties)
    /// with total summary cards and zone-wise breakdown. Supports optional filtering by ZoneNo.
    /// </summary>
    Task<RegisteredPropertySummaryResponseDto> GetRegisteredPropertyDataAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns Photo and Plan missing statistics (TotalPhotoMissing, TotalPlanMissing, TotalGapFields)
    /// with zone-wise breakdown. Supports optional filtering by ZoneNo.
    /// </summary>
    Task<MissingPhotoPlanDto> GetMissingPhotoPlanAsync(
        string? zoneNo = null,
        CancellationToken cancellationToken = default);
}
