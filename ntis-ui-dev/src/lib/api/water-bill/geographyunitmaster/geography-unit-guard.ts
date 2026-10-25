import { GeographyUnit } from "@/types/water-bill/geographyUnit.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<GeographyUnit>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<GeographyUnit> {
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
 * Type guard for GeographyUnit - validates structure before normalization
 * Note: This is a loose guard; use normalizeGeographyUnit for strict validation
 */
export function isGeographyUnitShape(value: unknown): value is Record<string, unknown> {
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
 * Normalizes and validates a geography unit object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeGeographyUnit(data: Record<string, unknown>): GeographyUnit {
  const id = Number(data.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(500, "Invalid data received from server", `Invalid id: ${data.id}`);
  }

  const geographyTypeId = Number(data.geographyTypeId);
  if (!Number.isFinite(geographyTypeId) || geographyTypeId <= 0) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: geographyTypeId");
  }

  const geographyUnitCode = String(data.geographyUnitCode ?? "").trim();
  if (!geographyUnitCode) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: geographyUnitCode");
  }

  const geographyUnitName = String(data.geographyUnitName ?? "").trim();
  if (!geographyUnitName) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: geographyUnitName");
  }

  const searchSequence = Number(data.searchSequence);

  const createdDateStr = String(data.createdDate ?? "").trim();
  if (!createdDateStr) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: createdDate");
  }

  const parentGeographyUnitIdRaw = data.parentGeographyUnitId;
  const parentGeographyUnitId =
    parentGeographyUnitIdRaw === null || parentGeographyUnitIdRaw === undefined
      ? null
      : Number(parentGeographyUnitIdRaw);

  return {
    id,
    geographyTypeId,
    geographyTypeCode: String(data.geographyTypeCode ?? "").trim(),
    geographyType: String(data.geographyType ?? "").trim(),
    parentGeographyUnitId:
      parentGeographyUnitId !== null && Number.isFinite(parentGeographyUnitId) ? parentGeographyUnitId : null,
    parentGeographyUnitName: data.parentGeographyUnitName != null ? String(data.parentGeographyUnitName) : null,
    geographyUnitCode,
    geographyUnitName,
    searchSequence: Number.isFinite(searchSequence) ? searchSequence : 0,
    markedForDeletion: parseBoolean(data.markedForDeletion),
    markedForDeletionDate: data.markedForDeletionDate != null ? String(data.markedForDeletionDate) : null,
    isActive: parseBoolean(data.isActive),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}
