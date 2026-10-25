/**
 * Inventory Item Name Service
 *
 * Provides CRUD operations for inventory item names (subtypes).
 *
 * All methods wrap API calls in try/catch and throw typed ApiErrors.
 *
 * @module inventory-item-name.service
 */

import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type {
  InventoryItemNameListResponse,
  InventoryItemNameListParams,
  InventoryItemNamePayload,
  InventoryItemNameItem,
} from '@/types/asset-masters/inventory-model.types';

function createInventoryApiError(statusCode?: number, errorMessage?: string, defaultMessage = 'Operation failed'): ApiError {
  const msg = errorMessage ?? '';
  const isDuplicate = msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate');
  return new ApiError(statusCode ?? (isDuplicate ? 409 : 500), msg || defaultMessage, defaultMessage);
}

export const inventoryItemNameService = {
  /**
   * Fetches a paginated list of inventory item names.
   *
   * @param params - Optional filter/pagination parameters
   * @returns Paginated response containing item name records
   */
  async getAll(params?: InventoryItemNameListParams): Promise<InventoryItemNameListResponse> {
    try {
      const q = new URLSearchParams();
      if (params?.PageNumber) q.set('PageNumber', params.PageNumber.toString());
      if (params?.PageSize) q.set('PageSize', params.PageSize.toString());
      if (params?.SearchTerm) q.set('SearchTerm', params.SearchTerm);
    if (params?.SortBy) q.set('SortBy', params.SortBy);

    if (params?.SortOrder) q.set('SortOrder', params.SortOrder);
      if (params?.SubTypeName) q.set('SubTypeName', params.SubTypeName);
      if (params?.InventoryItemCategoryId)
        q.set('InventoryItemCategoryId', params.InventoryItemCategoryId.toString());
      q.set('MarkedForDeletion', String(params?.MarkedForDeletion ?? false));

      const queryString = q.toString();
      const res = await apiClient.get<InventoryItemNameListResponse>(
        queryString ? `/InventoryItemName?${queryString}` : '/InventoryItemName'
      );
      if (!res.success || !res.data) {
        throw createInventoryApiError(
          res.statusCode,
          res.error,
          'Failed to fetch inventory item names'
        );
      }
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches a single inventory item name by its ID.
   *
   * @param id - Numeric or string item name ID
   * @returns The matching InventoryItemNameItem
   */
  async getById(id: number | string): Promise<InventoryItemNameItem> {
    try {
      const res = await apiClient.get<InventoryItemNameItem>(`/InventoryItemName/${id}`);
      if (!res.success) {
        throw createInventoryApiError(
          res.statusCode,
          res.error,
          `Failed to fetch inventory item name ${id}`
        );
      }
      return res.data!;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Creates a new inventory item name.
   *
   * @param payload - Item name data to persist
   * @returns The newly created InventoryItemNameItem
   */
  async create(payload: InventoryItemNamePayload): Promise<InventoryItemNameItem> {
    try {
      const res = await apiClient.post<InventoryItemNameItem>('/InventoryItemName', payload);
      if (!res.success) {
        throw createInventoryApiError(
          res.statusCode,
          res.error,
          'Create inventory item name failed'
        );
      }
      return res.data!;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Updates an existing inventory item name.
   *
   * @param id - ID of the item name to update
   * @param payload - Updated item name data
   * @returns The updated InventoryItemNameItem
   */
  async update(
    id: number | string,
    payload: InventoryItemNamePayload
  ): Promise<InventoryItemNameItem> {
    try {
      const res = await apiClient.put<InventoryItemNameItem>(`/InventoryItemName/${id}`, payload);
      if (!res.success) {
        throw createInventoryApiError(
          res.statusCode,
          res.error,
          'Update inventory item name failed'
        );
      }
      return res.data!;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Soft-deletes an inventory item name by ID.
   *
   * @param id - ID of the item name to delete
   */
  async delete(id: number | string): Promise<void> {
    try {
      const res = await apiClient.delete<void>(`/InventoryItemName/${id}`);
      if (!res.success) {
        throw createInventoryApiError(
          res.statusCode,
          res.error,
          'Delete inventory item name failed'
        );
      }
    } catch (error) {
      throw error;
    }
  },
};
