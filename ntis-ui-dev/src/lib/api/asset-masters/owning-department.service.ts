import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import {
  OwningDepartment,
  OwningDepartmentFormModel,
  RawOwningDepartment,
} from "@/types/asset-masters/owning-department.types";

const normalize = (item: RawOwningDepartment): OwningDepartment => ({
  id: item.id ?? 0,
  owningDepartmentName: item.owningDepartmentName ?? "",
  description: item.description ?? "",
  isActive: item.isActive ?? false,
  markedForDeletion: item.markedForDeletion ?? false,
  createdDate: item.createdDate ?? null,
  updatedDate: item.updatedDate ?? null,
  createdBy: item.createdBy ?? null,
  updatedBy: item.updatedBy ?? null,
});

export async function getOwningDepartmentsPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<OwningDepartment>> {
  const params = new URLSearchParams();
  params.set("PageNumber", String(pageNumber));
  params.set("PageSize", String(pageSize));
  params.set("MarkedForDeletion", "false");
  if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
  if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
  if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

  const response = await apiClient.get<PagedResponse<RawOwningDepartment>>(`/OwningDepartment?${params.toString()}`);
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to fetch owning department master",
      "Get owning department master failed"
    );
  }

  return {
    ...response.data,
    items: (response.data.items ?? []).map(normalize),
  };
}

export async function getOwningDepartmentById(id: number): Promise<OwningDepartment | null> {
  const response = await apiClient.get<RawOwningDepartment>(`/OwningDepartment/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || `Failed to fetch owning department master ${id}`,
      `Get owning department master ${id} failed`
    );
  }
  if (!response.data) return null;
  return normalize(response.data);
}

export async function createOwningDepartment(data: OwningDepartmentFormModel): Promise<void> {
  const payload = {
    owningDepartmentName: data.owningDepartmentName.trim(),
    description: data.description.trim(),
    isActive: data.isActive,
    createdBy: data.createdBy || null,
  };
  const response = await apiClient.post<void>("/OwningDepartment", payload);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Create owning department master failed",
      "Create owning department master failed"
    );
  }
}

export async function updateOwningDepartment(data: OwningDepartmentFormModel): Promise<void> {
  if (!data.id) {
    throw new ApiError(400, "Valid owning department master ID is required", "Validation failed");
  }
  const payload = {
    id: data.id,
    owningDepartmentName: data.owningDepartmentName.trim(),
    description: data.description.trim(),
    isActive: data.isActive,
    updatedBy: data.updatedBy || null,
  };
  const response = await apiClient.put<void>(`/OwningDepartment/${encodeURIComponent(String(data.id))}`, payload);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Update owning department master failed",
      "Update owning department master failed"
    );
  }
}

export async function deleteOwningDepartment(id: number): Promise<void> {
  const response = await apiClient.delete<void>(`/OwningDepartment/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || `Delete owning department master ${id} failed`,
      `Delete owning department master ${id} failed`
    );
  }
}
