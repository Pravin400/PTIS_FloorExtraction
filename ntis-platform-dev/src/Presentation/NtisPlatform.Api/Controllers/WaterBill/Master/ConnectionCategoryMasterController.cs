using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master.WaterBill;
using NtisPlatform.Core.Entities.Master.WaterBill;

namespace NtisPlatform.Api.Controllers.Master.WaterBill;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConnectionCategoryMasterController : ControllerBase
{
    private readonly IConnectionCategoryMasterService _service;
    private readonly ILogger<ConnectionCategoryMasterController> _logger;

    public ConnectionCategoryMasterController(
        IConnectionCategoryMasterService service,
        ILogger<ConnectionCategoryMasterController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] ConnectionCategoryMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateConnectionCategoryMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateConnectionCategoryMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(
        int id,
        [FromServices] IHardDeleteCleanupService cleanupService,
        [FromServices] IReferenceValidationService referenceValidationService,
        CancellationToken ct)
        => this.ExecuteForceDelete<ConnectionCategoryMasterEntity, int>(cleanupService, referenceValidationService, id, _logger, ct);
}
