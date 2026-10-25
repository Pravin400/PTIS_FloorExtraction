using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.PropertyBulkUpdate;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Standalone controller for bulk-updating property data across multiple properties by their IDs.
/// Single endpoint handles owner, occupier, contact, assessment, and photo updates in one request.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UpdateIdWiseController : ControllerBase
{
    private readonly IPropertyBulkUpdateService _service;
    private readonly ILogger<UpdateIdWiseController> _logger;

    public UpdateIdWiseController(
        IPropertyBulkUpdateService service,
        ILogger<UpdateIdWiseController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Updates owner, occupier, contact, assessment, and photo details
    /// across multiple properties in a single request.
    /// Only non-null fields in the payload are applied; null fields are skipped.
    /// </summary>
    /// <param name="dto">Payload containing property IDs and fields to update.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Properties updated successfully.</response>
    /// <response code="400">Invalid payload or no updatable fields provided.</response>
    /// <response code="401">Caller is not authenticated.</response>
    /// <response code="404">No active properties found for the given IDs.</response>
    [HttpPut("Update-Id-Wise-Details")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateIdWiseDetails([FromBody] UpdatePropertyIdWiseDetailsDto dto, CancellationToken ct)
    {
        if (!dto.HasAnyField())
        {
            throw new ValidationException(nameof(dto), "At least one field must be provided for update.", OperationType.Update);
        }

        var result = await _service.UpdateIdWiseDetailsAsync(dto, dto.UpdatedBy ?? 0, ct);
        return Ok(result);
    }
}
