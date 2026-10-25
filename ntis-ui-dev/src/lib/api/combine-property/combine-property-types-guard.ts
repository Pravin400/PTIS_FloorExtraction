import { CombinePropertyItem, PropertyCombineDetails } from "@/types/combine-property.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<CombinePropertyItem>
 */
export function isPagedCombinePropertyResponse(value: unknown): value is PagedResponse<CombinePropertyItem> {
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
 * Type guard for CombinePropertyItem - validates structure before normalization
 * Note: This is a loose guard; use normalizeCombinePropertyItem for strict validation
 */
export function isCombinePropertyItemShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const id = Number(obj.id ?? obj.combinePropertyId);
  return Number.isFinite(id) && id > 0;
}

/**
 * Normalizes and validates a combine property item
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeCombinePropertyItem(data: Record<string, unknown>): CombinePropertyItem {
  // Validate required ID field
  const id = Number(data.id ?? data.combinePropertyId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid id: ${data.id ?? data.combinePropertyId}`
    );
  }

  const wardId = Number(data.wardId ?? 0);

  return {
    id,
    wardId: Number.isFinite(wardId) ? wardId : 0,
    wardNo: String(data.wardNo ?? "").trim(),
    propertyNo: String(data.propertyNo ?? "").trim(),
    fromProperty: String(data.fromProperty ?? "").trim(),
    toProperty: String(data.toProperty ?? "").trim(),
    isActive: parseBoolean(data.isActive ?? data.isStatus ?? true),
    categoryId: data.categoryId != null ? Number(data.categoryId) : undefined,
    societyDetailId: data.societyDetailId != null ? Number(data.societyDetailId) : null,
    createdDate: data.createdDate != null ? String(data.createdDate) : null,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}

/**
 * Type guard for PropertyCombineDetails - validates structure before normalization
 */
export function isPropertyCombineDetailsShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const propertyId = Number(obj.propertyId ?? obj.id);
  return Number.isFinite(propertyId) && propertyId > 0;
}

/**
 * Normalizes and validates property combine details
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizePropertyCombineDetails(data: Record<string, unknown>): PropertyCombineDetails {
  const propertyId = Number(data.propertyId ?? data.id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid propertyId: ${data.propertyId ?? data.id}`
    );
  }

  const wardId = Number(data.wardId ?? 0);
  const taxAmount = Number(data.taxAmount ?? 0);
  const pendingAmount = Number(data.pendingAmount ?? 0);
  const propertyTypeId = Number(data.propertyTypeId ?? 0);

  return {
    propertyId,
    wardId: Number.isFinite(wardId) ? wardId : 0,
    wardNo: String(data.wardNo ?? "").trim(),
    propertyNo: String(data.propertyNo ?? "").trim(),
    partitionNo: String(data.partitionNo ?? "").trim(),
    oldPropertyNo: String(data.oldPropertyNo ?? "").trim(),
    ownerName: String(data.ownerName ?? "").trim(),
    occupierName: String(data.occupierName ?? "").trim(),
    taxAmount: Number.isFinite(taxAmount) ? taxAmount : 0,
    pendingAmount: Number.isFinite(pendingAmount) ? pendingAmount : 0,
    propertyDescription: String(data.propertyDescription ?? "").trim(),
    propertyTypeId: Number.isFinite(propertyTypeId) ? propertyTypeId : 0,
    combineReason: data.combineReason != null ? String(data.combineReason).trim() : undefined,
  };
}
