 
import { apiClient } from "@/services/api.service";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import type {
  AssetDocumentDefinitionParams,
  AssetDocumentDefinitionDto,
  CreateDocumentDefinitionPayload,
  UpdateDocumentDefinitionPayload
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { AssetDocumentDefinitionParams };

export const assetDocumentDefinitionCrudService = {
  async getAll(params?: AssetDocumentDefinitionParams): Promise<PagedResponse<AssetDocumentDefinitionDto>> {
    const q = new URLSearchParams();
    q.set("MarkedForDeletion", String(params?.MarkedForDeletion ?? false));
    if (params?.PageNumber) q.set("PageNumber", params.PageNumber.toString());
    if (params?.PageSize) q.set("PageSize", params.PageSize.toString());
    if (params?.SearchTerm) q.set("SearchTerm", params.SearchTerm);
    if (params?.AssetCategoryId) q.set("AssetCategoryId", params.AssetCategoryId.toString());
    if (params?.AssetTypeId) q.set("AssetTypeId", params.AssetTypeId.toString());
    if (params?.IsActive !== undefined && params?.IsActive !== null) {
      q.set("IsActive", String(params.IsActive));
    }
    if (params?.SortBy) q.set("SortBy", params.SortBy);
    if (params?.SortOrder) q.set("SortOrder", params.SortOrder);

    const queryString = q.toString();
    const res = await apiClient.get<PagedResponse<AssetDocumentDefinitionDto>>(
      `/master/asset-document-definitions?${queryString}`,
      { cache: "no-store" }
    );

    if (!res.success || !res.data) {
      throw new ApiError(res.statusCode ?? 500, res.error || "Failed to fetch document definitions", "Get paged document definitions failed");
    }

    const rawData: unknown = res.data;
    const items: unknown[] = Array.isArray(rawData)
      ? rawData
      : (rawData && typeof rawData === 'object' && 'items' in rawData && Array.isArray((rawData as Record<string, unknown>).items))
        ? (rawData as Record<string, unknown>).items as unknown[]
        : [];

    return {
      items: items as AssetDocumentDefinitionDto[],
      totalCount: res.data.totalCount ?? items.length,
      totalPages: res.data.totalPages ?? 1,
      pageNumber: res.data.pageNumber ?? (params?.PageNumber || 1),
      pageSize: res.data.pageSize ?? (params?.PageSize || 10),
      hasPrevious: res.data.hasPrevious ?? ((params?.PageNumber || 1) > 1),
      hasNext: res.data.hasNext ?? false,
    };
  },

  async create(payload: CreateDocumentDefinitionPayload): Promise<AssetDocumentDefinitionDto> {
    const res = await apiClient.post<AssetDocumentDefinitionDto>("/master/asset-document-definitions", payload);
    if (!res.success || !res.data) {
      throw new ApiError(res.statusCode ?? 500, res.error || "Failed to create document definition", "Create document definition failed");
    }
    return res.data;
  },

  async update(id: number, payload: UpdateDocumentDefinitionPayload): Promise<AssetDocumentDefinitionDto> {
    const res = await apiClient.put<AssetDocumentDefinitionDto>(`/master/asset-document-definitions/${id}`, payload);
    if (!res.success || !res.data) {
      throw new ApiError(res.statusCode ?? 500, res.error || "Failed to update document definition", "Update document definition failed");
    }
    return res.data;
  },

  async getById(id: number): Promise<AssetDocumentDefinitionDto> {
    const res = await apiClient.get<AssetDocumentDefinitionDto>(`/master/asset-document-definitions/${id}`);
    if (!res.success || !res.data) {
      throw new ApiError(res.statusCode ?? 500, res.error || "Failed to fetch document definition by ID", "Get document definition by ID failed");
    }
    return res.data;
  },

  async delete(id: number): Promise<void> {
    const res = await apiClient.delete<unknown>(`/master/asset-document-definitions/${id}`);
    if (!res.success) {
      throw new ApiError(res.statusCode ?? 500, res.error || "Failed to delete document definition", "Delete document definition failed");
    }
  }
};
