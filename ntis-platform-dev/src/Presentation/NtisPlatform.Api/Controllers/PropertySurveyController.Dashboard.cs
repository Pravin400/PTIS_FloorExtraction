using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.Property.PropertySurveyDashboard;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

public partial class PropertySurveyController
{
    /// <summary>
    /// Gets survey dashboard metrics for the specified ward or all wards (authorized roles).
    /// </summary>
    [Authorize]
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(SurveyDashboardResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPropertyDashboardDetailsAsync(
        [FromQuery] SurveyDashboardQueryParameters queryParameters,
        CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId <= 0)
        {
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Message = "Valid user identification is required."
            });
        }

        return Ok(await _propertySurveyDashboardService.GetAllAsync(queryParameters, currentUserId, ct));
    }
}
