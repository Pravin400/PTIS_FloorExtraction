import { SearchPropertyItem, EligibleCountResponse } from "@/types/addTaxes.types";
import { ApiError } from "@/lib/utils/api";

function readField(obj: Record<string, unknown>, camel: string, pascal: string): unknown {
  if (Object.prototype.hasOwnProperty.call(obj, camel) && obj[camel] != null) {
    return obj[camel];
  }
  if (Object.prototype.hasOwnProperty.call(obj, pascal) && obj[pascal] != null) {
    return obj[pascal];
  }
  return undefined;
}

/**
 * Type guard for SearchPropertyItem — validates structure before normalization
 */
export function isSearchPropertyItemShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const rawId = readField(obj, "propertyId", "PropertyId") ?? readField(obj, "id", "Id");
  const propertyId = Number(rawId);
  return Number.isFinite(propertyId) && propertyId > 0;
}

/**
 * Normalizes and validates a search property item
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeSearchPropertyItem(data: Record<string, unknown>): SearchPropertyItem {
  const rawId = readField(data, "propertyId", "PropertyId") ?? readField(data, "id", "Id");
  const propertyId = Number(rawId);
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid propertyId: ${rawId}`
    );
  }

  const oldProp = readField(data, "oldPropertyNo", "OldPropertyNo");
  const socName = readField(data, "societyName", "SocietyName");
  const rvVal = readField(data, "rv", "RV");
  const cvVal = readField(data, "cv", "CV");
  const taxVal = readField(data, "totalTax", "TotalTax");

  return {
    propertyId,
    upicId: String(readField(data, "upicId", "UPICId") ?? "").trim(),
    zoneName: String(readField(data, "zoneName", "ZoneName") ?? "").trim(),
    wardName: String(readField(data, "wardName", "WardName") ?? "").trim(),
    propertyNo: String(readField(data, "propertyNo", "PropertyNo") ?? "").trim(),
    partitionNo: String(readField(data, "partitionNo", "PartitionNo") ?? "").trim(),
    oldPropertyNo: oldProp != null ? String(oldProp).trim() : null,
    citySurveyNo: String(readField(data, "citySurveyNo", "CitySurveyNo") ?? "").trim(),
    plotNo: String(readField(data, "plotNo", "PlotNo") ?? "").trim(),
    wingFlatNo: String(readField(data, "wingFlatNo", "WingFlatNo") ?? "").trim(),
    categoryName: String(readField(data, "categoryName", "CategoryName") ?? "").trim(),
    propertyDescription: String(readField(data, "propertyDescription", "PropertyDescription") ?? "").trim(),
    mobile: String(readField(data, "mobile", "Mobile") ?? "").trim(),
    propertyHolderName: String(readField(data, "propertyHolderName", "PropertyHolderName") ?? "").trim(),
    occupierName: String(readField(data, "occupierName", "OccupierName") ?? "").trim(),
    shopBuildingName: String(readField(data, "shopBuildingName", "ShopBuildingName") ?? "").trim(),
    societyName: socName != null ? String(socName).trim() : null,
    address: String(readField(data, "address", "Address") ?? "").trim(),
    rv: rvVal != null ? Number(rvVal) : null,
    cv: cvVal != null ? Number(cvVal) : null,
    totalTax: Number.isFinite(Number(taxVal)) ? Number(taxVal) : 0,
  };
}

/**
 * Type guard for EligibleCountResponse
 */
export function isEligibleCountResponseShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const eligible = readField(obj, "eligible", "Eligible");
  const total = readField(obj, "total", "Total");
  const skipped = readField(obj, "skipped", "Skipped");
  return eligible !== undefined && total !== undefined && skipped !== undefined;
}

/**
 * Normalizes and validates eligible count response
 */
export function normalizeEligibleCountResponse(data: Record<string, unknown>): EligibleCountResponse {
  const eligible = Number(readField(data, "eligible", "Eligible") ?? 0);
  const total = Number(readField(data, "total", "Total") ?? 0);
  const skipped = Number(readField(data, "skipped", "Skipped") ?? 0);
  const alreadyTaxed = Number(readField(data, "alreadyTaxed", "AlreadyTaxed") ?? 0);
  const rawSkipReasons = readField(data, "skipReasons", "SkipReasons");
  const skipReasons = Array.isArray(rawSkipReasons)
    ? rawSkipReasons
        .map((r) => {
          const obj = r as Record<string, unknown>;
          const code = readField(obj, "code", "Code");
          const count = Number(readField(obj, "count", "Count") ?? 0);
          return typeof code === "string" && Number.isFinite(count) ? { code, count } : null;
        })
        .filter((r): r is { code: string; count: number } => r !== null)
    : undefined;

  return {
    eligible: Number.isFinite(eligible) ? eligible : 0,
    total: Number.isFinite(total) ? total : 0,
    skipped: Number.isFinite(skipped) ? skipped : 0,
    alreadyTaxed: Number.isFinite(alreadyTaxed) ? alreadyTaxed : 0,
    skipReasons,
  };
}
