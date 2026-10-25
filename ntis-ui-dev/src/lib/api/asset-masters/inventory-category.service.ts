/**
 * Inventory Category Service
 *
 * Provides CRUD operations for inventory item categories.
 * All methods wrap API calls in try/catch and throw typed ApiErrors.
 *
 * @module inventory-category.service
 */

import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type {
  InventoryCategoryItem,
  InventoryCategoryListParams,
  InventoryCategoryListResponse,
  InventoryCategoryPayload,
} from '@/types/asset-masters/inventory-category.types';

import { handleMasterDataApiRequest } from './api-utils';
export const inventoryCategoryService = {
  /**
   * Fetches a paginated list of inventory categories.
   *
   * @param params - Optional filter/pagination parameters
   * @returns Paginated response containing category records
   */
  async getAll(params?: InventoryCategoryListParams): Promise<InventoryCategoryListResponse> {
    try {
      const q = new URLSearchParams();
      if (params?.PageNumber) q.set('PageNumber', params.PageNumber.toString());
      if (params?.PageSize) q.set('PageSize', params.PageSize.toString());
      if (params?.SearchTerm) q.set('SearchTerm', params.SearchTerm);
      if (params?.TypeCode) q.set('TypeCode', params.TypeCode);
      if (params?.TypeName) q.set('TypeName', params.TypeName);
      q.set('MarkedForDeletion', String(params?.MarkedForDeletion ?? false));
      if (params?.IsActive !== undefined) q.set('IsActive', String(params.IsActive));
      if (params?.SortBy) q.set('SortBy', params.SortBy);
      if (params?.SortOrder) q.set('SortOrder', params.SortOrder);

      const queryString = q.toString();
      const res = await apiClient.get<InventoryCategoryListResponse>(
        queryString ? `/InventoryItemCategory?${queryString}` : '/InventoryItemCategory'
      );

      if (!res.success || !res.data) {
        const msg = res.error ?? '';
        const isDuplicate = msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate');
        throw new ApiError(
          res.statusCode ?? (isDuplicate ? 409 : 500),
          msg || 'Failed to fetch inventory categories',
          msg || 'Failed to fetch inventory categories'
        );
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
   * Fetches a single inventory category by its ID.
   *
   * @param id - Numeric or string category ID
   * @returns The matching InventoryCategoryItem
   */
  async getById(id: number | string): Promise<InventoryCategoryItem> {
    return handleMasterDataApiRequest(
      () => apiClient.get<InventoryCategoryItem>(`/InventoryItemCategory/${id}`),
      `Failed to fetch inventory category ${id}`
    );
  },

  /**
   * Creates a new inventory category.
   *
   * @param payload - Category data to persist
   * @returns The newly created InventoryCategoryItem
   */
  async create(payload: InventoryCategoryPayload): Promise<InventoryCategoryItem> {
    return handleMasterDataApiRequest(
      () => apiClient.post<InventoryCategoryItem>('/InventoryItemCategory', payload),
      'Create inventory category failed'
    );
  },

  /**
   * Updates an existing inventory category.
   *
   * @param id - ID of the category to update
   * @param payload - Updated category data
   * @returns The updated InventoryCategoryItem
   */
  async update(id: number | string, payload: InventoryCategoryPayload): Promise<InventoryCategoryItem> {
    return handleMasterDataApiRequest(
      () => apiClient.put<InventoryCategoryItem>(`/InventoryItemCategory/${id}`, payload),
      'Update inventory category failed'
    );
  },

  /**
   * Soft-deletes an inventory category by ID.
   *
   * @param id - ID of the category to delete
   */
  async delete(id: number | string): Promise<void> {
    return handleMasterDataApiRequest(
      () => apiClient.delete<void>(`/InventoryItemCategory/${id}`),
      'Delete inventory category failed'
    ) as Promise<void>;
  },

  /**
   * Fetches Asset Categories for the Inventory Category dropdown using specific parameters.
   * Calls /AssetCategory?IsActive=true&HasInventory=true&PageSize=-1
   */
  async getAssetCategoriesForDropdown(): Promise<Array<{ id: number; categoryName: string; categoryCode?: string; isActive?: boolean }>> {
    const res = await apiClient.get<unknown>('/AssetCategory?IsActive=true&HasInventory=true&PageSize=-1');

    if (!res.success || !res.data) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch asset categories for inventory category dropdown",
        "Fetch asset categories for inventory category failed"
      );
    }

    const rawData = res.data;
    const items: unknown[] = Array.isArray(rawData)
      ? rawData
      : (rawData && typeof rawData === 'object' && 'items' in rawData && Array.isArray((rawData as Record<string, unknown>).items))
        ? (rawData as Record<string, unknown>).items as unknown[]
        : [];

    const validItems = (items as Record<string, unknown>[]).filter((item) => {
      const isDeleted = item.markedForDeletion === true || item.markedForDeletion === 1 || String(item.markedForDeletion).toLowerCase() === 'true';
      return !isDeleted;
    });

    return validItems.map((item) => ({
      id: Number(item.id ?? 0),
      categoryName: String(item.categoryName ?? item.name ?? ""),
      categoryCode: item.categoryCode ? String(item.categoryCode) : undefined,
      isActive: item.isActive === undefined ? true : item.isActive === true || item.isActive === 1 || String(item.isActive).toLowerCase() === 'true',
    }));
  },
};
