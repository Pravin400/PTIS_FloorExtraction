using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Interfaces.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Infrastructure.Services;

namespace NtisPlatform.Api.Controllers.Master.WaterBill;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TariffChargeDetailController : ControllerBase
{
    private readonly ITariffChargeDetailService _service;
    private readonly ILogger<TariffChargeDetailController> _logger;

    public TariffChargeDetailController(
        ITariffChargeDetailService service,
        ILogger<TariffChargeDetailController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] TariffChargeDetailQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(long id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateTariffChargeDetailDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(long id, [FromBody] UpdateTariffChargeDetailDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(long id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(
        long id,
        [FromServices] IHardDeleteCleanupService cleanupService,
        [FromServices] IReferenceValidationService referenceValidationService,
        CancellationToken ct)
        => this.ExecuteForceDelete<TariffChargeDetailEntity, long>(cleanupService, referenceValidationService, id, _logger, ct);
}
