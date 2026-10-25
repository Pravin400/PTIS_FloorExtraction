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
public class TapSizeMasterController : ControllerBase
{
    private readonly ITapSizeMasterService _service;
    private readonly ILogger<TapSizeMasterController> _logger;

    public TapSizeMasterController(
        ITapSizeMasterService service,
        ILogger<TapSizeMasterController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] TapSizeMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateTapSizeMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateTapSizeMasterDto updateDto, CancellationToken ct)
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
        => this.ExecuteForceDelete<TapSizeMasterEntity, int>(cleanupService, referenceValidationService, id, _logger, ct);
}
