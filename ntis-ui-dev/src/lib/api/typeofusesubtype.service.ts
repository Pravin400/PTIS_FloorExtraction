import { apiClient } from "@/services/api.service";
import type { UseSubType } from "@/types/typeOfUse.types";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { mapApiSubTypeToUi } from "./typeofuse.mappers";
import { TypeOfUseErrorMessages } from "./typeofuse.errors";

/* ====================================================================== */
/* ============================ SUBTYPE APIS ============================= */
/* ====================================================================== */

/**
 * Get paginated list of use subtypes
 */
export async function getSubTypesPagedServer(params: {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
  typeOfUseId?: number;
}): Promise<PagedResponse<UseSubType>> {
  try {
    const qs = new URLSearchParams();
    qs.set("PageNumber", String(params.pageNumber));
    qs.set("PageSize", String(params.pageSize));
    if (params.searchTerm) qs.set("SearchTerm", params.searchTerm);
    if (params.sortBy) qs.set("SortBy", params.sortBy);
    if (params.sortOrder) qs.set("SortOrder", params.sortOrder);
    if (typeof params.filterLogic === "number") qs.set("FilterLogic", String(params.filterLogic));
    if (typeof params.typeOfUseId === "number") qs.set("TypeOfUseId", String(params.typeOfUseId));

    const response = await apiClient.get<PagedResponse<unknown>>(`/SubTypeOfUse?${qs.toString()}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.FETCH_SUBTYPES_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.FETCH_SUBTYPES_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const data = response.data;
    return { ...data, items: (data.items ?? []).map((s) => mapApiSubTypeToUi(s as Record<string, unknown>)) };
  } catch (error) {
    logger.error("Error fetching use subtypes", { error: error as Error });
    throw error;
  }
}

/**
 * Get a single use subtype by ID
 */
export async function getSubTypeByIdApi(id: string | number): Promise<UseSubType | null> {
  try {
    const response = await apiClient.get<unknown>(`/SubTypeOfUse/${id}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      return null;
    }

    return response.data ? mapApiSubTypeToUi(response.data as Record<string, unknown>) : null;
  } catch (error) {
    logger.error(`Error fetching use subtype ${id}`, { error: error as Error });
    throw error;
  }
}

/**
 * Create a new use subtype
 */
export async function createSubTypeApi(input: {
  description: string;
  typeOfUseId: number;
  searchSequence: number;
  isActive: boolean;
  createdBy?: string;
  typeOfUseCategoryId?: number | null;
}): Promise<UseSubType> {
  try {
    const payload = {
      description: input.description?.trim(),
      typeOfUseId: input.typeOfUseId,
      searchSequence: input.searchSequence,
      isActive: input.isActive,
      createdBy: Number(input.createdBy ?? "1"),
      typeOfUseCategoryId: input.typeOfUseCategoryId ?? null,
    };

    const response = await apiClient.post<unknown>("/SubTypeOfUse", payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.CREATE_SUBTYPE_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.CREATE_SUBTYPE_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return mapApiSubTypeToUi(response.data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error creating use subtype", { error: error as Error });
    throw error;
  }
}

/**
 * Update an existing use subtype
 */
export async function updateSubTypeApi(input: {
  subTypeOfUseId: number;
  description: string;
  typeOfUseId: number;
  searchSequence: number;
  isActive: boolean;
  updatedBy?: string;
  typeOfUseCategoryId?: number | null;
}): Promise<UseSubType> {
  try {
    const payload = {
      subTypeOfUseId: input.subTypeOfUseId,
      description: input.description?.trim(),
      typeOfUseId: input.typeOfUseId,
      searchSequence: input.searchSequence,
      isActive: input.isActive,
      updatedBy: Number(input.updatedBy ?? "1"),
      typeOfUseCategoryId: input.typeOfUseCategoryId ?? null,
    };

    const response = await apiClient.put<unknown>(`/SubTypeOfUse/${input.subTypeOfUseId}`, payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.UPDATE_SUBTYPE_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.UPDATE_SUBTYPE_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return mapApiSubTypeToUi(response.data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error updating use subtype", { error: error as Error });
    throw error;
  }
}

/**
 * Delete a use subtype (purge - permanent delete)
 */
export async function deleteSubTypeApi(id: string) {
  try {
    const response = await apiClient.delete<unknown>(`/SubTypeOfUse/${id}/purge`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.DELETE_SUBTYPE_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.DELETE_SUBTYPE_FAILED
      );
    }

    return true;
  } catch (error) {
    logger.error(`Error deleting use subtype ${id}`, { error: error as Error });
    throw error;
  }
}

/**
 * Get subtype count by type IDs
 */
export async function getSubTypeCountByTypeIds(typeIds: string[]) {
  try {
    const response = await apiClient.post<{ [key: string]: number }>(
      "/SubTypeOfUse/CountByType",
      { typeIds },
      {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      }
    );

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.FETCH_SUBTYPE_COUNTS_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.FETCH_SUBTYPE_COUNTS_FAILED
      );
    }

    return response.data; // { [typeId]: number }
  } catch (error) {
    logger.error("Error fetching subtype counts", { error: error as Error });
    throw error;
  }
}
