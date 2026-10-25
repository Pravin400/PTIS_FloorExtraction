import type { TapSize } from "@/types/waterBill/tapSizeMaster.types";

/**
 * Validates that an unknown object resembles a tap size payload from the API.
 */
export function isTapSizeShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  const hasId = "id" in obj || "Id" in obj;
  const hasType =
    "tapSize" in obj ||
    "TapSize" in obj ||
    "tapSizeCode" in obj ||
    "TapSizeCode" in obj ||
    "code" in obj ||
    "Code" in obj;
  return hasId && hasType;
}

/**
 * Normalizes incoming data into the standard TapSize structure.
 */
export function normalizeTapSize(data: Record<string, unknown>): TapSize {
  const id = Number(data.id ?? data.Id ?? 0);
  const code = String(
    data.tapSizeCode ??
      data.TapSizeCode ??
      data.code ??
      data.Code ??
      ""
  ).trim();
  const tapSize = String(data.tapSize ?? data.TapSize ?? "").trim();
  
  const nominalValRaw = data.nominalSizeValue ?? data.NominalSizeValue;
  const nominalVal =
    nominalValRaw != null && nominalValRaw !== "" && Number.isFinite(Number(nominalValRaw))
      ? Math.round((Number(nominalValRaw) + Number.EPSILON) * 100) / 100
      : null;

  const sizeUnitRaw = data.sizeUnit ?? data.SizeUnit;
  const sizeUnit = sizeUnitRaw != null ? String(sizeUnitRaw).trim() : null;

  return {
    id: Number.isFinite(id) ? id : 0,
    tapSizeCode: code || (tapSize ? tapSize.substring(0, 5).toUpperCase() : ""),
    tapSize,
    nominalSizeValue: nominalVal,
    sizeUnit,
    isActive: Boolean(data.isActive ?? data.IsActive ?? false),
    createdBy: data.createdBy !== undefined ? Number(data.createdBy) : (data.CreatedBy !== undefined ? Number(data.CreatedBy) : null),
    createdDate: data.createdDate !== undefined ? String(data.createdDate) : (data.CreatedDate !== undefined ? String(data.CreatedDate) : null),
    updatedBy: data.updatedBy !== undefined ? Number(data.updatedBy) : (data.UpdatedBy !== undefined ? Number(data.UpdatedBy) : null),
    updatedDate: data.updatedDate !== undefined ? String(data.updatedDate) : (data.UpdatedDate !== undefined ? String(data.UpdatedDate) : null),
  };
}

/**
 * Safely extracts items array from various API response shapes (camelCase, PascalCase, nested).
 */
export function extractRawItems(rawData: Record<string, unknown> | unknown[] | undefined): unknown[] {
  if (Array.isArray(rawData)) return rawData;
  if (!rawData || typeof rawData !== "object") return [];
  if (Array.isArray(rawData.items)) return rawData.items;
  if (Array.isArray(rawData.Items)) return rawData.Items;
  const nestedData = rawData.data as Record<string, unknown> | undefined;
  if (Array.isArray(nestedData?.items)) return nestedData.items;
  return [];
}

/**
 * Client-side search and status filter fallback.
 */
export function filterTapSizes(
  items: TapSize[],
  searchTerm?: string,
  statusFilter?: string
): TapSize[] {
  let result = items;

  if (searchTerm?.trim()) {
    const term = searchTerm.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.tapSizeCode.toLowerCase().includes(term) ||
        item.tapSize.toLowerCase().includes(term) ||
        (item.sizeUnit && item.sizeUnit.toLowerCase().includes(term))
    );
  }

  if (statusFilter === "active") {
    result = result.filter((item) => item.isActive);
  } else if (statusFilter === "inactive") {
    result = result.filter((item) => !item.isActive);
  }

  return result;
}

/**
 * Prepares the payload for create and update operations.
 */
export function createPayload(
  data: { tapSizeCode?: string; tapSize: string; nominalSizeValue?: number | string | null; sizeUnit?: string | null; isActive: boolean },
  userId?: number,
  id?: number
) {
  const base = data.tapSize.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const code = (data.tapSizeCode?.trim() || base.substring(0, 10) || "TAP").slice(0, 30);

  const parsedNominal =
    data.nominalSizeValue !== undefined &&
    data.nominalSizeValue !== null &&
    data.nominalSizeValue !== ""
      ? Math.round((Number(data.nominalSizeValue) + Number.EPSILON) * 100) / 100
      : null;

  const payload: Record<string, unknown> = {
    TapSizeCode: code,
    Code: code,
    TapSize: data.tapSize.trim(),
    tapSize: data.tapSize.trim(),
    NominalSizeValue: parsedNominal,
    nominalSizeValue: parsedNominal,
    SizeUnit: data.sizeUnit?.trim() || null,
    sizeUnit: data.sizeUnit?.trim() || null,
    IsActive: data.isActive,
    isActive: data.isActive,
  };

  if (id !== undefined) {
    payload.Id = id;
    payload.id = id;
    payload.UpdatedBy = userId;
  } else {
    payload.CreatedBy = userId;
  }

  return { code, payload };
}

export {
  formatNominalSize,
  parseNominalSizeFromTapSize,
} from "./tapSizeParser.utils";
