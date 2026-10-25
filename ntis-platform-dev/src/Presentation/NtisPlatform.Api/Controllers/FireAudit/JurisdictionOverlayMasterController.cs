using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.FireAudit.JurisdictionOverlay;
using NtisPlatform.Application.Interfaces.FireAudit;

namespace NtisPlatform.Api.Controllers.FireAudit;

[ApiController]
[Route("api/[controller]")]
public class JurisdictionOverlayMasterController : ControllerBase
{
    private readonly IJurisdictionOverlayMasterService _service;
    private readonly ILogger<JurisdictionOverlayMasterController> _logger;

    public JurisdictionOverlayMasterController(
        IJurisdictionOverlayMasterService service,
        ILogger<JurisdictionOverlayMasterController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] JurisdictionOverlayMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateJurisdictionOverlayMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateJurisdictionOverlayMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);
}
