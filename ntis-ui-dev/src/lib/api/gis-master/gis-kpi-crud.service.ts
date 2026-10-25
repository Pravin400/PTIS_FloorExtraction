import { apiClient } from "@/services/api.service";
import {
  GisKpiMaster,
  GisKpiMasterFormModel,
  GisDepartmentKpiMapping,
  GisDepartmentKpiMappingPayload,
} from "@/types/gis-master/gis-kpi-master.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { isGisKpiMasterShape, normalizeGisKpiMaster } from "./gis-kpi-types-guard";
import {
  validateGisKpiId,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  getDeleteErrorStatusCode,
  createApiError,
} from "./gis-kpi-validation";
import { logger } from "@/lib/utils/logger";

const BASE_ENDPOINT = "/GisKpiMaster";

/**
 * Fetches all GIS KPI masters from the API
 */
export async function getGisKpiList(): Promise<GisKpiMaster[]> {
  try {
    const response = await apiClient.get<PagedResponse<GisKpiMaster>>(BASE_ENDPOINT);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch GIS KPI masters",
        "Get GIS KPI masters failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    const items = response.data.items ?? [];
    return items.filter(isGisKpiMasterShape).map(normalizeGisKpiMaster);
  } catch (error) {
    logger.error("Error fetching GIS KPI masters", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

/**
 * Fetches paginated GIS KPI masters from the API
 */
export async function getGisKpiPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<GisKpiMaster>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);
    if (typeof sortBy === "string" && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (typeof sortOrder === "string" && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<GisKpiMaster>>(
      `${BASE_ENDPOINT}?${params.toString()}`
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch paged GIS KPI masters",
        "Get paged GIS KPI masters failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const validItems = response.data.items.filter(isGisKpiMasterShape);
    const normalizedItems = validItems.map(normalizeGisKpiMaster);
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    logger.error("Error fetching paged GIS KPI masters", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

/**
 * Fetches a single GIS KPI master by ID
 */
export async function getGisKpiById(id: number): Promise<GisKpiMaster | null> {
  try {
    if (!validateGisKpiId(id)) {
      throw new ApiError(400, "Valid GIS KPI ID is required", "Invalid GIS KPI ID");
    }
    const response = await apiClient.get<GisKpiMaster>(
      `${BASE_ENDPOINT}/${encodeURIComponent(String(id))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch GIS KPI master",
        `Get GIS KPI master ${id} failed`
      );
    }
    if (!response.data) return null;

    if (isGisKpiMasterShape(response.data)) {
      return normalizeGisKpiMaster(response.data as Record<string, unknown>);
    }

    throw new ApiError(500, "Unexpected data format received from server", "Data validation failed");
  } catch (error) {
    logger.error(`Error fetching GIS KPI master ${id}`, {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

/**
 * Creates a new GIS KPI master
 */
export async function createGisKpi(data: GisKpiMasterFormModel): Promise<void> {
  try {
    validateCreateFormData(data);
    const payload = {
      kpiCode: data.kpiCode.trim(),
      defaultTitle: data.defaultTitle.trim(),
      defaultIcon: data.defaultIcon.trim(),
      defaultColor: data.defaultColor.trim(),
      isActive: data.isActive,
    };
    const response = await apiClient.post<unknown>(BASE_ENDPOINT, payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Create GIS KPI master failed");
    }
  } catch (error) {
    logger.error("Error creating GIS KPI master", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

/**
 * Updates an existing GIS KPI master
 */
export async function updateGisKpi(data: GisKpiMasterFormModel): Promise<void> {
  try {
    validateUpdateFormData(data);
    const payload = {
      id: data.id,
      kpiCode: data.kpiCode.trim(),
      defaultTitle: data.defaultTitle.trim(),
      defaultIcon: data.defaultIcon.trim(),
      defaultColor: data.defaultColor.trim(),
      isActive: data.isActive,
    };

    let response = await apiClient.put<unknown>(
      `${BASE_ENDPOINT}/${encodeURIComponent(String(data.id))}`,
      payload
    );

    // Some APIs accept PUT at root endpoint with id in payload
    if (!response.success && response.statusCode === 404) {
      response = await apiClient.put<unknown>(BASE_ENDPOINT, payload);
    }

    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Update GIS KPI master failed");
    }
  } catch (error) {
    logger.error("Error updating GIS KPI master", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

/**
 * Deletes a GIS KPI master by ID
 */
export async function deleteGisKpi(id: number): Promise<void> {
  try {
    if (!validateGisKpiId(id)) {
      throw new ApiError(400, "Valid GIS KPI ID is required", "Validation failed");
    }

    // Try /purge first, then fallback to standard delete
    let response = await apiClient.delete<void>(
      `${BASE_ENDPOINT}/${encodeURIComponent(String(id))}/purge`
    );

    if (!response.success && response.statusCode === 404) {
      response = await apiClient.delete<void>(
        `${BASE_ENDPOINT}/${encodeURIComponent(String(id))}`
      );
    }

    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(
        statusCode,
        response.error || "Failed to delete GIS KPI master",
        `Delete GIS KPI master ${id} failed`
      );
    }
  } catch (error) {
    logger.error(`Error deleting GIS KPI master ${id}`, {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw error;
  }
}

/**
 * Fetches all GIS Department KPI mappings
 * GET /GisDepartmentKpiMapping
 */
export async function getGisDepartmentKpiMappings(departmentId?: number | string): Promise<GisDepartmentKpiMapping[]> {
  try {
    const q = departmentId ? `?DepartmentId=${encodeURIComponent(String(departmentId))}` : "";
    let response = await apiClient.get<PagedResponse<GisDepartmentKpiMapping> | GisDepartmentKpiMapping[]>(
      `/GisDepartmentKpiMapping${q ? `${q}&` : "?"}PageNumber=1&PageSize=1000`,
      { cache: "no-store" }
    );

    if (!response.success) {
      response = await apiClient.get<PagedResponse<GisDepartmentKpiMapping> | GisDepartmentKpiMapping[]>(
        `/GisDepartmentKpiMapping${q}`,
        { cache: "no-store" }
      );
    }

    if (!response.success || !response.data) {
      return [];
    }

    const data = response.data;
    if (typeof data === "object" && data !== null && "items" in data && Array.isArray((data as PagedResponse<GisDepartmentKpiMapping>).items)) {
      return (data as PagedResponse<GisDepartmentKpiMapping>).items;
    }
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  } catch (error) {
    logger.error("Error fetching GIS Department KPI mappings", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return [];
  }
}

/**
 * Fetches a single GIS Department KPI mapping by ID
 * GET /GisDepartmentKpiMapping/{id}
 */
export async function getGisDepartmentKpiMappingById(
  id: number
): Promise<GisDepartmentKpiMapping | null> {
  try {
    const response = await apiClient.get<
      GisDepartmentKpiMapping | { items: GisDepartmentKpiMapping }
    >(`/GisDepartmentKpiMapping/${encodeURIComponent(String(id))}`, {
      cache: "no-store",
    });

    if (response.success && response.data) {
      if (typeof response.data === "object" && "items" in response.data) {
        return (response.data as { items: GisDepartmentKpiMapping }).items;
      }
      return response.data as GisDepartmentKpiMapping;
    }
  } catch {
    // Fall back to searching in list
  }

  const all = await getGisDepartmentKpiMappings();
  return all.find((m) => Number(m.id) === Number(id)) ?? null;
}

/**
 * Creates a new GIS Department KPI mapping
 * POST /GisDepartmentKpiMapping
 */
export async function createGisDepartmentKpiMapping(
  payload: GisDepartmentKpiMappingPayload
): Promise<GisDepartmentKpiMapping> {
  const body = {
    isActive: payload.isActive,
    departmentId: payload.departmentId,
    kpiMasterId: payload.kpiMasterId,
    customTitle: payload.customTitle || null,
    customIcon: payload.customIcon || null,
    customColor: payload.customColor || null,
    displayOrder: payload.displayOrder ?? 1,
  };

  const response = await apiClient.post<GisDepartmentKpiMapping | { items: GisDepartmentKpiMapping }>(
    "/GisDepartmentKpiMapping",
    body
  );

  if (!response.success) {
    throw createApiError(
      response.statusCode,
      response.error || "Failed to create department mapping",
      "Create GIS Department KPI Mapping failed"
    );
  }

  if (response.data) {
    if (typeof response.data === "object" && "items" in response.data && response.data.items) {
      return (response.data as { items: GisDepartmentKpiMapping }).items;
    }
    return response.data as GisDepartmentKpiMapping;
  }

  return body as unknown as GisDepartmentKpiMapping;
}

/**
 * Updates an existing GIS Department KPI mapping
 * PUT /GisDepartmentKpiMapping/{id}
 */
export async function updateGisDepartmentKpiMapping(
  payload: GisDepartmentKpiMappingPayload
): Promise<void> {
  if (!payload.id) {
    throw new ApiError(400, "Mapping ID is required for update", "Validation failed");
  }

  const body = {
    id: payload.id,
    isActive: payload.isActive,
    departmentId: payload.departmentId,
    kpiMasterId: payload.kpiMasterId,
    customTitle: payload.customTitle || null,
    customIcon: payload.customIcon || null,
    customColor: payload.customColor || null,
    displayOrder: payload.displayOrder ?? 1,
  };

  let response = await apiClient.put<unknown>(
    `/GisDepartmentKpiMapping/${encodeURIComponent(String(payload.id))}`,
    body
  );

  if (!response.success && response.statusCode === 404) {
    response = await apiClient.put<unknown>("/GisDepartmentKpiMapping", body);
  }

  if (!response.success) {
    throw createApiError(
      response.statusCode,
      response.error || "Failed to update department mapping",
      "Update GIS Department KPI Mapping failed"
    );
  }
}

/**
 * Deletes a GIS Department KPI mapping by ID
 * DELETE /GisDepartmentKpiMapping/{id}
 */
export async function deleteGisDepartmentKpiMapping(id: number): Promise<void> {
  if (!id || id <= 0) {
    throw new ApiError(400, "Valid Mapping ID is required", "Validation failed");
  }

  let response = await apiClient.delete<void>(
    `/GisDepartmentKpiMapping/${encodeURIComponent(String(id))}/purge`
  );

  if (!response.success && response.statusCode === 404) {
    response = await apiClient.delete<void>(
      `/GisDepartmentKpiMapping/${encodeURIComponent(String(id))}`
    );
  }

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to delete department mapping",
      `Delete GIS Department KPI mapping ${id} failed`
    );
  }
}

