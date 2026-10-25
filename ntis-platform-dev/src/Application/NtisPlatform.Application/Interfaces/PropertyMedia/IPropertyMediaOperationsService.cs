using Microsoft.AspNetCore.Http;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.DTOs.PropertyTaxOperations;

namespace NtisPlatform.Application.Interfaces.PropertyMedia;

/// <summary>
/// Bulk Property Media import job: queues a job from the controller (<see cref="BulkUploadAsync"/>)
/// and processes it batch-by-batch from the Worker (<see cref="ProcessJobAsync"/>), mirroring
/// the Property Tax Job Processor pattern (<c>IPropertyTaxOperationsService</c>).
/// </summary>
public interface IPropertyMediaOperationsService
{
    /// <summary>
    /// Validates the request, scans the configured local import folder, and inserts a
    /// <c>Pending</c> <c>PropertyMediaJob</c> row. Returns immediately — the actual matching and
    /// upload happen later in <see cref="ProcessJobAsync"/>, picked up by the Worker.
    /// </summary>
    Task<ExecuteMediaJobResponseDto> BulkUploadAsync(
        ExecuteMediaJobRequestDto request, OperationContext context, CancellationToken cancellationToken = default);

    /// <summary>
    /// Called by the Worker after it claims a job <c>InProgress</c>. Materializes one detail row
    /// per file (first run only), then processes rows sequentially in batches, matching each
    /// file's Ward/Property and uploading via the existing PropertyPhoto upload pipeline.
    /// </summary>
    Task ProcessJobAsync(int jobId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Preview step for files the user picked via Browse: resolves the same Ward+Property match
    /// the folder-scan flow uses for every selected file, then inserts a
    /// <c>PropertyMediaJob</c> (Status=AwaitingConfirmation) and one <c>PropertyMediaJobDetail</c>
    /// row per file (Matched files get Status=Pending, others get NoMatch/Invalid) and saves every
    /// file to disk under that job's folder (see <c>IPropertyMediaBrowseSessionStorage</c>).
    /// Nothing is queued for upload yet - call <see cref="ExecuteBrowsedUploadAsync"/> with the
    /// returned JobId to do that.
    /// </summary>
    Task<PropertyMediaBrowsePreviewResultDto> PreviewBrowsedFilesAsync(
        IReadOnlyList<IFormFile> files, int photoTypeId, string? remarks,
        OperationContext context, CancellationToken cancellationToken = default);

    /// <summary>
    /// GET-friendly re-fetch of a browse-upload job's match-preview list (e.g. for the UI to
    /// redisplay/paginate without re-uploading) - reads straight from the
    /// <c>PropertyMediaJobDetail</c> rows <see cref="PreviewBrowsedFilesAsync"/> already persisted
    /// for <paramref name="jobId"/>. Returns null if <paramref name="jobId"/> doesn't resolve to an
    /// existing browse-upload job.
    /// </summary>
    Task<PropertyMediaBrowsePreviewResultDto?> GetBrowsedPreviewAsync(
        string previewId, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<PropertyMediaBrowsePreviewResultDto?> GetBrowsedPreviewAsync(
        int jobId, int page, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>
    /// Browse-upload counterpart to <see cref="BulkUploadAsync"/>: confirms a browse-upload job
    /// (from <see cref="PreviewBrowsedFilesAsync"/>) and queues EVERY currently-Matched(=Pending)
    /// detail row in it.
    /// </summary>
    Task<ExecuteMediaJobResponseDto?> ExecuteBrowsedUploadAsync(
        string previewId, OperationContext context, CancellationToken cancellationToken = default);

    Task<ExecuteMediaJobResponseDto?> ExecuteBrowsedUploadAsync(
        int jobId, OperationContext context, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets Status, JobId, and JobCode from PTIS.PropertyMediaJob for checking if a job is completed or still running.
    /// </summary>
    Task<ExecuteMediaJobResponseDto?> GetJobStatusAsync(int jobId, CancellationToken cancellationToken = default);
}
