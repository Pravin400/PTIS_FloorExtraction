using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.DTOs.Asset_Management.AssetFieldValue;

namespace NtisPlatform.Api.Controllers.Asset_Management;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssetMasterController : ControllerBase
{
    private readonly ILogger<AssetMasterController> _logger;
    private readonly IAssetMasterService _service;
   
    #region Constructor

    public AssetMasterController(
        ILogger<AssetMasterController> logger,
        IAssetMasterService service)
    {
        _logger = logger;
        _service = service;
    }

    #endregion

    #region Main CRUD Operations

    /// <summary>
    /// Gets all asset masters with pagination.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AssetMasterDto>), StatusCodes.Status200OK)]
    public Task<IActionResult> GetAll([FromQuery] AssetMasterQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Gets asset master by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AssetMasterDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Creates a new asset master with optional field values and photos.
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<AssetMasterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AssetMasterDto>), StatusCodes.Status409Conflict)]
    public Task<IActionResult> Create([FromForm] CreateAssetMasterDto createDto, CancellationToken ct)
        => this.ExecuteCreate(_service, createDto, _logger, ct);

    /// <summary>
    /// Updates an existing asset master with optional field values and photos.
    /// </summary>
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<AssetMasterDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Update(int id, [FromForm] UpdateAssetMasterDto updateDto, CancellationToken ct)
        => this.ExecuteUpdate(_service, id, updateDto, _logger, ct);

    /// <summary>
    /// Soft delete: Marks the record as deleted (IsActive=false).
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    #endregion

    #region Custom Endpoints

    /// <summary>
    /// Exports filtered asset master records to an Excel spreadsheet.
    /// </summary>
    [HttpGet("export-excel")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ExportExcel([FromQuery] AssetMasterQueryParameters queryParameters, CancellationToken ct)
    {
        var bytes = await _service.ExportToExcelAsync(queryParameters, ct);
        var fileName = $"AssetMaster_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// Gets the paged main-asset list for the Asset Register grid: each main asset with its sub-unit
    /// count, area, construction, custodian, rent, valuation, outstanding and document roll-ups, and
    /// its uploaded photo / document files identified by DocumentGuid, plus summary totals over the
    /// whole filtered set. Accepts the same filters, search and sort as
    /// GetAll; ParentAssetId is ignored. List filters take repeated keys, e.g.
    /// <c>?AssetCategoryId=1&amp;AssetTypeId=11&amp;AssetTypeId=12&amp;EncroachmentStatus=Encroached</c>.
    /// </summary>
    [HttpGet("parent-asset-details")]
    [ProducesResponseType(typeof(ParentAssetListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetParentAssetDetails([FromQuery] AssetMasterQueryParameters queryParameters, CancellationToken ct)
    {
        try
        {
            var result = await _service.GetParentAssetDetailsAsync(queryParameters, ct);
            return Ok(result);
        }
        catch (FilterValidationException ex)
        {
            _logger.LogWarning(ex, "Filter validation failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message, errors = ex.Errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetParentAssetDetails operation failed");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<ParentAssetListResponseDto>
            {
                Success = false,
                Message = "An error occurred while processing your request."
            });
        }
    }

    /// <summary>
    /// Gets the combined payload for the floor and other details tab in a single call.
    /// </summary>
    [HttpGet("parent/{parentAssetId:int}/floor-and-other-details")]
    [ProducesResponseType(typeof(ApiResponse<AssetFloorAndOtherDetailsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetFloorAndOtherDetails(int parentAssetId, CancellationToken ct)
    {
        if (parentAssetId <= 0)
        {
            return BadRequest(new ApiResponse<AssetFloorAndOtherDetailsResponseDto>
            {
                Success = false,
                Message = "Parent asset ID must be greater than zero."
            });
        }

        var asset = await _service.GetAssetFloorAndOtherDetailsAsync(parentAssetId, ct);
        if (asset == null)
        {
            return NotFound();
        }

        return Ok(new ApiResponse<AssetFloorAndOtherDetailsResponseDto>
        {
            Success = true,
            Items = asset,
            Message = "Asset floor and other details retrieved successfully."
        });
    }

    /// <summary>
    /// Gets one page of the sub-units of a parent asset (inventory items excluded), each with its
    /// floor / sub-floor details and the uploaded photo and document files, identified by DocumentGuid.
    /// </summary>
    /// <param name="parentAssetId">The parent asset ID.</param>
    /// <param name="queryParameters">
    /// PageNumber / PageSize (max 100, -1 for all); SearchTerm matches unit number, name, regional
    /// name or active-lease tenant; SortBy = AssetNo (default), AssetName or CreatedDate with
    /// SortOrder asc/desc; ActiveOnly = true returns only active sub-units (the Sub Unit Details grid
    /// rows), otherwise generated units that are not configured yet are included too.
    /// </param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("parent/{parentAssetId:int}/sub-unit-details")]
    [ProducesResponseType(typeof(ParentSubUnitDetailsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubUnitDetailsByParent(int parentAssetId, [FromQuery] SubUnitDetailsQueryParameters queryParameters, CancellationToken ct)
    {
        if (parentAssetId <= 0)
        {
            return BadRequest(new ApiResponse<ParentSubUnitDetailsResponseDto>
            {
                Success = false,
                Message = "Parent asset ID must be greater than zero."
            });
        }

        ParentSubUnitDetailsResponseDto? result;
        try
        {
            result = await _service.GetSubUnitDetailsByParentAsync(parentAssetId, queryParameters, ct);
        }
        catch (FilterValidationException ex)
        {
            _logger.LogWarning(ex, "Filter validation failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message, errors = ex.Errors });
        }

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Gets all sub-assets grouped by parent asset ID with their related floor details,
    /// room-wise submissions, and renter details.
    /// </summary>
    /// <param name="parentAssetId">The parent asset ID to get sub-assets for.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A grouped response containing parent asset info and all sub-assets with related details.</returns>
    [HttpGet("parent/{parentAssetId}/sub-assets")]
    [ProducesResponseType(typeof(SubAssetGroupedResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSubAssetsGroupedByParent(int parentAssetId, CancellationToken ct)
    {
        if (parentAssetId <= 0)
        {
            return BadRequest(new ApiResponse<SubAssetGroupedResponseDto>
            {
                Success = false,
                Message = "Parent asset ID must be greater than zero."
            });
        }

        var result = await _service.GetSubAssetsGroupedByParentAsync(parentAssetId, ct);
        return Ok(result);
    }

    /// <summary>
    /// Computes a real HealthScore for each of the given asset ids in one batch — primarily for
    /// child/sub-unit rows, which are full AssetMaster rows in their own right but aren't included
    /// in a parent's paginated list response and so never otherwise get a computed health score.
    /// </summary>
    [HttpPost("health-scores/batch")]
    [ProducesResponseType(typeof(List<AssetHealthScoreDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetHealthScoresBatch([FromBody] List<int> assetIds, CancellationToken ct)
    {
        if (assetIds == null || assetIds.Count == 0)
        {
            return Ok(new List<AssetHealthScoreDto>());
        }

        const int maxBatchSize = 500;
        if (assetIds.Count > maxBatchSize)
        {
            return BadRequest(new ApiResponse<string>
            {
                Success = false,
                Message = $"Batch size exceeds maximum limit of {maxBatchSize} asset IDs."
            });
        }

        var result = await _service.GetHealthScoresBatchAsync(assetIds, ct);
        return Ok(result);
    }

    /// <summary>
    /// Activates asset master record, all field values for the asset, and child assets where ParentAssetId equals the asset id.
    /// </summary>
    [HttpPut("{assetId:int}/activate")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateAsset(int assetId, CancellationToken ct)
    {
        var isUpdated = await _service.ActivateAssetAndFieldValuesAsync(assetId, ct);
        if (!isUpdated)
        {
            return NotFound();
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "Asset activated successfully.",
            Items = true
        });
    }

    /// <summary>
    /// Bulk save dynamic field values for an asset.
    /// </summary>
    [HttpPost("{assetId:int}/field-values/bulk")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BulkSaveFieldValues(int assetId, [FromBody] List<CreateAssetFieldValueDto> fieldValues, CancellationToken ct)
    {
        var success = await _service.BulkSaveFieldValuesAsync(assetId, fieldValues, ct);
        if (!success)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<bool>
            {
                Success = false,
                Message = "Failed to bulk save field values."
            });
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "Field values bulk saved successfully.",
            Items = true
        });
    }

    #endregion
}
