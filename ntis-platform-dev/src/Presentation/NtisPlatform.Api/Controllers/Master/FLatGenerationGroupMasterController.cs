using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Api.Controllers.Master;

/// <summary>
/// Controller for Flat Generation Group Master (PTIS.FLatGenerationGroupMaster) CRUD operations.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FLatGenerationGroupMasterController : ControllerBase
{
    private readonly IFLatGenerationGroupMasterService _service;
    private readonly ILogger<FLatGenerationGroupMasterController> _logger;

    public FLatGenerationGroupMasterController(
        IFLatGenerationGroupMasterService service,
        ILogger<FLatGenerationGroupMasterController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Gets all Flat Generation Group Masters with filtering, sorting, and pagination.
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] FLatGenerationGroupMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Gets Flat Generation Group Master by ID.
    /// </summary>
    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Creates a new Flat Generation Group Master.
    /// </summary>
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateFLatGenerationGroupMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Updates an existing Flat Generation Group Master.
    /// </summary>
    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateFLatGenerationGroupMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Deletes a Flat Generation Group Master by ID.
    /// </summary>
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
