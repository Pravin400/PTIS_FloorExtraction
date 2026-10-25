using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;

namespace NtisPlatform.Api.Controllers.WaterBill;

/// <summary>
/// Portal content partial API for managing and serving landing page portal content.
/// Exposed under /api/citizen/portal-content and grouped under CitizenService in Swagger.
/// </summary>
public partial class CitizenServiceController
{
    [HttpGet("/api/citizen/portal-content")]
    public Task<IActionResult> GetAllPortalContent([FromQuery] PortalContentQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_portalContentService, queryParameters, _logger, ct);

    [AllowAnonymous]
    [HttpGet("/api/citizen/portal-content/active/{contentType}")]
    public async Task<IActionResult> GetActivePortalContent(string contentType, [FromQuery] int? departmentId, CancellationToken ct)
    {
        try
        {
            var result = await _portalContentService.GetActivePortalContentAsync(departmentId, contentType, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active portal content for {ContentType}", contentType);
            return StatusCode(500, "An error occurred while retrieving portal content.");
        }
    }

    [Authorize]
    [HttpPost("/api/citizen/portal-content")]
    public Task<IActionResult> CreatePortalContent([FromBody] CreatePortalContentDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_portalContentService, createDto, _logger, ct);

    [Authorize]
    [HttpPut("/api/citizen/portal-content/{id}")]
    public Task<IActionResult> UpdatePortalContent(int id, [FromBody] UpdatePortalContentDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_portalContentService, id, updateDto, _logger, ct);

    [HttpGet("/api/citizen/portal-content/{id}")]
    public Task<IActionResult> GetPortalContentById(int id, CancellationToken ct)
        => this.ExecuteGetById(_portalContentService, id, _logger, ct);

    [Authorize]
    [HttpDelete("/api/citizen/portal-content/{id}")]
    public Task<IActionResult> DeletePortalContent(int id, CancellationToken ct)
        => this.ExecuteDelete(_portalContentService, id, _logger, ct);

    [Authorize]
    [HttpDelete("/api/citizen/portal-content/{id}/purge")]
    public Task<IActionResult> PurgePortalContent(
        int id,
        [FromServices] IHardDeleteCleanupService cleanupService,
        [FromServices] IReferenceValidationService referenceValidationService,
        CancellationToken ct)
        => this.ExecuteForceDelete<PortalContentEntity, int>(cleanupService, referenceValidationService, id, _logger, ct);
}
