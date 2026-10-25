import { apiClient } from "@/services/api.service";
import { AssetType, AssetTypeApiRecord } from "@/types/asset-masters/asset-type.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import type { AssetTypeParams } from "@/types/asset-masters/asset-type.types";

import { handleMasterDataApiRequest } from "./api-utils";

export const assetTypeService = {
  async getAll(params?: AssetTypeParams): Promise<PagedResponse<AssetType>> {
    const q = new URLSearchParams();
    if (params?.PageNumber) q.set('PageNumber', params.PageNumber.toString());
    if (params?.PageSize) q.set('PageSize', params.PageSize.toString());
    if (params?.SearchTerm) q.set('SearchTerm', params.SearchTerm);
    if (params?.IsActive) q.set('IsActive', params.IsActive);
    q.set('MarkedForDeletion', String((params as Record<string, unknown>)?.MarkedForDeletion ?? false));
    if (params?.CategoryId && params.CategoryId > 0) q.set('AssetCategoryId', params.CategoryId.toString());
    if (params?.SortBy) q.set('SortBy', params.SortBy);
    if (params?.SortOrder) q.set('SortOrder', params.SortOrder);

    const queryString = q.toString();
    const res = await apiClient.get<PagedResponse<AssetTypeApiRecord>>(
      queryString ? `/AssetType?${queryString}` : '/AssetType',
      { cache: 'no-store' }
    );

    if (!res.success || !res.data) throw new ApiError(res.statusCode ?? 500, res.error || "Failed to fetch paged asset types", "Get paged types failed");

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

    // Quick map for asset type
    const normalized = validItems.map((item: Record<string, unknown>) => ({
      id: Number(item.id ?? 0),
      typeCode: String(item.typeCode ?? ""),
      typeName: String(item.typeName ?? ""),
      typeNameLocal: String(item.typeNameLocal ?? item.TypeNameLocal ?? ""),
      categoryId: Number(item.categoryId ?? 0),
      categoryName: String(item.categoryName ?? item.assetCategoryName ?? ""),
      isActive: Boolean(item.isActive),
      createdDate: String(item.createdDate ?? ""),
      updatedDate: item.updatedDate ? String(item.updatedDate) : null,
      name: item.typeName,
      code: item.typeCode,
      status: item.isActive ? 'Active' : 'Inactive',
      description: String(item.description ?? item.Description ?? ""),
      backendId: item.id,
      group: String(item.categoryId || ""),
      allowRoomRegistration: item.allowRoomRegistration,
      allowUnitRegistration: item.allowUnitRegistration,
      ...(item.isSubUnit !== undefined && item.isSubUnit !== null
        ? {
            isSubUnit:
              item.isSubUnit === true ||
              item.isSubUnit === 1 ||
              String(item.isSubUnit).toLowerCase() === "true",
          }
        : {}),
    })) as AssetType[];

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

  async getById(id: number | string): Promise<AssetTypeApiRecord> {
    return handleMasterDataApiRequest(
      () => apiClient.get<AssetTypeApiRecord>(`/AssetType/${id}`),
      `Failed to fetch asset type ${id}`
    );
  },

  async create(payload: Record<string, unknown>): Promise<AssetTypeApiRecord> {
    try {
      return await handleMasterDataApiRequest(
        () => apiClient.post<AssetTypeApiRecord>('/AssetType', payload),
        'Create asset type failed'
      );
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(500, e instanceof Error ? e.message : "Unknown error", "Create asset type failed");
    }
  },

  async update(id: number | string, payload: Record<string, unknown>): Promise<AssetTypeApiRecord> {
    try {
      return await handleMasterDataApiRequest(
        () => apiClient.put<AssetTypeApiRecord>(`/AssetType/${id}`, payload),
        'Update asset type failed'
      );
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(500, e instanceof Error ? e.message : "Unknown error", "Update asset type failed");
    }
  },

  async delete(id: number | string, userId?: number): Promise<void> {
    return handleMasterDataApiRequest(
      () => apiClient.delete<void>(`/AssetType/${id}${userId ? `?userId=${userId}` : ''}`),
      'Delete asset type failed'
    ) as Promise<void>;
  }
};
