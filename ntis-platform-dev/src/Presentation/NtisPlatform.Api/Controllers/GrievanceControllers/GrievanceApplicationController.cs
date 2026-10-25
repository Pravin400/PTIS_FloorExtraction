using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Grievance Application operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GrievanceApplicationController : ControllerBase
{
    private readonly IGrievanceApplicationService _service;
    private readonly ILogger<GrievanceApplicationController> _logger;

    public GrievanceApplicationController(IGrievanceApplicationService service, ILogger<GrievanceApplicationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Applications with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    [Authorize]
    public Task<IActionResult> GetAll([FromQuery] GrievanceApplicationQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Grievance Application by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Get Grievance Application by Grievance Tracking Number
    /// </summary>
    [HttpGet("by-no/{grievanceNo}")]
    [Authorize]
    public async Task<IActionResult> GetByGrievanceNo(string grievanceNo, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetByGrievanceNoAsync(grievanceNo, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Grievance with number '{grievanceNo}' not found." });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get grievance by number {GrievanceNo}", grievanceNo);
            return StatusCode(500, new { message = "An error occurred while retrieving grievance details." });
        }
    }

    /// <summary>
    /// Track a Grievance Complaint with full stage progress and step-by-step timeline history
    /// </summary>
    /// <param name="grievanceNo">The unique Grievance Tracking Number (e.g. GRV-2026-000001)</param>
    /// <param name="mobileNo">Optional registered mobile number for validation</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet("track/{grievanceNo}")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackGrievance(string grievanceNo, [FromQuery] string? mobileNo, CancellationToken ct)
    {
        try
        {
            var result = await _service.TrackGrievanceAsync(grievanceNo, mobileNo, ct);
            if (result == null)
            {
                return NotFound(new { message = $"No grievance found matching tracking number '{grievanceNo}'" + (string.IsNullOrWhiteSpace(mobileNo) ? "." : " with provided mobile number.") });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track grievance by number {GrievanceNo}", grievanceNo);
            return StatusCode(500, new { message = "An error occurred while retrieving grievance tracking details." });
        }
    }

    /// <summary>
    /// Get all public grievance data (no request input required) including citizen info, progress, timeline, and photo view URLs
    /// Photos can be viewed using GrievancePhotoController.ViewPhoto (GET /api/grievance-photos/{id}/view)
    /// </summary>
    /// <param name="ct">Cancellation token</param>
    [HttpGet("public")]
    [HttpGet("public/all")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<GrievancePublicDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllPublicDetails(CancellationToken ct)
    {
        try
        {
            var result = await _service.GetAllPublicDetailsAsync(ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all public grievance details");
            return StatusCode(500, new { message = "An error occurred while retrieving all public grievance details." });
        }
    }

    /// <summary>
    /// Get comprehensive public grievance details, status timeline, and photo view URLs for citizen viewing
    /// Photos can be viewed using GrievancePhotoController.ViewPhoto (GET /api/grievance-photos/{id}/view)
    /// </summary>
    /// <param name="grievanceNo">The unique Grievance Tracking Number (e.g. GRV-2026-000001)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet("public/{grievanceNo}")]
    [HttpGet("public/details/{grievanceNo}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GrievancePublicDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPublicDetailsByGrievanceNo(string grievanceNo, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetPublicDetailsByGrievanceNoAsync(grievanceNo, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Grievance with number '{grievanceNo}' not found." });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get public grievance details for grievance number {GrievanceNo}", grievanceNo);
            return StatusCode(500, new { message = "An error occurred while retrieving public grievance details." });
        }
    }

    /// <summary>
    /// Get comprehensive public grievance details, status timeline, and photo view URLs by Grievance ID for citizen viewing
    /// Photos can be viewed using GrievancePhotoController.ViewPhoto (GET /api/grievance-photos/{id}/view)
    /// </summary>
    /// <param name="id">The Grievance Application ID</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet("public/by-id/{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GrievancePublicDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPublicDetailsById(int id, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetPublicDetailsByIdAsync(id, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Grievance with ID {id} not found." });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get public grievance details for ID {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving public grievance details." });
        }
    }

    /// <summary>
    /// Get Grievances filed by a specific citizen
    /// </summary>
    [HttpGet("citizen/{citizenId:int}")]
    [Authorize]
    public async Task<IActionResult> GetByCitizenId(int citizenId, [FromQuery] GrievanceApplicationQueryParameters queryParameters, CancellationToken ct)
    {
        try
        {
            // Security check: If caller is authenticated as a Citizen, ensure they can only access their own grievances
            var user = HttpContext?.User;
            if (user?.Identity?.IsAuthenticated == true && (user.IsInRole("Citizen") || user.FindFirst("user_type")?.Value == "citizen"))
            {
                var callerCitizenIdClaim = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("citizen_id")?.Value
                    ?? user.FindFirst("sub")?.Value;

                if (!int.TryParse(callerCitizenIdClaim, out var callerCitizenId) || callerCitizenId != citizenId)
                {
                    return Forbid();
                }
            }

            var result = await _service.GetByCitizenIdAsync(citizenId, queryParameters, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get grievances for citizen {CitizenId}", citizenId);
            return StatusCode(500, new { message = "An error occurred while retrieving citizen grievances." });
        }
    }

    /// <summary>
    /// Submit a new Grievance Application
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateGrievanceApplicationDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update an existing Grievance Application
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceApplicationDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Assign a staff officer to a grievance ticket
    /// </summary>
    [HttpPost("{id:int}/assign")]
    [Authorize]
    public async Task<IActionResult> AssignOfficer(int id, [FromBody] AssignGrievanceDto dto, CancellationToken ct)
    {
        try
        {
            var actionByUserId = GetActionByUserId();
            var result = await _service.AssignOfficerAsync(id, dto, actionByUserId, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Grievance application with ID {id} not found." });
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException uex)
        {
            return Unauthorized(new { message = uex.Message });
        }
        catch (Application.Exceptions.ValidationException vex)
        {
            return BadRequest(new { message = vex.Message, errors = vex.Errors });
        }
        catch (KeyNotFoundException knfe)
        {
            return NotFound(new { message = knfe.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign officer to grievance {Id}", id);
            return StatusCode(500, new { message = "An error occurred while assigning the grievance officer." });
        }
    }

    /// <summary>
    /// Forward a grievance ticket to another department and/or officer
    /// </summary>
    [HttpPost("{id:int}/forward")]
    [Authorize]
    public async Task<IActionResult> ForwardToDepartment(int id, [FromBody] ForwardGrievanceDto dto, CancellationToken ct)
    {
        try
        {
            var actionByUserId = GetActionByUserId();
            var result = await _service.ForwardToDepartmentAsync(id, dto, actionByUserId, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Grievance application with ID {id} not found." });
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException uex)
        {
            return Unauthorized(new { message = uex.Message });
        }
        catch (Application.Exceptions.ValidationException vex)
        {
            return BadRequest(new { message = vex.Message, errors = vex.Errors });
        }
        catch (KeyNotFoundException knfe)
        {
            return NotFound(new { message = knfe.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to forward grievance {Id}", id);
            return StatusCode(500, new { message = "An error occurred while forwarding the grievance." });
        }
    }

    /// <summary>
    /// Transition a grievance ticket to a new workflow state (proceed/resolve/close)
    /// </summary>
    [HttpPost("{id:int}/transition")]
    [Authorize]
    public async Task<IActionResult> TransitionState(int id, [FromBody] TransitionGrievanceStateDto dto, CancellationToken ct)
    {
        try
        {
            var actionByUserId = GetActionByUserId();
            var result = await _service.TransitionStateAsync(id, dto, actionByUserId, ct);
            if (result == null)
            {
                return NotFound(new { message = $"Grievance application with ID {id} not found." });
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException uex)
        {
            return Unauthorized(new { message = uex.Message });
        }
        catch (Application.Exceptions.ValidationException vex)
        {
            return BadRequest(new { message = vex.Message, errors = vex.Errors });
        }
        catch (KeyNotFoundException knfe)
        {
            return NotFound(new { message = knfe.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to transition grievance state for {Id}", id);
            return StatusCode(500, new { message = "An error occurred while transitioning grievance state." });
        }
    }

    /// <summary>
    /// Get the complete action timeline and audit history for a grievance
    /// </summary>
    [HttpGet("{id:int}/history")]
    [Authorize]
    public async Task<IActionResult> GetHistory(int id, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetHistoryAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException knfe)
        {
            return NotFound(new { message = knfe.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get history for grievance {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving grievance history." });
        }
    }

    /// <summary>
    /// Delete / Deactivate a Grievance Application
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    private int GetActionByUserId()
    {
        var user = HttpContext?.User;
        var claim = user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? user?.FindFirst("user_id")?.Value
            ?? user?.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(claim) && int.TryParse(claim, out var id) && id > 0)
        {
            return id;
        }

        throw new UnauthorizedAccessException("Authenticated user ID could not be identified from token claims. Please provide a valid Authorization header.");
    }
}
