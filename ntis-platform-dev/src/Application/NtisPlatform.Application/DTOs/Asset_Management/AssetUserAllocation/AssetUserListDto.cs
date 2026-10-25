using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Master.UserMaster;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Application.Enums;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetUserAllocation;

// GET /api/AssetUserAllocation/GetAllUserList
// One row per active user allocated to the "Asset Management" department. Field names match the AssetUser
// shape the Asset User Master grid reads (user fields, departments, roleAllocations, owningDepartments,
// zoneAllocations, stageAccess). roleAllocations, owningDepartments, zoneAllocations and stageAccess carry only
// the ids and names the grid shows — no row ids, audit dates or wards; GET /api/AssetUserAllocation/{userId}
// returns the full rows.

public class AssetUserListItemDto : BaseDtos
{
    public string UserName { get; set; } = null!;
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? UserCode { get; set; }
    public string? Address { get; set; }
    public string? MobileNo { get; set; }
    public string? AlternateMobileNo { get; set; }
    public string? Email { get; set; }
    public int? EmployeeTypeID { get; set; }
    public string? Language { get; set; }
    public string? Remark { get; set; }
    public bool MustChangePassword { get; set; }

    /// <summary>The user's active Asset Management department allocation(s) from CORE.UserDepartmentAllocation.</summary>
    public List<UserDepartmentAllocationDto> Departments { get; set; } = [];

    /// <summary>The user's active roles within the Asset Management department, one entry per role.</summary>
    public List<AssetUserRoleDto> RoleAllocations { get; set; } = [];

    /// <summary>The user's active owning departments ([AMS].[UserOwningDepartmentAllocation]) with their designation.</summary>
    public List<AssetUserOwningDepartmentDto> OwningDepartments { get; set; } = [];

    /// <summary>
    /// The zones the user has at least one active ward in, one entry per zone (no wards — GET /{userId} lists them).
    /// </summary>
    public List<AssetUserZoneDto> ZoneAllocations { get; set; } = [];

    /// <summary>
    /// The grievance workflow stages the user has direct access to (active user-level [AMS].[StageAccessControl]
    /// rows), one entry per stage, in workflow order.
    /// </summary>
    public List<AssetUserStageDto> StageAccess { get; set; } = [];
}

/// <summary>A role in the user list: the user has an active CORE.UserRoleAllocation row for it in Asset Management.</summary>
public class AssetUserRoleDto
{
    public int UserRoleId { get; set; }
    public string? UserRoleName { get; set; }
}

/// <summary>An owning department in the user list, with the user's designation in it (null when none).</summary>
public class AssetUserOwningDepartmentDto
{
    public int OwningDepartmentId { get; set; }
    public string? OwningDepartmentName { get; set; }
    public int? DesignationId { get; set; }
    public string? DesignationName { get; set; }
}

/// <summary>A zone in the user list: the user has at least one active [AMS].[UserZoneAllocation] row in it.</summary>
public class AssetUserZoneDto
{
    public int ZoneId { get; set; }
    public string? ZoneNo { get; set; }
    public string? ZoneDescription { get; set; }

    /// <summary>How many wards of this zone the user is allocated (active [AMS].[UserZoneAllocation] rows).</summary>
    public int AllocatedWardCount { get; set; }
}

/// <summary>A grievance workflow stage in the user list: the user has an active user-level [AMS].[StageAccessControl] row for it.</summary>
public class AssetUserStageDto
{
    public int StageId { get; set; }
    public string? StageCode { get; set; }
    public string? StageName { get; set; }
}

/// <summary>
/// Paging/search/sort for GetAllUserList. Property names match UserEntity so the shared
/// ApplyFilters / ApplySearch / ApplySort extensions can bind them. PageSize = -1 returns all rows.
/// There is no IsActive filter: the list returns active users only.
/// </summary>
public class AssetUserListQueryParameters : BaseQueryParameters
{
    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? UserName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? FirstName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? MiddleName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? LastName { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? UserCode { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? Email { get; set; }

    [Filterable(FilterOperator.Contains)]
    [Searchable]
    [Sortable]
    public string? MobileNo { get; set; }
}
