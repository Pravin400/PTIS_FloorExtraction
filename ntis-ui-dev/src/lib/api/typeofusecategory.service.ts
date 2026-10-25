import { apiClient } from "@/services/api.service";
import type { TypeOfUseCategory } from "@/types/typeOfUse.types";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { TypeOfUseErrorMessages } from "./typeofuse.errors";

/**
 * Get paginated list of categories
 */
export async function getUseCategoriesPagedServer(params: {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
  typeOfUseCategoryCode?: string;
  typeOfUseCategoryName?: string;
}): Promise<PagedResponse<TypeOfUseCategory>> {
  try {
    const qs = new URLSearchParams();
    qs.set("PageNumber", String(params.pageNumber));
    qs.set("PageSize", String(params.pageSize));
    if (params.searchTerm) qs.set("SearchTerm", params.searchTerm);
    if (params.sortBy) qs.set("SortBy", params.sortBy);
    if (params.sortOrder) qs.set("SortOrder", params.sortOrder);
    if (typeof params.filterLogic === "number") qs.set("FilterLogic", String(params.filterLogic));
    if (params.typeOfUseCategoryCode) qs.set("TypeOfUseCategoryCode", params.typeOfUseCategoryCode);
    if (params.typeOfUseCategoryName) qs.set("TypeOfUseCategoryName", params.typeOfUseCategoryName);

    const response = await apiClient.get<PagedResponse<TypeOfUseCategory>>(`/TypeOfUseCategory?${qs.toString()}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    
    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.FETCH_CATEGORIES_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.FETCH_CATEGORIES_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return response.data;
  } catch (error) {
    logger.error("Error fetching use categories", { error: error as Error });
    throw error;
  }
}

/**
 * Get category by ID
 */
export async function getTypeOfUseCategoryById(id: string | number): Promise<TypeOfUseCategory | null> {
  try {
    const response = await apiClient.get<TypeOfUseCategory>(`/TypeOfUseCategory/${id}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    
    if (!response.success) {
      return null;
    }
    
    return response.data || null;
  } catch (error) {
    logger.error(`Error fetching use category ${id}`, { error: error as Error });
    throw error;
  }
}

/**
 * Create a new category
 */
export async function createTypeOfUseCategoryApi(input: {
  typeOfUseCategoryCode: string;
  typeOfUseCategoryName: string;
  isActive: boolean;
  createdBy: string;
}): Promise<TypeOfUseCategory> {
  try {
    const payload = {
      typeOfUseCategoryCode: input.typeOfUseCategoryCode?.trim(),
      typeOfUseCategoryName: input.typeOfUseCategoryName?.trim(),
      isActive: input.isActive,
      createdBy: Number(input.createdBy ?? "1"),
    };

    const response = await apiClient.post<TypeOfUseCategory>("/TypeOfUseCategory", payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    
    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.CREATE_CATEGORY_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.CREATE_CATEGORY_FAILED
      );
    }
    
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    
    return response.data;
  } catch (error) {
    logger.error("Error creating use category", { error: error as Error });
    throw error;
  }
}

/**
 * Update a category
 */
export async function updateTypeOfUseCategoryApi(input: {
  id: number;
  typeOfUseCategoryCode: string;
  typeOfUseCategoryName: string;
  isActive: boolean;
  updatedBy: string;
}): Promise<TypeOfUseCategory> {
  try {
    const payload = {
      id: input.id,
      typeOfUseCategoryCode: input.typeOfUseCategoryCode?.trim(),
      typeOfUseCategoryName: input.typeOfUseCategoryName?.trim(),
      isActive: input.isActive,
      updatedBy: Number(input.updatedBy ?? "1"),
    };

    const response = await apiClient.put<TypeOfUseCategory>(`/TypeOfUseCategory/${input.id}`, payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    
    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.UPDATE_CATEGORY_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.UPDATE_CATEGORY_FAILED
      );
    }
    
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    
    return response.data;
  } catch (error) {
    logger.error(`Error updating use category ${input.id}`, { error: error as Error });
    throw error;
  }
}

/**
 * Delete a category
 */
export async function deleteTypeOfUseCategoryApi(id: string | number): Promise<boolean> {
  try {
    const response = await apiClient.delete<unknown>(`/TypeOfUseCategory/${id}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    
    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.DELETE_CATEGORY_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.DELETE_CATEGORY_FAILED
      );
    }
    
    return true;
  } catch (error) {
    logger.error(`Error deleting use category ${id}`, { error: error as Error });
    throw error;
  }
}
