import { apiClient } from "@/services/api.service";
import { Mouja, MoujaFormModel } from "@/types/mouja.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { isMoujaShape, normalizeMouja } from "./mouja-types-guard";
import {
  validateId, validateAndPrepareSearchTerm, validateCreateFormData,
  validateUpdateFormData, getDeleteErrorStatusCode, createApiError,
} from "./mouja-validation";

/** Fetches all mouja from the API */
export async function getMouja(): Promise<Mouja[]> {
  try {
    const response = await apiClient.get<PagedResponse<Mouja>>("/Mouja");
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch mouja", "Get mouja failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.filter(isMoujaShape).map(normalizeMouja);
  } catch (error) {
    logger.error("Error fetching mouja", { error: error as Error });
    throw error;
  }
}

/** Fetches paginated mouja from the API */
export async function getMoujaPaged(
  pageNumber: number, pageSize: number, searchTerm?: string, sortBy?: string, sortOrder?: string
): Promise<PagedResponse<Mouja>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<Mouja>>(`/Mouja?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged mouja", "Get paged mouja failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const items = response.data.items ?? [];
    const validItems = items.filter(isMoujaShape);
    const normalizedItems = validItems.map(normalizeMouja);
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    logger.error("Error fetching paged mouja", { error: error as Error });
    throw error;
  }
}

/** Fetches a single mouja by ID */
export async function getMoujaById(moujaId: number): Promise<Mouja | null> {
  try {
    if (!validateId(moujaId)) {
      throw new ApiError(400, "Valid Mouja ID is required", "Invalid mouja ID");
    }
    const response = await apiClient.get<Mouja>(`/Mouja/${encodeURIComponent(String(moujaId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch mouja", `Get mouja ${moujaId} failed`);
    }
    if (!response.data) return null;

    if (isMoujaShape(response.data)) {
      return normalizeMouja(response.data as Record<string, unknown>);
    }
    
    // Fallback for unexpected shape
    throw new ApiError(500, "Unexpected data format received from server", "Data validation failed");
  } catch (error) {
    logger.error(`Error fetching mouja ${moujaId}`, { error: error as Error });
    throw error;
  }
}

/** Creates a new mouja */
export async function createMouja(data: MoujaFormModel): Promise<void> {
  try {
    validateCreateFormData(data);
    const payload = {
      moujaNo: data.moujaNo.trim(),
      moujaName: data.moujaName.trim(),
      isActive: data.isActive,
      createdBy: data.createdBy ?? 1,
    };
    const response = await apiClient.post<unknown>("/Mouja", payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Create mouja failed");
    }
  } catch (error) {
    logger.error("Error creating mouja", { error: error as Error });
    throw error;
  }
}

/** Updates an existing mouja */
export async function updateMouja(data: MoujaFormModel): Promise<void> {
  try {
    validateUpdateFormData(data);
    const payload = {
      id: data.id,
      moujaNo: data.moujaNo.trim(),
      moujaName: data.moujaName.trim(),
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? 1,
    };
    const response = await apiClient.put<unknown>(`/Mouja/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Update mouja failed");
    }
  } catch (error) {
    logger.error("Error updating mouja", { error: error as Error });
    throw error;
  }
}

/** Deletes a mouja by ID */
export async function deleteMouja(id: number): Promise<void> {
  try {
    if (!validateId(id)) {
      throw new ApiError(400, "Valid Mouja ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/Mouja/${encodeURIComponent(String(id))}/purge`);
    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(statusCode, response.error || "Failed to delete mouja", `Delete mouja ${id} failed`);
    }
  } catch (error) {
    logger.error(`Error deleting mouja ${id}`, { error: error as Error });
    throw error;
  }
}

/** Searches mouja by mouja number or name (client-side) */
export async function searchMouja(query: string): Promise<Mouja[]> {
  try {
    if (!query?.trim()) return [];
    const allMouja = await getMouja();
    const lowerQuery = query.toLowerCase();
    return allMouja.filter(
      (mouja) =>
        mouja.moujaNo.toLowerCase().includes(lowerQuery) ||
        mouja.moujaName.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    logger.error("Error searching mouja", { error: error as Error });
    throw error;
  }
}
