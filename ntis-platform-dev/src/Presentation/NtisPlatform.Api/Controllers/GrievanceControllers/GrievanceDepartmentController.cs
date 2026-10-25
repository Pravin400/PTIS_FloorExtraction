using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDepartmentMaster;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Grievance Department Master CRUD operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GrievanceDepartmentController : ControllerBase
{
    private readonly IGrievanceDepartmentService _service;
    private readonly ILogger<GrievanceDepartmentController> _logger;

    public GrievanceDepartmentController(IGrievanceDepartmentService service, ILogger<GrievanceDepartmentController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Departments with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public Task<IActionResult> GetAll([FromQuery] GrievanceDepartmentQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Grievance Department by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Create new Grievance Department
    /// </summary>
    [HttpPost]
    [Authorize]
    public Task<IActionResult> Create([FromBody] CreateGrievanceDepartmentDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update existing Grievance Department
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceDepartmentDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Get all CORE departments that are not yet provisioned in Grievance Master
    /// </summary>
    [HttpGet("available-core")]
    [Authorize]
    public async Task<IActionResult> GetAvailableCoreDepartments(CancellationToken ct)
    {
        try
        {
            var result = await _service.GetAvailableCoreDepartmentsAsync(ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve available core departments");
            return StatusCode(500, new { message = "An error occurred while retrieving available core departments." });
        }
    }

    /// <summary>
    /// Provision a new Grievance Department linked to an existing CORE Department
    /// </summary>
    [HttpPost("provision-from-core/{coreDepartmentId:int}")]
    [Authorize]
    public async Task<IActionResult> ProvisionFromCoreDepartment(int coreDepartmentId, CancellationToken ct)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _service.ProvisionFromCoreDepartmentAsync(coreDepartmentId, userId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to provision department from CoreDepartmentId {CoreDepartmentId}: {Message}", coreDepartmentId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while provisioning department from CoreDepartmentId {CoreDepartmentId}", coreDepartmentId);
            return StatusCode(500, new { message = "An error occurred while provisioning department." });
        }
    }

    /// <summary>
    /// Get grievance departments allocated to the current logged-in user based on their CORE department allocations
    /// </summary>
    [HttpGet("my-departments")]
    [Authorize]
    public async Task<IActionResult> GetMyAllocatedDepartments(CancellationToken ct)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User is not authenticated." });
            }

            var result = await _service.GetGrievanceDepartmentsByUserIdAsync(userId.Value, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve grievance departments for current user");
            return StatusCode(500, new { message = "An error occurred while retrieving allocated grievance departments." });
        }
    }

    /// <summary>
    /// Get grievance departments allocated to a specific user (staff) based on their CORE department allocations
    /// </summary>
    [HttpGet("user/{userId:int}")]
    [Authorize]
    public async Task<IActionResult> GetGrievanceDepartmentsByUserId(int userId, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetGrievanceDepartmentsByUserIdAsync(userId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve grievance departments for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while retrieving allocated grievance departments." });
        }
    }

    /// <summary>
    /// Delete Grievance Department
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    /// <summary>
    /// Get list of active staff/users allocated to a grievance department (via CORE.UserDepartmentAllocation)
    /// </summary>
    /// <param name="grievanceDepartmentId">The Grievance Department ID (PK of GRV.GrievanceDepartmentMaster)</param>
    /// <param name="ct">Cancellation token</param>
    [HttpGet("{grievanceDepartmentId:int}/users")]
    [HttpGet("{grievanceDepartmentId:int}/allocated-users")]
    [Authorize]
    public async Task<IActionResult> GetAllocatedUsers(int grievanceDepartmentId, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetAllocatedUsersByGrievanceDepartmentIdAsync(grievanceDepartmentId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve allocated users for grievance department {GrievanceDepartmentId}", grievanceDepartmentId);
            return StatusCode(500, new { message = "An error occurred while retrieving allocated users for the grievance department." });
        }
    }

    private int? GetCurrentUserId()
    {
        var user = HttpContext?.User;
        var claim = user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? user?.FindFirst("user_id")?.Value
            ?? user?.FindFirst("sub")?.Value;

        return int.TryParse(claim, out var id) ? id : null;
    }
}
