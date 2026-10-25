using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;

namespace NtisPlatform.Api.Controllers.WaterBill;

/// <summary>
/// Citizen Service Aggregate API - Provides citizen service catalog and portal content.
/// Follows PropertyController partial pattern:
/// - CitizenServiceController.PortalContent.cs (Landing page portal content)
/// </summary>
[ApiController]
[Route("api/citizen/service")]
[Tags("CitizenService")]
public partial class CitizenServiceController : ControllerBase
{
    private readonly ICitizenServiceService _service;
    private readonly IPortalContentService _portalContentService;
    private readonly IDepartmentPortalConfigurationService _departmentPortalConfigService;
    private readonly ILogger<CitizenServiceController> _logger;

    public CitizenServiceController(
        ICitizenServiceService service,
        IPortalContentService portalContentService,
        IDepartmentPortalConfigurationService departmentPortalConfigService,
        ILogger<CitizenServiceController> logger)
    {
        _service = service;
        _portalContentService = portalContentService;
        _departmentPortalConfigService = departmentPortalConfigService;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] CitizenServiceQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);
        
    [AllowAnonymous]
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveCitizenServices([FromQuery] int? departmentId, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetActiveCitizenServicesAsync(departmentId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active citizen services.");
            return StatusCode(500, "An error occurred while retrieving citizen services.");
        }
    }

    [Authorize]
    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateCitizenServiceDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [Authorize]
    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateCitizenServiceDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [Authorize]
    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    [Authorize]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(
        int id,
        [FromServices] IHardDeleteCleanupService cleanupService,
        [FromServices] IReferenceValidationService referenceValidationService,
        CancellationToken ct)
        => this.ExecuteForceDelete<CitizenServiceEntity, int>(cleanupService, referenceValidationService, id, _logger, ct);
}
