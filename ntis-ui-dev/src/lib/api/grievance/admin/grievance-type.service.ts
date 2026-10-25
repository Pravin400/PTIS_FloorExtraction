/**
 * Grievance Type API Service
 * Built on centralized base `apiClient` (@/services/api.service).
 * Handles CRUD operations for Grievance Type entity.
 *
 * Path: src/lib/api/grievance/admin/grievance-type.service.ts
 */

import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievanceTypeItem,
  CreateGrievanceTypeDto,
  UpdateGrievanceTypeDto,
  GrievanceTypeFilterParams,
} from '@/types/grievance/department-master.types';

export function normalizeTypeItem(raw: Record<string, unknown>): GrievanceTypeItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    grievanceDepartmentId: Number(raw.grievanceDepartmentId ?? raw.GrievanceDepartmentId ?? 0),
    grievanceType: String(raw.grievanceType ?? raw.GrievanceType ?? ''),
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
    createdBy: raw.createdBy ? Number(raw.createdBy) : undefined,
    createdDate: (raw.createdDate ?? raw.CreatedDate) as string | undefined,
    updatedBy: raw.updatedBy ? Number(raw.updatedBy) : null,
    updatedDate: (raw.updatedDate ?? raw.UpdatedDate) as string | null | undefined,
  };
}

export class GrievanceTypeService {
  /**
   * GET /api/GrievanceType (with optional filters)
   */
  async getAll(
    params: GrievanceTypeFilterParams = {},
    token?: string
  ): Promise<ApiResponse<GrievanceTypeItem[]>> {
    const query = new URLSearchParams();
    if (params.id) query.set('Id', String(params.id));
    if (params.grievanceDepartmentId) {
      query.set('GrievanceDepartmentId', String(params.grievanceDepartmentId));
    }
    if (params.grievanceType) query.set('GrievanceType', params.grievanceType);
    if (params.isActive !== undefined) query.set('IsActive', String(params.isActive));
    if (params.pageNumber) query.set('PageNumber', String(params.pageNumber));
    if (params.pageSize) query.set('PageSize', String(params.pageSize));

    const queryString = query.toString();
    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.get<unknown>(
      `/GrievanceType${queryString ? `?${queryString}` : ''}`,
      opt,
      false
    );

    if (!res.success || !res.data) {
      return { success: false, data: [], message: res.message || res.error || 'Failed to fetch grievance types' };
    }

    const raw = res.data;
    const items = (Array.isArray(raw)
      ? raw
      : (raw as { items?: unknown[]; data?: unknown[] }).items ??
        (raw as { data?: unknown[] }).data ??
        []) as Record<string, unknown>[];

    return {
      success: true,
      data: items.map(normalizeTypeItem),
    };
  }

  /**
   * GET /api/GrievanceType/{id}
   */
  async getById(id: number | string, token?: string): Promise<ApiResponse<GrievanceTypeItem | null>> {
    const rawId = String(id).trim();
    if (!rawId) return { success: false, data: null, message: 'Invalid Grievance Type ID' };

    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.get<Record<string, unknown>>(
      `/GrievanceType/${encodeURIComponent(rawId)}`,
      opt,
      true
    );

    if (!res.success || !res.data) {
      return { success: false, data: null, message: res.message || `Grievance type #${rawId} not found` };
    }

    return {
      success: true,
      data: normalizeTypeItem(res.data),
    };
  }

  /**
   * POST /api/GrievanceType
   */
  async create(dto: CreateGrievanceTypeDto, token?: string): Promise<ApiResponse<GrievanceTypeItem>> {
    const body: Record<string, unknown> = {
      grievanceDepartmentId: Number(dto.grievanceDepartmentId),
      grievanceType: dto.grievanceType.trim(),
      isActive: dto.isActive ?? true,
      createdBy: dto.createdBy ?? 1,
    };

    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.post<Record<string, unknown>>('/GrievanceType', body, opt, true);

    if (!res.success || !res.data) {
      return { success: false, message: res.message || res.error || 'Failed to create grievance type' };
    }

    return {
      success: true,
      data: normalizeTypeItem(res.data),
      message: 'Grievance type registered successfully',
    };
  }

  /**
   * PUT /api/GrievanceType/{id}
   */
  async update(
    id: number | string,
    dto: UpdateGrievanceTypeDto,
    token?: string
  ): Promise<ApiResponse<GrievanceTypeItem>> {
    const rawId = String(id).trim();
    if (!rawId) return { success: false, message: 'Invalid Grievance Type ID' };

    const body: Record<string, unknown> = {
      id: Number(rawId),
      grievanceDepartmentId: Number(dto.grievanceDepartmentId),
      grievanceType: dto.grievanceType.trim(),
      isActive: dto.isActive ?? true,
      updatedBy: dto.updatedBy ?? 1,
    };

    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.put<Record<string, unknown>>(
      `/GrievanceType/${encodeURIComponent(rawId)}`,
      body,
      opt,
      true
    );

    if (!res.success || !res.data) {
      return { success: false, message: res.message || res.error || 'Failed to update grievance type' };
    }

    return {
      success: true,
      data: normalizeTypeItem(res.data),
      message: 'Grievance type updated successfully',
    };
  }

  /**
   * DELETE /api/GrievanceType/{id}
   */
  async delete(id: number | string, token?: string): Promise<ApiResponse<boolean>> {
    const rawId = String(id).trim();
    if (!rawId) return { success: false, data: false, message: 'Invalid Grievance Type ID' };

    const opt: RequestInit | undefined = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await apiClient.delete<boolean>(
      `/GrievanceType/${encodeURIComponent(rawId)}`,
      opt,
      true
    );

    return {
      success: res.success,
      data: res.success,
      message: res.message || (res.success ? 'Grievance type deleted successfully' : 'Failed to delete grievance type'),
    };
  }
}

export const grievanceTypeService = new GrievanceTypeService();
