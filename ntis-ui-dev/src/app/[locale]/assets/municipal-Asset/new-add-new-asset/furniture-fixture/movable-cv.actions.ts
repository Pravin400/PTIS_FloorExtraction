/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { capitalValueService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/capital-value.service";

/**
 * Server action to trigger Capital Value calculation for a movable asset.
 * Endpoint: POST /api/AssetCapitalValue/movable/calculate-cv
 */
export async function calculateMovableCVAction(
  assetId: number,
  conditionFactor: number = 1.0
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await capitalValueService.calculateMovableCV({
      assetId,
      conditionFactor,
      valuationMethod: 1, // DepreciatedValue
      createdBy: 1,
    });

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }

    return { success: false, error: response.error || "Failed to calculate CV for movable asset" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate movable CV"
    };
  }
}
