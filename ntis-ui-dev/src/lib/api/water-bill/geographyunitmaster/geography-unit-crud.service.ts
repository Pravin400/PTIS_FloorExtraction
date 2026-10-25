import { apiClient } from "@/services/api.service";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import { isGeographyUnitShape, normalizeGeographyUnit } from "./geography-unit-guard";
import {
  validateid,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  getDeleteErrorStatusCode,
  createApiError,
} from "./geography-unit-validation";
import { GeographyUnitFormModel, GeographyUnit, ParentGeographyUnitCandidate, GeographyUnitHierarchyNode } from "@/types/water-bill/geographyUnit.types";

const logger = createLogger("GeographyUnitMaster");

/**
 * Fetches paginated geography units from the API
 * Note: GET /GeographyUnit does not support server-side sorting.
 */
export async function getGeographyUnitPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<GeographyUnit>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);

    const response = await apiClient.get<PagedResponse<GeographyUnit>>(`/GeographyUnit?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged geography units", "Get paged geography units failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const validItems = response.data.items.filter(isGeographyUnitShape);
    const normalizedItems = validItems.map(normalizeGeographyUnit);
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    logger.error("Error fetching paged geography units", undefined, error);
    throw error;
  }
}

/**
 * Fetches a single geography unit by ID.
 * Note: mirrors GeographyTypeMaster's approach — looks up the record from
 * the paged list rather than assuming a GET /GeographyUnit/{id} endpoint exists.
 */
export async function getGeographyUnitById(id: number): Promise<GeographyUnit | null> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Geography Unit ID is required", "Invalid geography unit ID");
    }

    const MAX_PAGE_SIZE = 100;
    let pageNumber = 1;
    let totalPages = 1;

    do {
      const paged = await getGeographyUnitPaged(pageNumber, MAX_PAGE_SIZE);
      const match = paged.items.find((item) => item.id === id);
      if (match) return match;

      totalPages = paged.totalPages;
      pageNumber += 1;
    } while (pageNumber <= totalPages);

    return null;
  } catch (error) {
    logger.error("Error fetching geography unit", { id }, error);
    throw error;
  }
}

/**
 * Fetches valid parent-unit candidates for a given geography type.
 * Used to populate the Parent Unit dropdown, filtered server-side.
 */
export async function getParentGeographyUnitCandidates(
  geographyTypeId: number
): Promise<ParentGeographyUnitCandidate[]> {
  try {
    if (!validateid(geographyTypeId)) {
      throw new ApiError(400, "Valid Geography Type ID is required", "Invalid geography type ID");
    }
    const response = await apiClient.get<ParentGeographyUnitCandidate[]>(
      `/GeographyUnit/parent-candidates?geographyTypeId=${encodeURIComponent(String(geographyTypeId))}`
    );
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch parent unit candidates", "Get parent unit candidates failed");
    }
    return response.data ?? [];
  } catch (error) {
    logger.error("Error fetching parent geography unit candidates", { geographyTypeId }, error);
    throw error;
  }
}

/** Fetches the full geography unit hierarchy as a nested tree. */
export async function getGeographyUnitHierarchyTree(): Promise<GeographyUnitHierarchyNode[]> {
  try {
    const response = await apiClient.get<GeographyUnitHierarchyNode[]>("/GeographyUnit/hierarchy-tree");
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch geography unit hierarchy tree", "Get geography unit hierarchy tree failed");
    }
    return response.data ?? [];
  } catch (error) {
    logger.error("Error fetching geography unit hierarchy tree", undefined, error);
    throw error;
  }
}

/** Creates a new geography unit */
export async function createGeographyUnit(data: GeographyUnitFormModel): Promise<void> {
  try {
    validateCreateFormData(data);
    const payload = {
      geographyTypeId: Number(data.geographyTypeId) || 0,
      parentGeographyUnitId: data.parentGeographyUnitId ?? null,
      geographyUnitCode: data.geographyUnitCode.trim(),
      geographyUnitName: data.geographyUnitName.trim(),
      searchSequence: Number(data.searchSequence) || 0,
      isActive: data.isActive,
      createdBy: data.createdBy ?? 1,
    };
    const response = await apiClient.post<unknown>("/GeographyUnit", payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Create geography unit failed");
    }
  } catch (error) {
    logger.error("Error creating geography unit", undefined, error);
    throw error;
  }
}

/** Updates an existing geography unit */
export async function updateGeographyUnit(data: GeographyUnitFormModel): Promise<void> {
  try {
    validateUpdateFormData(data);
    const payload = {
      id: data.id,
      geographyTypeId: Number(data.geographyTypeId) || 0,
      parentGeographyUnitId: data.parentGeographyUnitId ?? null,
      geographyUnitCode: data.geographyUnitCode.trim(),
      geographyUnitName: data.geographyUnitName.trim(),
      searchSequence: Number(data.searchSequence) || 0,
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? 1,
    };
    const response = await apiClient.put<unknown>(`/GeographyUnit/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Update geography unit failed");
    }
  } catch (error) {
    logger.error("Error updating geography unit", undefined, error);
    throw error;
  }
}

/** Deletes a geography unit by ID */
export async function deleteGeographyUnit(id: number): Promise<void> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Geography Unit ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/GeographyUnit/${encodeURIComponent(String(id))}/purge`);
    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(statusCode, response.error || "Failed to delete geography unit", `Delete geography unit ${id} failed`);
    }
  } catch (error) {
    logger.error("Error deleting geography unit", { id }, error);
    throw error;
  }
}
