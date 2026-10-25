/* eslint-disable @typescript-eslint/no-explicit-any */
import { assetMasterService } from "@/lib/api/asset/asset-master.service";

export const parseNumericId = (val: any, mapping?: Record<string, number>): number | null => {
  if (val === null || val === undefined || String(val).trim() === "") return null;
  const parsed = Number(val);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }
  if (mapping) {
    const mapped = mapping[String(val).toLowerCase().trim()];
    if (mapped !== undefined) return mapped;
  }
  return null;
};

export const getSafeForeignKeyId = (
  parsedId: number | null,
  _isRequiredInUI?: boolean
): number | null => {
  // Trust the UI validation and database schema.
  // Do not perform 4 separate redundant DB queries just to validate foreign keys here.
  if (parsedId !== null && parsedId > 0) {
    return parsedId;
  }
  return null;
};

/**
 * Preserves the existing assetNo on update when the incoming payload didn't carry one.
 */
export async function resolveAssetNo(formData: any, parsedId: number, isUpdate: boolean): Promise<string> {
  let assetNo = (formData.assetNo || formData.assetCode || "").trim();
  if (!assetNo && isUpdate) {
    try {
      const existingAsset = await assetMasterService.getAssetById(parsedId);
      if (existingAsset.success && existingAsset.data) {
        assetNo = (existingAsset.data as any).assetNo || existingAsset.data.assetCode || "";
      }
    } catch (err) {
      console.warn("Failed to fetch existing asset to preserve assetNo during update:", err);
    }
  }
  return assetNo;
}

/**
 * Safe, non-recursive ID extractor to prevent grabbing IDs from nested objects like 'ward' or 'zone'.
 */
export function extractAssetIdFromResponse(resData: any, isUpdate: boolean, parsedId: number): number | null {
  const checkDirect = (o: any): number | null => {
    if (!o || typeof o !== "object") return null;
    const directId = o.id ?? o.Id ?? o.assetId ?? o.AssetId ?? o.assetMasterId ?? o.AssetMasterId;
    if (typeof directId === "number" && directId > 0) return directId;
    if (typeof directId === "string" && !isNaN(Number(directId)) && Number(directId) > 0) return Number(directId);
    return null;
  };

  const getAssetIdSafe = (obj: any): number | null => {
    if (!obj || typeof obj !== "object") return null;

    // 1. Check root level
    let found = checkDirect(obj);
    if (found) return found;

    // 2. Check well-known wrappers
    const wrappers = ["items", "Items", "data", "Data", "record", "Record", "result", "Result"];
    for (const w of wrappers) {
      if (obj[w] && typeof obj[w] === "object") {
        if (Array.isArray(obj[w]) && obj[w].length > 0) {
          found = checkDirect(obj[w][0]);
          if (found) return found;
        } else {
          found = checkDirect(obj[w]);
          if (found) return found;
        }
      }
    }
    return null;
  };

  return getAssetIdSafe(resData) || (isUpdate ? parsedId : null);
}
