import type {
  AssetUserListItem,
  UserAccessAllocationItem,
  UserOwningDepartmentAllocationItem,
  UserZoneAllocationItem,
  UserStageAccessAllocationItem,
} from "@/types/asset-masters/user-department-allocation.types";

/**
 * Maps raw Owning Department allocation items to strongly-typed UI models
 */
export function mapOwningDepartments(
  rawList: Record<string, unknown>[]
): UserOwningDepartmentAllocationItem[] {
  return rawList.map((d, idx) => {
    const rawId = Number(d.id ?? d.Id ?? d.owningDepartmentId ?? d.OwningDepartmentId);
    return {
      id: Number.isFinite(rawId) && rawId > 0 ? rawId : -(idx + 1),
      userId: Number(d.userId ?? d.UserId) || 0,
      owningDepartmentId: Number(d.owningDepartmentId ?? d.OwningDepartmentId) || 0,
      owningDepartmentName: (d.owningDepartmentName ?? d.OwningDepartmentName)
        ? String(d.owningDepartmentName ?? d.OwningDepartmentName)
        : null,
      designationId:
        typeof (d.designationId ?? d.DesignationId) === "number"
          ? ((d.designationId ?? d.DesignationId) as number)
          : null,
      designationName: (d.designationName ?? d.DesignationName)
        ? String(d.designationName ?? d.DesignationName)
        : null,
      isActive: typeof (d.isActive ?? d.IsActive) === "boolean" ? Boolean(d.isActive ?? d.IsActive) : true,
    };
  });
}

/**
 * Maps raw Zone allocation items to strongly-typed UI models
 */
export function mapZoneAllocations(
  rawList: Record<string, unknown>[]
): UserZoneAllocationItem[] {
  return rawList.map((z, idx) => {
    const rawId = Number(z.id ?? z.Id ?? z.zoneId ?? z.ZoneId);
    return {
      id: Number.isFinite(rawId) && rawId > 0 ? rawId : -(idx + 1),
      userId: Number(z.userId ?? z.UserId) || 0,
      zoneId: Number(z.zoneId ?? z.ZoneId) || 0,
      zoneNo: (z.zoneNo ?? z.ZoneNo) ? String(z.zoneNo ?? z.ZoneNo) : null,
      zoneDescription: (z.zoneDescription ?? z.ZoneDescription ?? z.description ?? z.Description)
        ? String(z.zoneDescription ?? z.ZoneDescription ?? z.description ?? z.Description)
        : null,
      wardId: typeof (z.wardId ?? z.WardId) === "number" ? ((z.wardId ?? z.WardId) as number) : null,
      wardNo: (z.wardNo ?? z.WardNo) ? String(z.wardNo ?? z.WardNo) : null,
      wardDescription: (z.wardDescription ?? z.WardDescription) ? String(z.wardDescription ?? z.WardDescription) : null,
      allocatedWardCount:
        typeof (z.allocatedWardCount ?? z.AllocatedWardCount) === "number"
          ? Number(z.allocatedWardCount ?? z.AllocatedWardCount)
          : undefined,
      isActive: typeof (z.isActive ?? z.IsActive) === "boolean" ? Boolean(z.isActive ?? z.IsActive) : true,
    };
  });
}

/**
 * Maps raw Grievance Stage Access items to strongly-typed UI models
 */
export function mapStageAccess(
  rawList: Record<string, unknown>[]
): UserStageAccessAllocationItem[] {
  return rawList.map((s, idx) => {
    const rawId = Number(s.id ?? s.Id ?? s.stageId ?? s.StageId);
    return {
      id: Number.isFinite(rawId) && rawId > 0 ? rawId : -(idx + 1),
      userId: Number(s.userId ?? s.UserId) || 0,
      stageId: Number(s.stageId ?? s.StageId) || 0,
      stageCode: (s.stageCode ?? s.StageCode) ? String(s.stageCode ?? s.StageCode) : null,
      stageName: (s.stageName ?? s.StageName) ? String(s.stageName ?? s.StageName) : null,
      isActive: typeof (s.isActive ?? s.IsActive) === "boolean" ? Boolean(s.isActive ?? s.IsActive) : true,
    };
  });
}

/**
 * Maps raw access allocations if present
 */
export function mapAccessAllocations(
  raw: Record<string, unknown>
): UserAccessAllocationItem[] {
  if (Array.isArray(raw.accessAllocations)) {
    return (raw.accessAllocations as Record<string, unknown>[]).map((a) => ({
      id: Number(a.id) || 0,
      userId: Number(a.userId) || 0,
      owningDepartmentId: typeof a.owningDepartmentId === "number" ? a.owningDepartmentId : null,
      owningDepartmentName: a.owningDepartmentName ? String(a.owningDepartmentName) : null,
      designationId: typeof a.designationId === "number" ? a.designationId : null,
      designationName: a.designationName ? String(a.designationName) : null,
      zoneId: typeof a.zoneId === "number" ? a.zoneId : null,
      zoneNo: a.zoneNo ? String(a.zoneNo) : null,
      zoneDescription: a.zoneDescription ? String(a.zoneDescription) : null,
      wardId: typeof a.wardId === "number" ? a.wardId : null,
      wardNo: a.wardNo ? String(a.wardNo) : null,
      wardDescription: a.wardDescription ? String(a.wardDescription) : null,
      isActive: Boolean(a.isActive),
    }));
  }
  return [];
}

/**
 * Normalizes raw API response item into a clean, strongly typed AssetUserListItem
 */
export function normalizeAssetUser(raw: Record<string, unknown>): AssetUserListItem {
  const rawData =
    raw.items && typeof raw.items === "object" && !Array.isArray(raw.items)
      ? { ...raw, ...(raw.items as Record<string, unknown>) }
      : raw.Items && typeof raw.Items === "object" && !Array.isArray(raw.Items)
        ? { ...raw, ...(raw.Items as Record<string, unknown>) }
        : raw;

  const departmentsRaw = Array.isArray(rawData.departments)
    ? rawData.departments
    : Array.isArray(rawData.Departments)
      ? rawData.Departments
      : [];

  const rolesRaw = Array.isArray(rawData.roleAllocations)
    ? rawData.roleAllocations
    : Array.isArray(rawData.RoleAllocations)
      ? rawData.RoleAllocations
      : [];

  const rawOwningDepts = Array.isArray(rawData.owningDepartments)
    ? (rawData.owningDepartments as Record<string, unknown>[])
    : Array.isArray(rawData.OwningDepartments)
      ? (rawData.OwningDepartments as Record<string, unknown>[])
      : [];

  const rawZoneAllocs = Array.isArray(rawData.zoneAllocations)
    ? (rawData.zoneAllocations as Record<string, unknown>[])
    : Array.isArray(rawData.ZoneAllocations)
      ? (rawData.ZoneAllocations as Record<string, unknown>[])
      : [];

  const rawStageAccess = Array.isArray(rawData.stageAccess)
    ? (rawData.stageAccess as Record<string, unknown>[])
    : Array.isArray(rawData.StageAccess)
      ? (rawData.StageAccess as Record<string, unknown>[])
      : [];

  const owningDepartments = mapOwningDepartments(rawOwningDepts);
  const zoneAllocations = mapZoneAllocations(rawZoneAllocs);
  const stageAccess = mapStageAccess(rawStageAccess);
  const accessAllocations = mapAccessAllocations(raw);

  return {
    id: typeof raw.id === "number" ? raw.id : Number(raw.id) || 0,
    userName: String(raw.userName ?? ""),
    firstName: raw.firstName ? String(raw.firstName) : null,
    middleName: raw.middleName ? String(raw.middleName) : null,
    lastName: raw.lastName ? String(raw.lastName) : null,
    userCode: raw.userCode ? String(raw.userCode) : null,
    address: raw.address ? String(raw.address) : null,
    mobileNo: raw.mobileNo ? String(raw.mobileNo) : null,
    alternateMobileNo: raw.alternateMobileNo ? String(raw.alternateMobileNo) : null,
    email: raw.email ? String(raw.email) : null,
    employeeTypeID: typeof raw.employeeTypeID === "number" ? raw.employeeTypeID : null,
    language: raw.language ? String(raw.language) : null,
    remark: raw.remark ? String(raw.remark) : null,
    mustChangePassword: Boolean(raw.mustChangePassword),
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : true,
    createdDate: raw.createdDate ? String(raw.createdDate) : null,
    updatedDate: raw.updatedDate ? String(raw.updatedDate) : null,
    departments: departmentsRaw.map((d: Record<string, unknown>) => ({
      id: Number(d.id) || 0,
      userId: Number(d.userId) || 0,
      departmentId: Number(d.departmentId) || 0,
      departmentName: d.departmentName ? String(d.departmentName) : "",
      departmentNameLocal: d.departmentNameLocal ? String(d.departmentNameLocal) : "",
      isActive: Boolean(d.isActive),
    })),
    roleAllocations: rolesRaw.map((r: Record<string, unknown>, idx: number) => ({
      id: Number(r.id ?? r.Id ?? r.userRoleId ?? r.UserRoleId) || (idx + 1),
      userId: Number(r.userId ?? r.UserId) || 0,
      departmentId: Number(r.departmentId ?? r.DepartmentId) || 0,
      userRoleId: typeof (r.userRoleId ?? r.UserRoleId) === "number" ? ((r.userRoleId ?? r.UserRoleId) as number) : undefined,
      departmentName: r.departmentName ? String(r.departmentName) : (r.DepartmentName ? String(r.DepartmentName) : ""),
      userRoleName: r.userRoleName ? String(r.userRoleName) : (r.UserRoleName ? String(r.UserRoleName) : ""),
      isActive: typeof (r.isActive ?? r.IsActive) === "boolean" ? Boolean(r.isActive ?? r.IsActive) : true,
    })),
    owningDepartments,
    zoneAllocations,
    stageAccess,
    accessAllocations,
  };
}
