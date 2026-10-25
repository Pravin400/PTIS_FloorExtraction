'use server';

/**
 * Admin Complaints Server Actions (Layer 2 - Next.js RPC)
 * Path: src/lib/actions/grievance/admin/admin-complaints.actions.ts
 *
 * BFF proxy layer: Next.js server -> Grievance backend service.
 * Enforces session tokens and delivers typed responses.
 * Line ceiling: <= 300 lines.
 */

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ApiResponse } from '@/types/common.types';
import type {
  ComplaintsFilterParams,
  ComplaintsPagedResult,
  DepartmentOption,
  ForwardGrievanceDto,
  AssignGrievanceDto,
  DepartmentOfficerOption,
} from '@/types/grievance/admin-complaints.types';
import { adminGrievanceService } from '@/lib/api/grievance/admin/admin-grievance.service';
import { grievanceDepartmentMasterService } from '@/lib/api/grievance/admin/grievance-department-master.service';
import { getUsers } from '@/lib/api/configuration-settings/user-management/user.services';
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

/**
 * Fetch paginated complaint records with server-side filters.
 */
export async function fetchAdminComplaintsAction(
  params: ComplaintsFilterParams = {}
): Promise<ApiResponse<ComplaintsPagedResult>> {
  try {
    const token = await getSessionToken();
    return await adminGrievanceService.getApplications(params, token);
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || 'Failed to fetch admin complaints',
      data: {
        items: [],
        totalCount: 0,
        pageNumber: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }
}

/**
 * Fetch active department options for the filter dropdown.
 */
export async function fetchAdminDepartmentOptionsAction(): Promise<ApiResponse<DepartmentOption[]>> {
  try {
    const token = await getSessionToken();
    const res = await grievanceDepartmentMasterService.getAll({ pageSize: 100 }, token);

    if (!res.success || !res.data) {
      return { success: true, data: [] };
    }

    const options: DepartmentOption[] = (res.data.items || []).map((dept) => ({
      id: Number(dept.id),
      nameEn: dept.nameEn,
      nameMr: dept.nameMr,
      code: dept.code,
    }));

    return { success: true, data: options };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || 'Failed to fetch department options',
      data: [],
    };
  }
}

/**
 * Forward grievance application to another department
 */
export async function forwardComplaintAction(
  complaintId: number,
  dto: ForwardGrievanceDto
): Promise<ApiResponse<boolean>> {
  try {
    const token = await getSessionToken();
    const res = await adminGrievanceService.forwardApplication(complaintId, dto, token);
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance', 'layout');
      } catch {}
    }
    return res;
  } catch (error) {
    return {
      success: false,
      data: false,
      message: (error as Error).message || 'Failed to forward grievance',
    };
  }
}

/**
 * Assign grievance application to an officer
 */
export async function assignComplaintAction(
  complaintId: number,
  dto: AssignGrievanceDto
): Promise<ApiResponse<boolean>> {
  try {
    const token = await getSessionToken();
    const res = await adminGrievanceService.assignApplication(complaintId, dto, token);
    if (res.success) {
      try {
        revalidatePath('/[locale]/grievance', 'layout');
      } catch {}
    }
    return res;
  } catch (error) {
    return {
      success: false,
      data: false,
      message: (error as Error).message || 'Failed to assign grievance',
    };
  }
}

/**
 * Fetch active department officers from user-management
 */
export async function fetchDepartmentOfficersAction(
  departmentId?: number
): Promise<ApiResponse<DepartmentOfficerOption[]>> {
  try {
    const usersRes = await getUsers({ isActive: true, pageSize: 100 });
    const allUsers = usersRes.items || [];
    const deptIdStr = departmentId !== undefined ? String(departmentId) : undefined;

    const matchedUsers = deptIdStr
      ? allUsers.filter((u) => u.departmentIds?.includes(deptIdStr))
      : allUsers;

    const activeList = matchedUsers.length > 0 ? matchedUsers : allUsers;

    const options: DepartmentOfficerOption[] = activeList.map((u) => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || `Officer #${u.userId}`;
      const deptName = u.departmentNames?.[0] || undefined;
      return {
        id: u.userId,
        name,
        departmentId: u.departmentIds?.[0] ? Number(u.departmentIds[0]) : undefined,
        departmentName: deptName,
        designation: u.userName,
        mobileNo: u.mobileNo,
      };
    });

    return { success: true, data: options };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: (error as Error).message || 'Failed to load department officers',
    };
  }
}
