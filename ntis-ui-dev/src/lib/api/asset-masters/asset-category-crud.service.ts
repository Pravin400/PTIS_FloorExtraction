import { apiClient } from "@/services/api.service";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import type { AssetCategory, AssetCategoryApiRecord, AssetCategoryParams } from "@/types/asset-masters/asset-category.types";

import { handleMasterDataApiRequest } from "./api-utils";

export const assetCategoryService = {
  async getAll(params?: AssetCategoryParams): Promise<PagedResponse<AssetCategory>> {
    const q = new URLSearchParams();
    if (params?.PageNumber) q.set('PageNumber', params.PageNumber.toString());
    if (params?.PageSize) q.set('PageSize', params.PageSize.toString());
    if (params?.SearchTerm) q.set('SearchTerm', params.SearchTerm);
    if (params?.IsActive) q.set('IsActive', params.IsActive);
    q.set('MarkedForDeletion', String((params as Record<string, unknown>)?.MarkedForDeletion ?? false));
    if (params?.SortBy) q.set('SortBy', params.SortBy);
    if (params?.SortOrder) q.set('SortOrder', params.SortOrder);

    const queryString = q.toString();
    const res = await apiClient.get<PagedResponse<AssetCategoryApiRecord>>(
      queryString ? `/AssetCategory?${queryString}` : '/AssetCategory',
      { cache: 'no-store' }
    );

    if (!res.success || !res.data) throw new ApiError(res.statusCode ?? 500, res.error || "Failed to fetch paged asset categories", "Get paged categories failed");

    const rawData: unknown = res.data;
    const items: unknown[] = Array.isArray(rawData)
      ? rawData
      : (rawData && typeof rawData === 'object' && 'items' in rawData && Array.isArray((rawData as Record<string, unknown>).items))
        ? (rawData as Record<string, unknown>).items as unknown[]
        : [];

    const validItems = (items as Record<string, unknown>[]).filter((item: Record<string, unknown>) => {
      const isDeleted = item.markedForDeletion === true || item.markedForDeletion === 1 || String(item.markedForDeletion).toLowerCase() === 'true';
      return !isDeleted;
    });

    // Normalize mappings directly inside the service
    const normalized = validItems.map((item: Record<string, unknown>) => ({
      id: item.id,
      categoryName: item.categoryName,
      categoryCode: item.categoryCode,
      isActive: item.isActive,
      description: item.description,
      backendId: item.id,
      isMovable: Boolean(item.isMovable),
      hasFloorDetails: Boolean(item.hasFloorDetails),
      hasInventory: Boolean(item.hasInventory),
      isInventoryMandatory: Boolean(item.isInventoryMandatory),
      hasLegalCompliance: Boolean(item.hasLegalCompliance),
      valuationType: item.valuationType || "",
    })) as unknown as AssetCategory[];

    const removedCount = items.length - validItems.length;

    return {
      items: normalized,
      totalCount: Math.max(0, (res.data.totalCount ?? normalized.length) - removedCount),
      totalPages: res.data.totalPages ?? 1,
      pageNumber: res.data.pageNumber ?? (params?.PageNumber || 1),
      pageSize: res.data.pageSize ?? (params?.PageSize || 10),
      hasPrevious: res.data.hasPrevious ?? ((params?.PageNumber || 1) > 1),
      hasNext: res.data.hasNext ?? ((params?.PageNumber || 1) < (res.data.totalPages ?? 1))
    };
  },

  async getById(id: number | string): Promise<AssetCategoryApiRecord> {
    return handleMasterDataApiRequest(
      () => apiClient.get<AssetCategoryApiRecord>(`/AssetCategory/${id}`),
      `Failed to fetch asset category ${id}`
    );
  },

  async create(payload: Record<string, unknown>): Promise<AssetCategoryApiRecord> {
    try {
      return await handleMasterDataApiRequest(
        () => apiClient.post<AssetCategoryApiRecord>('/AssetCategory', payload),
        'Create asset category failed'
      );
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(500, e instanceof Error ? e.message : "Unknown error", "Create asset category failed");
    }
  },

  async update(id: number | string, payload: Record<string, unknown>): Promise<AssetCategoryApiRecord> {
    try {
      return await handleMasterDataApiRequest(
        () => apiClient.put<AssetCategoryApiRecord>(`/AssetCategory/${id}`, payload),
        'Update asset category failed'
      );
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(500, e instanceof Error ? e.message : "Unknown error", "Update asset category failed");
    }
  },

  async delete(id: number | string, userId?: number): Promise<void> {
    return handleMasterDataApiRequest(
      () => apiClient.delete<void>(`/AssetCategory/${id}${userId ? `?userId=${userId}` : ''}`),
      'Delete asset category failed'
    ) as Promise<void>;
  }
};
