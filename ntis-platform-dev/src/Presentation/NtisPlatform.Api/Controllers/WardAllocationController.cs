using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NtisPlatform.Api.Extensions;
using NtisPlatform.Application.DTOs.Bulk;
using NtisPlatform.Application.DTOs.wardallocation;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Api.Controllers;

/// <summary>
/// Controller handling ward allocation endpoints, dropdown lookups, and batch operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WardAllocationController : ControllerBase
{
    private readonly IWardAllocationService _service;
    private readonly ILogger<WardAllocationController> _logger;

    public WardAllocationController(
        IWardAllocationService service,
        ILogger<WardAllocationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a paginated list of ward allocations based on filters, search query, and sorting criteria.
    /// </summary>
    /// <param name="queryParameters">Filters, search, sorting, and pagination parameters.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with PagedResult of WardAllocationDto, or 400 Bad Request on invalid query parameters.</returns>
    [HttpGet]
    public Task<IActionResult> GetAll([FromQuery] WardAllocationQueryParameters queryParameters, CancellationToken ct)
        => this.ExecuteGetAllPaged(_service, queryParameters, _logger, ct);

    /// <summary>
    /// Retrieves a specific ward allocation record by its unique identifier.
    /// </summary>
    /// <param name="id">Unique identifier of the ward allocation.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with WardAllocationDto, or 404 Not Found if the record does not exist.</returns>
    [HttpGet("{id:int}")]
    public Task<IActionResult> GetById(int id, CancellationToken ct)
        => this.ExecuteGetById(_service, id, _logger, ct);

    /// <summary>
    /// Creates one or more flexible ward allocations for a specified user, department, and module.
    /// </summary>
    /// <param name="createDto">The flexible ward allocation creation data containing zone and ward allocations.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with created allocation details, or 400 Bad Request on validation error or allocation conflict.</returns>
    [HttpPost]
    public async Task<IActionResult> CreateFlexible([FromBody] CreateFlexibleWardAllocationDto createDto, CancellationToken ct)
    {
        var result = await _service.CreateFlexibleAsync(createDto, ct);

        var zoneCount = createDto?.Allocations?.Count ?? 0;
        var wardCount = result.Count;

        var summary = zoneCount == 1
            ? $"{wardCount} ward allocation(s) created in 1 zone"
            : $"{wardCount} ward allocation(s) created across {zoneCount} zones";

        return Ok(new
        {
            success = true,
            message = summary,
            totalAllocations = wardCount,
            zonesAffected = zoneCount,
            items = result
        });
    }

    /// <summary>
    /// Updates or replaces ward allocations for a user and module.
    /// </summary>
    /// <param name="id">The allocation ID to update.</param>
    /// <param name="updateDto">The updated flexible ward allocation details.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with updated allocation details, 400 Bad Request on validation error, or 404 Not Found.</returns>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFlexibleWardAllocationDto updateDto, CancellationToken ct)
    {
        var result = await _service.ReplaceAllocationsAsync(id, updateDto.UserId, updateDto.ModuleId, updateDto, ct);

        var zoneCount = updateDto?.Allocations?.Count ?? 0;
        var wardCount = result.Count;

        var summary = zoneCount == 1
            ? $"{wardCount} ward allocation(s) updated in 1 zone"
            : $"{wardCount} ward allocation(s) updated across {zoneCount} zones";

        return Ok(new
        {
            success = true,
            message = summary,
            totalAllocations = wardCount,
            zonesAffected = zoneCount,
            existingAllocationId = id,
            items = result
        });
    }

    /// <summary>
    /// Performs bulk updates on multiple ward allocation records.
    /// </summary>
    /// <param name="items">Array of bulk update items containing record IDs and update payloads.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with bulk update operation results, or 400 Bad Request on validation errors.</returns>
    [HttpPut("Bulk")]
    public Task<IActionResult> BulkUpdate([FromBody] BulkUpdateItem<int, UpdateWardAllocationDto>[] items, CancellationToken ct)
        => this.ExecuteBulkUpdate(_service, items, _logger, ct);

    /// <summary>
    /// Deletes a ward allocation record by its unique identifier.
    /// </summary>
    /// <param name="id">Unique identifier of the ward allocation record to delete.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with deletion confirmation, 404 Not Found if the record does not exist, or 400 Bad Request if referenced by other entities.</returns>
    [HttpDelete("{id:int}")]
    public Task<IActionResult> Delete(int id, CancellationToken ct)
        => this.ExecuteDelete(_service, id, _logger, ct);

    /// <summary>
    /// Deletes multiple ward allocation records in a batch operation.
    /// </summary>
    /// <param name="ids">Array of ward allocation IDs to delete.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with bulk deletion operation results.</returns>
    [HttpDelete("Bulk")]
    public Task<IActionResult> BulkDelete([FromBody] int[] ids, CancellationToken ct)
        => this.ExecuteBulkDelete(_service, ids, _logger, ct);

    /// <summary>
    /// Retrieves all employees (both active and inactive) for ward allocation.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of WardAllocationEmployeeDto.</returns>
    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees(CancellationToken ct)
        => Ok(await _service.GetEmployeesAsync(ct));

    /// <summary>
    /// Retrieves all active employees available for ward allocation.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of WardAllocationEmployeeDto.</returns>
    [HttpGet("employees/active")]
    public async Task<IActionResult> GetActiveEmployees(CancellationToken ct)
        => Ok(await _service.GetActiveEmployeesAsync(ct));

    /// <summary>
    /// Retrieves all inactive employees for reference.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of WardAllocationEmployeeDto.</returns>
    [HttpGet("employees/inactive")]
    public async Task<IActionResult> GetInactiveEmployees(CancellationToken ct)
        => Ok(await _service.GetInactiveEmployeesAsync(ct));

    /// <summary>
    /// Retrieves active modules and departments allocated to a specific user.
    /// </summary>
    /// <param name="userId">Unique identifier of the user.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of WardAllocationModuleDto, or 400 Bad Request if userId is invalid.</returns>
    [HttpGet("modules/{userId:int}")]
    public async Task<IActionResult> GetModulesByUserId(int userId, CancellationToken ct)
        => Ok(await _service.GetModulesByUserIdAsync(userId, ct));

    /// <summary>
    /// Retrieves all active zones for ward allocation dropdowns.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of WardAllocationZoneDto.</returns>
    [HttpGet("zones")]
    public async Task<IActionResult> GetZones(CancellationToken ct)
        => Ok(await _service.GetZonesAsync(ct));

    /// <summary>
    /// Retrieves all active wards belonging to a specific zone.
    /// </summary>
    /// <param name="zoneId">Unique identifier of the zone.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of WardAllocationWardDto, or 400 Bad Request if zoneId is invalid.</returns>
    [HttpGet("wards/{zoneId:int}")]
    public async Task<IActionResult> GetWardsByZoneId(int zoneId, CancellationToken ct)
        => Ok(await _service.GetWardsByZoneIdAsync(zoneId, ct));

    /// <summary>
    /// Retrieves all active departments for ward allocation dropdowns.
    /// </summary>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of WardAllocationDepartmentDto.</returns>
    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments(CancellationToken ct)
        => Ok(await _service.GetDepartmentsAsync(ct));

    /// <summary>
    /// Retrieves a hierarchical list of zones and wards allocated to a specific user.
    /// </summary>
    /// <param name="userId">Unique identifier of the user.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of UserAllocatedZoneWardDto, or 400 Bad Request if userId is invalid.</returns>
    [HttpGet("allocated-zones-wards/{userId:int}")]
    public async Task<IActionResult> GetAllocatedZonesAndWardsByUserId(int userId, CancellationToken ct)
        => Ok(await _service.GetAllocatedZonesAndWardsByUserIdAsync(userId, ct));

    /// <summary>
    /// Retrieves a flat list of zones allocated to a specific user grouped by module.
    /// </summary>
    /// <param name="userId">Unique identifier of the user.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of AllocatedZoneByUserDto, or 400 Bad Request if userId is invalid.</returns>
    [HttpGet("allocated-zones/{userId:int}")]
    public async Task<IActionResult> GetAllocatedZonesByUserId(int userId, CancellationToken ct)
        => Ok(await _service.GetAllocatedZonesByUserIdAsync(userId, ct));

    /// <summary>
    /// Retrieves a distinct list of wards allocated to a specific user.
    /// </summary>
    /// <param name="userId">Unique identifier of the user.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of AllocatedWardByUserDto, or 400 Bad Request if userId is invalid.</returns>
    [HttpGet("allocated-wards/{userId:int}")]
    public async Task<IActionResult> GetAllocatedWardsByUserId(int userId, CancellationToken ct)
        => Ok(await _service.GetAllocatedWardsByUserIdAsync(userId, ct));

    /// <summary>
    /// Retrieves old wards mapped to a specific ward ID with optional user filter.
    /// </summary>
    /// <param name="wardId">Unique identifier of the ward.</param>
    /// <param name="userId">Optional user ID filter.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>200 OK with a list of OldWardByWardDto, or 400 Bad Request if wardId is invalid.</returns>
    [HttpGet("wards/{wardId:int}/old-wards")]
    public async Task<IActionResult> GetOldWardsByWardId(int wardId, [FromQuery] int? userId, CancellationToken ct)
        => Ok(await _service.GetOldWardsByWardIdAsync(wardId, userId, ct));
}