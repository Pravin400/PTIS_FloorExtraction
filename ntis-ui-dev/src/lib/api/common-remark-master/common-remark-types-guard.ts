import { CommonRemark, RemarkCategory } from "@/types/common-remark-master/common-remark.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<CommonRemark>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<CommonRemark> {
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
 * Type guard for CommonRemark shape
 */
export function isCommonRemarkShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  
  if (!("id" in obj) || !("remarkTypeId" in obj) || !("remark" in obj) || !("createdDate" in obj)) {
    return false;
  }
  const id = Number(obj.id);
  const remarkTypeId = Number(obj.remarkTypeId);
  
  if (!Number.isFinite(id) || id <= 0) {
    return false;
  }
  if (!Number.isFinite(remarkTypeId) || remarkTypeId <= 0) {
    return false;
  }
  if (obj.remark == null || String(obj.remark).trim() === "") {
    return false;
  }
  if (obj.createdDate == null || String(obj.createdDate).trim() === "") {
    return false;
  }
  return true;
}

/**
 * Normalizes and validates a CommonRemark object
 */
export function normalizeCommonRemark(data: Record<string, unknown>, categories: RemarkCategory[]): CommonRemark {
  const id = Number(data.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid id: ${data.id}`
    );
  }

  const remarkTypeId = Number(data.remarkTypeId);
  if (!Number.isFinite(remarkTypeId) || remarkTypeId <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid remarkTypeId: ${data.remarkTypeId}`
    );
  }

  const remark = String(data.remark ?? "").trim();
  if (!remark) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: remark"
    );
  }

  const createdDateStr = String(data.createdDate ?? "").trim();
  if (!createdDateStr) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: createdDate"
    );
  }

  const cat = categories.find((c) => c.id === remarkTypeId);
  const remarkType = cat ? cat.categoryName : `Type ${remarkTypeId}`;

  return {
    id,
    remarkTypeId,
    remarkType,
    remark,
    isActive: parseBoolean(data.isActive),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}

/**
 * Type guard for RemarkCategory shape
 */
export function isRemarkCategoryShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (!("id" in obj) || !("remarkTypeName" in obj)) {
    return false;
  }
  const id = Number(obj.id);
  if (!Number.isFinite(id) || id <= 0) {
    return false;
  }
  if (obj.remarkTypeName == null || String(obj.remarkTypeName).trim() === "") {
    return false;
  }
  return true;
}

/**
 * Normalizes and validates a RemarkCategory object
 */
export function normalizeRemarkCategory(data: Record<string, unknown>): RemarkCategory {
  const id = Number(data.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid category id: ${data.id}`
    );
  }

  const remarkTypeName = String(data.remarkTypeName ?? "").trim();
  if (!remarkTypeName) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: remarkTypeName"
    );
  }

  return {
    id,
    categoryCode: remarkTypeName,
    categoryName: remarkTypeName,
  };
}
