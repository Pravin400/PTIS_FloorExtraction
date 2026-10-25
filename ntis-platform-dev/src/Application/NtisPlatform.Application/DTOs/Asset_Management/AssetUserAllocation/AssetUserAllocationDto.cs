using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace NtisPlatform.Application.DTOs.Asset_Management.AssetUserAllocation;

// READ DTOs
// Field names match the owningDepartments / zoneAllocations shape the Asset User Master screen reads.

/// <summary>One active row of [AMS].[UserOwningDepartmentAllocation] (Id = row id).</summary>
public class UserOwningDepartmentAllocationDto : BaseDtos
{
    public int UserId { get; set; }
    public int OwningDepartmentId { get; set; }
    public string? OwningDepartmentName { get; set; }
    public int? DesignationId { get; set; }
    public string? DesignationName { get; set; }
}

/// <summary>One active row of [AMS].[UserZoneAllocation] (Id = row id): one allocated ward and its zone.</summary>
public class UserZoneAllocationDto : BaseDtos
{
    public int UserId { get; set; }
    public int ZoneId { get; set; }
    public string? ZoneNo { get; set; }
    public string? ZoneDescription { get; set; }
    public int WardId { get; set; }
    public string? WardNo { get; set; }
    public string? WardDescription { get; set; }
}

/// <summary>
/// One active user-level row of [AMS].[StageAccessControl] (Id = row id): a grievance workflow stage the user is
/// allocated to directly (UserId = the user, DesignationId null).
/// </summary>
public class UserStageAccessAllocationDto : BaseDtos
{
    public int UserId { get; set; }
    public int StageId { get; set; }
    public string? StageCode { get; set; }
    public string? StageName { get; set; }
}

/// <summary>A user's active owning-department, zone and stage-access allocations.</summary>
public class AssetUserAllocationDto
{
    public int UserId { get; set; }
    public List<UserOwningDepartmentAllocationDto> OwningDepartments { get; set; } = [];
    public List<UserZoneAllocationDto> ZoneAllocations { get; set; } = [];
    public List<UserStageAccessAllocationDto> StageAccess { get; set; } = [];
}

// WRITE DTOs
// Unknown JSON properties are rejected (400) instead of ignored: a body with misspelt or old field names
// (e.g. owningDepartmentIds, or wardId instead of wardIds) must not silently change a user's access.

/// <summary>One owning department for the user, with the user's designation in it (optional).</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class OwningDepartmentAllocationItemDto
{
    [Range(1, int.MaxValue, ErrorMessage = "OwningDepartmentId_Required")]
    public int OwningDepartmentId { get; set; }

    /// <summary>Must belong to <see cref="OwningDepartmentId"/> (DesignationMaster.OwningDepartmentId).</summary>
    public int? DesignationId { get; set; }
}

/// <summary>
/// One zone for the user: either the whole zone (<see cref="WardIds"/> null or []) — every active ward of the
/// zone is allocated — or only the wards listed in <see cref="WardIds"/>.
/// </summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class ZoneAllocationItemDto
{
    [Range(1, int.MaxValue, ErrorMessage = "ZoneId_Required")]
    public int ZoneId { get; set; }

    /// <summary>Wards to allocate; each must belong to <see cref="ZoneId"/> (WardMaster.ZoneId). null or [] = all active wards of the zone.</summary>
    public List<int>? WardIds { get; set; }
}

/// <summary>
/// One grievance workflow stage the user gets direct access to ([AMS].[StageAccessControl] row with this UserId and
/// no DesignationId). DesignationId and CanTakeAction are not part of this API: a new row gets CanTakeAction = 1 (the
/// column default) and an existing row keeps its value; sending either field is rejected like any unknown field.
/// </summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class StageAccessAllocationItemDto
{
    [Range(1, int.MaxValue, ErrorMessage = "StageId_Required")]
    public int StageId { get; set; }
}

/// <summary>
/// The user's allocation, one list per kind. A list that is sent is the complete set of that kind (sync, not
/// append): one [AMS].[UserOwningDepartmentAllocation] row per department, one [AMS].[UserZoneAllocation] row
/// per allocated ward and one user-level [AMS].[StageAccessControl] row per stage. Departments/wards/stages not
/// listed are deactivated (kept as history); listed ones are inserted, or their existing row is re-activated and
/// updated. [] removes all of that kind; a list left out (null) keeps the user's current allocation of that kind
/// unchanged. There are no CreatedBy / UpdatedBy fields: the rows are stamped with the authenticated caller, and a
/// body that sends them is rejected like any unknown field.
/// </summary>
public abstract class AssetUserAllocationListsDto
{
    /// <summary>null = keep the current owning departments; [] = remove them all.</summary>
    public List<OwningDepartmentAllocationItemDto>? OwningDepartments { get; set; }

    /// <summary>null = keep the current zones/wards; [] = remove them all.</summary>
    public List<ZoneAllocationItemDto>? ZoneAllocations { get; set; }

    /// <summary>null = keep the current stage access; [] = remove it all.</summary>
    public List<StageAccessAllocationItemDto>? StageAccess { get; set; }
}

/// <summary>POST /api/AssetUserAllocation</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class SaveAssetUserAllocationDto : AssetUserAllocationListsDto
{
    [Range(1, int.MaxValue, ErrorMessage = "UserId_Required")]
    public int UserId { get; set; }
}

/// <summary>PUT /api/AssetUserAllocation/{userId} — same rules as POST; the user comes from the route.</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateAssetUserAllocationDto : AssetUserAllocationListsDto
{
}
