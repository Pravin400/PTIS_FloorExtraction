using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Models;
using System.Security.Claims;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Property Individual API — retrieves and updates individual property details
/// (Basic Details, KYC Information, Individual-level Additional Revenue).
/// Business logic lives in <c>PropertyIndividualService</c>;
/// exception-to-HTTP mapping is handled by <c>PropertyApiExceptionFilter</c>.
/// </summary>
public partial class PropertyController
{
    /// <summary>
    /// Retrieves individual property details combining Basic Details, KYC Information,
    /// and Individual-level Additional Revenue.
    /// </summary>
    /// <param name="propertyId">PropertyMast Id.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Returns individual property details.</response>
    /// <response code="404">Property not found for the given propertyId.</response>
    /// <response code="500">Internal server error.</response>
    [HttpGet("{propertyId:int}/individual")]
    [ProducesResponseType(typeof(ApiResponse<PropertyIndividualDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetIndividualDetails(int propertyId, CancellationToken ct)
    {
        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Retrieving individual property details for PropertyId={PropertyId}", propertyId);

        var result = await _propertyIndividualService.GetIndividualDetailsAsync(propertyId, ct);

        if (result is null)
        {
            _logger.LogWarning("Individual property details not found for PropertyId={PropertyId}", propertyId);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"No individual property found for propertyId {propertyId}."
            });
        }

        return Ok(new ApiResponse<PropertyIndividualDto>
        {
            Success = true,
            Message = "Record fetched successfully",
            Items = result
        });
    }

    /// <summary>
    /// Updates editable fields for an individual property (partial update via PATCH).
    /// Supported for both PATCH and PUT methods.
    /// </summary>
    /// <param name="propertyId">PropertyMast Id (route).</param>
    /// <param name="dto">Payload containing the relevant fields to update.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <response code="200">Individual property details updated successfully.</response>
    /// <response code="400">Request payload is missing or no fields were provided.</response>
    /// <response code="401">Caller is not authenticated.</response>
    /// <response code="404">No active property found for the given propertyId.</response>
    /// <response code="423">Property is currently locked and cannot be modified.</response>
    /// <response code="500">Internal server error.</response>
    [Authorize]
    [HttpPatch("{propertyId:int}/individual")]
    [HttpPut("{propertyId:int}/individual")]
    [ProducesResponseType(typeof(ApiResponse<PropertyIndividualDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status423Locked)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateIndividualDetails(
        [FromRoute] int propertyId,
        [FromBody] UpdatePropertyIndividualDto dto,
        CancellationToken ct)
    {
        if (dto is null || !dto.HasAnyField())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Request body is required and must contain at least one field to update."
            });
        }

        int userId;
        try
        {
            userId = GetCurrentUserId();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Message = "Valid user authorization claim is required."
            });
        }

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
                "Individual property update requested: PropertyId={PropertyId}, ActorUserId={ActorUserId}",
                propertyId, userId);

        var outcome = await _propertyIndividualService.UpdateIndividualDetailsAsync(propertyId, dto, userId, ct);

        if (outcome == TopSectionUpdateOutcome.PropertyNotFound)
        {
            _logger.LogWarning("Individual property update failed: PropertyId={PropertyId} not found", propertyId);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"No active property found for propertyId {propertyId}."
            });
        }

        if (outcome == TopSectionUpdateOutcome.PropertyLocked)
        {
            _logger.LogWarning("Individual property update failed: PropertyId={PropertyId} is locked", propertyId);
            return StatusCode(StatusCodes.Status423Locked, new ApiResponse<object>
            {
                Success = false,
                Message = "Property is currently locked and cannot be modified."
            });
        }

        if (outcome == TopSectionUpdateOutcome.NoFieldsProvided)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "At least one valid field must be provided for update."
            });
        }

        if (outcome != TopSectionUpdateOutcome.Success)
        {
            _logger.LogError(
                "Individual property update failed with unexpected outcome: PropertyId={PropertyId}, Outcome={Outcome}",
                propertyId, outcome);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An unexpected error occurred while updating individual property details."
            });
        }

        var updatedDetails = await _propertyIndividualService.GetIndividualDetailsAsync(propertyId, ct);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
                "Individual property update completed: PropertyId={PropertyId}, ActorUserId={ActorUserId}",
                propertyId, userId);

        return Ok(new ApiResponse<PropertyIndividualDto>
        {
            Success = true,
            Message = "Individual property details updated successfully.",
            Items = updatedDetails
        });
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var id) || id <= 0)
            throw new UnauthorizedAccessException("Valid user identification is required.");
        return id;
    }
}
