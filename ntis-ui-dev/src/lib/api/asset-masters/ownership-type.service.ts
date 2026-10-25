/**
 * Ownership Type Service
 *
 * Provides CRUD operations for ownership types.
 * All methods wrap API calls in try/catch and throw typed ApiErrors.
 *
 * @module ownership-type.service
 */

import { apiClient } from '@/services/api.service';

import type { MasterDataRecord } from '@/types/asset-masters/master-data.types';
import type { 
  OwnershipTypeApiRecord, 
  OwnershipTypePagedResponse, 
  OwnershipTypeParams 
} from '@/types/asset-masters/master-data-api.types';
import { buildOwnershipTypeCreatePayload, buildOwnershipTypeUpdatePayload } from './asset-payload-builders';
import { ApiError } from '@/lib/utils/api';

export type { OwnershipTypeApiRecord, OwnershipTypePagedResponse, OwnershipTypeParams };

async function handleMasterDataApiRequest<T>(
  requestFn: () => Promise<{ success: boolean; data?: T; statusCode?: number; error?: string }>,
  defaultErrorMessage = 'Operation failed'
): Promise<T> {
  try {
    const res = await requestFn();
    if (!res.success) {
      const msg = res.error ?? '';
      const isDuplicate = msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate');
      throw new ApiError(res.statusCode ?? (isDuplicate ? 409 : 500), msg || defaultErrorMessage, defaultErrorMessage);
    }
    return res.data as T;
  } catch (error) {
    throw error;
  }
}

export const ownershipTypeService = {
  /**
   * Fetches a paginated list of ownership types.
   */
  async getAll(params?: OwnershipTypeParams): Promise<OwnershipTypePagedResponse> {
    const q = new URLSearchParams();
    if (params?.PageNumber) q.set('PageNumber', params.PageNumber.toString());
    if (params?.PageSize) q.set('PageSize', params.PageSize.toString());
    if (params?.SearchTerm) q.set('SearchTerm', params.SearchTerm);
    if (params?.SortBy) q.set('SortBy', params.SortBy);

    if (params?.SortOrder) q.set('SortOrder', params.SortOrder);
    q.set('MarkedForDeletion', String(params?.MarkedForDeletion ?? false));
    if (params?.IsActive !== undefined) q.set('IsActive', String(params.IsActive));

    const queryString = q.toString();
    const result = await handleMasterDataApiRequest(
      () => apiClient.get<OwnershipTypePagedResponse>(
        queryString ? `/OwnershipType?${queryString}` : '/OwnershipType',
        { cache: 'no-store' }
      ),
      'Failed to fetch ownership types'
    );

    if (result && Array.isArray(result.items)) {
      const filteredItems = result.items.filter((item: OwnershipTypeApiRecord) => {
        const rec = item as unknown as Record<string, unknown>;
        const keys = [
          "MarkedForDeletion", "markedForDeletion",
          "IsMarkedForDelete", "isMarkedForDelete",
          "IsMarkedForDeletion", "isMarkedForDeletion",
          "IsMarkForDelete", "isMarkForDelete",
          "IsDeleted", "isDeleted"
        ];
        for (const k of keys) {
          const val = rec[k];
          if (val === true || val === 1 || val === "1") return false;
          if (typeof val === "string" && val.toLowerCase() === "true") return false;
        }
        return true;
      });
      return {
        ...result,
        items: filteredItems,
        totalCount: result.totalCount,
      };
    }

    return result;
  },

  /**
   * Fetches a single ownership type by its ID.
   */
  async getById(id: number | string): Promise<OwnershipTypeApiRecord> {
    return handleMasterDataApiRequest(
      () => apiClient.get<OwnershipTypeApiRecord>(`/OwnershipType/${id}`),
      `Failed to fetch ownership type ${id}`
    );
  },

  /**
   * Creates a new ownership type.
   */
  async create(payload: Record<string, unknown>): Promise<OwnershipTypeApiRecord> {
    return handleMasterDataApiRequest(
      () => apiClient.post<OwnershipTypeApiRecord>('/OwnershipType', payload),
      'Create ownership type failed'
    );
  },

  /**
   * Updates an existing ownership type.
   */
  async update(id: number | string, payload: Record<string, unknown>): Promise<OwnershipTypeApiRecord> {
    return handleMasterDataApiRequest(
      () => apiClient.put<OwnershipTypeApiRecord>(`/OwnershipType/${id}`, payload),
      'Update ownership type failed'
    );
  },

  /**
   * Soft-deletes an ownership type by ID.
   */
  async delete(id: number | string): Promise<void> {
    return handleMasterDataApiRequest(
      () => apiClient.delete<void>(`/OwnershipType/${id}`),
      'Delete ownership type failed'
    ) as Promise<void>;
  },
};

// ─── Named exports (kept for backward compatibility with existing imports) ──

/** @deprecated Use ownershipTypeService.getAll() */
export const getOwnershipTypes = (params?: OwnershipTypeParams) =>
  ownershipTypeService.getAll(params);

/** @deprecated Use ownershipTypeService.getById() */
export const getOwnershipTypeById = (id: number | string) =>
  ownershipTypeService.getById(id);

/** @deprecated Use ownershipTypeService.create() */
export const createOwnershipType = (record: MasterDataRecord, userId: number = 0) =>
  ownershipTypeService.create(buildOwnershipTypeCreatePayload(record, userId));

/** @deprecated Use ownershipTypeService.update() */
export const updateOwnershipType = (id: string | number, record: MasterDataRecord, userId: number = 0) =>
  ownershipTypeService.update(id, buildOwnershipTypeUpdatePayload(record, Number(id), userId));

/** @deprecated Use ownershipTypeService.delete() */
export const deleteOwnershipType = (id: string | number) =>
  ownershipTypeService.delete(id);

