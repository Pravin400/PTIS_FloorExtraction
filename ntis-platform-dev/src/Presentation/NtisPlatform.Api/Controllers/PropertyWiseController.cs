using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Controller for managing property-wise zone and ward allocations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PropertyWiseController : ControllerBase
{
    private readonly IPropertyWiseService _service;
    private readonly ILogger<PropertyWiseController> _logger;

    public PropertyWiseController(
        IPropertyWiseService service,
        ILogger<PropertyWiseController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a paginated list of property-wise allocations based on query parameters.
    /// </summary>
    /// <param name="queryParameters">Query filters and pagination options.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with paginated list of PropertyWiseDto items.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PropertyWiseDto>), StatusCodes.Status200OK)]
    public Task<IActionResult> GetAll([FromQuery] PropertyWiseQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Retrieves a single property-wise allocation by its unique identifier.
    /// </summary>
    /// <param name="id">The allocation record ID.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with PropertyWiseDto, or 404 NotFound if not found.</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PropertyWiseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Creates one or more property-wise allocations for a user with range validations.
    /// </summary>
    /// <param name="createDto">Allocation creation parameters including user, department, module, property ranges, and zones/wards.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with created allocations, 400 BadRequest on validation failure, or 409 Conflict on duplicate allocation.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<List<PropertyWiseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreatePropertyWiseDto createDto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _service.CreateAllocationsAsync(createDto, ct);
        return Ok(new ApiResponse<List<PropertyWiseDto>>
        {
            Success = true,
            Message = "Property wise allocations created successfully.",
            Items = result
        });
    }

    /// <summary>
    /// Updates an existing property-wise allocation record.
    /// </summary>
    /// <param name="id">The allocation record ID to update.</param>
    /// <param name="updateDto">Updated allocation parameters.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with updated PropertyWiseDto, 400 BadRequest on validation failure, or 404 NotFound.</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<PropertyWiseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePropertyWiseDto updateDto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        return await this.ExecuteUpdate(_service, id, updateDto, _logger, ct);
    }

    /// <summary>
    /// Updates multiple property-wise allocation records in bulk.
    /// </summary>
    /// <param name="items">Collection of update items containing record IDs and payloads.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with bulk update result, or 400 BadRequest.</returns>
    [HttpPut("Bulk")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<IActionResult> BulkUpdate([FromBody] BulkUpdateItem<int, UpdatePropertyWiseDto>[] items, CancellationToken ct)
        => this.ExecuteBulkUpdate(_service, items, _logger, ct);

    /// <summary>
    /// Deletes a property-wise allocation record by its ID.
    /// </summary>
    /// <param name="id">The allocation record ID to delete.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK if successfully deleted, or 404 NotFound.</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    /// <summary>
    /// Deletes multiple property-wise allocation records by their IDs in bulk.
    /// </summary>
    /// <param name="ids">Array of allocation record IDs to delete.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with bulk deletion status.</returns>
    [HttpDelete("Bulk")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public Task<IActionResult> BulkDelete([FromBody] int[] ids, CancellationToken ct)
        => this.ExecuteBulkDelete(_service, ids, _logger, ct);
}