using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management.AssetUserAllocation;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Api.Controllers.Asset_Management;

/// <summary>
/// Lists Asset Management users and maintains their allocations: owning departments (with designation) in
/// [AMS].[UserOwningDepartmentAllocation], zone wards (one row per ward) in [AMS].[UserZoneAllocation] and
/// grievance workflow stages (user-level rows) in [AMS].[StageAccessControl].
/// </summary>
/// <remarks>
/// The allocations are stored only — they do not yet limit what a user sees anywhere else (grievance lists, for
/// example, are not filtered by them).
/// </remarks>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssetUserAllocationController : ControllerBase
{
    private readonly IAssetUserAllocationService _service;
    private readonly ILogger<AssetUserAllocationController> _logger;

    public AssetUserAllocationController(
        IAssetUserAllocationService service,
        ILogger<AssetUserAllocationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Paged list of active users allocated to the "Asset Management" department, each with their user
    /// details, Asset Management department and role, owning departments, allocated zones and stage access.
    /// </summary>
    /// <remarks>
    /// Returns the same paged shape as GET /api/users ({ items, totalCount, pageNumber, pageSize, ... }).
    /// Inactive (locked) users are not listed. PageSize = -1 returns all rows on one page, up to 5,000 (a larger
    /// result reports its real totalCount and hasNext; page through the rest). SearchTerm matches userName,
    /// first/middle/last name, userCode, email and mobileNo. The nested lists carry only ids and names:
    /// roleAllocations { userRoleId, userRoleName }, owningDepartments { owningDepartmentId, owningDepartmentName,
    /// designationId, designationName }, zoneAllocations { zoneId, zoneNo, zoneDescription, allocatedWardCount },
    /// one entry per zone, and stageAccess { stageId, stageCode, stageName }, one entry per stage in workflow order.
    /// The full allocation rows, with one entry per ward, are returned by GET /api/AssetUserAllocation/{userId}.
    ///
    ///     GET /api/AssetUserAllocation/GetAllUserList?PageNumber=1&amp;PageSize=10&amp;SearchTerm=awais&amp;SortBy=UserName&amp;SortOrder=asc
    /// </remarks>
    [HttpGet("GetAllUserList")]
    [ProducesResponseType(typeof(PagedResult<AssetUserListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllUserList([FromQuery] AssetUserListQueryParameters queryParameters, CancellationToken ct)
    {
        try
        {
            return Ok(await _service.GetAllUserListAsync(queryParameters, ct));
        }
        catch (FilterValidationException ex)
        {
            _logger.LogWarning(ex, "Invalid asset user list query: {Message}", ex.Message);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message,
                Errors = ex.Errors.Values.ToList()
            });
        }
    }

    /// <summary>
    /// Returns the user's active owning departments, zone allocations (one entry per ward) and stage access
    /// (empty lists when none).
    /// </summary>
    [HttpGet("{userId:int}")]
    [ProducesResponseType(typeof(ApiResponse<AssetUserAllocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public Task<IActionResult> GetByUserId(int userId, CancellationToken ct)
        => ExecuteAsync(
            userId,
            () => _service.GetByUserIdAsync(userId, ct),
            "Asset user allocations retrieved successfully");

    /// <summary>
    /// Saves the user's owning departments, zones and stage access in one transaction.
    /// </summary>
    /// <remarks>
    /// Each list that is sent is the complete set of that kind (sync, not append): one
    /// UserOwningDepartmentAllocation row per department (designation optional, must belong to that department),
    /// one UserZoneAllocation row per ward and one StageAccessControl row per stage (UserId = the user, no
    /// designation; CanTakeAction = 1 on a new row). A zone sent without wardIds allocates every active ward of that
    /// zone; a zone sent with wardIds allocates only those wards (each must belong to that zone).
    /// Departments/wards/stages not listed are deactivated (kept as history); listed ones re-use their existing row
    /// or are inserted. Send [] to remove all of a kind; leave a list out to keep that kind unchanged. Unknown
    /// fields are rejected with 400. CreatedBy / UpdatedBy are the authenticated caller (from the token), never
    /// body fields. Concurrent saves of the same user apply one after the other; 409 means another request
    /// inserted the same row first — reload and retry.
    ///
    ///     POST /api/AssetUserAllocation
    ///     {
    ///         "userId": 7,
    ///         "owningDepartments": [
    ///             { "owningDepartmentId": 1, "designationId": 4 },
    ///             { "owningDepartmentId": 3 }
    ///         ],
    ///         "zoneAllocations": [
    ///             { "zoneId": 2 },
    ///             { "zoneId": 5, "wardIds": [27, 28] }
    ///         ],
    ///         "stageAccess": [
    ///             { "stageId": 1 },
    ///             { "stageId": 2 }
    ///         ]
    ///     }
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AssetUserAllocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public Task<IActionResult> Save([FromBody] SaveAssetUserAllocationDto dto, CancellationToken ct)
        => ExecuteAsync(
            dto.UserId,
            () => _service.SaveAsync(dto, ct),
            "Asset user allocations saved successfully");

    /// <summary>
    /// Updates the user's owning departments, zones and stage access — same behaviour and validation as POST,
    /// with the user taken from the route.
    /// </summary>
    /// <remarks>
    ///     PUT /api/AssetUserAllocation/7
    ///     {
    ///         "owningDepartments": [ { "owningDepartmentId": 1, "designationId": 4 } ],
    ///         "zoneAllocations": [ { "zoneId": 2 }, { "zoneId": 5, "wardIds": [27] } ],
    ///         "stageAccess": [ { "stageId": 2 } ]
    ///     }
    /// </remarks>
    [HttpPut("{userId:int}")]
    [ProducesResponseType(typeof(ApiResponse<AssetUserAllocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public Task<IActionResult> Update(int userId, [FromBody] UpdateAssetUserAllocationDto dto, CancellationToken ct)
        => ExecuteAsync(
            userId,
            () => _service.UpdateAsync(userId, dto, ct),
            "Asset user allocations updated successfully");

    // Maps the service's expected failures to ApiResponse bodies with their real message; anything else
    // (including database errors that are not an allocation conflict) falls through to GlobalExceptionHandlerMiddleware.
    private async Task<IActionResult> ExecuteAsync(int userId, Func<Task<AssetUserAllocationDto>> action, string successMessage)
    {
        try
        {
            var result = await action();
            return Ok(new ApiResponse<AssetUserAllocationDto>
            {
                Success = true,
                Message = successMessage,
                Items = result
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid asset user allocation request for UserId {UserId}", userId);
            return BadRequest(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // The service raises this only when another writer inserted the same (UserId, OwningDepartmentId) /
            // (UserId, ZoneId, WardId) row first. Nothing was saved. Other DbUpdateExceptions are real errors.
            _logger.LogWarning(ex, "Concurrent asset user allocation update for UserId {UserId}", userId);
            return Conflict(new ApiResponse<object> { Success = false, Message = ex.Message });
        }
    }
}
