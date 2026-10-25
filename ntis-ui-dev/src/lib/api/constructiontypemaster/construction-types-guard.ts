import { ConstructionType } from "@/types/construction.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<ConstructionType>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<ConstructionType> {
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
 * Type guard for ConstructionType - validates structure before normalization
 * Note: This is a loose guard; use normalizeConstructionType for strict validation
 */
export function isConstructionTypeShape(value: unknown): value is Record<string, unknown> {
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
 * Normalizes and validates a construction type object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeConstructionType(data: Record<string, unknown>): ConstructionType {
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
  const constructionCode = String(data.constructionCode ?? "").trim();
  if (!constructionCode) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: constructionCode"
    );
  }

  const description = String(data.description ?? "").trim();
  const descriptionEnglish = data.descriptionEnglish != null ? String(data.descriptionEnglish).trim() : "";
  if (!description) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: description"
    );
  }

  // Normalize optional fields with safe defaults
  const searchSequence = Number(data.searchSequence);

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
    constructionCode,
    description,
    descriptionEnglish,
    searchSequence: Number.isFinite(searchSequence) ? searchSequence : 0,
    isActive: parseBoolean(data.isActive),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}