using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowTransition;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Grievance Workflow Transition CRUD operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GrievanceWorkflowTransitionController : ControllerBase
{
    private readonly IGrievanceWorkflowTransitionService _service;
    private readonly ILogger<GrievanceWorkflowTransitionController> _logger;

    public GrievanceWorkflowTransitionController(IGrievanceWorkflowTransitionService service, ILogger<GrievanceWorkflowTransitionController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Workflow Transitions with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GrievanceWorkflowTransitionQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Grievance Workflow Transition by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Create new Grievance Workflow Transition
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateGrievanceWorkflowTransitionDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update existing Grievance Workflow Transition
    /// </summary>
    [HttpPut("{id:int}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceWorkflowTransitionDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete / Deactivate Grievance Workflow Transition
    /// </summary>
    [HttpDelete("{id:int}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
