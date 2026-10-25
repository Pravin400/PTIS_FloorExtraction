using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertyMedia;
using NtisPlatform.Application.DTOs.PropertyTaxOperations;
using NtisPlatform.Application.Interfaces.PropertyMedia;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Enums;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Property Media &amp; Document Center API - dashboard stats, gap analysis and bulk
/// media/document operations across properties.
/// </summary>
[ApiController]
[Route("api/PropertyMedia")]
public class PropertyMediaController : ControllerBase
{
    private readonly IPropertyMediaDashboardService _dashboardService;
    private readonly IPropertyMediaExportService _exportService;
    private readonly IPropertyMediaUploadService _uploadService;
    private readonly IPropertyMediaOperationsService _mediaOperationsService;
    private readonly IPropertyMediaDownloadService _downloadService;

    public PropertyMediaController(
        IPropertyMediaDashboardService dashboardService,
        IPropertyMediaExportService exportService,
        IPropertyMediaUploadService uploadService,
        IPropertyMediaOperationsService mediaOperationsService,
        IPropertyMediaDownloadService downloadService)
    {
        _dashboardService = dashboardService;
        _exportService = exportService;
        _uploadService = uploadService;
        _mediaOperationsService = mediaOperationsService;
        _downloadService = downloadService;
    }

    /// <summary>
    /// Gets the top-level dashboard statistics for the Property Media &amp; Document Center screen.
    /// </summary>
    /// <response code="200">Returns the dashboard statistics</response>
    [HttpGet("dashboard-stats")]
    [ProducesResponseType(typeof(ApiResponse<PropertyMediaDashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var stats = await _dashboardService.GetDashboardStatsAsync(ct);

        return Ok(new ApiResponse<PropertyMediaDashboardStatsDto>
        {
            Success = true,
            Message = "Dashboard statistics retrieved successfully",
            Items = stats
        });
    }

    /// <summary>Gets the "Choose What to Upload" Category dropdown for the Upload/Download drawer.</summary>
    /// <response code="200">Returns the category list</response>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(ApiResponse<List<PropertyMediaDropdownOptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        var categories = await _uploadService.GetCategoriesAsync(ct);
        return Ok(new ApiResponse<List<PropertyMediaDropdownOptionDto>>
        {
            Success = true,
            Message = "Categories retrieved successfully",
            Items = categories
        });
    }

    /// <summary>
    /// Gets the Property Subtype dropdown for the Upload/Download drawer, dependent on the
    /// selected <paramref name="category"/> (Photo / Plan / Document) - call this again whenever
    /// the Category selection changes.
    /// </summary>
    /// <response code="200">Returns the subtype list for the given category</response>
    [HttpGet("subtypes")]
    [ProducesResponseType(typeof(ApiResponse<List<PropertyMediaDropdownOptionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubTypes([FromQuery] PropertyMediaCategory? category, CancellationToken ct)
    {
        var subTypes = await _uploadService.GetPropertySubTypesAsync(category, ct);
        return Ok(new ApiResponse<List<PropertyMediaDropdownOptionDto>>
        {
            Success = true,
            Message = "Subtypes retrieved successfully",
            Items = subTypes
        });
    }

    /// <summary>
    /// Gets the list of applicable Property Numbers filtered by Ward(s) and optional From Property No.
    /// </summary>
    /// <response code="200">Returns list of matching property numbers in natural order</response>
    [HttpGet("property-numbers")]
    [ProducesResponseType(typeof(ApiResponse<List<string>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPropertyNumbers(
        [FromQuery] PropertyMediaPropertyNumbersQueryParameters queryParameters,
        CancellationToken ct)
    {
        var propertyNumbers = await _downloadService.GetPropertyNumbersAsync(queryParameters, ct);
        return Ok(new ApiResponse<List<string>>
        {
            Success = true,
            Message = "Property numbers retrieved successfully",
            Items = propertyNumbers
        });
    }

    /// <summary>
    /// Downloads original image files matching the selected Category, PhotoSubType,
    /// Division (Zone), Ward, and optional Property No range (From / To) into a single ZIP file.
    /// Streamed to disk and client to handle large downloads efficiently.
    /// </summary>
    /// <response code="200">Returns the generated ZIP file</response>
    /// <response code="400">Invalid parameters, From Property No &gt; To Property No, or no matching files found in storage</response>
    [HttpGet("download/images")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadImages(
        [FromQuery] PropertyMediaDownloadQueryParameters queryParameters,
        CancellationToken ct)
    {
        try
        {
            var result = await _downloadService.DownloadImagesZipAsync(queryParameters, ct);
            return File(result.ZipStream, "application/zip", result.FileName);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Development-only, step 1 of 2 (pairs with <see cref="ServerBulkUpload"/>): paged preview
    /// of the image files found in the server-configured local import folder
    /// (PropertyMediaDevTools:LocalImportFolder in appsettings.Development.json), each resolved
    /// against the database so Status (Matched/NoMatch/Invalid/Skipped) and property details are
    /// known BEFORE any upload happens - the "Select Files from Server" table. Read-only - does
    /// not touch the database beyond that lookup, and never queues or uploads anything. Once the
    /// user reviews this, call <see cref="ServerBulkUpload"/> to actually queue the upload. Returns 404
    /// outside the Development environment; the folder path is never accepted as request input.
    /// </summary>
    /// <response code="200">Returns the paged preview with folder-wide totals</response>
    /// <response code="404">Not available outside the Development environment</response>
    [HttpGet("Server-imports-Match/preview")]
    [DisableRequestSizeLimit]
    [ProducesResponseType(typeof(ApiResponse<ServerImportPreviewResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PreviewServerImport(
        [FromQuery] int? photoTypeId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _uploadService.GetServerImportImagesAsync(photoTypeId, page, pageSize, ct);

        return Ok(new ApiResponse<ServerImportPreviewResultDto>
        {
            Success = true,
            Message = $"{result.TotalCount} image(s) found, {result.TotalMatched} matched",
            Items = result
        });
    }


    /// <summary>
    /// Gets the "Detailed Coverage" table: one row per active PropertyPhotoType with
    /// Applicable / Available / Missing counts and Coverage percentage, filtered per
    /// <paramref name="queryParameters"/>: Category (Photo/Plan/Document - an exact-match filter,
    /// e.g. from clicking a Gap Analysis stat tile) and SearchTerm (free text against the Category
    /// label or PhotoTypeName) are both optional and combine with AND when both are given. Pass
    /// <paramref name="format"/> (Excel/Pdf) to download the same filtered rows as a file instead
    /// of getting the normal JSON response.
    /// </summary>
    /// <response code="200">Returns the detailed coverage rows, or the exported file if <paramref name="format"/> is given</response>
    [HttpGet("detailed-coverage-list")]
    [ProducesResponseType(typeof(ApiResponse<List<PropertyMediaCoverageRowDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDetailedCoverage(
        [FromQuery] PropertyMediaCoverageQueryParameters queryParameters,
        [FromQuery] PropertyMediaExportFormat? format,
        CancellationToken ct)
    {
        if (format is not null)
        {
            var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            if (format == PropertyMediaExportFormat.Pdf)
            {
                var pdfBytes = await _exportService.ExportDetailedCoverageToPdfAsync(queryParameters, ct);
                return File(pdfBytes, "application/pdf", $"PropertyMedia_DetailedCoverage_{timestamp}.pdf");
            }

            var excelBytes = await _exportService.ExportDetailedCoverageToExcelAsync(queryParameters, ct);
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"PropertyMedia_DetailedCoverage_{timestamp}.xlsx");
        }

        var rows = await _dashboardService.GetDetailedCoverageAsync(queryParameters, ct);

        var totalCount = rows.Count;
        var pagedRows = queryParameters.PageSize == -1
            ? rows
            : rows.Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize).Take(queryParameters.PageSize).ToList();

        return Ok(new ApiResponse<List<PropertyMediaCoverageRowDto>>
        {
            Success = true,
            Message = $"{pagedRows.Count} coverage row(s) retrieved successfully",
            Items = pagedRows,
            TotalCount = totalCount
        });
    }

    /// <summary>
    /// "View" drill-down for a Detailed Coverage row: lists the active properties that are
    /// missing at least one active PropertyPhoto of <paramref name="photoTypeId"/> - or, when
    /// <paramref name="photoTypeId"/> is omitted, of ANY active PropertyPhotoType - paged and
    /// filtered per <paramref name="queryParameters"/>: ZoneId/WardId/PropertyTypeId/
    /// WorkflowStageId are optional exact-match filters (dropdown options come from the existing
    /// /api/Zone, /api/Ward, /api/PropertyTypeMaster and /api/PropertyWorkflowStageMaster
    /// endpoints), and SearchTerm is an optional free-text match against PropertyNo, OwnerName,
    /// ZoneNo, WardNo or PropertyType - all combine with AND. Returns the total gap count (after
    /// every filter) plus the requested page of rows. Pass <paramref name="format"/>
    /// (Excel/Pdf) to download every matching row (ignoring paging) as a file instead of getting
    /// the normal JSON response.
    /// </summary>
    /// <response code="200">Returns the paged list of missing properties, or the exported file if <paramref name="format"/> is given</response>
    [HttpGet("detailed-coverage/missing-properties")]
    [ProducesResponseType(typeof(ApiResponse<PropertyMediaGapListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMissingPropertiesByPhotoType(
        [FromQuery] int? photoTypeId,
        [FromQuery] PropertyMediaGapQueryParameters queryParameters,
        [FromQuery] PropertyMediaExportFormat? format,
        CancellationToken ct)
    {
        if (format is not null)
        {
            var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            if (format == PropertyMediaExportFormat.Pdf)
            {
                var pdfBytes = await _exportService.ExportMissingPropertiesToPdfAsync(photoTypeId, queryParameters, ct);
                return File(pdfBytes, "application/pdf", $"PropertyMedia_MissingProperties_{timestamp}.pdf");
            }

            var excelBytes = await _exportService.ExportMissingPropertiesToExcelAsync(photoTypeId, queryParameters, ct);
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"PropertyMedia_MissingProperties_{timestamp}.xlsx");
        }

        var result = await _dashboardService.GetMissingPropertiesByPhotoTypeAsync(photoTypeId, queryParameters, ct);

        return Ok(new ApiResponse<PropertyMediaGapListDto>
        {
            Success = true,
            Message = $"{result.GapRecords} missing property record(s) found",
            Items = result,
            TotalCount = result.GapRecords
        });
    }


    /// <summary>
    /// Development-only: re-scans the configured local import folder and queues every MATCHED
    /// file as a bulk-import job tagged with <paramref name="request"/>'s PhotoTypeId - files that
    /// don't match are never queued. Returns immediately with the JobCode - the
    /// NtisPlatform.Worker process picks the job up and uploads asynchronously.
    /// </summary>
    /// <response code="200">Job queued successfully</response>
    /// <response code="400">Invalid PhotoTypeId, or no importable files found</response>
    /// <response code="404">Not available outside the Development environment</response>
    [HttpPost("Server-bulk-upload")]
    [DisableRequestSizeLimit]
    [ProducesResponseType(typeof(ApiResponse<ExecuteMediaJobResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ServerBulkUpload([FromBody] ExecuteMediaJobRequestDto request, CancellationToken ct)
    {
        try
        {
            var result = await _mediaOperationsService.BulkUploadAsync(request, BuildContext(), ct);
            return Ok(new ApiResponse<ExecuteMediaJobResponseDto>
            {
                Success = true,
                Message = "Upload started successfully. Processing in background.",
                Items = result
            });
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// One or more files the user picks from their own PC (not the server-side local import
    /// folder, and not Development-only - this is a normal upload). Resolves the same
    /// Ward+Property match the local-folder flow uses for every selected file, inserts a
    /// PropertyMediaJob (AwaitingConfirmation) and one detail row per file (matched or not,
    /// persisted to the database - not just returned in the response), saves every file to disk
    /// under that job's folder, and returns the new JobId together with the match preview for
    /// every selected file. Nothing is queued yet - call <see cref="ExecuteLocalBulkUpload"/> with
    /// the returned JobId to actually queue every Matched file for upload.
    /// </summary>
    /// <response code="200">Returns the job id and one match-preview result per selected file</response>
    /// <response code="400">No file selected, or invalid PhotoTypeId</response>
    [HttpPost("Local-Imports-Match")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue, ValueLengthLimit = int.MaxValue, ValueCountLimit = int.MaxValue)]
    [ProducesResponseType(typeof(ApiResponse<PropertyMediaBrowsePreviewResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PreviewLocalImport(
        [FromForm] int photoTypeId, [FromForm] string? remarks,
        List<IFormFile> files, CancellationToken ct)
    {
        if (files is null || files.Count == 0 || files.All(f => f.Length == 0))
        {
            return BadRequest(new ApiResponse<object> { Success = false, Message = "No file was selected." });
        }

        try
        {
            var result = await _mediaOperationsService.PreviewBrowsedFilesAsync(
                files, photoTypeId, remarks, BuildContext(), ct);

            return Ok(new ApiResponse<PropertyMediaBrowsePreviewResultDto>
            {
                Success = true,
                Message = $"{result.TotalMatched} of {result.TotalCount} file(s) matched",
                Items = result
            });
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// GET re-fetch of a browse-upload job's match-preview list (from <see cref="PreviewLocalImport"/>),
    /// for redisplaying/paginating the same matched/unmatched list on the UI without re-uploading
    /// files - e.g. after a page refresh.
    /// </summary>
    /// <response code="200">Returns the paged match-preview result</response>
    /// <response code="404">PreviewId does not resolve to an existing browse session or job</response>
    [HttpGet("Local-Imports-Match/preview/{previewId}")]
    [ProducesResponseType(typeof(ApiResponse<PropertyMediaBrowsePreviewResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLocalImportPreview(
        string previewId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var result = await _mediaOperationsService.GetBrowsedPreviewAsync(previewId, page, pageSize, ct);
        if (result is null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"No browse-upload preview was found for PreviewId {previewId}."
            });
        }

        return Ok(new ApiResponse<PropertyMediaBrowsePreviewResultDto>
        {
            Success = true,
            Message = $"{result.TotalMatched} of {result.TotalCount} file(s) matched",
            Items = result
        });
    }

    /// <summary>
    /// Confirms a browse-upload job (from <see cref="PreviewLocalImport"/>) and queues EVERY
    /// currently-Matched file in it, creating the job and flipping it to Pending.
    /// </summary>
    /// <response code="200">Returns the queued job</response>
    /// <response code="400">No matched files available for this job, or the job isn't awaiting confirmation</response>
    /// <response code="404">PreviewId does not resolve to an existing browse session or job</response>
    [HttpPost("local-bulk-upload")]
    [ProducesResponseType(typeof(ApiResponse<ExecuteMediaJobResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExecuteLocalBulkUpload([FromBody] ExecuteBrowseMediaJobRequestDto request, CancellationToken ct)

    {
        var previewId = !string.IsNullOrWhiteSpace(request.PreviewId)
            ? request.PreviewId
            : request.JobId?.ToString();

        if (string.IsNullOrWhiteSpace(previewId))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "PreviewId is required."
            });
        }

        try
        {
            var result = await _mediaOperationsService.ExecuteBrowsedUploadAsync(
                previewId, BuildContext(), ct);

            if (result is null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = $"No browse-upload preview was found for PreviewId {previewId}."
                });
            }

            return Ok(new ApiResponse<ExecuteMediaJobResponseDto>
            {
                Success = true,
                Message = "Upload started successfully. Processing in background.",
                Items = result
            });
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Paged list of Property Media bulk-import jobs, newest first.
    /// Pass format=Excel or format=Pdf to download the full list as a file.
    /// </summary>
    /// <response code="200">Returns the paged job list, or the exported file if format is given</response>
    [HttpGet("jobs-History")]
    [ProducesResponseType(typeof(ApiResponse<List<PropertyMediaJobSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMediaJobs(
        [FromQuery] PropertyMediaJobQueryParameters queryParameters,
        [FromQuery] PropertyMediaExportFormat? format,
        CancellationToken ct = default)
    {
        if (format is not null)
        {
            var timestamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            if (format == PropertyMediaExportFormat.Pdf)
            {
                var pdfBytes = await _exportService.ExportMediaJobsToPdfAsync(queryParameters, ct);
                return File(pdfBytes, "application/pdf", $"PropertyMedia_Jobs_{timestamp}.pdf");
            }

            var excelBytes = await _exportService.ExportMediaJobsToExcelAsync(queryParameters, ct);
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"PropertyMedia_Jobs_{timestamp}.xlsx");
        }

        var result = await _dashboardService.GetMediaJobsAsync(queryParameters, ct);
        return Ok(new ApiResponse<List<PropertyMediaJobSummaryDto>>
        {
            Success = true,
            Message = $"{result.Items.Count} job(s) retrieved successfully",
            Items = result.Items,
            TotalCount = result.TotalCount
        });
    }

    /// <summary>
    /// Gets Status, JobId, and JobCode from PTIS.PropertyMediaJob to check if a job is completed or still running.
    /// </summary>
    /// <param name="jobId">The PropertyMediaJob ID</param>
    /// <param name="ct">Cancellation token</param>
    /// <response code="200">Returns the job status details</response>
    /// <response code="404">Job not found</response>
    [HttpGet("job-status/{jobId}")]
    [ProducesResponseType(typeof(ApiResponse<ExecuteMediaJobResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetJobStatus(int jobId, CancellationToken ct = default)

    {
        var result = await _mediaOperationsService.GetJobStatusAsync(jobId, ct);
        if (result is null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Property Media job with ID {jobId} was not found."
            });
        }

        return Ok(new ApiResponse<ExecuteMediaJobResponseDto>
        {
            Success = true,
            Message = $"Job {result.JobCode} is currently '{result.Status}'",
            Items = result
        });
    }

    private OperationContext BuildContext()
    {
        var userName = User.FindFirst("name")?.Value ?? User.Identity?.Name;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();
        return new OperationContext(GetUserId(), userName, role, ip, userAgent);
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
            throw new UnauthorizedAccessException("Valid user identification is required.");
        return id;
    }
}
