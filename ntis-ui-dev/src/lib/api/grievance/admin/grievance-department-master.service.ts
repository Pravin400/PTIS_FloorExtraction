/**
 * Grievance Department Master API Service
 * Built on centralized base `apiClient` (@/services/api.service).
 * Handles CRUD operations for Grievance Department entity.
 *
 * Path: src/lib/api/grievance/admin/grievance-department-master.service.ts
 */

import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievanceDepartment,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFilterParams,
  DepartmentStats,
  GrievanceTypeItem,
} from '@/types/grievance/department-master.types';
import {
  normalizeGrievanceDepartment,
  normalizePagedResponse,
  toBackendCreatePayload,
  toBackendUpdatePayload,
} from './department-master-mapper';
import type { NormalizedPagedResult } from './department-master-mapper';
import { grievanceTypeService } from './grievance-type.service';

export class GrievanceDepartmentMasterService {
  /**
   * GET /api/GrievanceDepartment
   */
  async getAll(
    params: DepartmentFilterParams = {},
    token?: string
  ): Promise<ApiResponse<NormalizedPagedResult>> {
    const query = new URLSearchParams();
    if (params.search) query.set('SearchTerm', params.search);
    if (params.status && params.status !== 'all') {
      query.set('IsActive', params.status === 'active' ? 'true' : 'false');
    }
    if (params.page) query.set('PageNumber', String(params.page));
    query.set('PageSize', String(params.pageSize || 100));

    const queryString = query.toString();
    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    // Department listing is public master data — requireAuth is false so it never fails on expired tokens
    const res = await apiClient.get<Record<string, unknown>>(
      `/GrievanceDepartment${queryString ? `?${queryString}` : ''}`,
      opt,
      false
    );

    if (!res.success || !res.data) {
      return { success: false, message: res.message || res.error || 'Failed to fetch departments' };
    }

    return {
      success: true,
      data: normalizePagedResponse(res.data),
    };
  }

  /**
   * GET /api/GrievanceDepartment/{id}
   */
  async getById(id: string | number, token?: string): Promise<ApiResponse<GrievanceDepartment>> {
    const rawId = String(id).trim();
    if (!rawId) return { success: false, message: 'Invalid department ID' };

    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.get<Record<string, unknown>>(
      `/GrievanceDepartment/${encodeURIComponent(rawId)}`,
      opt,
      true
    );

    if (!res.success || !res.data) {
      return { success: false, message: res.message || `Department #${rawId} not found` };
    }

    const data = normalizeGrievanceDepartment(res.data);
    const typesRes = await grievanceTypeService.getAll({ grievanceDepartmentId: rawId, isActive: true }, token);
    if (typesRes.success && Array.isArray(typesRes.data)) {
      data.grievanceTypes = typesRes.data
        .filter((t: GrievanceTypeItem) => Boolean(t.isActive))
        .map((t: GrievanceTypeItem) => t.grievanceType);
    }

    return { success: true, data };
  }

  /**
   * POST /api/GrievanceDepartment
   */
  async create(
    dto: CreateDepartmentDto,
    token?: string,
    userId?: number | string
  ): Promise<ApiResponse<GrievanceDepartment>> {
    const payload = toBackendCreatePayload(dto, userId);
    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.post<Record<string, unknown>>('/GrievanceDepartment', payload, opt, true);

    if (!res.success || !res.data) {
      return { success: false, message: res.message || res.error || 'Failed to create department' };
    }

    return {
      success: true,
      data: normalizeGrievanceDepartment(res.data),
      message: 'Department created successfully',
    };
  }

  /**
   * PUT /api/GrievanceDepartment/{id}
   */
  async update(
    id: string | number,
    dto: UpdateDepartmentDto,
    token?: string,
    userId?: number | string
  ): Promise<ApiResponse<GrievanceDepartment>> {
    const rawId = String(id).trim();
    if (!rawId) return { success: false, message: 'Invalid department ID' };

    const payload = toBackendUpdatePayload(rawId, dto, userId);
    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.put<Record<string, unknown>>(
      `/GrievanceDepartment/${encodeURIComponent(rawId)}`,
      payload,
      opt,
      true
    );

    if (!res.success || !res.data) {
      return { success: false, message: res.message || res.error || 'Failed to update department' };
    }

    return {
      success: true,
      data: normalizeGrievanceDepartment(res.data),
      message: 'Department updated successfully',
    };
  }

  /**
   * DELETE /api/GrievanceDepartment/{id}
   */
  async delete(id: string | number, token?: string): Promise<ApiResponse<boolean>> {
    const rawId = String(id).trim();
    if (!rawId) return { success: false, message: 'Invalid department ID', data: false };

    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.delete<boolean>(
      `/GrievanceDepartment/${encodeURIComponent(rawId)}`,
      opt,
      true
    );

    return {
      success: res.success,
      data: res.success,
      message: res.message || (res.success ? 'Department deleted successfully' : 'Failed to delete department'),
    };
  }

  /**
   * GET /api/GrievanceDepartment (Stats calculation)
   */
  async getStats(token?: string): Promise<ApiResponse<DepartmentStats>> {
    const allRes = await this.getAll({ pageSize: 100 }, token);
    if (!allRes.success || !allRes.data) {
      return {
        success: false,
        message: allRes.message || 'Failed to calculate department stats',
        data: { total: 0, active: 0, inactive: 0, totalGrievances: 0 },
      };
    }

    const items = allRes.data.items;
    const total = allRes.data.total;
    const active = items.filter((d) => d.isActive).length;
    const inactive = items.filter((d) => !d.isActive).length;

    let totalGrievances = 0;
    try {
      const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      const grvRes = await apiClient.get<Record<string, unknown>>('/GrievanceApplication?PageSize=1', opt, true);
      if (grvRes.success && grvRes.data) {
        totalGrievances = Number(grvRes.data.totalCount ?? grvRes.data.total ?? 0);
      }
    } catch {}

    return {
      success: true,
      data: { total, active, inactive, totalGrievances },
    };
  }

  /**
   * POST /api/GrievanceType (Associate with Department)
   */
  async addGrievanceType(
    departmentId: string | number,
    grievanceType: string,
    token?: string
  ): Promise<ApiResponse<GrievanceDepartment>> {
    const createRes = await grievanceTypeService.create(
      {
        grievanceDepartmentId: Number(departmentId),
        grievanceType: grievanceType.trim(),
        isActive: true,
      },
      token
    );

    if (!createRes.success) {
      return { success: false, message: createRes.message || 'Failed to create grievance type on backend' };
    }

    return await this.getById(departmentId, token);
  }

  /**
   * DELETE /api/GrievanceType/{id} (Disassociate from Department)
   */
  async removeGrievanceType(
    departmentId: string | number,
    grievanceType: string,
    token?: string
  ): Promise<ApiResponse<GrievanceDepartment>> {
    const typesRes = await grievanceTypeService.getAll({ grievanceDepartmentId: departmentId }, token);
    if (typesRes.success && Array.isArray(typesRes.data)) {
      const match = typesRes.data.find(
        (t) => t.grievanceType.toLowerCase() === grievanceType.trim().toLowerCase()
      );
      if (match?.id) {
        const deleteRes = await grievanceTypeService.delete(match.id, token);
        if (!deleteRes.success) {
          return { success: false, message: deleteRes.message || 'Failed to delete grievance type on backend' };
        }
      }
    }

    return await this.getById(departmentId, token);
  }
}

export const grievanceDepartmentMasterService = new GrievanceDepartmentMasterService();
