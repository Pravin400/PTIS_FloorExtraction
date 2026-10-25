import { apiClient } from "@/services/api.service";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import {
  AssessmentYearRange,
  AssessmentYearRangeConfig,
  AssessmentYearRangeFormModel,
  AssessmentYearRangeCreatePayload,
  AssessmentYearRangeUpdatePayload,
} from "@/types/asset-masters/assessment-year-range.types";

/**
 * Validates pagination parameters
 */
function validatePaginationParams(pageNumber: number, pageSize: number): void {
  const MAX_PAGE_SIZE = 100;
  const MAX_PAGE_NUMBER = 10000;
  
  if (
    !Number.isFinite(pageNumber) ||
    !Number.isFinite(pageSize) ||
    pageNumber <= 0 ||
    pageSize <= 0 ||
    pageSize > MAX_PAGE_SIZE ||
    pageNumber > MAX_PAGE_NUMBER
  ) {
    throw new ApiError(400, "Invalid pagination parameters", "Validation failed");
  }
}

/**
 * Validates ID parameter
 */
function validateId(id: number): boolean {
  return Number.isFinite(id) && id > 0;
}

/**
 * Parses a boolean value from various types (boolean, number, string)
 * Handles API responses that may return 0/1, "true"/"false", etc.
 */
function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower === "true" || lower === "1";
  }
  return Boolean(value);
}

/**
 * Checks if a value can be interpreted as a boolean
 */
function isBooleanLike(value: unknown): boolean {
  return (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  );
}

/**
 * Type guard to validate Assessment Year Range shape
 * Accepts boolean/number/string for isActive to handle various API response formats
 */
function isValidAssessmentYearRangeShape(item: unknown, idField: string): boolean {
  if (typeof item !== "object" || item === null) return false;
  const record = item as Record<string, unknown>;
  
  // Handle both lowercase and PascalCase variations
  const idValue = record[idField] ?? record[idField.charAt(0).toUpperCase() + idField.slice(1)];
  const fromYearValue = record.fromYear ?? record.FromYear;
  const toYearValue = record.toYear ?? record.ToYear;
  const isActiveValue = record.isActive ?? record.IsActive;

  return (
    typeof idValue === "number" &&
    typeof fromYearValue === "number" &&
    typeof toYearValue === "number" &&
    isBooleanLike(isActiveValue)
  );
}

/**
 * Normalizes Assessment Year Range entity from API response
 */
function normalizeAssessmentYearRange<T extends AssessmentYearRange>(
  item: Record<string, unknown>,
  idField: string
): T {
  // Handle both lowercase and PascalCase variations
  const idValue = item[idField] ?? item[idField.charAt(0).toUpperCase() + idField.slice(1)];
  const fromYearValue = item.fromYear ?? item.FromYear;
  const toYearValue = item.toYear ?? item.ToYear;
  const isActiveValue = item.isActive ?? item.IsActive;
  const createdDateValue = item.createdDate ?? item.CreatedDate;
  const updatedDateValue = item.updatedDate ?? item.UpdatedDate;

  const normalized = {
    [idField]: Number(idValue),
    fromYear: Number(fromYearValue),
    toYear: Number(toYearValue),
    isActive: parseBoolean(isActiveValue),
    createdDate: String(createdDateValue ?? ""),
    updatedDate: updatedDateValue ? String(updatedDateValue) : null,
  };
  return normalized as unknown as T;
}

/**
 * Creates API error with appropriate status code
 */
function createApiError(
  statusCode: number | undefined,
  error: string | undefined,
  context: string
): ApiError {
  const code = statusCode ?? 500;
  const message = error || "Operation failed";
  return new ApiError(code, message, context);
}

/**
 * Extracts error status code from error message for delete operations
 */
function getDeleteErrorStatusCode(errorMessage: string): number {
  const lowerMessage = errorMessage.toLowerCase();
  if (lowerMessage.includes("in use") || lowerMessage.includes("linked") || lowerMessage.includes("foreign key")) {
    return 409;
  }
  if (lowerMessage.includes("not found")) {
    return 404;
  }
  return 500;
}

function isItemDeleted(record: Record<string, unknown>): boolean {
  const keys = [
    "MarkedForDeletion", "markedForDeletion",
    "IsMarkedForDelete", "isMarkedForDelete",
    "IsMarkedForDeletion", "isMarkedForDeletion",
    "IsMarkForDelete", "isMarkForDelete",
    "IsDeleted", "isDeleted",
    "IsMarkDelete", "isMarkDelete"
  ];
  for (const k of keys) {
    const val = record[k];
    if (val === true || val === 1 || val === "1") return true;
    if (typeof val === "string" && val.toLowerCase() === "true") return true;
  }
  return false;
}

/**
 * Fetches paginated Assessment Year Range data
 */
export async function getAssessmentYearRangePaged<T extends AssessmentYearRange>(
  config: AssessmentYearRangeConfig,
  pageNumber: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<T>> {
  try {
    validatePaginationParams(pageNumber, pageSize);

    const params = new URLSearchParams();
    params.append("PageNumber", pageNumber.toString());
    params.append("PageSize", pageSize.toString());
    params.append("MarkedForDeletion", "false");

    if (sortBy && sortBy.trim()) params.append("SortBy", sortBy.trim());
    if (sortOrder && sortOrder.trim()) params.append("SortOrder", sortOrder.trim());

    const response = await apiClient.get<PagedResponse<T>>(
      `/${config.endpoint}?${params.toString()}`
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch assessment year range data",
        "Get paged assessment year range failed"
      );
    }

    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const validItems = response.data.items.filter((item) => {
      if (!isValidAssessmentYearRangeShape(item, config.idField)) return false;
      return !isItemDeleted(item as Record<string, unknown>);
    });
    const normalizedItems = validItems.map((item) =>
      normalizeAssessmentYearRange<T>(item as unknown as Record<string, unknown>, config.idField)
    );

    return {
      ...response.data,
      items: normalizedItems,
      totalCount: response.data.totalCount,
    };
  } catch (error) {
    console.error(`Error fetching paged assessment year range (${config.type}):`, error);
    throw error;
  }
}

/**
 * Fetches a single Assessment Year Range by ID
 */
export async function getAssessmentYearRangeById<T extends AssessmentYearRange>(
  config: AssessmentYearRangeConfig,
  id: number
): Promise<T | null> {
  try {
    if (!validateId(id)) {
      throw new ApiError(400, "Valid ID is required", "Invalid ID");
    }

    const response = await apiClient.get<T>(
      `/${config.endpoint}/${encodeURIComponent(String(id))}`
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || "Failed to fetch assessment year range",
        `Get assessment year range ${id} failed`
      );
    }

    if (!response.data) return null;

    if (isValidAssessmentYearRangeShape(response.data, config.idField)) {
      return normalizeAssessmentYearRange<T>(
        response.data as unknown as Record<string, unknown>,
        config.idField
      );
    }

    throw new ApiError(500, "Unexpected data format received from server", "Data validation failed");
  } catch (error) {
    console.error(`Error fetching assessment year range ${id} (${config.type}):`, error);
    throw error;
  }
}

/**
 * Creates a new Assessment Year Range
 */
export async function createAssessmentYearRange(
  config: AssessmentYearRangeConfig,
  data: AssessmentYearRangeFormModel
): Promise<void> {
  try {
    const fromYear = Number(data.fromYear);
    const toYear = Number(data.toYear);

    if (!Number.isFinite(fromYear) || fromYear < 1700 || fromYear > 2100) {
      throw new ApiError(400, "From Year must be a valid year between 1700 and 2100", "Validation failed");
    }
    if (!Number.isFinite(toYear) || toYear < 1700 || toYear > 2100) {
      throw new ApiError(400, "To Year must be a valid year between 1700 and 2100", "Validation failed");
    }
    if (fromYear > toYear) {
      throw new ApiError(400, "From Year cannot be greater than To Year", "Validation failed");
    }

    const payload: AssessmentYearRangeCreatePayload = {
      fromYear,
      toYear,
      isActive: data.isActive,
      createdBy: data.createdBy,
    };

    const response = await apiClient.post<unknown>(`/${config.endpoint}`, payload);

    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Create assessment year range failed");
    }
  } catch (error) {
    console.error(`Error creating assessment year range (${config.type}):`, error);
    throw error;
  }
}

/**
 * Updates an existing Assessment Year Range
 */
export async function updateAssessmentYearRange(
  config: AssessmentYearRangeConfig,
  data: AssessmentYearRangeFormModel
): Promise<void> {
  try {
    if (!data.id || !validateId(data.id)) {
      throw new ApiError(400, "Valid ID is required for update", "Validation failed");
    }

    const fromYear = Number(data.fromYear);
    const toYear = Number(data.toYear);

    if (!Number.isFinite(fromYear) || fromYear < 1700 || fromYear > 2100) {
      throw new ApiError(400, "From Year must be a valid year between 1700 and 2100", "Validation failed");
    }
    if (!Number.isFinite(toYear) || toYear < 1700 || toYear > 2100) {
      throw new ApiError(400, "To Year must be a valid year between 1700 and 2100", "Validation failed");
    }
    if (fromYear > toYear) {
      throw new ApiError(400, "From Year cannot be greater than To Year", "Validation failed");
    }

    const payload: AssessmentYearRangeUpdatePayload & { [key: string]: unknown } = {
      [config.idField]: data.id,
      fromYear,
      toYear,
      isActive: data.isActive,
      updatedBy: data.updatedBy,
    };

    const response = await apiClient.put<unknown>(
      `/${config.endpoint}/${encodeURIComponent(String(data.id))}`,
      payload
    );

    if (!response.success) {
      throw createApiError(response.statusCode, response.error, "Update assessment year range failed");
    }
  } catch (error) {
    console.error(`Error updating assessment year range (${config.type}):`, error);
    throw error;
  }
}

/**
 * Purge deletes an Assessment Year Range by ID.
 * This is a permanent delete operation.
 */
export async function purgeDeleteAssessmentYearRange(
  config: AssessmentYearRangeConfig,
  id: number
): Promise<void> {
  try {
    if (!validateId(id)) {
      throw new ApiError(400, "Valid ID is required", "Validation failed");
    }

    const response = await apiClient.delete<void>(
      `/${config.endpoint}/${encodeURIComponent(String(id))}/purge`
    );

    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(
        statusCode,
        response.error || "Failed to purge delete assessment year range",
        `Purge delete assessment year range ${id} failed`
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Normal deletes an Assessment Year Range by ID.
 * Exactly matches Swagger's DELETE /{id} endpoint.
 */
export async function deleteAssessmentYearRange(
  config: AssessmentYearRangeConfig,
  id: number
): Promise<void> {
  try {
    if (!validateId(id)) {
      throw new ApiError(400, "Valid ID is required", "Validation failed");
    }

    const response = await apiClient.delete<void>(
      `/${config.endpoint}/${encodeURIComponent(String(id))}`
    );

    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(
        statusCode,
        response.error || "Failed to delete assessment year range",
        `Delete assessment year range ${id} failed`
      );
    }
  } catch (error) {
    throw error;
  }
}
