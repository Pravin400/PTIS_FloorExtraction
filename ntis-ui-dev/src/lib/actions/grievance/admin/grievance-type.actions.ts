'use server';

/**
 * Grievance Type Server Actions (Layer 2 - Next.js RPC)
 * BFF proxy layer: Next.js server → Grievance backend service
 * Handles CRUD operations for Grievance Type entity by delegating to GrievanceTypeService
 *
 * Path: src/lib/actions/grievance/admin/grievance-type.actions.ts
 *
 * Delegates all HTTP calls to grievanceTypeService.
 */

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievanceTypeItem,
  CreateGrievanceTypeDto,
  UpdateGrievanceTypeDto,
  GrievanceTypeFilterParams,
} from '@/types/grievance/department-master.types';
import { grievanceTypeService } from '@/lib/api/grievance/admin/grievance-type.service';
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

export async function fetchGrievanceTypesAction(
  params: GrievanceTypeFilterParams = {}
): Promise<ApiResponse<GrievanceTypeItem[]>> {
  try {
    const token = await getSessionToken();
    return await grievanceTypeService.getAll(params, token);
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'Failed to fetch grievance types',
      data: [],
    };
  }
}

export async function fetchGrievanceTypeByIdAction(
  id: number
): Promise<ApiResponse<GrievanceTypeItem | null>> {
  try {
    const token = await getSessionToken();
    return await grievanceTypeService.getById(id, token);
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || `Failed to fetch grievance type #${id}`,
      data: null,
    };
  }
}

export async function createGrievanceTypeAction(
  dto: CreateGrievanceTypeDto
): Promise<ApiResponse<GrievanceTypeItem>> {
  try {
    const token = await getSessionToken();
    const res = await grievanceTypeService.create(dto, token);
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
      message: (err as Error).message || 'Failed to create grievance type',
    };
  }
}

export async function updateGrievanceTypeAction(
  id: number,
  dto: UpdateGrievanceTypeDto
): Promise<ApiResponse<GrievanceTypeItem>> {
  try {
    const token = await getSessionToken();
    const res = await grievanceTypeService.update(id, dto, token);
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
      message: (err as Error).message || 'Failed to update grievance type',
    };
  }
}

export async function deleteGrievanceTypeAction(
  id: number
): Promise<ApiResponse<boolean>> {
  try {
    const token = await getSessionToken();
    const res = await grievanceTypeService.delete(id, token);
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
      message: (err as Error).message || 'Failed to delete grievance type',
      data: false,
    };
  }
}
