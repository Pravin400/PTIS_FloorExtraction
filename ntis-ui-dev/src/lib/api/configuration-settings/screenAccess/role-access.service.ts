import { apiClient } from '@/services/api.service';
import type {
  RoleMasterData,
  ScreenAccessPermissionData,
  ScreenMasterData,
} from '@/types/screen-access.types';
import { ApiError } from '@/lib/utils/api';
import { getMasterDataPageSize } from './screen-access.services'; // still used by getPermissionsByRole
import { parseBoolean } from '@/lib/utils/type-guards';
import { logError } from '@/lib/utils/logger';

function normalizePermission(item: Record<string, unknown>): ScreenAccessPermissionData {
  let accessLevel: 'no-access' | 'view' | 'edit' | 'delete' | 'full' = 'no-access';
  if (item.haveNoAccess || item.HaveNoAccess) accessLevel = 'no-access';
  else if (item.haveFullAccess || item.HaveFullAccess) accessLevel = 'full';
  else if (item.canDelete || item.CanDelete) accessLevel = 'delete';
  else if (item.canEdit || item.CanEdit) accessLevel = 'edit';
  else if (item.canView || item.CanView) accessLevel = 'view';

  return {
    id: Number(item.roleWiseScreenAccessId ?? item.RoleWiseScreenAccessId ?? item.id ?? item.Id),
    roleId: Number(item.userRoleId ?? item.UserRoleId ?? item.roleId ?? item.RoleId),
    screenId: Number(item.screenId ?? item.ScreenId),
    accessLevel,
    createdBy:
      item.createdBy != null
        ? Number(item.createdBy)
        : item.CreatedBy != null
          ? Number(item.CreatedBy)
          : undefined,
    updatedBy:
      item.updatedBy != null
        ? Number(item.updatedBy)
        : item.UpdatedBy != null
          ? Number(item.updatedBy)
          : undefined,
  };
}

function extractArrayFromResponse(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[];
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const candidate =
      r.items ?? r.Items ?? r.data ?? r.Data ?? r.result ?? r.Result ?? r.value ?? r.Value;
    if (Array.isArray(candidate)) {
      return candidate as Record<string, unknown>[];
    }
    if (candidate && typeof candidate === 'object') {
      const c = candidate as Record<string, unknown>;
      const nested = c.items ?? c.Items ?? c.data ?? c.Data;
      if (Array.isArray(nested)) {
        return nested as Record<string, unknown>[];
      }
    }
  }
  return [];
}

export async function getRoles(): Promise<RoleMasterData[]> {
  // Fetch from /UserRole which contains userRoleName (e.g. "Admin", "sudo").
  // /RoleWiseScreenAccessMaster only has userRoleId with no name field,
  // causing the dropdown to show "Role 1" instead of the actual role name.
  const url = `/UserRole?PageSize=1000&IsActive=true`;
  const response = await apiClient.get<unknown>(url);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch roles',
      'Get roles failed'
    );
  }

  const items = extractArrayFromResponse(response.data);

  return items
    .filter((item) => {
      const activeVal = item.isActive ?? item.IsActive ?? item.status ?? item.Status ?? true;
      if (typeof activeVal === 'string' && activeVal.toLowerCase() === 'inactive') return false;
      return parseBoolean(activeVal);
    })
    .map((item) => {
      const id = Number(item.id ?? item.Id ?? item.userRoleId ?? item.UserRoleId);
      const name = String(
        item.userRoleName ?? item.UserRoleName ?? item.roleName ?? item.RoleName ?? `Role ${id}`
      );
      const deptId = Number(
        item.departmentId ??
          item.DepartmentId ??
          item.departmentMasterId ??
          item.DepartmentMasterId ??
          item.deptId ??
          item.DeptId ??
          0
      );
      return {
        roleMasterId: id,
        roleCode: String(item.roleCode ?? item.RoleCode ?? `ROLE_${id}`),
        roleName: name,
        isActive: true,
        departmentId: deptId > 0 ? deptId : undefined,
      } satisfies RoleMasterData;
    })
    .filter((r) => r.roleMasterId > 0);
}

export async function getPermissionsByRole(roleId: number): Promise<ScreenAccessPermissionData[]> {
  const url = `/RoleWiseScreenAccessMaster?UserRoleId=${roleId}&PageSize=${getMasterDataPageSize()}`;
  const response = await apiClient.get<unknown>(url);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      'accessControl.messages.updateError',
      'Get permissions failed'
    );
  }

  const items = extractArrayFromResponse(response.data);
  return items.map(normalizePermission);
}

export async function getScreenAccessWithAllScreens({
  roleId,
  preFetchedScreens,
}: {
  roleId: number;
  preFetchedScreens: ScreenMasterData[];
}): Promise<ScreenAccessPermissionData[]> {
  const permissions = await getPermissionsByRole(roleId);
  const permissionMap = new Map<number, ScreenAccessPermissionData>();
  permissions.forEach((p) => {
    if (p.screenId) permissionMap.set(p.screenId, p);
  });

  return preFetchedScreens.map((screen) => {
    const existing = permissionMap.get(screen.screenMasterId || 0);
    return (
      existing || {
        roleId,
        screenId: screen.screenMasterId || 0,
        accessLevel: 'no-access',
      }
    );
  });
}

export async function updateScreenAccess(
  data: ScreenAccessPermissionData[],
  updatedBy?: number
): Promise<void> {
  const baseUrl = `/RoleWiseScreenAccessMaster`;
  const CHUNK_SIZE = 10;

  try {
    // 1. Group requests by roleId to check existing permissions from backend
    const roleIds = Array.from(new Set(data.map((d) => d.roleId).filter(Boolean)));
    const existingPermsMap = new Map<string, ScreenAccessPermissionData>();

    await Promise.all(
      roleIds.map(async (rId) => {
        try {
          const perms = await getPermissionsByRole(rId);
          perms.forEach((p) => {
            if (p.screenId) {
              existingPermsMap.set(`${rId}_${p.screenId}`, p);
            }
          });
        } catch (e) {
          logError(`Could not pre-fetch permissions for role ${rId}:`, {
            error: e instanceof Error ? e : undefined,
          });
        }
      })
    );

    // 2. Process changes in chunks
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map(async (item) => {
          const { accessLevel, roleId, screenId } = item;
          const existing = existingPermsMap.get(`${roleId}_${screenId}`);
          const recordId =
            existing?.id && existing.id > 0
              ? existing.id
              : typeof item.id === 'number' && item.id > 0
                ? item.id
                : undefined;

          const payload: Record<string, unknown> = {
            userRoleId: roleId,
            UserRoleId: roleId,
            roleId: roleId,
            RoleId: roleId,
            screenId: screenId,
            ScreenId: screenId,
            canView: ['view', 'edit', 'delete', 'full'].includes(accessLevel),
            CanView: ['view', 'edit', 'delete', 'full'].includes(accessLevel),
            canEdit: ['edit', 'delete', 'full'].includes(accessLevel),
            CanEdit: ['edit', 'delete', 'full'].includes(accessLevel),
            canDelete: ['delete', 'full'].includes(accessLevel),
            CanDelete: ['delete', 'full'].includes(accessLevel),
            haveFullAccess: accessLevel === 'full',
            HaveFullAccess: accessLevel === 'full',
            haveNoAccess: accessLevel === 'no-access',
            HaveNoAccess: accessLevel === 'no-access',
            isActive: true,
            IsActive: true,
          };

          if (recordId) {
            payload.roleWiseScreenAccessId = recordId;
            payload.RoleWiseScreenAccessId = recordId;
            payload.id = recordId;
            payload.Id = recordId;

            const effectiveCreatedBy = existing?.createdBy ?? item.createdBy;
            if (effectiveCreatedBy !== undefined && effectiveCreatedBy !== null) {
              payload.createdBy = effectiveCreatedBy;
              payload.CreatedBy = effectiveCreatedBy;
            }
            if (updatedBy !== undefined && updatedBy !== null) {
              payload.updatedBy = updatedBy;
              payload.UpdatedBy = updatedBy;
            }

            const url = `${baseUrl}/${recordId}`;
            let res = await apiClient.put(url, payload);
            if (!res.success) {
              logError(`PUT to ${url} failed, attempting POST fallback:`, {
                error: res.error ? new Error(res.error) : undefined,
                message: res.message,
              });
              if (updatedBy !== undefined && updatedBy !== null) {
                payload.createdBy = updatedBy;
                payload.CreatedBy = updatedBy;
              }
              res = await apiClient.post(baseUrl, payload);
            }

            if (!res.success) {
              logError('Failed to update screen access record:', {
                error: res.error ? new Error(res.error) : undefined,
                message: res.message,
                payload,
              });
              throw new Error(res.error || res.message || 'accessControl.messages.updateError');
            }
          } else {
            if (updatedBy !== undefined && updatedBy !== null) {
              payload.createdBy = updatedBy;
              payload.CreatedBy = updatedBy;
            }
            let res = await apiClient.post(baseUrl, payload);
            if (!res.success) {
              logError(`POST to ${baseUrl} failed, checking for existing record:`, {
                error: res.error ? new Error(res.error) : undefined,
                message: res.message,
              });
              try {
                const refreshedPerms = await getPermissionsByRole(roleId);
                const match = refreshedPerms.find((p) => p.screenId === screenId);
                if (match?.id) {
                  payload.roleWiseScreenAccessId = match.id;
                  payload.RoleWiseScreenAccessId = match.id;
                  payload.id = match.id;
                  payload.Id = match.id;
                  res = await apiClient.put(`${baseUrl}/${match.id}`, payload);
                }
              } catch (fetchErr) {
                logError('Error checking existing permissions during fallback:', {
                  error: fetchErr instanceof Error ? fetchErr : undefined,
                });
              }
            }

            if (!res.success) {
              logError('Failed to create screen access record:', {
                error: res.error ? new Error(res.error) : undefined,
                message: res.message,
                payload,
              });
              throw new Error(res.error || res.message || 'accessControl.messages.updateError');
            }
          }
        })
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'accessControl.messages.updateError';
    throw new Error(message);
  }
}

