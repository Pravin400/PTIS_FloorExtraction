using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Exceptions;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Property Revision API: open a revision, capture a snapshot of the (separately-edited) live
/// property state, and post it. Workflow: Create (opens DRAFT) -&gt; caller edits live
/// PropertyMast/PropertyDetails and recalculates RV/CV through the normal property API -&gt;
/// CaptureSnapshot (write-once) -&gt; Post (finalizes, marks POSTED + IsCurrent). This API never
/// edits live PropertyMast/PropertyDetails itself.
/// </summary>
[ApiController]
[Route("api")]
[Authorize]
public class PropertyRevisionController : ControllerBase
{
    private readonly IPropertyRevisionService _service;
    private readonly ILogger<PropertyRevisionController> _logger;
    private readonly IWebHostEnvironment _environment;

    public PropertyRevisionController(
        IPropertyRevisionService service,
        ILogger<PropertyRevisionController> logger,
        IWebHostEnvironment environment)
    {
        _service = service;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// POST api/properties/{propertyId}/revisions
    ///
    /// Opens a new DRAFT revision for the property (HISTORY_ONLY or PERIOD_WISE per
    /// <paramref name="request"/>.CalculationScope). Never modifies the live property.
    /// </summary>
    [HttpPost("properties/{propertyId:int}/revisions")]
    [ProducesResponseType(typeof(ApiResponse<PropertyRevisionCreatedDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        int propertyId,
        [FromBody] CreatePropertyRevisionDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _service.CreateAsync(propertyId, request, cancellationToken);
            return Ok(new ApiResponse<PropertyRevisionCreatedDto>
            {
                Success = true,
                Message = "Revision created.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (RevisionConflictException ex)
        {
            return Conflict(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (NtisPlatformException ex)
        {
            _logger.LogWarning(ex, "Revision creation rejected for PropertyId={PropertyId}", propertyId);
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error creating revision for PropertyId={PropertyId}. CorrelationId: {CorrelationId}", propertyId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }

    /// <summary>
    /// POST api/properties/{propertyId}/revisions/baseline
    ///
    /// Saves the CURRENT (pre-change) details and tax as the initial assessment for the finance
    /// year. Call before changing the property or its tax. Safe to call repeatedly (idempotent).
    /// </summary>
    [HttpPost("properties/{propertyId:int}/revisions/baseline")]
    [ProducesResponseType(typeof(ApiResponse<RevisionBaselineDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> EnsureBaseline(
        int propertyId,
        [FromBody] EnsureRevisionBaselineDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _service.EnsureBaselineAsync(propertyId, request, cancellationToken);
            return Ok(new ApiResponse<RevisionBaselineDto>
            {
                Success = true,
                Message = result.Created ? "Initial assessment saved." : "Initial assessment already exists.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (RevisionConflictException ex)
        {
            return Conflict(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (NtisPlatformException ex)
        {
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error saving baseline for PropertyId={PropertyId}. CorrelationId: {CorrelationId}", propertyId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }

    /// <summary>
    /// GET api/properties/{propertyId}/revisions
    ///
    /// Paged revision history for the property, newest revision first.
    /// </summary>
    [HttpGet("properties/{propertyId:int}/revisions")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PropertyRevisionSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetHistory(
        int propertyId,
        [FromQuery] PropertyRevisionQueryParameters query,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.GetHistoryAsync(propertyId, query, cancellationToken);
            return Ok(new ApiResponse<PagedResult<PropertyRevisionSummaryDto>>
            {
                Success = true,
                Message = "Revision history retrieved.",
                Items = result,
                TotalCount = result.TotalCount
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error fetching revision history for PropertyId={PropertyId}. CorrelationId: {CorrelationId}", propertyId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }

    /// <summary>
    /// GET api/property-revisions/{revisionId}
    ///
    /// Revision header + periods (revision_api_rules.txt section 5).
    /// </summary>
    [HttpGet("property-revisions/{revisionId:long}")]
    [ProducesResponseType(typeof(ApiResponse<PropertyRevisionDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Get(long revisionId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.GetAsync(revisionId, cancellationToken);
            return Ok(new ApiResponse<PropertyRevisionDetailsDto>
            {
                Success = true,
                Message = "Revision retrieved.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error fetching revision RevisionId={RevisionId}. CorrelationId: {CorrelationId}", revisionId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }

    /// <summary>
    /// POST api/property-revisions/{revisionId}/capture-snapshot
    ///
    /// Copies the CURRENT LIVE property state into the revision's snapshot tables. Call this after
    /// editing the live property through the normal property API and re-running RV/CV calculation
    /// - this endpoint does not touch live data itself, it only records what is live right now.
    /// Write-once per revision/period: a second call for the same pair returns 409.
    /// </summary>
    [HttpPost("property-revisions/{revisionId:long}/capture-snapshot")]
    [ProducesResponseType(typeof(ApiResponse<RevisionSnapshotCapturedDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CaptureSnapshot(
        long revisionId,
        [FromBody] CaptureRevisionSnapshotDto? request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.CaptureSnapshotAsync(revisionId, request ?? new CaptureRevisionSnapshotDto(), cancellationToken);
            return Ok(new ApiResponse<RevisionSnapshotCapturedDto>
            {
                Success = true,
                Message = "Snapshot captured.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (RevisionConflictException ex)
        {
            _logger.LogWarning(ex, "Snapshot capture rejected for RevisionId={RevisionId}", revisionId);
            return Conflict(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (NtisPlatformException ex)
        {
            _logger.LogWarning(ex, "Snapshot capture rejected for RevisionId={RevisionId}", revisionId);
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error capturing snapshot for RevisionId={RevisionId}. CorrelationId: {CorrelationId}", revisionId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }

    /// <summary>
    /// POST api/property-revisions/{revisionId}/approve
    ///
    /// Approves a revision in CALCULATED status. Revisions must be approved before they can be posted.
    /// </summary>
    [HttpPost("property-revisions/{revisionId:long}/approve")]
    [ProducesResponseType(typeof(ApiResponse<PropertyRevisionDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Approve(long revisionId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.ApproveAsync(revisionId, cancellationToken);
            return Ok(new ApiResponse<PropertyRevisionDetailsDto>
            {
                Success = true,
                Message = "Revision approved successfully.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (RevisionConflictException ex)
        {
            _logger.LogWarning(ex, "Approve rejected for RevisionId={RevisionId}", revisionId);
            return Conflict(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (NtisPlatformException ex)
        {
            _logger.LogWarning(ex, "Approve validation failed for RevisionId={RevisionId}", revisionId);
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error approving RevisionId={RevisionId}. CorrelationId: {CorrelationId}", revisionId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }

    /// <summary>
    /// POST api/property-revisions/{revisionId}/post
    ///
    /// Finalizes the approved revision: synchronizes approved property snapshot changes to live PropertyMast,
    /// traces or replaces live PolicyTaxDetails/TransMast from the captured snapshot(s), marks it POSTED
    /// and IsCurrent for its property + finance year. Immutable afterwards.
    /// </summary>
    [HttpPost("property-revisions/{revisionId:long}/post")]
    [ProducesResponseType(typeof(ApiResponse<RevisionPostedDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Post(long revisionId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.PostAsync(revisionId, cancellationToken);
            return Ok(new ApiResponse<RevisionPostedDto>
            {
                Success = true,
                Message = "Revision posted.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (RevisionConflictException ex)
        {
            _logger.LogWarning(ex, "Post rejected for RevisionId={RevisionId}", revisionId);
            return Conflict(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (NtisPlatformException ex)
        {
            _logger.LogWarning(ex, "Post rejected for RevisionId={RevisionId}", revisionId);
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error posting revision RevisionId={RevisionId}. CorrelationId: {CorrelationId}", revisionId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }
}
