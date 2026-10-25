using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Exceptions;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Phase 2a of the Property Revision API: draft editing of the "core property snapshot" group,
/// starting with RevisionPropertyMast. Every write here targets only the Revision* snapshot
/// tables for the revision's editable row (the HISTORY_ONLY row, or the latest period's row for a
/// PERIOD_WISE revision) - the live PropertyMast/PropertyDetails rows are never touched while the
/// revision is DRAFT or CALCULATED (revision_api_rules.txt / REVISION LOGIC.txt section 4).
/// RevisionPropertyDetails and the remaining snapshot tables (Renter/Room/Social/Certificates/
/// Photo/ApplyTaxes) follow in later phases.
/// </summary>
[ApiController]
[Route("api/property-revisions/{revisionId:long}")]
[Authorize]
public class PropertyRevisionSnapshotController : ControllerBase
{
    private readonly IPropertyRevisionSnapshotService _service;
    private readonly ILogger<PropertyRevisionSnapshotController> _logger;
    private readonly IWebHostEnvironment _environment;

    public PropertyRevisionSnapshotController(
        IPropertyRevisionSnapshotService service,
        ILogger<PropertyRevisionSnapshotController> logger,
        IWebHostEnvironment environment)
    {
        _service = service;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>GET api/property-revisions/{revisionId}/property</summary>
    [HttpGet("property")]
    [ProducesResponseType(typeof(ApiResponse<RevisionPropertyMastDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetProperty(long revisionId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.GetPropertyMastAsync(revisionId, cancellationToken);
            return Ok(new ApiResponse<RevisionPropertyMastDto>
            {
                Success = true,
                Message = "Revision property snapshot retrieved.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (NtisPlatformException ex)
        {
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error fetching revision property snapshot RevisionId={RevisionId}. CorrelationId: {CorrelationId}", revisionId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }

    /// <summary>
    /// PUT api/property-revisions/{revisionId}/property
    ///
    /// Full-replace update of the revision's editable RevisionPropertyMast row. Rejected with 400
    /// if the revision is APPROVED/POSTED/CANCELLED. If a tax-relevant field (TaxZoneId, WardId,
    /// PropertyTypeId, CategoryId) actually changes value on a CALCULATED revision, the revision is
    /// silently reset back to DRAFT (surfaced via the response's ResetToDraft flag) - see
    /// REVISION LOGIC.txt section 19.
    /// </summary>
    [HttpPut("property")]
    [ProducesResponseType(typeof(ApiResponse<UpdateRevisionPropertyMastResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateProperty(
        long revisionId,
        [FromBody] UpdateRevisionPropertyMastDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _service.UpdatePropertyMastAsync(revisionId, request, cancellationToken);
            return Ok(new ApiResponse<UpdateRevisionPropertyMastResultDto>
            {
                Success = true,
                Message = result.ResetToDraft
                    ? "Revision property snapshot updated. A tax-relevant field changed, so the revision was reset to DRAFT."
                    : "Revision property snapshot updated.",
                Items = result
            });
        }
        catch (EntityNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (NtisPlatformException ex)
        {
            _logger.LogWarning(ex, "Revision property update rejected for RevisionId={RevisionId}", revisionId);
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Error updating revision property snapshot RevisionId={RevisionId}. CorrelationId: {CorrelationId}", revisionId, correlationId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = _environment.IsDevelopment() ? $"An error occurred: {ex.Message}" : "An error occurred",
                CorrelationId = correlationId
            });
        }
    }
}
