using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowState;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Grievance Workflow State CRUD operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GrievanceWorkflowStateController : ControllerBase
{
    private readonly IGrievanceWorkflowStateService _service;
    private readonly ILogger<GrievanceWorkflowStateController> _logger;

    public GrievanceWorkflowStateController(IGrievanceWorkflowStateService service, ILogger<GrievanceWorkflowStateController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Workflow States with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GrievanceWorkflowStateQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Grievance Workflow State by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Create new Grievance Workflow State
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateGrievanceWorkflowStateDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update existing Grievance Workflow State
    /// </summary>
    [HttpPut("{id:int}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceWorkflowStateDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete / Deactivate Grievance Workflow State
    /// </summary>
    [HttpDelete("{id:int}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
