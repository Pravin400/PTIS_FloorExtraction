/**
 * Inventory Condition Service
 *
 * Provides CRUD operations for inventory conditions (AssetConditionMaster).
 *
 * All methods wrap API calls in try/catch and throw typed ApiErrors.
 *
 * @module inventory-condition.service
 */

import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type {
  InventoryCondition,
  CreateInventoryConditionDto,
  UpdateInventoryConditionDto,
  InventoryConditionListParams,
  InventoryConditionPagedResult,
  BackendMutationResponse,
} from '@/types/asset-masters/inventory-condition.types';

function createInventoryConditionError(statusCode?: number, errorMessage?: string, fallback = 'Operation failed'): never {
  const msg = errorMessage || fallback;
  const isDuplicate = msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate');
  throw new ApiError(statusCode ?? (isDuplicate ? 409 : 500), msg, fallback);
}

function normalizeConditionItem(item: Partial<InventoryCondition> & { categoryId?: number; conditionCategory?: string }): InventoryCondition {
  const catId = item.categoryId ?? item.inventoryItemCategoryId ?? 0;
  const condCategory = (item.conditionCategory ?? item.conditionType ?? 'Inventory') as 'Asset' | 'Inventory';
  return {
    ...(item as unknown as InventoryCondition),
    id: item.id ?? 0,
    categoryId: catId,
    inventoryItemCategoryId: catId,
    conditionCategory: condCategory,
    conditionType: condCategory,
    conditionName: item.conditionName ?? '',
    conditionFactor: Number(item.conditionFactor ?? 0),
    displayOrder: Number(item.displayOrder ?? 1),
    isActive: Boolean(item.isActive),
    description: item.description ?? null,
  };
}

export const inventoryConditionService = {
  /**
   * Fetches a paginated list of inventory conditions.
   *
   * @param params - Optional filter/pagination parameters
   * @returns Paginated response containing condition records
   */
  async getAll(params?: InventoryConditionListParams): Promise<InventoryConditionPagedResult> {
    try {
      const q = new URLSearchParams();
      if (params?.PageNumber) q.set('PageNumber', String(params.PageNumber));
      if (params?.PageSize) q.set('PageSize', String(params.PageSize));
      if (params?.SearchTerm) q.set('SearchTerm', params.SearchTerm.trim());
      if (params?.SortBy) q.set('SortBy', params.SortBy);
      if (params?.SortOrder) q.set('SortOrder', params.SortOrder);
      if (params?.ConditionName) q.set('ConditionName', params.ConditionName);
      if (params?.InventoryItemCategoryId) q.set('CategoryId', String(params.InventoryItemCategoryId));

      q.set('MarkedForDeletion', String(params?.MarkedForDeletion ?? false));
      if (params?.IsActive !== undefined) q.set('IsActive', String(params.IsActive));

      const queryString = q.toString();
      const res = await apiClient.get<InventoryConditionPagedResult>(
        queryString ? `/AssetConditionMaster?${queryString}` : '/AssetConditionMaster'
      );

      if (!res.success || !res.data) {
        if (res.statusCode === 404) {
          return {
            items: [],
            totalCount: 0,
            pageNumber: params?.PageNumber ?? 1,
            pageSize: params?.PageSize ?? 10,
            totalPages: 0,
          };
        }
        createInventoryConditionError(
          res.statusCode,
          res.error,
          'Failed to fetch inventory conditions'
        );
      }

      const responseData = res.data;
      if (responseData.items) {
        responseData.items = responseData.items.map(normalizeConditionItem);
      }
      return responseData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches a single inventory condition by its ID.
   *
   * @param id - Numeric or string condition ID
   * @returns The matching InventoryCondition
   */
  async getById(id: number | string): Promise<InventoryCondition> {
    try {
      const res = await apiClient.get<InventoryCondition | BackendMutationResponse<InventoryCondition>>(`/AssetConditionMaster/${id}`);
      if (!res.success || !res.data) {
        createInventoryConditionError(
          res.statusCode,
          res.error,
          `Failed to fetch inventory condition #${id}`
        );
      }
      const rawData = res.data;
      const item = ('items' in rawData && rawData.items) ? rawData.items : (rawData as InventoryCondition);
      return normalizeConditionItem(item);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Creates a new inventory condition.
   *
   * @param dto - Condition DTO to persist
   * @returns The newly created InventoryCondition
   */
  async create(dto: CreateInventoryConditionDto): Promise<InventoryCondition> {
    try {
      const res = await apiClient.post<BackendMutationResponse<InventoryCondition>>(
        '/AssetConditionMaster',
        dto
      );
      if (!res.success || !res.data) {
        createInventoryConditionError(
          res.statusCode,
          res.error,
          'Create inventory condition failed'
        );
      }
      const rawData = res.data;
      const createdItem = ('items' in rawData && rawData.items) ? rawData.items : (rawData as unknown as InventoryCondition);
      return normalizeConditionItem(createdItem);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Updates an existing inventory condition.
   *
   * @param id - ID of the condition to update
   * @param dto - Updated condition DTO
   * @returns The updated InventoryCondition
   */
  async update(
    id: number | string,
    dto: UpdateInventoryConditionDto
  ): Promise<InventoryCondition> {
    try {
      const res = await apiClient.put<BackendMutationResponse<InventoryCondition>>(
        `/AssetConditionMaster/${id}`,
        dto
      );
      if (!res.success || !res.data) {
        createInventoryConditionError(
          res.statusCode,
          res.error,
          'Update inventory condition failed'
        );
      }
      const rawData = res.data;
      const updatedItem = ('items' in rawData && rawData.items) ? rawData.items : (rawData as unknown as InventoryCondition);
      return normalizeConditionItem(updatedItem);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Soft-deletes an inventory condition by ID.
   *
   * @param id - ID of the condition to delete
   */
  async delete(id: number | string): Promise<void> {
    try {
      const res = await apiClient.delete<BackendMutationResponse<null>>(`/AssetConditionMaster/${id}`);
      if (!res.success) {
        createInventoryConditionError(
          res.statusCode,
          res.error,
          `Delete inventory condition #${id} failed`
        );
      }
    } catch (error) {
      throw error;
    }
  },
};
