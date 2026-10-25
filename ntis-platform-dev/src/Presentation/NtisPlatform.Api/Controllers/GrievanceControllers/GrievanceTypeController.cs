using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceTypeMaster;
using NtisPlatform.Application.Interfaces.GrievanceInterface;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

/// <summary>
/// Controller for Grievance Type Master CRUD operations (GRV Module)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GrievanceTypeController : ControllerBase
{
    private readonly IGrievanceTypeService _service;
    private readonly ILogger<GrievanceTypeController> _logger;

    public GrievanceTypeController(IGrievanceTypeService service, ILogger<GrievanceTypeController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Types with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public Task<IActionResult> GetAll([FromQuery] GrievanceTypeQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Get Grievance Type by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Create new Grievance Type
    /// </summary>
    [HttpPost]
    [Authorize]
    public Task<IActionResult> Create([FromBody] CreateGrievanceTypeDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Update existing Grievance Type
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievanceTypeDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Delete Grievance Type
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
