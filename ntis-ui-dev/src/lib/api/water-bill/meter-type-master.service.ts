import { cookies } from "next/headers";
import { apiClient } from "@/services/api.service";
import { MeterType, MeterTypeFormModel } from "@/types/water-bill/meter-type-master.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

export async function getMeterTypesPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<MeterType>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<MeterType>>(`/MeterTypeMaster?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch meter types", "Get meter types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching paged meter types:", error);
    throw error;
  }
}

export async function getMeterTypeById(id: number): Promise<MeterType | null> {
  try {
    const response = await apiClient.get<MeterType>(`/MeterTypeMaster/${id}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch meter type", "Get meter type failed");
    }
    return response.data ?? null;
  } catch (error) {
    console.error(`Error fetching meter type ${id}:`, error);
    throw error;
  }
}

export async function createMeterType(data: MeterTypeFormModel): Promise<void> {
  try {
    const cookieStore = await cookies();
    const userId = data.createdBy ?? getUserIdFromCookies(cookieStore) ?? 1;

    const codeValue = (data.meterTypeCode || data.code || "").trim().toUpperCase();
    const payload = {
      meterTypeCode: codeValue,
      code: codeValue,
      meterType: data.meterType.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive,
      createdBy: userId,
    };
    const response = await apiClient.post<unknown>("/MeterTypeMaster", payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to create meter type", "Create failed");
    }
  } catch (error) {
    console.error("Error creating meter type:", error);
    throw error;
  }
}

export async function updateMeterType(data: MeterTypeFormModel): Promise<void> {
  try {
    const cookieStore = await cookies();
    const userId = data.updatedBy ?? getUserIdFromCookies(cookieStore) ?? 1;

    const codeValue = (data.meterTypeCode || data.code || "").trim().toUpperCase();
    const payload = {
      meterTypeCode: codeValue,
      code: codeValue,
      meterType: data.meterType.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive,
      updatedBy: userId,
    };
    const response = await apiClient.put<unknown>(`/MeterTypeMaster/${data.id}`, payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to update meter type", "Update failed");
    }
  } catch (error) {
    console.error("Error updating meter type:", error);
    throw error;
  }
}

export async function deleteMeterType(id: number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`/MeterTypeMaster/${id}/purge`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to delete meter type", "Delete failed");
    }
  } catch (error) {
    console.error(`Error deleting meter type ${id}:`, error);
    throw error;
  }
}
