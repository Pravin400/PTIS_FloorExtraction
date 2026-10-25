import { GisKpiMaster } from "@/types/gis-master/gis-kpi-master.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<GisKpiMaster>
 */
export function isGisKpiPagedResponse(value: unknown): value is PagedResponse<GisKpiMaster> {
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
 * Type guard for GisKpiMaster - validates structure before normalization
 */
export function isGisKpiMasterShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  // Must have a valid ID field (> 0)
  if (!("id" in obj)) {
    return false;
  }
  const id = Number(obj.id);
  return Number.isFinite(id) && id > 0;
}

/**
 * Normalizes and validates a GIS KPI master object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeGisKpiMaster(data: Record<string, unknown>): GisKpiMaster {
  const id = Number(data.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(500, "Invalid data received from server", `Invalid id: ${data.id}`);
  }

  const kpiCode = String(data.kpiCode ?? "").trim();
  if (!kpiCode) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: kpiCode");
  }

  const defaultTitle = String(data.defaultTitle ?? "").trim();
  if (!defaultTitle) {
    throw new ApiError(500, "Invalid data received from server", "Missing required field: defaultTitle");
  }

  const defaultIcon = String(data.defaultIcon ?? "").trim();
  const defaultColor = String(data.defaultColor ?? "").trim();

  const createdDateStr = String(data.createdDate ?? new Date().toISOString()).trim();

  return {
    id,
    kpiCode,
    defaultTitle,
    defaultIcon,
    defaultColor,
    isActive: parseBoolean(data.isActive),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}
