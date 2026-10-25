using NtisPlatform.Application.DTOs.Asset_Management.AssetUserAllocation;
using NtisPlatform.Application.Models;

namespace NtisPlatform.Application.Interfaces.Asset_Management;

/// <summary>
/// Lists Asset Management users and maintains their allocations: owning departments (with designation)
/// in [AMS].[UserOwningDepartmentAllocation], zones (with ward) in [AMS].[UserZoneAllocation] and grievance
/// workflow stages in [AMS].[StageAccessControl] (user-level rows). The allocations are stored only — nothing
/// filters what a user sees by them yet.
/// </summary>
public interface IAssetUserAllocationService
{
    /// <summary>
    /// Paged list of active users (not locked, not marked for deletion) with an active allocation to the
    /// "Asset Management" department (CORE.UserDepartmentAllocation), each with that department, their roles in
    /// it, their active owning departments, the zones they have active wards in (one entry per zone with its
    /// allocated ward count, no wards) and the grievance workflow stages they have direct access to (one entry per
    /// stage). Roles, owning departments, zones and stages carry only ids and names;
    /// <see cref="GetByUserIdAsync"/> returns full rows.
    /// </summary>
    /// <exception cref="Exceptions.FilterValidationException">SortBy names a field that is not sortable.</exception>
    Task<PagedResult<AssetUserListItemDto>> GetAllUserListAsync(
        AssetUserListQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the user's active owning-department, zone (one entry per ward) and stage-access (one entry per
    /// stage, user-level rows only) allocations (empty lists when none).
    /// </summary>
    /// <exception cref="KeyNotFoundException">User does not exist or is marked for deletion.</exception>
    Task<AssetUserAllocationDto> GetByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Syncs the user's rows to the request in one transaction that first locks the user's CORE.UserMaster row:
    /// for each list that is sent, departments/wards/stages not listed are deactivated, listed ones re-use their
    /// existing row (re-activated and updated) or are inserted. A list left out (null) is not touched; [] removes
    /// all of it. CreatedBy / UpdatedBy are the authenticated caller. Returns the user's allocations after the save.
    /// </summary>
    /// <exception cref="KeyNotFoundException">User does not exist or is marked for deletion.</exception>
    /// <exception cref="ArgumentException">
    /// A non-positive id, a department listed twice with different designations, a newly allocated
    /// department/designation/zone/ward/stage that is missing or inactive, a designation outside its department,
    /// a ward outside its zone, or a whole zone with no active ward. (A zone listed twice gets the union of its wards.)
    /// </exception>
    /// <exception cref="UnauthorizedAccessException">The token carries no valid staff user id.</exception>
    /// <exception cref="Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException">
    /// Another writer inserted the same allocation row first; nothing was saved.
    /// </exception>
    Task<AssetUserAllocationDto> SaveAsync(
        SaveAssetUserAllocationDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Same as <see cref="SaveAsync"/> for the user given by <paramref name="userId"/>
    /// (PUT /api/AssetUserAllocation/{userId}); the audit user is the authenticated caller.
    /// </summary>
    /// <exception cref="KeyNotFoundException">User does not exist or is marked for deletion.</exception>
    /// <exception cref="ArgumentException">Same validation as <see cref="SaveAsync"/>.</exception>
    /// <exception cref="UnauthorizedAccessException">The token carries no valid staff user id.</exception>
    /// <exception cref="Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException">Same as <see cref="SaveAsync"/>.</exception>
    Task<AssetUserAllocationDto> UpdateAsync(
        int userId,
        UpdateAssetUserAllocationDto dto,
        CancellationToken cancellationToken = default);
}
