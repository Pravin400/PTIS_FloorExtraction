using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflow;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Grievance Workflow CRUD operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GrievanceWorkflowController : ControllerBase
{
    private readonly IGrievanceWorkflowService _service;
    private readonly ILogger<GrievanceWorkflowController> _logger;

    public GrievanceWorkflowController(IGrievanceWorkflowService service, ILogger<GrievanceWorkflowController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Workflows with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GrievanceWorkflowQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Grievance Workflow by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Create new Grievance Workflow
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateGrievanceWorkflowDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update existing Grievance Workflow
    /// </summary>
    [HttpPut("{id:int}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceWorkflowDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete / Deactivate Grievance Workflow
    /// </summary>
    [HttpDelete("{id:int}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
