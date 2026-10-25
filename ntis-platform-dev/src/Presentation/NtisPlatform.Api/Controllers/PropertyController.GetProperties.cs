using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

public partial class PropertyController
{
    /// <summary>
    /// Retrieves property records filtered by ward, optional property number range, optional partition number, merge status flag, search text, and user survey visit info with pagination.
    /// </summary>
    /// <param name="queryParameters">Query parameters containing WardNo, FromPropertyNo, ToPropertyNo, PartitionNo, Flag, SearchText, Pagination parameters, and UserId</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Paged list of property records matching the filter criteria</returns>
    /// <response code="200">Records fetched successfully</response>
    /// <response code="400">Invalid query parameters</response>
    [HttpGet("get-properties")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<GetPropertiesItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<GetPropertiesItemDto>>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetProperties(
        [FromQuery] GetPropertiesQueryParameters queryParameters,
        CancellationToken ct)
    {
        try
        {
            if (queryParameters == null)
            {
                return BadRequest(new ApiResponse<PagedResult<GetPropertiesItemDto>>
                {
                    Success = false,
                    Message = "Query parameters are required"
                });
            }

            if (string.IsNullOrWhiteSpace(queryParameters.WardNo))
            {
                return BadRequest(new ApiResponse<PagedResult<GetPropertiesItemDto>>
                {
                    Success = false,
                    Message = "wardNo is required"
                });
            }

            if (queryParameters.UserId <= 0)
            {
                return BadRequest(new ApiResponse<PagedResult<GetPropertiesItemDto>>
                {
                    Success = false,
                    Message = "userId is required and must be greater than 0"
                });
            }

            if (string.IsNullOrWhiteSpace(queryParameters.Flag))
            {
                return BadRequest(new ApiResponse<PagedResult<GetPropertiesItemDto>>
                {
                    Success = false,
                    Message = "flag is required"
                });
            }

            var result = await _propertyService.GetPropertiesAsync(queryParameters, ct);

            return Ok(new ApiResponse<PagedResult<GetPropertiesItemDto>>
            {
                Success = true,
                Message = "Records fetched successfully",
                Items = result,
                TotalCount = result.TotalCount
            });
        }
        catch (NtisPlatform.Application.Exceptions.ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error in get-properties endpoint");
            return BadRequest(new ApiResponse<PagedResult<GetPropertiesItemDto>>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving properties for WardNo: {WardNo}, FromPropertyNo: {FromPropertyNo}, ToPropertyNo: {ToPropertyNo}",
                queryParameters?.WardNo, queryParameters?.FromPropertyNo, queryParameters?.ToPropertyNo);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ApiResponse<PagedResult<GetPropertiesItemDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving property records"
                });
        }
    }
}
