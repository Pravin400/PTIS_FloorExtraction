import type { BackendUser, User, Role, Designation, ModuleAccess } from '@/types/user-management';
import { ApiError } from '@/lib/utils/api';
import { ApiResponse } from '@/types/common.types';

/**
 * Caching configuration for User Management module
 */
export const USER_MANAGEMENT_TAG = 'user-management';
export const CACHE_DURATION = 3600;

export const userManagementCacheOptions = {
  cache: 'force-cache' as RequestCache,
  next: {
    tags: [USER_MANAGEMENT_TAG],
    revalidate: CACHE_DURATION,
  },
};

export const noStoreOptions = {
  cache: 'no-store' as RequestCache,
};

export function handleApiResponse<T>(response: ApiResponse<T>, defaultMessage: string): T {
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || response.message || defaultMessage,
      defaultMessage
    );
  }
  return response.data;
}

export function mapBackendUserToUser(bu: BackendUser): User {
  const isUserActive = bu.isActive === true || String(bu.isActive).toLowerCase() === 'true';
  const userIdStr = String(bu.id || '0');

  const rawDepts = bu.departments ?? (bu as unknown as { departmentAllocations?: typeof bu.departments }).departmentAllocations;
  const safeDepts = Array.isArray(rawDepts) ? rawDepts : [];
  const safeModules = Array.isArray(bu.moduleAccess) ? bu.moduleAccess : [];
  const safeRoles = Array.isArray(bu.roleAllocations) ? bu.roleAllocations : [];

  // Filter active departments first
  const activeDepts = safeDepts.filter((d) => d && (d.isActive || !isUserActive));
  const activeDeptIds = new Set(activeDepts.map((d) => String(d.departmentId)));

  const moduleAccess: ModuleAccess = {};
  if (Array.isArray(bu.moduleAccess)) {
    bu.moduleAccess.forEach((ma) => {
      // Include active module access under active departments (or all allocations if the user is inactive)
      if (ma && (ma.isActive || !isUserActive)) {
        const deptId = String(ma.departmentId);
        if (activeDeptIds.has(deptId)) {
          if (!moduleAccess[deptId]) moduleAccess[deptId] = [];
          moduleAccess[deptId].push(String(ma.moduleId));
        }
      }
    });
  }

  const roleAccess: Record<string, number[]> = {};
  if (Array.isArray(bu.roleAllocations)) {
    bu.roleAllocations.forEach((ra) => {
      // Include active role allocations under active departments (or all allocations if the user is inactive)
      if (ra && (ra.isActive || !isUserActive)) {
        const deptId = String(ra.departmentId);
        if (activeDeptIds.has(deptId)) {
          if (!roleAccess[deptId]) roleAccess[deptId] = [];
          roleAccess[deptId].push(ra.userRoleId);
        }
      }
    });
  }

  return {
    id: userIdStr,
    userId: bu.id || 0,
    userName: bu.userName || '',
    userCode: bu.userCode || '',
    firstName: bu.firstName || '',
    middleName: bu.middleName || '',
    lastName: bu.lastName || '',
    email: bu.email || '',
    mobileNo: bu.mobileNo || '',
    alternateMobileNo: bu.alternateMobileNo || '',
    address: bu.address || '',
    isActive: isUserActive,
    twoFactorEnabled: bu.twoFactorEnabled === true,
    twoFactorRequired: bu.twoFactorRequired === true,
    status: isUserActive ? 'Active' : 'Inactive',
    departmentNames: activeDepts.map((d) => d.departmentName || String(d.departmentId)) || [],
    departmentIds: activeDepts.map((d) => String(d.departmentId)) || [],
    moduleNames:
      safeModules
        .filter((ma) => ma && (ma.isActive || !isUserActive) && activeDeptIds.has(String(ma.departmentId)))
        .map((ma) => ma.moduleName || String(ma.moduleId)) || [],
    moduleIds:
      safeModules
        .filter((ma) => ma && (ma.isActive || !isUserActive) && activeDeptIds.has(String(ma.departmentId)))
        .map((ma) => String(ma.moduleId)) || [],
    roles:
      safeRoles
        .filter((ra) => ra && (ra.isActive || !isUserActive) && activeDeptIds.has(String(ra.departmentId)))
        .map((ra) => ra.userRoleName || '') || [],
    userRoleIds:
      safeRoles
        .filter((ra) => ra && (ra.isActive || !isUserActive) && activeDeptIds.has(String(ra.departmentId)))
        .map((ra) => ra.userRoleId || 0) || [],
    moduleAccess,
    roleAccess,
    remark: bu.remark || '',
    employeeTypeID: bu.employeeTypeID,
    language: bu.language,
    rawDepartments: safeDepts,
    rawModuleAccess: safeModules,
    rawRoleAllocations: safeRoles,
    createdBy: bu.createdBy,
    createdDate: bu.createdDate,
  };
}

function findId(obj: unknown): unknown {
  if (obj === undefined || obj === null) return null;
  if (typeof obj !== 'object') return obj; // Might be the ID itself

  const o = obj as Record<string, unknown>;

  // Priority 1: Direct 'id' or 'ID'
  if (o.id !== undefined && o.id !== null) return o.id;
  if (o.ID !== undefined && o.ID !== null) return o.ID;

  // Priority 2: Key ending in 'id' case-insensitively
  const keys = Object.keys(o);
  const idKey = keys.find((k) => k.toLowerCase() === 'id' || k.toLowerCase().endsWith('id'));
  if (idKey !== undefined) return o[idKey];

  return null;
}

export function mapBackendRoleToRole(br: unknown): Role | null {
  if (!br) return null;

  // Handle nested 'data' property or success wrapper
  let data: unknown = br;
  if (br && typeof br === 'object' && 'success' in br) {
    const brObj = br as Record<string, unknown>;
    if (brObj.data !== undefined) {
      data = brObj.data;
    }
  }

  // Handle array response (use first item)
  if (Array.isArray(data)) {
    data = data[0];
  }

  if (data === undefined || data === null) return null;

  // Extract ID using robust finder
  const roleId = findId(data);
  if (roleId === undefined || roleId === null) return null;

  // If data was just the ID, create a skeletal object
  const isObject = typeof data === 'object' && data !== null;
  const d = isObject ? (data as Record<string, unknown>) : null;

  const name = d ? (d.userRoleName as string) || (d.name as string) : 'Unspecified Role';
  const isActive = d ? !!((d.isActive as boolean) ?? true) : true;
  const rawDeptId = d ? (d.departmentId ?? d.departmentID) : undefined;
  const departmentId = rawDeptId !== undefined && rawDeptId !== null ? Number(rawDeptId) : undefined;
  const departmentName = d ? (d.departmentName as string) || (d.deptName as string) : undefined;

  return {
    id: String(roleId),
    userRoleId: Number(roleId),
    name: name || 'Unspecified Role',
    departmentId: departmentId,
    departmentName: departmentName,
    isActive: isActive,
    status: isActive ? 'Active' : 'Inactive',
  };
}

export function mapBackendDesignationToDesignation(d: unknown): Designation | null {
  if (!d) return null;

  // Handle nested 'data' property or success wrapper
  let data: unknown = d;
  if (d && typeof d === 'object' && 'success' in d) {
    const dObj = d as Record<string, unknown>;
    if (dObj.data !== undefined) {
      data = dObj.data;
    }
  }

  // Handle array response (use first item)
  if (Array.isArray(data)) {
    data = data[0];
  }

  if (data === undefined || data === null) return null;

  // Extract ID using robust finder
  const designationId = findId(data);
  if (designationId === undefined || designationId === null) return null;

  const isObject = typeof data === 'object' && data !== null;
  const dataObj = isObject ? (data as Record<string, unknown>) : null;

  return {
    id: String(designationId),
    code: dataObj ? (dataObj.designationCode as string) || (dataObj.code as string) || '' : '',
    name: dataObj ? (dataObj.designationName as string) || (dataObj.name as string) || '' : '',
    localName: dataObj
      ? (dataObj.designationLocal as string) || (dataObj.localName as string) || ''
      : '',
    description: dataObj
      ? (dataObj.designationDescription as string) ||
        (dataObj.description as string) ||
        (dataObj.designationRemarks as string) ||
        (dataObj.remark as string) ||
        (dataObj.remarks as string) ||
        ''
      : '',
    status: dataObj ? (dataObj.isActive ? 'Active' : 'Inactive') : 'Active',
    isActive: dataObj ? !!((dataObj.isActive as boolean) ?? true) : true,
    userCount: dataObj ? (dataObj.userCount as number) || 0 : 0,
  };
}
