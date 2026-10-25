using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Models;

namespace NtisPlatform.Api.Controllers;

public partial class PropertyController
{
    /// <summary>
    /// Retrieves nearest properties relative to the surveyor's current latitude and longitude within a 2 km range (default top 10).
    /// </summary>
    /// <param name="queryParameters">Query parameters containing surveyor's Latitude, Longitude, optional RadiusInKm, Limit, WardId, and WardNo.</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>List of nearby properties with calculated distance from the surveyor</returns>
    /// <response code="200">Nearest properties fetched successfully</response>
    /// <response code="400">Invalid query parameters or coordinates out of range</response>
    [HttpGet("nearest-properties")]
    [ProducesResponseType(typeof(ApiResponse<List<NearestPropertyDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<NearestPropertyDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetNearestProperties(
        [FromQuery] NearestPropertiesQueryParameters queryParameters,
        CancellationToken ct)
    {
        try
        {
            if (queryParameters == null)
            {
                return BadRequest(new ApiResponse<List<NearestPropertyDto>>
                {
                    Success = false,
                    Message = "Query parameters are required"
                });
            }

            if (queryParameters.Latitude < -90.0 || queryParameters.Latitude > 90.0)
            {
                return BadRequest(new ApiResponse<List<NearestPropertyDto>>
                {
                    Success = false,
                    Message = "Latitude must be between -90 and 90 degrees"
                });
            }

            if (queryParameters.Longitude < -180.0 || queryParameters.Longitude > 180.0)
            {
                return BadRequest(new ApiResponse<List<NearestPropertyDto>>
                {
                    Success = false,
                    Message = "Longitude must be between -180 and 180 degrees"
                });
            }

            var result = await _propertyService.GetNearestPropertiesAsync(queryParameters, ct);

            return Ok(new ApiResponse<List<NearestPropertyDto>>
            {
                Success = true,
                Message = "Nearest properties fetched successfully",
                Items = result,
                TotalCount = result.Count
            });
        }
        catch (NtisPlatform.Application.Exceptions.ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error in nearest-properties endpoint");
            return BadRequest(new ApiResponse<List<NearestPropertyDto>>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error in nearest-properties endpoint");
            return BadRequest(new ApiResponse<List<NearestPropertyDto>>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving nearest properties for Latitude: {Latitude}, Longitude: {Longitude}",
                queryParameters?.Latitude, queryParameters?.Longitude);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ApiResponse<List<NearestPropertyDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving nearest properties"
                });
        }
    }
}
