import { Office } from "@/types/office.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<Office>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<Office> {
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
 * Type guard for Office - validates structure before normalization
 * Note: This is a loose guard; use normalizeOffice for strict validation
 */
export function isOfficeShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  
  const officeId = Number(obj.officeId ?? obj.id);
  return Number.isFinite(officeId) && officeId > 0;
}

/**
 * Normalizes and validates an office object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeOffice(data: Record<string, unknown>): Office {
  // Validate required ID field
  const officeId = Number(data.officeId ?? data.id);
  if (!Number.isFinite(officeId) || officeId <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid officeId: ${data.officeId ?? data.id}`
    );
  }

  // Validate required string fields
  const officeCode = String(data.officeCode ?? "").trim();
  if (!officeCode) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: officeCode"
    );
  }

  const officeName = String(data.officeName ?? "").trim();
  if (!officeName) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: officeName"
    );
  }

  // Normalize optional fields with safe defaults
  return {
    officeId,
    officeCode,
    officeName,
    type: data.type != null ? String(data.type).trim() : "",
    address: data.address != null ? String(data.address).trim() : "",
    city: data.city != null ? String(data.city).trim() : "",
    pincode: data.pincode != null ? String(data.pincode).trim() : "",
    phone: data.phone != null ? String(data.phone).trim() : "",
    emailId: data.emailId != null ? String(data.emailId).trim() : "",
    establishedDate: data.establishedDate != null ? String(data.establishedDate) : null,
    isActive: parseBoolean(data.isActive ?? data.isStatus),
    createdDate: String(data.createdDate ?? "").trim(),
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}
