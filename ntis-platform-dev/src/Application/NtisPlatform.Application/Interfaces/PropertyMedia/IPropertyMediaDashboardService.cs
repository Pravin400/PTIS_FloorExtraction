using NtisPlatform.Application.DTOs.PropertyMedia;

namespace NtisPlatform.Application.Interfaces.PropertyMedia;

/// <summary>
/// Use-case service for the Property Media &amp; Document Center dashboard.
/// </summary>
public interface IPropertyMediaDashboardService
{
    Task<PropertyMediaDashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Detailed Coverage table: one row per active <c>PTIS.PropertyPhotoType</c> with
    /// Applicable / Available / Missing / Coverage% counts, filtered per
    /// <paramref name="queryParameters"/>: Category is an optional exact-match filter
    /// (Photo/Plan/Document), SearchTerm is an optional free-text match against the Category
    /// label or PhotoTypeName - both combine with AND when supplied together.
    /// </summary>
    Task<List<PropertyMediaCoverageRowDto>> GetDetailedCoverageAsync(
        PropertyMediaCoverageQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Drill-down for a Detailed Coverage row's "View" action: lists the active, non-deleted
    /// properties that are missing at least one active PropertyPhoto of <paramref name="photoTypeId"/>
    /// - or, when <paramref name="photoTypeId"/> is omitted, of ANY active PropertyPhotoType (one
    /// row per missing (property, photo type) combination) - paged and filtered per
    /// <paramref name="queryParameters"/>: optional exact-match ZoneId/WardId/PropertyTypeId/
    /// WorkflowStageId filters plus an optional free-text SearchTerm (matches PropertyNo,
    /// OwnerName, ZoneNo, WardNo or PropertyType), all combined with AND. GapRecords is the total
    /// matching count after every filter is applied.
    /// </summary>
    Task<PropertyMediaGapListDto> GetMissingPropertiesByPhotoTypeAsync(
        int? photoTypeId,
        PropertyMediaGapQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>Paged list of Property Media bulk-import jobs, newest first.</summary>
    Task<(List<PropertyMediaJobSummaryDto> Items, int TotalCount)> GetMediaJobsAsync(
        PropertyMediaJobQueryParameters queryParameters,
        CancellationToken cancellationToken = default);
}
