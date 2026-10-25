import { apiClient } from "@/services/api.service";
import type { UseType } from "@/types/typeOfUse.types";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { mapApiTypeToUi } from "./typeofuse.mappers";
import { TypeOfUseErrorMessages } from "./typeofuse.errors";

/* ====================================================================== */
/* =============================== TYPE APIS ============================= */
/* ====================================================================== */

/**
 * Get paginated list of use types
 */
export async function getUseTypesPagedServer(params: {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
  typeOfUseId?: number;
  type?: string;
  typeOfUseGroupId?: number;
}): Promise<PagedResponse<UseType>> {
  try {
    const qs = new URLSearchParams();
    qs.set("PageNumber", String(params.pageNumber));
    qs.set("PageSize", String(params.pageSize));
    if (params.searchTerm) qs.set("SearchTerm", params.searchTerm);
    if (params.sortBy) qs.set("SortBy", params.sortBy);
    if (params.sortOrder) qs.set("SortOrder", params.sortOrder);
    if (typeof params.filterLogic === "number") qs.set("FilterLogic", String(params.filterLogic));
    if (typeof params.typeOfUseId === "number") qs.set("TypeOfUseId", String(params.typeOfUseId));
    if (params.type) qs.set("Type", params.type);
    if (typeof params.typeOfUseGroupId === "number") qs.set("TypeOfUseGroupId", String(params.typeOfUseGroupId));

    const response = await apiClient.get<PagedResponse<unknown>>(`/TypeOfUse?${qs.toString()}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.FETCH_TYPES_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.FETCH_TYPES_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const data = response.data;
    return { ...data, items: (data.items ?? []).map((t) => mapApiTypeToUi(t as Record<string, unknown>)) };
  } catch (error) {
    logger.error("Error fetching use types", { error: error as Error });
    throw error;
  }
}

/**
 * Get a single use type by ID
 */
export async function getUseTypeById(id: string | number): Promise<UseType | null> {
  try {
    const response = await apiClient.get<unknown>(`/TypeOfUse/${id}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      return null;
    }

    return response.data ? mapApiTypeToUi(response.data as Record<string, unknown>) : null;
  } catch (error) {
    logger.error(`Error fetching use type ${id}`, { error: error as Error });
    throw error;
  }
}

/**
 * Create a new use type
 */
export async function createUseTypeApi(input: {
  typeOfUseCode: string;
  description: string;
  type: string;
  typeOfUseGroupId: number;
  searchSequence: number;
  isActive: boolean;
  createdBy?: string;
  typeOfUseCategoryId?: number | null;
}): Promise<UseType> {
  try {
    const payload = {
      typeOfUseCode: input.typeOfUseCode?.trim(),
      description: input.description?.trim(),
      type: input.type,
      typeOfUseGroupId: input.typeOfUseGroupId,
      searchSequence: input.searchSequence,
      isActive: input.isActive,
      createdBy: Number(input.createdBy ?? "1"),
      typeOfUseCategoryId: input.typeOfUseCategoryId ?? null,
    };

    const response = await apiClient.post<unknown>("/TypeOfUse", payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.CREATE_TYPE_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.CREATE_TYPE_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return mapApiTypeToUi(response.data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error creating use type", { error: error as Error });
    throw error;
  }
}

/**
 * Update an existing use type
 */
export async function updateUseTypeApi(input: {
  typeOfUseId: number;
  typeOfUseCode: string;
  description: string;
  type: string;
  typeOfUseGroupId: number;
  searchSequence: number;
  isActive: boolean;
  updatedBy?: string;
  typeOfUseCategoryId?: number | null;
}): Promise<UseType> {
  try {
    const payload = {
      typeOfUseId: input.typeOfUseId,
      typeOfUseCode: input.typeOfUseCode?.trim(),
      description: input.description?.trim(),
      type: input.type,
      typeOfUseGroupId: input.typeOfUseGroupId,
      searchSequence: input.searchSequence,
      isActive: input.isActive,
      updatedBy: Number(input.updatedBy ?? "1"),
      typeOfUseCategoryId: input.typeOfUseCategoryId ?? null,
    };

    const response = await apiClient.put<unknown>(`/TypeOfUse/${input.typeOfUseId}`, payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.UPDATE_TYPE_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.UPDATE_TYPE_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return mapApiTypeToUi(response.data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error updating use type", { error: error as Error });
    throw error;
  }
}

/**
 * Delete a use type (purge - permanent delete)
 */
export async function deleteUseTypeApi(id: string) {
  try {
    const response = await apiClient.delete<unknown>(`/TypeOfUse/${id}/purge`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.DELETE_TYPE_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.DELETE_TYPE_FAILED
      );
    }

    return true;
  } catch (error) {
    logger.error(`Error deleting use type ${id}`, { error: error as Error });
    throw error;
  }
}
