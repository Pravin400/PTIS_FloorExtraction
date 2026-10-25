using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDeptForwarding;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Grievance Department Forwarding operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GrievanceDeptForwardingController : ControllerBase
{
    private readonly IGrievanceDeptForwardingService _service;
    private readonly ILogger<GrievanceDeptForwardingController> _logger;

    public GrievanceDeptForwardingController(IGrievanceDeptForwardingService service, ILogger<GrievanceDeptForwardingController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Department Forwardings with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GrievanceDeptForwardingQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Grievance Department Forwarding by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Get all Department Forwardings for a specific Grievance Application
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
            _logger.LogError(ex, "Failed to get forwardings for grievance {GrievanceId}", grievanceId);
            return StatusCode(500, new { message = "An error occurred while retrieving grievance department forwardings." });
        }
    }

    /// <summary>
    /// Get all forwardings assigned to a specific Department (Department Inbox with pagination & filtering)
    /// </summary>
    [HttpGet("department/{departmentId:int}")]
    public Task<IActionResult> GetByDepartmentId(
        int departmentId, [FromQuery] GrievanceDeptForwardingQueryParameters queryParameters, CancellationToken ct)
    {
        queryParameters.ForwardedToDeptId = departmentId;
        return this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);
    }

    /// <summary>
    /// Create a new Grievance Department Forwarding record
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateGrievanceDeptForwardingDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update existing Grievance Department Forwarding status / remark / assigned officer
    /// </summary>
    [HttpPut("{id:int}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceDeptForwardingDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete / Deactivate Grievance Department Forwarding record
    /// </summary>
    [HttpDelete("{id:int}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
