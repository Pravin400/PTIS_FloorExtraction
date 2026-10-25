import { PropertyType } from "@/types/property-type.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<PropertyType>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<PropertyType> {
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
 * Type guard for PropertyType - validates structure before normalization
 * Note: This is a loose guard; use normalizePropertyType for strict validation
 */
export function isPropertyTypeShape(value: unknown): value is Record<string, unknown> {
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
 * Normalizes and validates a property type object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizePropertyType(data: Record<string, unknown>): PropertyType {
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
  const propertyDescription = String(data.propertyDescription ?? "").trim();
  if (!propertyDescription) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: propertyDescription"
    );
  }

  const descriptionEnglish =
    typeof data.descriptionEnglish === "string"
      ? data.descriptionEnglish.trim()
      : typeof data.DescriptionEnglish === "string"
      ? (data.DescriptionEnglish as string).trim()
      : typeof data.propertyDescriptionEnglish === "string"
      ? data.propertyDescriptionEnglish.trim()
      : typeof data.PropertyDescriptionEnglish === "string"
      ? (data.PropertyDescriptionEnglish as string).trim()
      : null;

  const type = String(data.type ?? "").trim();
  if (!type) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: type"
    );
  }

  // propertyTypeGroup is now optional/nullable
  const propertyTypeGroup = data.propertyTypeGroup ? String(data.propertyTypeGroup).trim() : null;

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

  // Handle propertyTypeCategoryId - now required (default to 0 if null/invalid)
  const propertyTypeCategoryId = data.propertyTypeCategoryId != null 
    ? Number(data.propertyTypeCategoryId) 
    : 0;

  return {
    id,
    propertyDescription,
    descriptionEnglish,
    propertyDescriptionEnglish: descriptionEnglish,
    type,
    propertyTypeGroup,
    searchSequence: Number.isFinite(searchSequence) ? searchSequence : 0,
    propertyTypeCategoryId: Number.isFinite(propertyTypeCategoryId) ? propertyTypeCategoryId : 0,
    isActive: parseBoolean(data.isActive),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}
