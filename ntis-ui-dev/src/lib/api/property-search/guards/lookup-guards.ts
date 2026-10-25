/**
 * Lookup options type guards and normalization.
 */

import type { LookupOptionsApiResponse } from "@/types/property-search";

const EMPTY: LookupOptionsApiResponse = {
  propertyNos: [],
  oldPropertyNos: [],
  upicIds: [],
  csns: [],
  subZoneNos: [],
};

export function isLookupOptionsApiResponse(
  value: unknown
): value is LookupOptionsApiResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.propertyNos) &&
    Array.isArray(obj.oldPropertyNos) &&
    Array.isArray(obj.upicIds) &&
    Array.isArray(obj.csns) &&
    Array.isArray(obj.subZoneNos)
  );
}

export function normalizeLookupOptions(
  data: unknown
): LookupOptionsApiResponse {
  if (!isLookupOptionsApiResponse(data)) {
    return EMPTY;
  }

  return {
    propertyNos: data.propertyNos.filter((v): v is string => typeof v === "string"),
    oldPropertyNos: data.oldPropertyNos.filter(
      (v): v is string => typeof v === "string"
    ),
    upicIds: data.upicIds.filter((v): v is string => typeof v === "string"),
    csns: data.csns.filter((v): v is string => typeof v === "string"),
    subZoneNos: data.subZoneNos.filter((v): v is string => typeof v === "string"),
  };
}
