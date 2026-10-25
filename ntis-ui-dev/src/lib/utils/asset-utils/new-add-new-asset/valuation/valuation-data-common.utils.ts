/* eslint-disable @typescript-eslint/no-explicit-any */
import { valuationApiService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/valuation.service";

/**
 * Robustly extracts the asset object from the various response envelope
 * shapes valuationApiService.getAssetDetails can return.
 */
export function extractAssetObject(assetRes: any): any {
  let assetObj: any = null;
  if (assetRes.success && assetRes.data) {
    const data = assetRes.data as any;
    if (data && typeof data === "object") {
      assetObj = data.items?.[0] ?? data.Items?.[0] ?? data.data?.[0] ?? data.Data?.[0] ?? data.result ?? data.Result ?? data;
    }
  }
  return assetObj;
}

export function resolveAssetCategory(
  assetObj: any,
  isBuildingClient?: boolean
): { assetCategoryId: number; category: string; isBuilding: boolean; isLand: boolean } {
  const assetCategoryId = Number(assetObj?.assetCategoryId ?? assetObj?.categoryId ?? 0);
  const category = String(assetObj?.categoryName ?? assetObj?.category ?? assetObj?.assetCategoryName ?? assetObj?.assetCategory ?? "").toLowerCase().trim();

  const isBuilding =
    isBuildingClient === true ||
    assetCategoryId === 1 ||
    category.includes("building") ||
    category.includes("infra") ||
    assetObj?.categoryId === 1;

  const isLand =
    assetCategoryId === 2 ||
    category.includes("land") ||
    category.includes("plot");

  return { assetCategoryId, category, isBuilding, isLand };
}

/**
 * Standard floors fetch (no extra Object.values fallback) — shared by the
 * building-CV-failed fallback and the land branch.
 */
export async function fetchStandardFloorsList(assetId: number): Promise<any[]> {
  const floorsRes = await valuationApiService.getFloorsByAsset(assetId);
  if (floorsRes.success && floorsRes.data) {
    const data = floorsRes.data as any;
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === "object") {
      const candidateArray = data.floorDetails ?? data.FloorDetails ?? data.items ?? data.Items ?? data.data ?? data.Data ?? data.result ?? data.Result;
      if (Array.isArray(candidateArray)) {
        return candidateArray;
      } else if (candidateArray && typeof candidateArray === 'object') {
        const nestedArray = candidateArray.floorDetails ?? candidateArray.FloorDetails ?? candidateArray.items ?? candidateArray.Items;
        if (Array.isArray(nestedArray)) {
          return nestedArray;
        }
      }
    }
  }
  return [];
}

export function extractInventoriesList(inventoryRes: any): any[] {
  let inventoriesList: any[] = [];
  if (inventoryRes.success && inventoryRes.data) {
    const data = inventoryRes.data as any;
    if (Array.isArray(data)) {
      inventoriesList = data;
    } else if (data && typeof data === "object") {
      const candidateArray = data.batches ?? data.Batches ?? data.items ?? data.Items ?? data.data ?? data.Data ?? data.result ?? data.Result;
      if (Array.isArray(candidateArray)) {
        inventoriesList = candidateArray;
      } else {
        const arrays = Object.values(data).filter(Array.isArray);
        if (arrays.length > 0) {
          inventoriesList = arrays[0];
        }
      }
    }
  }
  return inventoriesList;
}

export async function fetchCvRollup(assetId: number): Promise<any> {
  let cvRollup: any = null;
  if (assetId > 0) {
    try {
      const rollupRes = await valuationApiService.getParentAssetValuation(assetId);
      if (rollupRes.success && rollupRes.data) {
        cvRollup = rollupRes.data;
      }
    } catch (err) {
      console.error("Failed to fetch parent asset valuation:", err);
    }
  }
  return cvRollup;
}
