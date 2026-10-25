using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Property Aggregate API - Partial controller for mapped old property details
/// </summary>
public partial class PropertyController
{
    /// <summary>
    /// Retrieves all mapped old properties for a merged property.
    /// </summary>
    /// <param name="queryParameters">The query parameters including PropertyId, pagination, and sorting</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Mapped old property details</returns>
    /// <response code="200">Returns the mapped old properties</response>
    /// <response code="404">Property not found</response>
    [HttpGet("mapped-old-properties")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MappedOldPropertyMastDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MappedOldPropertyMastDto>>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMappedOldProperties([FromQuery] MappedOldPropertyQueryParameters queryParameters, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _propertyService.GetMappedOldPropertyDetailsAsync(queryParameters, cancellationToken);

            if (result?.TotalCount == 0 || result == null)
            {
                return NotFound(new ApiResponse<PagedResult<MappedOldPropertyMastDto>>
                {
                    Success = false,
                    Message = $"No mapped old properties found for Property ID {queryParameters.PropertyId}."
                });
            }

            return Ok(new ApiResponse<PagedResult<MappedOldPropertyMastDto>>
            {
                Success = true,
                Message = "Mapped old properties retrieved successfully.",
                Items = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while retrieving mapped old properties for Property ID {PropertyId}.", queryParameters.PropertyId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<PagedResult<MappedOldPropertyMastDto>>
            {
                Success = false,
                Message = "An unexpected error occurred while retrieving mapped old properties."
            });
        }
    }
}
