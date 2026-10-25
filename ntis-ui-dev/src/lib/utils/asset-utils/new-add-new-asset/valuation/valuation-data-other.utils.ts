/* eslint-disable @typescript-eslint/no-explicit-any */
import { valuationApiService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/valuation.service";
import { apiClient } from "@/services/api.service";

/**
 * Non-building, non-land assets: fetches standard floors and, for movable
 * category assets, triggers server-side CV calculation on load.
 */
export async function fetchOtherValuationData(
  assetId: number,
  assetObj: any,
  assetCategoryId: number,
  category: string
): Promise<{ floorsList: any[]; assetObj: any }> {
  let floorsList: any[] = [];

  const floorsRes = await valuationApiService.getFloorsByAsset(assetId);
  if (floorsRes.success && floorsRes.data) {
    const data = floorsRes.data as any;
    if (Array.isArray(data)) {
      floorsList = data;
    } else if (data && typeof data === "object") {
      const candidateArray = data.floorDetails ?? data.FloorDetails ?? data.items ?? data.Items ?? data.data ?? data.Data ?? data.result ?? data.Result;
      if (Array.isArray(candidateArray)) {
        floorsList = candidateArray;
      } else {
        const arrays = Object.values(data).filter(Array.isArray);
        if (arrays.length > 0) {
          floorsList = arrays[0];
        }
      }
    }
  }

  const isMovable = assetCategoryId === 3 || category.includes("movable") || assetObj?.isMovableCategory === true;
  if (isMovable) {
    try {
      const { inventoryService } = await import("@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory.service");
      const condRes = await inventoryService.getConditions();
      let conditionsList: any[] = [];
      if (condRes.success && condRes.data) {
        conditionsList = Array.isArray(condRes.data) ? condRes.data : [];
      }

      // Resolve condition factor
      const condName = assetObj?.assetCondition || assetObj?.condition || "Good";
      const normalizedCond = String(condName).toLowerCase().trim();
      let resolvedCondFactor = 1.0;

      if (conditionsList.length > 0) {
        const match = conditionsList.find(
          (c) =>
            String(c.conditionName).toLowerCase().trim() === normalizedCond &&
            (assetCategoryId === 0 || Number(c.inventoryItemCategoryId) === assetCategoryId)
        );
        if (match) {
          resolvedCondFactor = match.conditionFactor;
        } else {
          const matchName = conditionsList.find(
            (c) => String(c.conditionName).toLowerCase().trim() === normalizedCond
          );
          if (matchName) resolvedCondFactor = matchName.conditionFactor;
        }
      } else {
        if (normalizedCond === "good") resolvedCondFactor = 0.85;
        else if (normalizedCond === "average") resolvedCondFactor = 0.75;
        else if (normalizedCond === "poor") resolvedCondFactor = 0.40;
      }

      const depRate = Number(assetObj?.depreciationRate) || 10;

      // Call the calculate-cv endpoint to compute & persist
      await apiClient.post("/AssetCapitalValue/movable/calculate-cv", {
        assetId,
        valuationMethod: 1, // DepreciatedValue
        conditionFactor: resolvedCondFactor,
        depreciationRate: depRate,
        depreciation: depRate,
        createdBy: 1,
      });

      // Fetch updated asset master again
      const updatedAssetRes = await valuationApiService.getAssetDetails(assetId);
      if (updatedAssetRes.success && updatedAssetRes.data) {
        const upData = updatedAssetRes.data as any;
        assetObj = upData.items?.[0] ?? upData.Items?.[0] ?? upData.data?.[0] ?? upData.Data?.[0] ?? upData.result ?? upData.Result ?? upData;
      }
    } catch (calcErr) {
      console.error("Movable CV calculation failed on load:", calcErr);
    }
  }

  return { floorsList, assetObj };
}
