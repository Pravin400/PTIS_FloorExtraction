import { apiClient } from "@/services/api.service";
import type { UseGroup, UseGroupIconKey } from "@/types/typeOfUse.types";
import type { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { mapApiGroupToUi, iconKeyToApi } from "./typeofuse.mappers";
import { TypeOfUseErrorMessages } from "./typeofuse.errors";

/* ====================================================================== */
/* =============================== GROUP APIS ============================ */
/* ====================================================================== */

/**
 * Get paginated list of use groups
 */
export async function getUseGroupsPagedServer(params: {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
  typeOfUseGroupId?: number;
}): Promise<PagedResponse<UseGroup>> {
  try {
    const qs = new URLSearchParams();
    qs.set("PageNumber", String(params.pageNumber));
    qs.set("PageSize", String(params.pageSize));
    if (params.searchTerm) qs.set("SearchTerm", params.searchTerm);
    if (params.sortBy) qs.set("SortBy", params.sortBy);
    if (params.sortOrder) qs.set("SortOrder", params.sortOrder);
    if (typeof params.filterLogic === "number") qs.set("FilterLogic", String(params.filterLogic));
    if (typeof params.typeOfUseGroupId === "number") qs.set("TypeOfUseGroupId", String(params.typeOfUseGroupId));

    const response = await apiClient.get<PagedResponse<unknown>>(`/TypeOfUseGroup?${qs.toString()}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.FETCH_GROUPS_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.FETCH_GROUPS_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const data = response.data;
    return { ...data, items: (data.items ?? []).map((g) => mapApiGroupToUi(g as Record<string, unknown>)) };
  } catch (error) {
    logger.error("Error fetching use groups", { error: error as Error });
    throw error;
  }
}

/**
 * Get a single use group by ID
 */
export async function getUseGroupById(id: string | number): Promise<UseGroup | null> {
  try {
    const response = await apiClient.get<unknown>(`/TypeOfUseGroup/${id}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      return null;
    }

    return response.data ? mapApiGroupToUi(response.data as Record<string, unknown>) : null;
  } catch (error) {
    logger.error(`Error fetching use group ${id}`, { error: error as Error });
    throw error;
  }
}

/**
 * Create a new use group
 */
export async function createUseGroupApi(input: {
  typeOfUseGroupCode: string;
  groupName: string;
  groupIcon: UseGroupIconKey;
  isActive: boolean;
  createdBy?: string;
}): Promise<UseGroup> {
  try {
    const payload = {
      typeOfUseGroupCode: input.typeOfUseGroupCode?.trim(),
      groupName: input.groupName?.trim(),
      groupIcon: iconKeyToApi(input.groupIcon),
      isActive: input.isActive,
      createdBy: Number(input.createdBy ?? "1"),
    };

    const response = await apiClient.post<unknown>("/TypeOfUseGroup", payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.CREATE_GROUP_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.CREATE_GROUP_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return mapApiGroupToUi(response.data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error creating use group", { error: error as Error });
    throw error;
  }
}

/**
 * Update an existing use group
 */
export async function updateUseGroupApi(input: {
  typeOfUseGroupId: number;
  typeOfUseGroupCode: string;
  groupName: string;
  groupIcon: UseGroupIconKey;
  isActive: boolean;
  updatedBy?: string;
}): Promise<UseGroup> {
  try {
    const payload = {
      typeOfUseGroupId: input.typeOfUseGroupId,
      typeOfUseGroupCode: input.typeOfUseGroupCode?.trim(),
      groupName: input.groupName?.trim(),
      groupIcon: iconKeyToApi(input.groupIcon),
      isActive: input.isActive,
      updatedBy: Number(input.updatedBy ?? "1"),
    };

    const response = await apiClient.put<unknown>(`/TypeOfUseGroup/${input.typeOfUseGroupId}`, payload, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.UPDATE_GROUP_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.UPDATE_GROUP_FAILED
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    return mapApiGroupToUi(response.data as Record<string, unknown>);
  } catch (error) {
    logger.error("Error updating use group", { error: error as Error });
    throw error;
  }
}

/**
 * Delete a use group (purge - permanent delete)
 */
export async function deleteUseGroupApi(id: string | number) {
  try {
    const response = await apiClient.delete<unknown>(`/TypeOfUseGroup/${id}/purge`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!response.success) {
      const backendError = response.error;
      throw new ApiError(
        response.statusCode ?? 500,
        backendError || TypeOfUseErrorMessages.DELETE_GROUP_FAILED,
        backendError ? "" : TypeOfUseErrorMessages.DELETE_GROUP_FAILED
      );
    }

    return true;
  } catch (error) {
    logger.error(`Error deleting use group ${id}`, { error: error as Error });
    throw error;
  }
}