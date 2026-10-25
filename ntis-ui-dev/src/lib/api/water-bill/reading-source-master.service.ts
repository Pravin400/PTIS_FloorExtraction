import { cookies } from "next/headers";
import { apiClient } from "@/services/api.service";
import { ReadingSource, ReadingSourceFormModel } from "@/types/water-bill/reading-source-master.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

export async function getReadingSourcesPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<ReadingSource>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
    if (sortBy?.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder?.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<ReadingSource>>(`/ReadingSourceMaster?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch reading sources", "Get reading sources failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching paged reading sources:", error);
    throw error;
  }
}

export async function getReadingSourceById(id: number): Promise<ReadingSource | null> {
  try {
    const response = await apiClient.get<ReadingSource>(`/ReadingSourceMaster/${id}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch reading source", "Get reading source failed");
    }
    return response.data ?? null;
  } catch (error) {
    console.error(`Error fetching reading source ${id}:`, error);
    throw error;
  }
}

export async function createReadingSource(data: ReadingSourceFormModel): Promise<void> {
  try {
    const cookieStore = await cookies();
    const userId = data.createdBy ?? getUserIdFromCookies(cookieStore) ?? 1;

    const codeValue = (data.readingSourceCode || data.code || "").trim().toUpperCase();
    const payload = {
      readingSourceCode: codeValue,
      code: codeValue,
      readingSource: data.readingSource.trim(),
      isActive: data.isActive,
      createdBy: userId,
    };
    const response = await apiClient.post<unknown>("/ReadingSourceMaster", payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to create reading source", "Create failed");
    }
  } catch (error) {
    console.error("Error creating reading source:", error);
    throw error;
  }
}

export async function updateReadingSource(data: ReadingSourceFormModel): Promise<void> {
  try {
    const cookieStore = await cookies();
    const userId = data.updatedBy ?? getUserIdFromCookies(cookieStore) ?? 1;

    const codeValue = (data.readingSourceCode || data.code || "").trim().toUpperCase();
    const payload = {
      readingSourceCode: codeValue,
      code: codeValue,
      readingSource: data.readingSource.trim(),
      isActive: data.isActive,
      updatedBy: userId,
    };
    const response = await apiClient.put<unknown>(`/ReadingSourceMaster/${data.id}`, payload);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to update reading source", "Update failed");
    }
  } catch (error) {
    console.error("Error updating reading source:", error);
    throw error;
  }
}

export async function deleteReadingSource(id: number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`/ReadingSourceMaster/${id}/purge`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to delete reading source", "Delete failed");
    }
  } catch (error) {
    console.error(`Error deleting reading source ${id}:`, error);
    throw error;
  }
}
