import { Mouja } from "@/types/mouja.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<Mouja>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<Mouja> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    typeof obj.totalCount === "number" &&
    typeof obj.pageNumber === "number" &&
    typeof obj.pageSize === "number" &&
    typeof obj.totalPages === "number" &&
    typeof obj.hasPrevious === "boolean" &&
    typeof obj.hasNext === "boolean"
  );
}

/**
 * Type guard for Mouja - validates structure before normalization
 * Note: This is a loose guard; use normalizeMouja for strict validation
 */
export function isMoujaShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  // Must have a valid ID field (> 0)
  if (!("id" in obj)) {
    return false;
  }
  const { id } = obj;
  return typeof id === "number" && Number.isFinite(id) && id > 0;
}

/**
 * Normalizes and validates a mouja object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeMouja(data: Record<string, unknown>): Mouja {
  // Validate required ID field
  const id = Number(data.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid id: ${data.id}`
    );
  }

  // Validate required string fields
  const moujaNo = String(data.moujaNo ?? "").trim();
  if (!moujaNo) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: moujaNo"
    );
  }

  const moujaName = String(data.moujaName ?? "").trim();
  if (!moujaName) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: moujaName"
    );
  }

  // Validate createdDate - it's required from the backend
  const createdDateStr = String(data.createdDate ?? "").trim();
  if (!createdDateStr) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: createdDate"
    );
  }

  return {
    id,
    moujaNo,
    moujaName,
    isActive: parseBoolean(data.isActive),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}
