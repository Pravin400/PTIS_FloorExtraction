using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Public Citizen Grievance Dashboard operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/grievance/public-dashboard")]
public class GrievancePublicDashboardController : ControllerBase
{
    private readonly IPublicDashboardService _service;
    private readonly ILogger<GrievancePublicDashboardController> _logger;

    public GrievancePublicDashboardController(
        IPublicDashboardService service,
        ILogger<GrievancePublicDashboardController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get unified public dashboard summary and department performance in a single response
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PublicDashboardResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDashboard([FromQuery] PublicDashboardQueryParameters queryParameters, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetDashboardAsync(queryParameters, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get public dashboard");
            return StatusCode(500, new { message = "An error occurred while retrieving public dashboard." });
        }
    }
}
