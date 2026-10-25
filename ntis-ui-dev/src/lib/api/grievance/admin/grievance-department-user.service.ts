/**
 * Grievance Department User API Service (Layer 4 - Domain Service)
 * Path: src/lib/api/grievance/admin/grievance-department-user.service.ts
 *
 * Built on centralized base `apiClient` (@/services/api.service).
 * Handles retrieval of active officers/users allocated to a grievance department:
 * GET /api/GrievanceDepartment/{grievanceDepartmentId}/users
 * Line ceiling: <= 300 lines.
 */

import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type { GrievanceDepartmentUser } from '@/types/grievance/department-user.types';

export function normalizeGrievanceDepartmentUser(
  raw: Record<string, unknown>,
  departmentId: number
): GrievanceDepartmentUser {
  const userId = Number(raw.userId ?? raw.UserId ?? raw.userMasterId ?? raw.UserMasterId ?? raw.id ?? raw.Id ?? 0);
  const fullName = String(
    raw.fullName ??
      raw.FullName ??
      raw.name ??
      raw.Name ??
      raw.userName ??
      raw.UserName ??
      `Officer #${userId}`
  ).trim();

  return {
    id: Number(raw.id ?? raw.Id ?? userId),
    userId: userId > 0 ? userId : Number(raw.id ?? raw.Id ?? 0),
    departmentId: Number(raw.departmentId ?? raw.DepartmentId ?? raw.grievanceDepartmentId ?? departmentId),
    userName: (raw.userName ?? raw.UserName) as string | undefined,
    fullName,
    fullNameLocal: (raw.fullNameLocal ?? raw.FullNameLocal ?? raw.nameMr ?? raw.NameMr) as string | undefined,
    email: (raw.email ?? raw.Email) as string | undefined,
    mobileNo: (raw.mobileNo ?? raw.MobileNo ?? raw.phone ?? raw.Phone) as string | undefined,
    designation: (raw.designation ?? raw.Designation ?? raw.roleName ?? raw.RoleName) as string | undefined,
    designationLocal: (raw.designationLocal ?? raw.DesignationLocal ?? raw.designationMr ?? raw.DesignationMr) as string | undefined,
    roleName: (raw.roleName ?? raw.RoleName) as string | undefined,
    zoneId: raw.zoneId != null ? Number(raw.zoneId) : raw.ZoneId != null ? Number(raw.ZoneId) : null,
    wardId:
      raw.wardId != null
        ? Number(raw.wardId)
        : raw.WardId != null
        ? Number(raw.WardId)
        : raw.wardNo != null
        ? Number(raw.wardNo)
        : raw.WardNo != null
        ? Number(raw.WardNo)
        : raw.wardNumber != null
        ? Number(raw.wardNumber)
        : raw.WardNumber != null
        ? Number(raw.WardNumber)
        : null,
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
  };
}

export class GrievanceDepartmentUserService {
  /**
   * GET /api/GrievanceDepartment/{grievanceDepartmentId}/users
   * Retrieves all active users/officers allocated to that grievance department.
   */
  async getUsersByDepartment(
    departmentId: number | string,
    token?: string
  ): Promise<ApiResponse<GrievanceDepartmentUser[]>> {
    const rawId = String(departmentId).trim();
    if (!rawId || isNaN(Number(rawId)) || Number(rawId) <= 0) {
      return { success: false, data: [], message: 'Valid Department ID is required' };
    }

    const opt: RequestInit | undefined = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;

    const res = await apiClient.get<unknown>(
      `/GrievanceDepartment/${encodeURIComponent(rawId)}/users`,
      opt
    );

    if (!res.success || !res.data) {
      return {
        success: false,
        data: [],
        message: res.message || `No officers found for department #${rawId}`,
      };
    }

    // Defensive unwrapping of backend envelope: array, { items: [] }, or { data: [] }
    const rawData = res.data as Record<string, unknown>;
    const rawArray: unknown[] = Array.isArray(res.data)
      ? res.data
      : Array.isArray(rawData?.items)
      ? (rawData.items as unknown[])
      : Array.isArray(rawData?.data)
      ? (rawData.data as unknown[])
      : [];

    const normalizedUsers = rawArray
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => normalizeGrievanceDepartmentUser(item, Number(rawId)))
      .filter((user) => user.userId > 0 && user.isActive);

    return {
      success: true,
      data: normalizedUsers,
      message: res.message,
    };
  }
}

export const grievanceDepartmentUserService = new GrievanceDepartmentUserService();
