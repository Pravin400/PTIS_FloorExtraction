/**
 * Inventory Model Service
 *
 * Provides CRUD operations for inventory models.
 *
 * All methods wrap API calls in try/catch and throw typed ApiErrors.
 *
 * @module inventory-model.service
 */

import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type {
  InventoryModelItem,
  InventoryModelListParams,
  InventoryModelListResponse,
  InventoryModelPayload,
} from '@/types/asset-masters/inventory-model.types';

import { handleMasterDataApiRequest } from './api-utils';
export const inventoryModelService = {
  /**
   * Fetches a paginated list of inventory models.
   *
   * @param params - Optional filter/pagination parameters
   * @returns Paginated response containing model records
   */
  async getAll(params?: InventoryModelListParams): Promise<InventoryModelListResponse> {
    try {
      const q = new URLSearchParams();
      if (params?.PageNumber) q.set('PageNumber', params.PageNumber.toString());
      if (params?.PageSize) q.set('PageSize', params.PageSize.toString());
      if (params?.SearchTerm) q.set('SearchTerm', params.SearchTerm);
      if (params?.ModelName) q.set('ModelName', params.ModelName);
      if (params?.InventoryItemNameId)
        q.set('InventoryItemNameId', params.InventoryItemNameId.toString());
      q.set('MarkedForDeletion', String(params?.MarkedForDeletion ?? false));
      if (params?.IsActive !== undefined) q.set('IsActive', String(params.IsActive));
      if (params?.SortBy) q.set('SortBy', params.SortBy);
      if (params?.SortOrder) q.set('SortOrder', params.SortOrder);

      const queryString = q.toString();
      const res = await apiClient.get<InventoryModelListResponse>(
        queryString ? `/InventoryItemModel?${queryString}` : '/InventoryItemModel'
      );
      if (!res.success || !res.data) {
        throw new ApiError(res.statusCode ?? 500, res.error || 'Failed to fetch inventory models', 'Failed to fetch inventory models');
      }

      if (res.data.items) {
        const originalLength = res.data.items.length;
        res.data.items = (res.data.items as unknown as Record<string, unknown>[]).filter((item: Record<string, unknown>) => {
          const isDeleted = item.markedForDeletion === true || item.markedForDeletion === 1 || String(item.markedForDeletion).toLowerCase() === 'true';
          return !isDeleted;
        }) as unknown as typeof res.data.items;
        res.data.totalCount = Math.max(0, res.data.totalCount - (originalLength - res.data.items.length));
      }

      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches a single inventory model by its ID.
   *
   * @param id - Numeric or string model ID
   * @returns The matching InventoryModelItem
   */
  async getById(id: number | string): Promise<InventoryModelItem> {
    return handleMasterDataApiRequest(
      () => apiClient.get<InventoryModelItem>(`/InventoryItemModel/${id}`),
      `Failed to fetch inventory model ${id}`
    );
  },

  /**
   * Creates a new inventory model.
   *
   * @param payload - Model data to persist
   * @returns The newly created InventoryModelItem
   */
  async create(payload: InventoryModelPayload): Promise<InventoryModelItem> {
    return handleMasterDataApiRequest(
      () => apiClient.post<InventoryModelItem>('/InventoryItemModel', payload),
      'Create inventory model failed'
    );
  },

  /**
   * Updates an existing inventory model.
   *
   * @param id - ID of the model to update
   * @param payload - Updated model data
   * @returns The updated InventoryModelItem
   */
  async update(id: number | string, payload: InventoryModelPayload): Promise<InventoryModelItem> {
    return handleMasterDataApiRequest(
      () => apiClient.put<InventoryModelItem>(`/InventoryItemModel/${id}`, payload),
      'Update inventory model failed'
    );
  },

  /**
   * Soft-deletes an inventory model by ID.
   *
   * @param id - ID of the model to delete
   */
  async delete(id: number | string): Promise<void> {
    return handleMasterDataApiRequest(
      () => apiClient.delete<void>(`/InventoryItemModel/${id}`),
      'Delete inventory model failed'
    ) as Promise<void>;
  },
};
