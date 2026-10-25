using NtisPlatform.Application.DTOs.PropertyTaxOperations;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Orchestrates the Property Tax Operations screen: initial load, scope/eligibility evaluation,
/// synchronous "Add Tax" execution (reusing the rateable-value engine), and audit/monitor reads.
/// </summary>
public interface IPropertyTaxOperationsService
{
    Task<OperationsInitDto> GetInitAsync(int actingUserId, int? financeYearId = null, CancellationToken cancellationToken = default);

    Task<EligibleCountResponseDto> GetEligibleCountAsync(
        EligibleCountRequestDto request, int actingUserId, CancellationToken cancellationToken = default);

    Task<OperationPreviewResponseDto> GetPreviewAsync(
        OperationPreviewRequestDto request, int actingUserId, CancellationToken cancellationToken = default);

    Task<ExecuteOperationResponseDto> ExecuteAsync(
        ExecuteOperationRequestDto request, OperationContext context, CancellationToken cancellationToken = default);

    Task<JobStatusDto> GetJobStatusAsync(
        long jobId, int actingUserId, CancellationToken cancellationToken = default);

    Task<PagedResult<JobPropertyResultDto>> GetJobPropertiesAsync(
        long jobId, JobPropertiesQueryParameters query, int actingUserId, CancellationToken cancellationToken = default);

    Task<PagedResult<JobAuditDto>> GetAuditListAsync(
        OperationAuditQueryParameters query, int actingUserId, CancellationToken cancellationToken = default);

    Task<JobAuditDetailDto> GetAuditDetailAsync(
        long jobId, JobPropertiesQueryParameters queryParams, int actingUserId, CancellationToken cancellationToken = default);

    Task<ImportTemplateDto> GetImportTemplateAsync(CancellationToken cancellationToken = default);

    Task ProcessJobAsync(long jobId, CancellationToken cancellationToken = default);

    Task WritePropertiesCsvToStreamAsync(Stream outputStream, string statusFilter, int? financeYearId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Streams a CSV file for the given scoped preview request filtered by downloadType
    /// (all | eligible | skipped). The stream is written with a UTF-8 BOM so Excel opens it correctly.
    /// </summary>
    Task WritePreviewExportCsvToStreamAsync(Stream outputStream, OperationPreviewRequestDto request, string downloadType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Aggregates currently-unresolved PropertyTaxRecalcFlag rows for the given finance year — backs
    /// the Add Taxes "master data changed" banner. Returns AffectedCount = 0 when there are none.
    /// </summary>
    Task<MasterDataChangeSummaryDto> GetMasterDataChangeSummaryAsync(int financeYearId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Paginated list of properties currently flagged for recalculation for the given finance year —
    /// backs the "View Properties" modal opened from the master-data-change banner.
    /// </summary>
    Task<PagedResult<MasterDataChangeAffectedPropertyDto>> GetMasterDataChangeAffectedPropertiesAsync(
        int financeYearId, JobPropertiesQueryParameters queryParams, CancellationToken cancellationToken = default);

    /// <summary>
    /// Streams the full (unpaginated) affected-properties list as CSV, for the modal's Export CSV button.
    /// </summary>
    Task WriteMasterDataChangeExportCsvToStreamAsync(Stream outputStream, int financeYearId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves a PENDING PTIS.MasterDataChangeBatch (populated by PTIS.usp_ProcessCdcChanges) into
    /// PropertyTaxRecalcFlag rows: figures out which properties are affected by the underlying
    /// master-data change, narrows to properties already taxed (TransMast) for the relevant
    /// calculation method, and flags each affected (PropertyId, FinanceYearId) pair that isn't
    /// already flagged. Sets the batch's own Status/TotalRecords/ProcessedRecords/CompletedAt when
    /// done (COMPLETED on success, FAILED with ErrorDetail on any exception — never rethrows).
    /// </summary>
    Task ResolveMasterDataChangeBatchAsync(long batchId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Pre-warms the Property Tax Summary Counts cache (e.g. at startup or after batch job completion).
    /// </summary>
    Task WarmupSummaryCountsAsync(int? financeYearId = null, CancellationToken cancellationToken = default);
}
