import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import { GstMaster, GstMasterFormModel, RawGstMaster } from "@/types/asset-masters/gst-master.types";

const normalize = (item: RawGstMaster): GstMaster => ({
  id: item.id ?? 0,
  taxCode: item.taxCode ?? "",
  taxName: item.taxName ?? "",
  taxPercentage: item.taxPercentage ?? 0,
  effectiveFromDate: item.effectiveFromDate ?? null,
  effectiveToDate: item.effectiveToDate ?? null,
  isActive: item.isActive ?? false,
  createdDate: item.createdDate ?? null,
  updatedDate: item.updatedDate ?? null,
  createdBy: item.createdBy ?? null,
  updatedBy: item.updatedBy ?? null,
});

export async function getGstMastersPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<GstMaster>> {
  const params = new URLSearchParams();
  params.set("PageNumber", String(pageNumber));
  params.set("PageSize", String(pageSize));
  params.set("MarkedForDeletion", "false");
  if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
  if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
  if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

  const response = await apiClient.get<PagedResponse<RawGstMaster>>(`/GST?${params.toString()}`);
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch GST master", "Get GST master failed");
  }

  return {
    ...response.data,
    items: (response.data.items ?? []).map(normalize),
  };
}

export async function getGstMasterById(id: number): Promise<GstMaster | null> {
  const response = await apiClient.get<RawGstMaster>(`/GST/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || `Failed to fetch GST master ${id}`, `Get GST master ${id} failed`);
  }
  if (!response.data) return null;
  return normalize(response.data);
}

export async function createGstMaster(data: GstMasterFormModel): Promise<void> {
  const payload = {
    taxCode: data.taxCode.trim(),
    taxName: data.taxName.trim(),
    taxPercentage: Number(data.taxPercentage) || 0,
    effectiveFromDate: data.effectiveFromDate || null,
    effectiveToDate: data.effectiveToDate || null,
    isActive: data.isActive,
    createdBy: data.createdBy || null,
  };
  const response = await apiClient.post<void>("/GST", payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Create GST master failed", "Create GST master failed");
  }
}

export async function updateGstMaster(data: GstMasterFormModel): Promise<void> {
  if (!data.id) {
    throw new ApiError(400, "Valid GST master ID is required", "Validation failed");
  }
  const payload = {
    id: data.id,
    taxCode: data.taxCode.trim(),
    taxName: data.taxName.trim(),
    taxPercentage: Number(data.taxPercentage) || 0,
    effectiveFromDate: data.effectiveFromDate || null,
    effectiveToDate: data.effectiveToDate || null,
    isActive: data.isActive,
    updatedBy: data.updatedBy || null,
  };
  const response = await apiClient.put<void>(`/GST/${encodeURIComponent(String(data.id))}`, payload);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || "Update GST master failed", "Update GST master failed");
  }
}

export async function deleteGstMaster(id: number): Promise<void> {
  const response = await apiClient.delete<void>(`/GST/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error || `Delete GST master ${id} failed`, `Delete GST master ${id} failed`);
  }
}
