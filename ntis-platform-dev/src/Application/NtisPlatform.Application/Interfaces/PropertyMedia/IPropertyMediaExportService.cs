using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Core.Enums;

namespace NtisPlatform.Application.Interfaces.PropertyMedia;

/// <summary>
/// Combined export service for Property Media (Excel and PDF exports).
/// </summary>
public interface IPropertyMediaExportService
{
    /// <summary>
    /// Exports the Detailed Coverage table to an .xlsx workbook.
    /// </summary>
    Task<byte[]> ExportDetailedCoverageToExcelAsync(
        PropertyMediaCoverageQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports the Detailed Coverage table to a landscape A4 PDF.
    /// </summary>
    Task<byte[]> ExportDetailedCoverageToPdfAsync(
        PropertyMediaCoverageQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports every matching row (ignores paging) of the missing-properties drill-down to an .xlsx workbook.
    /// </summary>
    Task<byte[]> ExportMissingPropertiesToExcelAsync(
        int? photoTypeId,
        PropertyMediaGapQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports every matching row (ignores paging) of the missing-properties drill-down to a landscape A4 PDF.
    /// </summary>
    Task<byte[]> ExportMissingPropertiesToPdfAsync(
        int? photoTypeId,
        PropertyMediaGapQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports the currently-available PropertyPhoto files matching Category/Subtype to an .xlsx listing.
    /// </summary>
    Task<byte[]> ExportMatchedFilesToExcelAsync(
        PropertyMediaCategory? category,
        int? photoTypeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// PDF counterpart of <see cref="ExportMatchedFilesToExcelAsync"/>.
    /// </summary>
    Task<byte[]> ExportMatchedFilesToPdfAsync(
        PropertyMediaCategory? category,
        int? photoTypeId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports every matching job row (ignores paging) to an .xlsx workbook.
    /// </summary>
    Task<byte[]> ExportMediaJobsToExcelAsync(
        PropertyMediaJobQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports every matching job row (ignores paging) to a landscape A4 PDF.
    /// </summary>
    Task<byte[]> ExportMediaJobsToPdfAsync(
        PropertyMediaJobQueryParameters queryParameters,
        CancellationToken cancellationToken = default);
}
