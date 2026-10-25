using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceEscalation;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Ward Representative / Observer poke and grievance escalation operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GrievanceEscalationController : ControllerBase
{
    private readonly IGrievanceEscalationService _service;
    private readonly ILogger<GrievanceEscalationController> _logger;

    public GrievanceEscalationController(
        IGrievanceEscalationService service,
        ILogger<GrievanceEscalationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Escalations and Pokes with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GrievanceEscalationQueryParameters queryParameters, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Task.FromResult<IActionResult>(Forbid());
        }
        return this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);
    }

    /// <summary>
    /// Get Escalation details by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Task.FromResult<IActionResult>(Forbid());
        }
        return this.ExecuteGetById(_service, id, _logger, ct);
    }

    /// <summary>
    /// Get all Escalation and Poke history for a specific Grievance ticket
    /// </summary>
    [HttpGet("grievance/{grievanceId:int}")]
    public async Task<IActionResult> GetByGrievanceId(int grievanceId, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Forbid();
        }

        try
        {
            var result = await _service.GetByGrievanceIdAsync(grievanceId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get escalations for grievance {GrievanceId}", grievanceId);
            return StatusCode(500, new { message = "An error occurred while retrieving grievance escalations." });
        }
    }

    /// <summary>
    /// Get all Escalations for a specific Ward
    /// </summary>
    [HttpGet("ward/{wardId:int}")]
    public async Task<IActionResult> GetByWardId(int wardId, [FromQuery] GrievanceEscalationQueryParameters queryParameters, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Forbid();
        }

        try
        {
            var result = await _service.GetByWardIdAsync(wardId, queryParameters, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get escalations for ward {WardId}", wardId);
            return StatusCode(500, new { message = "An error occurred while retrieving ward escalations." });
        }
    }

    /// <summary>
    /// Get all Escalations for a specific Zone (aggregating across all wards in the zone)
    /// </summary>
    [HttpGet("zone/{zoneId:int}")]
    public async Task<IActionResult> GetByZoneId(int zoneId, [FromQuery] GrievanceEscalationQueryParameters queryParameters, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Forbid();
        }

        try
        {
            var result = await _service.GetByZoneIdAsync(zoneId, queryParameters, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get escalations for zone {ZoneId}", zoneId);
            return StatusCode(500, new { message = "An error occurred while retrieving zone escalations." });
        }
    }

    /// <summary>
    /// Ward Representative / Observer pokes or escalates a grievance complaint
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Escalate([FromBody] CreateGrievanceEscalationDto dto, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Forbid();
        }

        try
        {
            var escalatedByUserId = GetActionByUserId();
            dto.CreatedBy = escalatedByUserId;
            var result = await _service.EscalateGrievanceAsync(dto, escalatedByUserId, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException uex)
        {
            return Unauthorized(new { message = uex.Message });
        }
        catch (Application.Exceptions.ValidationException vex)
        {
            return BadRequest(new { message = vex.Message, errors = vex.Errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create grievance escalation for grievance {GrievanceApplicationId}", dto.GrievanceApplicationId);
            return StatusCode(500, new { message = "An error occurred while escalating the grievance." });
        }
    }

    /// <summary>
    /// Corporation staff or Department HOD responds to an observer poke
    /// </summary>
    [HttpPost("{id:int}/respond")]
    public async Task<IActionResult> RespondToEscalation(int id, [FromBody] RespondGrievanceEscalationDto dto, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Forbid();
        }

        try
        {
            var staffUserId = GetActionByUserId();
            var result = await _service.RespondToEscalationAsync(id, dto, staffUserId, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Grievance escalation with ID {id} not found." });
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException uex)
        {
            return Unauthorized(new { message = uex.Message });
        }
        catch (KeyNotFoundException knfe)
        {
            return NotFound(new { message = knfe.Message });
        }
        catch (Application.Exceptions.ValidationException vex)
        {
            return BadRequest(new { message = vex.Message, errors = vex.Errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to respond to escalation {Id}", id);
            return StatusCode(500, new { message = "An error occurred while responding to the grievance escalation." });
        }
    }

    /// <summary>
    /// Delete / Deactivate an Escalation record
    /// </summary>
    [HttpDelete("{id:int}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        if (IsCitizenCaller())
        {
            return Task.FromResult<IActionResult>(Forbid());
        }
        return this.ExecuteDelete(_service, id, _logger, ct);
    }

    private bool IsCitizenCaller()
    {
        var user = HttpContext?.User;
        return user?.Identity?.IsAuthenticated == true && (user.IsInRole("Citizen") || user.FindFirst("user_type")?.Value == "citizen");
    }

    private int GetActionByUserId()
    {
        var user = HttpContext?.User;
        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            throw new UnauthorizedAccessException("Authentication is required.");
        }

        if (IsCitizenCaller())
        {
            throw new UnauthorizedAccessException("Citizen accounts are not permitted to mutate grievance escalations.");
        }

        var claim = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("user_id")?.Value
            ?? user.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(claim) && int.TryParse(claim, out var id) && id > 0)
        {
            return id;
        }

        throw new UnauthorizedAccessException("Authenticated user ID could not be identified from token claims. Please provide a valid Authorization header.");
    }
}
