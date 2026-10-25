using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyUnit;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Api.Controllers.WaterBill.Master;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GeographyUnitController : ControllerBase
{
    private readonly IGeographyUnitService _service;
    private readonly IHardDeleteCleanupService _cleanupService;
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ILogger<GeographyUnitController> _logger;

    public GeographyUnitController(
        IGeographyUnitService service,
        IHardDeleteCleanupService cleanupService,
        IReferenceValidationService referenceValidationService,
        ILogger<GeographyUnitController> logger)
    {
        _service = service;
        _cleanupService = cleanupService;
        _referenceValidationService = referenceValidationService;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GeographyUnitQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpGet("parent-candidates")]
    public async Task<IActionResult> GetParentCandidates([FromQuery] int geographyTypeId, CancellationToken ct)
    {
        var candidates = await _service.GetParentCandidatesAsync(geographyTypeId, ct);
        return Ok(candidates);
    }

    [HttpGet("hierarchy-tree")]
    public async Task<IActionResult> GetHierarchyTree([FromQuery] int? rootId, CancellationToken ct)
    {
        var tree = await _service.GetHierarchyTreeAsync(rootId, ct);
        return Ok(tree);
    }

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateGeographyUnitDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGeographyUnitDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    [Authorize]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(int id, CancellationToken ct)
        => this.ExecuteForceDelete<GeographyUnitEntity, int>(_cleanupService, _referenceValidationService, id, _logger, ct);
}
