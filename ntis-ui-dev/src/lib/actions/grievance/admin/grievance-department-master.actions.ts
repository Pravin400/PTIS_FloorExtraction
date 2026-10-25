'use server';

/**
 * Grievance Department Master Server Actions (Layer 2 - Next.js RPC)
 * BFF proxy layer: Next.js server → Grievance backend service
 * Handles CRUD operations for Grievance Department by delegating to GrievanceDepartmentMasterService
 *
 * Path: src/lib/actions/grievance/admin/grievance-department-master.actions.ts
 *
 * Delegates all HTTP calls to grievanceDepartmentMasterService.
 */

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievanceDepartment,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFilterParams,
  DepartmentStats,
} from '@/types/grievance/department-master.types';
import type { NormalizedPagedResult } from '@/lib/api/grievance/admin/department-master-mapper';
import { grievanceDepartmentMasterService } from '@/lib/api/grievance/admin/grievance-department-master.service';
import { isAccessTokenExpired } from '@/lib/utils/jwt-expiry';

function getValidToken(token?: string | null): string | undefined {
  if (!token || !token.trim()) return undefined;
  if (isAccessTokenExpired(token.trim())) return undefined;
  return token.trim();
}

async function getSessionToken(): Promise<string | undefined> {
  try {
    const store = await cookies();
    const citizenToken = getValidToken(store.get('citizen_token')?.value);
    if (citizenToken) return citizenToken;
    const authToken = getValidToken(store.get('auth_token')?.value);
    if (authToken) return authToken;
    return undefined;
  } catch {
    return undefined;
  }
}

async function getSessionUserId(): Promise<number | undefined> {
  try {
    const store = await cookies();
    const raw = store.get('user_id')?.value || store.get('citizen_id')?.value;
    if (raw && !isNaN(Number(raw)) && Number(raw) > 0) {
      return Number(raw);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * 1. Fetch departments (with pagination, search, status filter)
 */
export async function fetchDepartmentsAction(
  params: DepartmentFilterParams = {}
): Promise<ApiResponse<NormalizedPagedResult>> {
  try {
    const token = await getSessionToken();
    return await grievanceDepartmentMasterService.getAll(params, token);
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to fetch departments',
    };
  }
}

/**
 * 2. Fetch department by ID
 */
export async function fetchDepartmentByIdAction(
  id: string | number
): Promise<ApiResponse<GrievanceDepartment>> {
  try {
    const token = await getSessionToken();
    return await grievanceDepartmentMasterService.getById(id, token);
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || `Failed to fetch department #${id}`,
    };
  }
}

/**
 * 3. Create a new department
 */
export async function createDepartmentAction(
  dto: CreateDepartmentDto
): Promise<ApiResponse<GrievanceDepartment>> {
  try {
    const token = await getSessionToken();
    const userId = await getSessionUserId();
    const res = await grievanceDepartmentMasterService.create(dto, token, userId);
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance/departments', 'page');
        revalidatePath('/[locale]/grievance/department-master', 'page');
        revalidatePath('/[locale]/grievance/complaints', 'page');
      } catch {}
    }
    return res;
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to create department',
    };
  }
}

/**
 * 4. Update an existing department
 */
export async function updateDepartmentAction(
  id: string | number,
  dto: UpdateDepartmentDto
): Promise<ApiResponse<GrievanceDepartment>> {
  try {
    const token = await getSessionToken();
    const userId = await getSessionUserId();
    const res = await grievanceDepartmentMasterService.update(id, dto, token, userId);
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance/departments', 'page');
        revalidatePath('/[locale]/grievance/department-master', 'page');
        revalidatePath('/[locale]/grievance/complaints', 'page');
      } catch {}
    }
    return res;
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to update department',
    };
  }
}

/**
 * 5. Delete a department
 */
export async function deleteDepartmentAction(
  id: string | number
): Promise<ApiResponse<boolean>> {
  try {
    const token = await getSessionToken();
    const res = await grievanceDepartmentMasterService.delete(id, token);
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance/departments', 'page');
        revalidatePath('/[locale]/grievance/department-master', 'page');
        revalidatePath('/[locale]/grievance/complaints', 'page');
      } catch {}
    }
    return res;
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to delete department',
    };
  }
}

/**
 * 6. Fetch department stats
 */
export async function fetchDepartmentStatsAction(): Promise<ApiResponse<DepartmentStats>> {
  try {
    const token = await getSessionToken();
    return await grievanceDepartmentMasterService.getStats(token);
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to fetch department stats',
    };
  }
}

/**
 * 7. Add grievance type to department
 */
export async function addGrievanceTypeToDepartmentAction(
  departmentId: string | number,
  grievanceType: string
): Promise<ApiResponse<GrievanceDepartment>> {
  try {
    const token = await getSessionToken();
    const res = await grievanceDepartmentMasterService.addGrievanceType(departmentId, grievanceType, token);
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance/departments', 'page');
        revalidatePath('/[locale]/grievance/department-master', 'page');
      } catch {}
    }
    return res;
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to add grievance type',
    };
  }
}

export const addGrievanceTypeAction = addGrievanceTypeToDepartmentAction;

/**
 * 8. Remove grievance type from department
 */
export async function removeGrievanceTypeFromDepartmentAction(
  departmentId: string | number,
  grievanceType: string
): Promise<ApiResponse<GrievanceDepartment>> {
  try {
    const token = await getSessionToken();
    const res = await grievanceDepartmentMasterService.removeGrievanceType(departmentId, grievanceType, token);
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance/departments', 'page');
        revalidatePath('/[locale]/grievance/department-master', 'page');
      } catch {}
    }
    return res;
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to remove grievance type',
    };
  }
}

export const removeGrievanceTypeAction = removeGrievanceTypeFromDepartmentAction;
