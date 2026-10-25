import { apiClient } from "@/services/api.service";
import { ConstructionType, ConstructionTypeFormModel } from "@/types/construction.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { isConstructionTypeShape, normalizeConstructionType } from "./construction-types-guard";
import {
  validateid, validateAndPrepareSearchTerm, validateCreateFormData,
  validateUpdateFormData, getDeleteErrorStatusCode, createApiError,
  checkBackendResponseErrors,
} from "./construction-validation";

/** Fetches all construction types from the API */
export async function getConstruction(): Promise<ConstructionType[]> {
  try {
    const response = await apiClient.get<PagedResponse<ConstructionType>>("/ConstructionType?PageNumber=1&PageSize=-1");
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch construction types", "Get construction types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.filter(isConstructionTypeShape).map(normalizeConstructionType);
  } catch (error) {
    console.error("Error fetching construction types:", error);
    throw error;
  }
}

/** Fetches paginated construction types from the API */
export async function getConstructionPaged(
  pageNumber: number, pageSize: number, searchTerm?: string, sortBy?: string, sortOrder?: string
): Promise<PagedResponse<ConstructionType>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<ConstructionType>>(`/ConstructionType?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged construction types", "Get paged construction types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const validItems = response.data.items.filter(isConstructionTypeShape);
    const normalizedItems = validItems.map(normalizeConstructionType);
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    console.error("Error fetching paged construction types:", error);
    throw error;
  }
}

/** Fetches a single construction type by ID */
export async function getConstructionTypeById(constructionId: number): Promise<ConstructionType | null> {
  try {
    if (!validateid(constructionId)) {
      throw new ApiError(400, "Valid Construction Type ID is required", "Invalid construction type ID");
    }
    const response = await apiClient.get<ConstructionType>(`/ConstructionType/${encodeURIComponent(String(constructionId))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch construction type", `Get construction type ${constructionId} failed`);
    }
    if (!response.data) return null;

    if (isConstructionTypeShape(response.data)) {
      return normalizeConstructionType(response.data as Record<string, unknown>);
    }
    
    // Fallback for unexpected shape
    throw new ApiError(500, "Unexpected data format received from server", "Data validation failed");
  } catch (error) {
    console.error(`Error fetching construction type ${constructionId}:`, error);
    throw error;
  }
}

/** Creates a new construction type */
export async function createConstructionType(data: ConstructionTypeFormModel): Promise<void> {
  try {
    const existing = await getConstruction().catch(() => []);
    await validateCreateFormData(data, existing);
    const payload = {
      constructionCode: data.constructionCode.trim(),
      descriptionEnglish: (data.descriptionEnglish ?? "").trim(),
      description: (data.description ?? "").trim(),
      searchSequence: Number(data.searchSequence) || 0,
      isActive: data.isActive,
      createdBy: data.createdBy ?? 1,
    };
    const response = await apiClient.post<unknown>("/ConstructionType", payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Create construction type failed");
    }
    checkBackendResponseErrors(response.data as Record<string, unknown>, "Create construction type");
  } catch (error) {
    console.error("Error creating construction type:", error);
    throw error;
  }
}

/** Updates an existing construction type */
export async function updateConstructionType(data: ConstructionTypeFormModel): Promise<void> {
  try {
    const existing = await getConstruction().catch(() => []);
    await validateUpdateFormData(data, existing);
    const payload = {
      id: data.id,
      constructionCode: data.constructionCode.trim(),
      descriptionEnglish: (data.descriptionEnglish ?? "").trim(),
      description: (data.description ?? "").trim(),
      searchSequence: Number(data.searchSequence) || 0,
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? 1,
    };
    const response = await apiClient.put<unknown>(`/ConstructionType/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Update construction type failed");
    }
    checkBackendResponseErrors(response.data as Record<string, unknown>, "Update construction type");
  } catch (error) {
    console.error("Error updating construction type:", error);
    throw error;
  }
}

/** Deletes a construction type by ID */
export async function deleteConstructionType(id: number): Promise<void> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Construction Type ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/ConstructionType/${encodeURIComponent(String(id))}/purge`);
    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(statusCode, response.error || "Failed to delete construction type", `Delete construction type ${id} failed`);
    }
  } catch (error) {
    console.error(`Error deleting construction type ${id}:`, error);
    throw error;
  }
}

/** Searches construction types by construction ID or description (client-side) */
export async function searchConstructionTypes(query: string): Promise<ConstructionType[]> {
  try {
    if (!query?.trim()) return [];
    const list = await getConstruction();
    const searchQuery = query.toLowerCase();
    return list.filter((item) =>
      item.constructionCode?.toLowerCase().includes(searchQuery) ||
      item.description?.toLowerCase().includes(searchQuery)
    );
  } catch (error) {
    console.error("Error searching construction types:", error);
    throw error;
  }
}