using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceActivityLog;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for querying immutable Grievance Activity Logs and Audit Trails (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GrievanceActivityLogController : ControllerBase
{
    private readonly IGrievanceActivityLogService _service;
    private readonly ILogger<GrievanceActivityLogController> _logger;

    public GrievanceActivityLogController(
        IGrievanceActivityLogService service,
        ILogger<GrievanceActivityLogController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Activity Logs with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GrievanceActivityLogQueryParameters queryParameters, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetAllAsync(queryParameters, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get grievance activity logs");
            return StatusCode(500, new { message = "An error occurred while retrieving grievance activity logs." });
        }
    }

    /// <summary>
    /// Get Grievance Activity Log entry by ID
    /// </summary>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetByIdAsync(id, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Activity log entry with ID {id} not found." });
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get grievance activity log with ID {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the activity log entry." });
        }
    }

    /// <summary>
    /// Get complete activity log timeline for a specific Grievance Application
    /// </summary>
    [HttpGet("grievance/{grievanceId:int}")]
    public async Task<IActionResult> GetByGrievanceId(int grievanceId, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetByGrievanceIdAsync(grievanceId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get activity logs for grievance {GrievanceId}", grievanceId);
            return StatusCode(500, new { message = "An error occurred while retrieving grievance activity logs." });
        }
    }
}
