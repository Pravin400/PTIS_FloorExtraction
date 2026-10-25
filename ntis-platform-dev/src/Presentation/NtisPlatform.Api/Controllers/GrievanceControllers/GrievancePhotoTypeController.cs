using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Api.Controllers.GrievanceControllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class GrievancePhotoTypeController : ControllerBase
{
    private readonly IGrievancePhotoTypeService _service;
    private readonly ILogger<GrievancePhotoTypeController> _logger;

    public GrievancePhotoTypeController(IGrievancePhotoTypeService service, ILogger<GrievancePhotoTypeController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Get all Grievance Photo Types with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GrievancePhotoTypeQueryParameters queryParams, CancellationToken cancellationToken)
        => this.ExecuteGetAllPaged(_service, queryParams, _logger, cancellationToken);

    /// <summary>
    /// Get Grievance Photo Type by ID
    /// </summary>
    [HttpGet("{id:int}")]
    public Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
        => this.ExecuteGetById(_service, id, _logger, cancellationToken);

    /// <summary>
    /// Create a new Grievance Photo Type
    /// </summary>
    [HttpPost]
    [Authorize]
    public Task<IActionResult> Create([FromBody] CreateGrievancePhotoTypeDto dto, CancellationToken cancellationToken)
        => this.ExecuteCreate(_service, dto, _logger, cancellationToken);

    /// <summary>
    /// Update an existing Grievance Photo Type
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGrievancePhotoTypeDto dto, CancellationToken cancellationToken)
        => this.ExecuteUpdate(_service, id, dto, _logger, cancellationToken);

    /// <summary>
    /// Delete / Deactivate a Grievance Photo Type
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize]
    public Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        => this.ExecuteDelete(_service, id, _logger, cancellationToken);
}
