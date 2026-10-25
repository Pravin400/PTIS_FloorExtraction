import { apiClient } from "@/services/api.service";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import { isGeographyTypeShape, normalizeGeographyType } from "./geography-type-guard";
import {
  validateid,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  getDeleteErrorStatusCode,
  createApiError,
} from "./geography-type-validation";
import { GeographyType, GeographyTypeFormModel } from "@/types/water-bill/geographyType.types";

const logger = createLogger("GeographyTypeMaster");

/** Fetches paginated geography types from the API */
/** Note: GET /GeographyTypeMaster does not support server-side sorting. */
export async function getGeographyTypePaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<GeographyType>> {
  try {
    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append("SearchTerm", safeSearchTerm);

    const response = await apiClient.get<PagedResponse<GeographyType>>(`/GeographyTypeMaster?${params.toString()}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || "Failed to fetch paged geography types", "Get paged geography types failed");
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const validItems = response.data.items.filter(isGeographyTypeShape);
    const normalizedItems = validItems.map(normalizeGeographyType);
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    logger.error("Error fetching paged geography types", undefined, error);
    throw error;
  }
}

/**
 * Fetches a single geography type by ID.
 * Note: GET /GeographyTypeMaster/{id} is not supported by the API (405),
 * so this looks up the record from the paged list instead.
 */
export async function getGeographyTypeById(id: number): Promise<GeographyType | null> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Geography Type ID is required", "Invalid geography type ID");
    }

    const MAX_PAGE_SIZE = 100;
    let pageNumber = 1;
    let totalPages = 1;

    do {
      const paged = await getGeographyTypePaged(pageNumber, MAX_PAGE_SIZE);
      const match = paged.items.find((item) => item.id === id);
      if (match) return match;

      totalPages = paged.totalPages;
      pageNumber += 1;
    } while (pageNumber <= totalPages);

    return null;
  } catch (error) {
    logger.error("Error fetching geography type", { id }, error);
    throw error;
  }
}

/** Creates a new geography type */
export async function createGeographyType(data: GeographyTypeFormModel): Promise<void> {
  try {
    validateCreateFormData(data);
    const payload = {
      geographyTypeCode: data.geographyTypeCode.trim(),
      geographyType: data.geographyType.trim(),
      levelNo: Number(data.levelNo) || 0,
      isActive: data.isActive,
      createdBy: data.createdBy ?? 1,
    };
    const response = await apiClient.post<unknown>("/GeographyTypeMaster", payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Create geography type failed");
    }
  } catch (error) {
    logger.error("Error creating geography type", undefined, error);
    throw error;
  }
}

/** Updates an existing geography type */
export async function updateGeographyType(data: GeographyTypeFormModel): Promise<void> {
  try {
    validateUpdateFormData(data);
    const payload = {
      id: data.id,
      geographyTypeCode: data.geographyTypeCode.trim(),
      geographyType: data.geographyType.trim(),
      levelNo: Number(data.levelNo) || 0,
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? 1,
    };
    const response = await apiClient.put<unknown>(`/GeographyTypeMaster/${encodeURIComponent(String(data.id))}`, payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Update geography type failed");
    }
  } catch (error) {
    logger.error("Error updating geography type", undefined, error);
    throw error;
  }
}

/** Deletes a geography type by ID */
export async function deleteGeographyType(id: number): Promise<void> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Geography Type ID is required", "Validation failed");
    }
    const response = await apiClient.delete<void>(`/GeographyTypeMaster/${encodeURIComponent(String(id))}/purge`);
    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(statusCode, response.error || "Failed to delete geography type", `Delete geography type ${id} failed`);
    }
  } catch (error) {
    logger.error("Error deleting geography type", { id }, error);
    throw error;
  }
}
