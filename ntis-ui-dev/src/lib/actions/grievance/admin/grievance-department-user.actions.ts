'use server';

/**
 * Grievance Department User Server Actions (Layer 3 - Next.js RPC)
 * Path: src/lib/actions/grievance/admin/grievance-department-user.actions.ts
 *
 * BFF proxy layer: Next.js server → Grievance backend service
 * Retrieves all active officers allocated to a grievance department:
 * GET /api/GrievanceDepartment/{grievanceDepartmentId}/users
 * Line ceiling: <= 300 lines.
 */

import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types/common.types';
import type { GrievanceDepartmentUser } from '@/types/grievance/department-user.types';
import { grievanceDepartmentUserService } from '@/lib/api/grievance/admin/grievance-department-user.service';
import { fetchDepartmentOfficersAction } from '@/lib/actions/grievance/admin/admin-complaints.actions';
import { isAccessTokenExpired } from '@/lib/utils/jwt-expiry';

function getValidToken(token?: string | null): string | undefined {
  if (!token || !token.trim()) return undefined;
  if (isAccessTokenExpired(token.trim())) return undefined;
  return token.trim();
}

async function getSessionToken(): Promise<string | undefined> {
  try {
    const store = await cookies();
    const authToken = getValidToken(store.get('auth_token')?.value);
    if (authToken) return authToken;
    const citizenToken = getValidToken(store.get('citizen_token')?.value);
    if (citizenToken) return citizenToken;
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Fetch all active users/officers allocated to a specific grievance department
 * GET /api/GrievanceDepartment/{grievanceDepartmentId}/users
 * Falls back to central User Management if department has no direct endpoint mappings.
 */
export async function fetchGrievanceDepartmentUsersAction(
  departmentId: number | string
): Promise<ApiResponse<GrievanceDepartmentUser[]>> {
  if (!departmentId || String(departmentId).trim().length === 0) {
    return { success: false, data: [], message: 'Department ID is required' };
  }

  const token = await getSessionToken();
  const directRes = await grievanceDepartmentUserService.getUsersByDepartment(departmentId, token);
  if (directRes.success && directRes.data && directRes.data.length > 0) {
    return directRes;
  }

  // Load active officers allocated to this department from User Management
  const officersRes = await fetchDepartmentOfficersAction(Number(departmentId));
  if (officersRes.success && officersRes.data && officersRes.data.length > 0) {
    const mapped: GrievanceDepartmentUser[] = officersRes.data.map((u) => ({
      id: u.id,
      userId: u.id,
      departmentId: Number(departmentId),
      fullName: u.name,
      designation: u.designation || ' ',
      isActive: true,
      mobileNo: u.mobileNo,
    }));
    return { success: true, data: mapped };
  }

  return directRes;
}
