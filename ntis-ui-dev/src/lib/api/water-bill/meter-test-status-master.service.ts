import { cookies } from "next/headers";
import { apiClient } from "@/services/api.service";
import { MeterTestStatus, MeterTestStatusFormModel } from "@/types/water-bill/meter-test-status-master.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

export async function getMeterTestStatusesPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<MeterTestStatus>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<MeterTestStatus>>(`/MeterTestStatusMaster?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch meter test statuses", "Get meter test statuses failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching paged meter test statuses:", error);
    throw error;
  }
}

export async function getMeterTestStatusById(id: number): Promise<MeterTestStatus | null> {
  try {
    const response = await apiClient.get<MeterTestStatus>(`/MeterTestStatusMaster/${id}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch meter test status", "Get meter test status failed");
    }
    return response.data ?? null;
  } catch (error) {
    console.error(`Error fetching meter test status ${id}:`, error);
    throw error;
  }
}

export async function createMeterTestStatus(data: MeterTestStatusFormModel): Promise<void> {
  try {
    const cookieStore = await cookies();
    const userId = data.createdBy ?? getUserIdFromCookies(cookieStore) ?? 1;

    const codeValue = (data.meterTestStatusCode || data.code || "").trim().toUpperCase();
    const payload = {
      meterTestStatusCode: codeValue,
      code: codeValue,
      meterTestStatus: data.meterTestStatus.trim(),
      isActive: data.isActive,
      createdBy: userId,
    };
    const response = await apiClient.post<unknown>("/MeterTestStatusMaster", payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to create meter test status", "Create failed");
    }
  } catch (error) {
    console.error("Error creating meter test status:", error);
    throw error;
  }
}

export async function updateMeterTestStatus(data: MeterTestStatusFormModel): Promise<void> {
  try {
    const cookieStore = await cookies();
    const userId = data.updatedBy ?? getUserIdFromCookies(cookieStore) ?? 1;

    const codeValue = (data.meterTestStatusCode || data.code || "").trim().toUpperCase();
    const payload = {
      meterTestStatusCode: codeValue,
      code: codeValue,
      meterTestStatus: data.meterTestStatus.trim(),
      isActive: data.isActive,
      updatedBy: userId,
    };
    const response = await apiClient.put<unknown>(`/MeterTestStatusMaster/${data.id}`, payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to update meter test status", "Update failed");
    }
  } catch (error) {
    console.error("Error updating meter test status:", error);
    throw error;
  }
}

export async function deleteMeterTestStatus(id: number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`/MeterTestStatusMaster/${id}/purge`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to delete meter test status", "Delete failed");
    }
  } catch (error) {
    console.error(`Error deleting meter test status ${id}:`, error);
    throw error;
  }
}
