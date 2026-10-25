import { apiClient } from '@/services/api.service';
import type { BackendUser, User } from '@/types/user-management';
import type {
  TwoFactorSetupResponse,
  EnableTwoFactorResponse,
  TwoFactorEmailVerificationPendingResponse,
} from '@/types/two-factor.types';
import { ApiError } from '@/lib/utils/api';

function getSelectedDepartmentIds(user: Partial<User>): string[] {
  return Array.from(new Set((user.departmentIds || []).map((id) => String(id))));
}
function getSelectedModulePairs(user: Partial<User>): { deptId: number; modId: number }[] {
  const selectedModPairs: { deptId: number; modId: number }[] = [];
  const processedPairs = new Set<string>();
  Object.entries(user.moduleAccess || {}).forEach(([deptId, modules]) => {
    if (!Array.isArray(modules)) return;
    modules.forEach((modId) => {
      const parsedDeptId = Number(deptId);
      const parsedModId = Number(modId);
      if (Number.isNaN(parsedDeptId) || Number.isNaN(parsedModId)) return;
      const pairKey = `${parsedDeptId}-${parsedModId}`;
      if (!processedPairs.has(pairKey)) {
        selectedModPairs.push({ deptId: parsedDeptId, modId: parsedModId });
        processedPairs.add(pairKey);
      }
    });
  });
  return selectedModPairs;
}
function validateRoleDepartmentIntegrity(user: Partial<User>): void {
  const selectedDeptIds = getSelectedDepartmentIds(user);
  const hasRoles = Object.values(user.roleAccess || {}).some(
    (roleIds) => Array.isArray(roleIds) && roleIds.length > 0
  );
  if (hasRoles && selectedDeptIds.length === 0) {
    throw new ApiError(
      400,
      'Roles cannot be assigned without at least one department.',
      'Integrity Error'
    );
  }
}

export async function createUser(user: Partial<User>, userId?: number): Promise<User> {
  validateRoleDepartmentIntegrity(user);
  const selectedDeptIds = getSelectedDepartmentIds(user);
  const selectedModPairs = getSelectedModulePairs(user);
  const backendUser = {
    isActive: user.isActive ?? true,
    createdBy: userId || 0,
    userName: user.userName,
    firstName: user.firstName,
    middleName: user.middleName || '',
    lastName: user.lastName,
    userCode: user.userCode || user.userName,
    address: (user.address as string) || '',
    mobileNo: user.mobileNo,
    alternateMobileNo: user.alternateMobileNo || '',
    email: user.email,
    employeeTypeID: 1,
    mustChangePassword: false,
    language: 'en',
    remark: user.remark || '',
    departments: selectedDeptIds.map((deptId) => ({
      isActive: user.isActive ?? true,
      createdBy: userId || 0,
      departmentId: Number(deptId),
      userId: 0,
    })),
    moduleAccess: selectedModPairs.map(({ deptId, modId }) => ({
      isActive: user.isActive ?? true,
      createdBy: userId || 0,
      departmentId: deptId,
      moduleId: modId,
      userId: 0,
    })),
    roleAllocations: Object.entries(user.roleAccess || {}).flatMap(([deptId, roleIds]) => {
      const parsedDeptId = Number(deptId);
      if (!selectedDeptIds.includes(String(deptId))) return [];
      return (Array.isArray(roleIds) ? roleIds : []).map((roleId: number) => ({
        isActive: user.isActive ?? true,
        createdBy: userId || 0,
        departmentId: parsedDeptId,
        userRoleId: roleId,
        userId: 0,
      }));
    }),
  };
  const response = await apiClient.post<BackendUser | { items: BackendUser }>('/users', backendUser);
  if (!response.success || !response.data) {
    const errorMsg = response.error || 'A record with the same details already exists.';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }
  // The create endpoint wraps the created record in a { items: BackendUser } envelope (unlike
  // GET /users/{id}, which returns the record directly) — unwrap defensively, then re-fetch by
  // id so the returned User is normalized the exact same way as everywhere else.
  const created =
    'items' in response.data ? response.data.items : (response.data as BackendUser);
  const { getUserById } = await import('./user.services');
  return getUserById(String(created.id));
}
export async function updateUser(id: number, user: Partial<User>, userId?: number): Promise<User> {
  validateRoleDepartmentIntegrity(user);
  const selectedDeptIds = getSelectedDepartmentIds(user);
  const selectedModPairs = getSelectedModulePairs(user);
  const rawDepartments = user.rawDepartments || [];
  const rawModuleAccess = user.rawModuleAccess || [];
  const rawRoleAllocations = Array.isArray(user.rawRoleAllocations) ? user.rawRoleAllocations : [];
  const userIsActive =
    typeof user.isActive === 'boolean'
      ? user.isActive
      : user.isActive === 'true'
        ? true
        : user.isActive === 'false'
          ? false
          : (user.isActive ?? true);

  const backendUser = {
    id,
    isActive: userIsActive,
    updatedBy: userId || 0,
    userName: user.userName,
    firstName: user.firstName,
    middleName: user.middleName || '',
    lastName: user.lastName,
    userCode: user.userCode || user.userName,
    address: user.address || '',
    mobileNo: user.mobileNo,
    alternateMobileNo: user.alternateMobileNo || '',
    email: user.email,
    employeeTypeID: user.employeeTypeID ?? 1,
    mustChangePassword: false,
    language: user.language || 'en',
    remark: user.remark || '',
    departments: selectedDeptIds.map((deptId) => {
      const rawDept = rawDepartments.find((rd) => String(rd.departmentId) === String(deptId));
      return {
        id: rawDept?.id,
        isActive: userIsActive,
        departmentId: Number(deptId),
        userId: id,
      };
    }),
    moduleAccess: selectedModPairs.map((sp) => {
      const rawMod = rawModuleAccess.find(
        (rma) => Number(rma.departmentId) === sp.deptId && Number(rma.moduleId) === sp.modId
      );
      return {
        id: rawMod?.id,
        isActive: userIsActive,
        departmentId: sp.deptId,
        moduleId: sp.modId,
        userId: id,
      };
    }),
    roleAllocations: Object.entries(user.roleAccess || {}).flatMap(([deptId, roleIds]) => {
      const parsedDeptId = Number(deptId);
      return (Array.isArray(roleIds) ? roleIds : []).map((roleId) => {
        const rawRole = rawRoleAllocations.find(
          (rra) =>
            String(rra.departmentId) === String(deptId) &&
            String(rra.userRoleId) === String(roleId)
        );
        return {
          id: rawRole?.id,
          isActive: userIsActive,
          departmentId: parsedDeptId,
          userRoleId: Number(roleId),
          userId: id,
        };
      });
    }),
  };
  const response = await apiClient.put<void>(`/users/${id}`, backendUser);
  if (!response.success) {
    const errorMsg = response.error || 'Failed to update user';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }

  // 🚀 Symmetrical Deactivation and Activation Solution:
  // Aligning 100% with the backend design (UpdateUserDto excludes isActive; use /lock and /unlock endpoints).
  if (userIsActive === false) {
    const lockResponse = await apiClient.put<void>(`/users/${id}/lock`, {
      updatedBy: userId || 0,
    });
    if (!lockResponse.success) {
      const lockError = lockResponse.error || 'Failed to lock user';
      throw new ApiError(lockResponse.statusCode ?? 500, lockError, lockError);
    }
  } else {
    const unlockResponse = await apiClient.put<void>(`/users/${id}/unlock`, {
      updatedBy: userId || 0,
    });
    if (!unlockResponse.success) {
      const unlockError = unlockResponse.error || 'Failed to unlock user';
      throw new ApiError(unlockResponse.statusCode ?? 500, unlockError, unlockError);
    }
  }

  const { getUserById } = await import('./user.services');
  return getUserById(String(id));
}
export async function deleteUser(id: string): Promise<void> {
  const response = await apiClient.delete<void>(`/users/${id}`, {
    body: JSON.stringify({ id: Number(id) }),
  });
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'API Error',
      'Failed to delete user'
    );
  }
}

// ── Two-factor admin actions ────────────────────────────────────────────
// Mirrors the lock/unlock pattern in updateUser above: fire the security
// endpoint, then re-fetch the full user so the caller gets a consistent User.

export async function requireUserTwoFactor(id: number, updatedBy?: number): Promise<User> {
  const response = await apiClient.put<void>(`/users/${id}/require-2fa`, {
    updatedBy: updatedBy || 0,
  });
  if (!response.success) {
    const errorMsg = response.error || 'Failed to require two-factor authentication';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }
  const { getUserById } = await import('./user.services');
  return getUserById(String(id));
}

export async function unrequireUserTwoFactor(id: number, updatedBy?: number): Promise<User> {
  const response = await apiClient.put<void>(`/users/${id}/unrequire-2fa`, {
    updatedBy: updatedBy || 0,
  });
  if (!response.success) {
    const errorMsg = response.error || 'Failed to remove two-factor authentication requirement';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }
  const { getUserById } = await import('./user.services');
  return getUserById(String(id));
}

export async function resetUserTwoFactor(id: number, updatedBy?: number): Promise<User> {
  const response = await apiClient.put<void>(`/users/${id}/reset-2fa`, {
    updatedBy: updatedBy || 0,
  });
  if (!response.success) {
    const errorMsg = response.error || 'Failed to reset two-factor authentication';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }
  const { getUserById } = await import('./user.services');
  return getUserById(String(id));
}

// ── Admin-assisted 2FA enrollment ────────────────────────────────────────
// Lets an admin walk a user through authenticator setup in person (right after creating
// their account, or later from the edit drawer) by scanning the QR with that user's own
// phone. Mirrors the self-service /security/two-factor/setup and /enable calls exactly,
// just scoped by a target user id instead of the caller's own JWT.

export async function beginUserTwoFactorSetup(id: number): Promise<TwoFactorSetupResponse> {
  const response = await apiClient.post<TwoFactorSetupResponse>(`/users/${id}/2fa/setup`);
  if (!response.success || !response.data) {
    const errorMsg = response.error || 'Failed to start two-factor setup';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }
  return response.data;
}

// A valid TOTP code only proves the scanner can operate *some* authenticator app, not that it's
// the target user's — so this does NOT enable 2FA yet. It unlocks a one-time code emailed to the
// target's registered address; call confirmUserTwoFactorEmail with that code to actually enable.
export async function enableUserTwoFactor(id: number, code: string): Promise<TwoFactorEmailVerificationPendingResponse> {
  const response = await apiClient.post<TwoFactorEmailVerificationPendingResponse>(`/users/${id}/2fa/enable`, { code });
  if (!response.success || !response.data) {
    const errorMsg = response.error || 'Failed to enable two-factor authentication';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }
  return response.data;
}

export async function confirmUserTwoFactorEmail(id: number, code: string): Promise<EnableTwoFactorResponse> {
  const response = await apiClient.post<EnableTwoFactorResponse>(`/users/${id}/2fa/confirm-email`, { code });
  if (!response.success || !response.data) {
    const errorMsg = response.error || 'Failed to confirm two-factor authentication';
    throw new ApiError(response.statusCode ?? 500, errorMsg, errorMsg);
  }
  return response.data;
}
