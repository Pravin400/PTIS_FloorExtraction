using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.GIS;
using NtisPlatform.Application.DTOs.GIS.Asset;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.GIS;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Models.GIS;

namespace NtisPlatform.Api.Controllers.GIS;

/// <summary>
/// Dedicated Asset GIS Controller exposing Mapbox Vector Tiles (.mvt/.pbf), Point-in-Polygon Identify, Geometry, 
/// Dynamic KPI Metric Cards, Dynamic Cascading Filters, and GeoJSON Bulk Upload.
/// Aligned 100% with Clean Architecture: zero raw ADO.NET/SQL, ultra-lightweight actions delegating all domain logic to Application Services.
/// </summary>
[Route("api/gis/asset")]
[ApiController]
[Authorize]
public class GisAssetDashboardController : ControllerBase
{
    private readonly IGisAssetTileService _tileService;
    private readonly IGisAssetUploadService _uploadService;
    private readonly IGisAssetKpiService _kpiService;
    private readonly IGisAssetFilterService _filterService;
    private readonly IGisAssetPopupService _popupService;
    private readonly ILogger<GisAssetDashboardController> _logger;
    private readonly IGisDepartmentUserAccessService? _userAccessService;
    private readonly ICurrentUserService? _currentUserService;

    public GisAssetDashboardController(
        IGisAssetTileService tileService,
        IGisAssetUploadService uploadService,
        IGisAssetKpiService kpiService,
        IGisAssetFilterService filterService,
        IGisAssetPopupService popupService,
        ILogger<GisAssetDashboardController> logger,
        IGisDepartmentUserAccessService? userAccessService = null,
        ICurrentUserService? currentUserService = null)
    {
        _tileService = tileService ?? throw new ArgumentNullException(nameof(tileService));
        _uploadService = uploadService ?? throw new ArgumentNullException(nameof(uploadService));
        _kpiService = kpiService ?? throw new ArgumentNullException(nameof(kpiService));
        _filterService = filterService ?? throw new ArgumentNullException(nameof(filterService));
        _popupService = popupService ?? throw new ArgumentNullException(nameof(popupService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _userAccessService = userAccessService;
        _currentUserService = currentUserService;
    }

    private bool IsAdminUser()
    {
        if (User == null) return false;
        if (User.IsInRole("Admin") || User.IsInRole("SuperAdmin") || User.IsInRole("GisAdmin") || User.IsInRole("Administrator"))
            return true;

        return User.Claims.Any(c =>
            (c.Type == ClaimTypes.Role || c.Type == "role" || c.Type == "roles") &&
            (string.Equals(c.Value, "Admin", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(c.Value, "SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(c.Value, "GisAdmin", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(c.Value, "Administrator", StringComparison.OrdinalIgnoreCase)));
    }

    private int? TryGetCurrentUserId()
    {
        if (_currentUserService != null)
        {
            try
            {
                int id = _currentUserService.GetCurrentUserId();
                if (id > 0) return id;
            }
            catch { }
        }

        var claim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? User?.FindFirst(ClaimTypes.Name)?.Value
                 ?? User?.FindFirst("userId")?.Value
                 ?? User?.FindFirst("sub")?.Value;

        if (int.TryParse(claim, out var parsedId) && parsedId > 0)
        {
            return parsedId;
        }

        return null;
    }

    private async Task<List<GisDepartmentUserAccessDto>> GetCurrentUserAccessListAsync(int userId, CancellationToken ct)
    {
        if (_userAccessService == null)
            return new List<GisDepartmentUserAccessDto>();

        var queryParams = new GisDepartmentUserAccessQueryParameters
        {
            UserId = userId,
            IsActive = true,
            PageSize = 100
        };

        var result = await _userAccessService.GetAllAsync(queryParams, ct);
        return result?.Items?.ToList() ?? new List<GisDepartmentUserAccessDto>();
    }

    /// <summary>
    /// Retrieves calculated dynamic KPI cards for Asset GIS dashboard with active filter context.
    /// Format: GET /api/gis/asset/kpis?zoneId=1&amp;assetCategoryId=2
    /// </summary>
    [HttpGet("kpis")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    [ProducesResponseType(typeof(ApiResponse<GisAssetKpiSummaryResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetKpiSummary([FromQuery] GisAssetDataRequestDto? filters, CancellationToken ct)
    {
        try
        {
            var summary = await _kpiService.GetAssetKpiSummaryAsync(filters, ct);
            return Ok(ApiResponse<GisAssetKpiSummaryResponseDto>.SuccessResponse(summary, "Asset GIS KPI summary retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Asset GIS KPI summary");
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error calculating KPI metrics: {ex.Message}"));
        }
    }

    /// <summary>
    /// Retrieves dynamic cascading filter groups (Zone, Ward, Asset Category, Asset Type) for Asset GIS dashboard.
    /// Format: GET /api/gis/asset/filters?zoneId=1&amp;assetCategoryId=2&amp;departmentId=3
    /// </summary>
    [HttpGet("filters")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "zoneId", "assetCategoryId", "departmentId" })]
    [ProducesResponseType(typeof(ApiResponse<List<GisAssetFilterGroupDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFilters([FromQuery] int? zoneId, [FromQuery] int? assetCategoryId, [FromQuery] int? departmentId, CancellationToken ct)
    {
        try
        {
            var groups = await _filterService.GetAssetFilterGroupsAsync(zoneId, assetCategoryId, departmentId, ct);
            return Ok(ApiResponse<List<GisAssetFilterGroupDto>>.SuccessResponse(groups, "Asset GIS filters retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Asset GIS filter groups");
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Error retrieving filter groups: {ex.Message}"));
        }
    }

    /// <summary>
    /// Serves Mapbox Vector Tiles (.mvt) or GeoJSON tiles on-the-fly for Mapbox GL JS / MapLibre.
    /// Format: GET /api/gis/asset/tiles/14/11512/7452.mvt?assetCategoryId=1
    /// </summary>
    [HttpGet("tiles/{z:int}/{x:int}/{y:int}.mvt")]
    [HttpGet("tiles/{z:int}/{x:int}/{y:int}.pbf")]
    [AllowAnonymous] // Vector tile stream public tile server endpoint
    [ResponseCache(Duration = 600, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "*" })]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetVectorTile(
        [Range(0, 22)] int z, 
        [Range(0, int.MaxValue)] int x, 
        [Range(0, int.MaxValue)] int y, 
        [FromQuery] GisAssetDataRequestDto? filters, 
        CancellationToken ct)
    {
        try
        {
            var coord = new TileCoordDto(z, x, y);
            var req = filters ?? new GisAssetDataRequestDto();
            var tileBytes = await _tileService.GetAssetTileAsync(coord, req, ct);

            if (tileBytes == null || tileBytes.Length == 0)
                return NoContent();

            return File(tileBytes, "application/json");
        }
        catch (ArgumentOutOfRangeException ex)
        {
            _logger.LogWarning(ex, "Invalid tile coordinates: Z={Z}, X={X}, Y={Y}", z, x, y);
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating asset vector tile at Z={Z}, X={X}, Y={Y}", z, x, y);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Error generating vector tile",
                Errors = new List<string> { "Unable to generate the requested tile." }
            });
        }
    }

    /// <summary>
    /// Point-in-polygon identify endpoint. Identifies the asset at clicked coordinates (Latitude/Longitude).
    /// Format: GET /api/gis/asset/identify?lat=19.249942&amp;lng=72.974292
    /// </summary>
    [HttpGet("identify")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Identify(
        [FromQuery, Range(-90.0, 90.0)] double lat, 
        [FromQuery, Range(-180.0, 180.0)] double lng, 
        CancellationToken ct)
    {
        try
        {
            var assetMasterId = await _tileService.FindAssetIdAtPointAsync(lat, lng, ct);
            if (!assetMasterId.HasValue)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No asset found at the specified location",
                    Errors = new List<string> { $"No geometry intersected Point({lng}, {lat})" }
                });
            }

            var geom = await _tileService.GetAssetGeometryAsync(assetMasterId.Value.ToString(), ct);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Asset identified successfully",
                Items = geom ?? new { assetMasterId = assetMasterId.Value }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error identifying asset at Lat={Lat}, Lng={Lng}", lat, lng);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal error during point-in-polygon identification",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Fetches high-fidelity GeoJSON polygon geometry for a specific asset by AssetMasterId or BuildingId.
    /// Format: GET /api/gis/asset/geometry/101
    /// </summary>
    [HttpGet("geometry/{targetId}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssetGeometry(string targetId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "assetMasterId or buildingId is required"
            });
        }

        try
        {
            var cleanId = Uri.UnescapeDataString(targetId).Trim();
            var geometryObj = await _tileService.GetAssetGeometryAsync(cleanId, ct);
            if (geometryObj == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = $"Geometry not found for target '{cleanId}'"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Asset geometry fetched successfully",
                Items = geometryObj
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching geometry for asset {TargetId}", targetId);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal error fetching asset geometry",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Fetches all 21 structured attributes for the Asset GIS Map Popup by AssetId.
    /// Format: GET /api/gis/asset/AssetPopupDetails?assetId=101
    /// </summary>
    [HttpGet("AssetPopupDetails")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(ApiResponse<GisAssetPopupDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssetPopupDetails([FromQuery] int assetId, CancellationToken ct = default)
    {
        if (assetId <= 0)
        {
            return BadRequest(ApiResponse<GisAssetPopupDetailsDto>.ErrorResponse("A valid positive AssetId is required."));
        }

        try
        {
            var details = await _popupService.GetAssetPopupDetailsAsync(assetId, ct);
            if (details == null)
            {
                return NotFound(ApiResponse<GisAssetPopupDetailsDto>.ErrorResponse($"Asset details not found for AssetId {assetId}."));
            }

            return Ok(ApiResponse<GisAssetPopupDetailsDto>.SuccessResponse(details, "Asset popup details retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching popup details for AssetId {AssetId}", assetId);
            return StatusCode(500, new ApiResponse<GisAssetPopupDetailsDto>
            {
                Success = false,
                Message = "Internal error retrieving asset popup details.",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Exports GIS Asset points and attributes to an Excel (.xlsx) file using URL query parameters.
    /// If no parameters are passed, all council properties are automatically exported.
    /// Format: GET /api/gis/asset/export-excel
    /// Example with filters: GET /api/gis/asset/export-excel?zoneId=1&amp;assetCategoryId=2
    /// </summary>
    [HttpGet("export-excel")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ExportExcel([FromQuery] GisAssetDataRequestDto? filters = null, CancellationToken ct = default)
    {
        try
        {
            var filterReq = filters ?? new GisAssetDataRequestDto();

            if (!IsAdminUser())
            {
                var userId = TryGetCurrentUserId();
                if (userId == null)
                {
                    return StatusCode(StatusCodes.Status403Forbidden,
                        ApiResponse<object>.ErrorResponse("You do not have permission to export GIS asset data."));
                }

                if (_userAccessService != null)
                {
                    var accessList = await GetCurrentUserAccessListAsync(userId.Value, ct);
                    var exportAccess = accessList.Where(a => a.CanExport).ToList();
                    if (!exportAccess.Any())
                    {
                        return StatusCode(StatusCodes.Status403Forbidden,
                            ApiResponse<object>.ErrorResponse("You do not have permission to export GIS asset data."));
                    }

                    var allowedUlbIds = exportAccess.Select(a => a.UlbId).Where(id => id > 0).Distinct().ToList();
                    if (filterReq.UlbId.HasValue && filterReq.UlbId.Value > 0)
                    {
                        if (allowedUlbIds.Any() && !allowedUlbIds.Contains(filterReq.UlbId.Value))
                        {
                            return StatusCode(StatusCodes.Status403Forbidden,
                                ApiResponse<object>.ErrorResponse("You do not have permission to export GIS asset data for this municipality."));
                        }
                    }
                    else if (allowedUlbIds.Any())
                    {
                        filterReq.UlbId = allowedUlbIds.First();
                    }
                }
            }

            var bytes = await _tileService.ExportAssetPointsToExcelAsync(filterReq, ct);
            var fileName = $"GIS_Assets_Export_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating GIS Assets Excel export");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while generating the Excel export: " + ex.Message
            });
        }
    }

    /// <summary>
    /// Reloads asset spatial status and style cache into memory.
    /// </summary>
    [HttpPost("tiles/reload-status")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReloadStatus(CancellationToken ct)
    {
        try
        {
            await _tileService.ReloadStatusCacheAsync(ct);
            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "Asset GIS status cache reloaded successfully",
                Items = "OK"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reloading asset tile status cache");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to reload status cache",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Diagnostic endpoint for spatial tile engine status and memory metrics.
    /// </summary>
    [HttpGet("tiles/debug")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Debug(CancellationToken ct)
    {
        try
        {
            var info = await _tileService.GetDebugInfoAsync(ct);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Debug info fetched successfully",
                Items = info
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset tile engine debug info");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Error retrieving debug info",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// High-performance streaming upload of Asset GeoJSON spatial polygons directly into AMS.GisAssetGeometry.
    /// Supports up to 300k+ polygons with atomic replacement ("replace") or incremental merge ("upsert").
    /// Format: POST /api/gis/asset/upload-geojson?mode=replace
    /// </summary>
    [HttpPost("upload-geojson")]
    [Consumes("multipart/form-data")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 524_288_000)]
    [ProducesResponseType(typeof(ApiResponse<GisAssetUploadResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadAssetGeoJson(
        IFormFile file, 
        [FromQuery] string mode = "replace", 
        [FromQuery] int? ulbId = null,
        CancellationToken ct = default)
    {
        if (!IsAdminUser())
        {
            var userId = TryGetCurrentUserId();
            if (userId == null)
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<object>.ErrorResponse("You do not have permission to upload GIS asset data."));
            }

            if (_userAccessService != null)
            {
                var accessList = await GetCurrentUserAccessListAsync(userId.Value, ct);
                var hasEditAccess = accessList.Any(a => a.CanEdit && (!ulbId.HasValue || a.UlbId == 0 || a.UlbId == ulbId.Value));
                if (!hasEditAccess)
                {
                    return StatusCode(StatusCodes.Status403Forbidden,
                        ApiResponse<object>.ErrorResponse("You do not have permission to upload GIS asset data for this municipality."));
                }

                if (!ulbId.HasValue)
                {
                    var allowedUlbs = accessList.Where(a => a.CanEdit && a.UlbId > 0).Select(a => a.UlbId).Distinct().ToList();
                    if (allowedUlbs.Count == 1)
                    {
                        ulbId = allowedUlbs[0];
                    }
                }
            }
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("No file was uploaded or file is empty."));
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".geojson" && extension != ".json")
        {
            return BadRequest(ApiResponse<object>.ErrorResponse("Invalid file type. Only .geojson or .json spatial files are supported."));
        }

        var user = User.Identity?.Name ?? "Administrator";

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _uploadService.ProcessAssetGeoJsonAsync(stream, file.FileName, user, mode, ulbId, ct);
            return Ok(ApiResponse<GisAssetUploadResultDto>.SuccessResponse(result, result.Message));
        }
        catch (InvalidDataException ex)
        {
            _logger.LogWarning(ex, "Invalid GeoJSON data uploaded: {Message}", ex.Message);
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Asset GeoJSON upload for file '{FileName}'", file.FileName);
            return StatusCode(500, ApiResponse<object>.ErrorResponse($"Failed to process Asset GeoJSON: {ex.Message}"));
        }
    }
}
