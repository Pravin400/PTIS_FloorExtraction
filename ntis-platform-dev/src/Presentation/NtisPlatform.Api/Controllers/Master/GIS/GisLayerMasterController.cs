using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GIS;

namespace NtisPlatform.Api.Controllers.Master;

/// <summary>
/// Controller for Dynamic GIS Layer Catalog Master CRUD operations and GeoJSON Boundary Uploads.
/// Follows standard generic Master controller flow with zero business or DB logic in controller actions.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GisLayerMasterController : ControllerBase
{
    private readonly IGisLayerMasterService _service;
    private readonly IHardDeleteCleanupService _cleanupService;
    private readonly IReferenceValidationService _referenceValidationService;
    private readonly ILogger<GisLayerMasterController> _logger;

    public GisLayerMasterController(
        IGisLayerMasterService service, 
        IHardDeleteCleanupService cleanupService, 
        IReferenceValidationService referenceValidationService, 
        ILogger<GisLayerMasterController> logger)
    {
        _service = service;
        _cleanupService = cleanupService;
        _referenceValidationService = referenceValidationService;
        _logger = logger;
    }

    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] GisLayerMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    [HttpGet("{id}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    [HttpPost]
    public Task<IActionResult> Create([FromBody] CreateGisLayerMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    [HttpPost("Bulk")]
    public Task<IActionResult> BulkCreate([FromBody] CreateGisLayerMasterDto[] items, CancellationToken ct)
        => this.ExecuteBulkCreate(_service, items, _logger, ct);

    [HttpPut("{id}")]
    public Task<IActionResult> Update(int id, [FromBody] UpdateGisLayerMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    [HttpPut("Bulk")]
    public Task<IActionResult> BulkUpdate([FromBody] BulkUpdateItem<int, UpdateGisLayerMasterDto>[] items, CancellationToken ct)
        => this.ExecuteBulkUpdate(_service, items, _logger, ct);

    [HttpDelete("{id}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    [HttpDelete("Bulk")]
    public Task<IActionResult> BulkDelete([FromBody] int[] ids, CancellationToken ct)
        => this.ExecuteBulkDelete(_service, ids, _logger, ct);

    [Authorize]
    [HttpDelete("{id}/purge")]
    public Task<IActionResult> Purge(int id, CancellationToken ct)
        => this.ExecuteForceDelete<GisLayerMasterEntity, int>(_cleanupService, _referenceValidationService, id, _logger, ct);

    [Authorize]
    [HttpDelete("Bulk/purge")]
    public Task<IActionResult> BulkPurge([FromBody] int[] ids, CancellationToken ct)
        => this.ExecuteBulkForceDelete<GisLayerMasterEntity, int>(_cleanupService, _referenceValidationService, ids, _logger, ct);

    /// <summary>
    /// Uploads and stores a GeoJSON boundary file directly for this layer.
    /// Delegates file processing, streaming, validation, and audit logging to service.
    /// </summary>
    [HttpPost("{id:int}/upload-geojson")]
    [Consumes("multipart/form-data")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 524_288_000)] // 500 MB limit
    [ProducesResponseType(typeof(ApiResponse<GisUploadResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadGeoJson(int id, IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "No file uploaded. Please select a valid .geojson or .json file."
            });
        }

        using var stream = file.OpenReadStream();
        var result = await _service.UploadGeoJsonAsync(id, stream, file.FileName, file.Length, ct);
        return Ok(new ApiResponse<GisUploadResultDto>
        {
            Success = true,
            Message = $"GeoJSON file '{file.FileName}' successfully saved for Layer '{result?.LayerName}' (ID: {id}).",
            Items = result
        });
    }

    /// <summary>
    /// Fetches the GeoJSON boundary data stored for this layer with dynamic style properties applied.
    /// Delegates retrieval and caching to service.
    /// </summary>
    [HttpGet("{id:int}/geojson")]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(ContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGeoJson(int id, CancellationToken ct)
    {
        var geoJson = await _service.GetGeoJsonAsync(id, ct);
        if (string.IsNullOrWhiteSpace(geoJson))
        {
            return NotFound(ApiResponse<object>.ErrorResponse($"No GeoJSON boundary data found for Layer ID {id}."));
        }

        return Content(geoJson, "application/json");
    }
}
