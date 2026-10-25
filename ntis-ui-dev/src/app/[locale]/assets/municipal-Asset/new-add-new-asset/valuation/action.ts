/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { valuationApiService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/valuation.service";
import { capitalValueService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/capital-value.service";
import { submitAssetForm } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/submit/action";
import {
  extractAssetObject,
  resolveAssetCategory,
  fetchBuildingValuationData,
  fetchLandValuationData,
  fetchOtherValuationData,
  extractInventoriesList,
  fetchCvRollup,
} from "@/lib/utils/asset-utils/new-add-new-asset/valuation/valuation-data.utils";

/**
 * Server Action to load all valuation-related data for a specific assetId
 */
export async function getAssetValuationDataAction(assetId: number, isBuildingClient?: boolean) {
  try {
    const [assetRes, inventoryRes] = await Promise.all([
      valuationApiService.getAssetDetails(assetId),
      valuationApiService.getInventoryBatchesByAsset(assetId)
    ]);

    let assetObj = extractAssetObject(assetRes);
    const { assetCategoryId, category, isBuilding, isLand } = resolveAssetCategory(assetObj, isBuildingClient);

    let floorsList: any[] = [];
    let buildingCVData: any = null;
    let plotCVData: any = null;

    if (isBuilding) {
      const result = await fetchBuildingValuationData(assetId);
      floorsList = result.floorsList;
      buildingCVData = result.buildingCVData;
      plotCVData = result.plotCVData;
    } else if (isLand) {
      const result = await fetchLandValuationData(assetId);
      floorsList = result.floorsList;
      plotCVData = result.plotCVData;
    } else {
      const result = await fetchOtherValuationData(assetId, assetObj, assetCategoryId, category);
      floorsList = result.floorsList;
      assetObj = result.assetObj;
    }

    const inventoriesList = extractInventoriesList(inventoryRes);
    const cvRollup = await fetchCvRollup(assetId);

    return {
      success: true,
      asset: assetObj,
      floors: floorsList,
      inventories: inventoriesList,
      buildingCV: buildingCVData,
      plotCV: plotCVData,
      cvRollup
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load valuation data from server"
    };
  }
}

/**
 * Server action to save and calculate movable asset CV.
 * Saves current form values, runs calculation, and refetches updated asset.
 */
export async function calculateAndFetchMovableCVAction(
  formData: any,
  conditionFactor: number,
  depreciationRate: number
) {
  try {
    const assetId = Number(formData.id || formData.assetId);
    if (!assetId || assetId <= 0) {
      return { success: false, error: "Asset ID not found." };
    }

    // 1. Submit the form to save latest user inputs (grossValue, purchaseDate, depreciationRate, condition, etc.)
    const saveRes = await submitAssetForm(formData);
    if (!saveRes.success) {
      return { success: false, error: saveRes.error || "Failed to save asset details." };
    }

    // 2. Call the calculate-cv endpoint via capitalValueService
    const calcRes = await capitalValueService.calculateMovableCV({
      assetId,
      valuationMethod: 1, // DepreciatedValue
      conditionFactor,
      depreciationRate,
      createdBy: 1,
    });

    if (!calcRes.success) {
      return { success: false, error: calcRes.error || "Failed to calculate movable CV." };
    }

    // 3. Fetch the updated asset details from the database
    const assetRes = await valuationApiService.getAssetDetails(assetId);
    if (!assetRes.success || !assetRes.data) {
      return { success: false, error: assetRes.error || "Failed to fetch updated asset details." };
    }

    const data = assetRes.data as any;
    const assetObj = data.items?.[0] ?? data.Items?.[0] ?? data.data?.[0] ?? data.Data?.[0] ?? data.result ?? data.Result ?? data;

    return {
      success: true,
      capitalValue: String(assetObj?.capitalValue ?? ""),
      currentBookValue: String(assetObj?.currentBookValue ?? ""),
      marketValue: String(assetObj?.marketValue ?? ""),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during CV calculation."
    };
  }
}

export async function triggerRecalculateBuildingCVAction(assetId: number) {
  try {
    const res = await valuationApiService.calculateBuildingCV(assetId);
    if (!res.success) {
      return { success: false, error: res.error || "Recalculation failed" };
    }
    return { success: true, data: { success: true } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Recalculate CV error",
    };
  }
}

export async function triggerRecalculatePlotCVAction(assetId: number) {
  try {
    const res = await valuationApiService.calculatePlotCV(assetId);
    if (!res.success) {
      return { success: false, error: res.error || "Plot CV recalculation failed" };
    }
    return { success: true, data: { success: true } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Plot CV error",
    };
  }
}

export async function fetchParentAssetValuationAction(parentAssetId: number) {
  try {
    const res = await valuationApiService.getParentAssetValuation(parentAssetId);
    if (res?.success) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res?.error || "Failed to fetch parent asset valuation" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Parent asset valuation fetch error",
    };
  }
}
