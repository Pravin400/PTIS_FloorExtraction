import { GeographyType } from "@/types/water-bill/geographyType.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<GeographyType>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<GeographyType> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    typeof obj.totalCount === "number" &&
    typeof obj.pageNumber === "number" &&
    typeof obj.pageSize === "number" &&
    typeof obj.totalPages === "number"
  );
}

/**
 * Type guard for GeographyType - validates structure before normalization
 * Note: This is a loose guard; use normalizeGeographyType for strict validation
 */
export function isGeographyTypeShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  if (!("id" in obj)) {
    return false;
  }
  const { id } = obj;
  return typeof id === "number" && Number.isFinite(id) && id > 0;
}

/**
 * Normalizes and validates a geography type object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeGeographyType(data: Record<string, unknown>): GeographyType {
  const id = Number(data.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(500, "Invalid data received from server", `Invalid id: ${data.id}`);
  }

  const code = String(data.geographyTypeCode ?? "").trim();
  if (!code) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: geographyTypeCode");
  }

  const geographyType = String(data.geographyType ?? "").trim();
  if (!geographyType) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: geographyType");
  }

  const levelNo = Number(data.levelNo);

  const createdDateStr = String(data.createdDate ?? "").trim();
  if (!createdDateStr) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: createdDate");
  }

  return {
    id,
    geographyTypeCode: code,
    geographyType,
    levelNo: Number.isFinite(levelNo) ? levelNo : 0,
    isActive: parseBoolean(data.isActive),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}
