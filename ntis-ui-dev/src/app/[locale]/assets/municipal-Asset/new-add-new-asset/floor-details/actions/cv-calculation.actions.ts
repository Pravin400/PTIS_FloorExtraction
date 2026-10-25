/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { capitalValueService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/capital-value.service';
import { floorDetailsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-details.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';
import { cookies } from 'next/headers';

/**
 * Trigger CV calculation for a floor detail record.
 * Calculates CapitalValue using SDRR × area × age/floor/nature/use factors
 * and propagates the result to all sub-units on that floor.
 */
export async function calculateFloorCVAction(floorDetailId: number): Promise<ActionResult<any>> {
  try {
    const res = await floorDetailsService.calculateFloorCV(floorDetailId);
    if (res.success) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res.error ?? 'CV calculation failed' };
  } catch (err: any) {
    logger.error('calculateFloorCVAction Error:', { error: err });
    return { success: false, error: err.message || 'CV calculation failed' };
  }
}

/**
 * Calculate CV for an entire building including all floors + sub-units.
 * Endpoint: POST /api/AssetCapitalValue/building/calculate-cv
 * Updates: AssetFloorDetails.CapitalValue, sub-unit AssetMaster.CapitalValue,
 *          and parent building AssetMaster.CapitalValue (sum of all floors).
 */
export async function calculateBuildingCVAction(
  buildingAssetId: number,
  forceRecalculate: boolean = true
): Promise<ActionResult<any>> {
  try {
    const res = await capitalValueService.calculateBuildingCV({
      buildingAssetId,
      forceRecalculate,
      createdBy: 1,
    });
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.error ?? 'Building CV calculation failed' };
  } catch (err: any) {
    logger.error('calculateBuildingCVAction Error:', { error: err });
    return { success: false, error: err.message || 'Building CV calculation failed' };
  }
}

/**
 * Calculate CV for a single unit (shop/unit/office) using AssetCapitalValueController.
 * Endpoint: POST /api/AssetCapitalValue/unit/calculate-cv
 */
export async function calculateUnitCVAction(
  assetId: number,
  subUnitsDetailsId?: number
): Promise<ActionResult<any>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    const res = await capitalValueService.calculateUnitCV({
      id: assetId,
      Id: assetId,
      assetId,
      AssetId: assetId,
      subUnitsDetailsId: subUnitsDetailsId || 0,
      SubUnitsDetailsId: subUnitsDetailsId || 0,
      includeChildAssets: false,
      IncludeChildAssets: false,
      createdBy: userId ?? 1,
      CreatedBy: userId ?? 1,
    });
    if (!res.success) {
      return { success: false, error: res.error ?? 'Unit CV calculation failed' };
    }

    const summary = res.data as any;
    const floorDetails = Array.isArray(summary?.floorDetails) ? summary.floorDetails : [];
    const calculatedCount = summary?.calculatedFloorDetailsCount ?? 0;

    if (floorDetails.length === 0) {
      return {
        success: false,
        error: `No floor detail record found to calculate CV for asset ${assetId}${subUnitsDetailsId ? ` (SubUnitsDetailsId ${subUnitsDetailsId})` : ''}.`,
      };
    }

    if (calculatedCount === 0) {
      const failureMessage = floorDetails.find((f: any) => !f.isCalculated)?.calculationMessage;
      return {
        success: false,
        error: failureMessage || 'Capital value could not be calculated for this unit.',
      };
    }

    return { success: true, data: summary };
  } catch (err: any) {
    logger.error('calculateUnitCVAction Error:', { error: err });
    return { success: false, error: err.message || 'Unit CV calculation failed' };
  }
}

/**
 * Calculate CV for a single movable asset (furniture, vehicle, IT equipment, etc.).
 * Endpoint: POST /api/AssetCapitalValue/movable/calculate-cv
 * Updates: AssetMaster.CapitalValue for the movable asset using depreciated value method.
 */
export async function calculateMovableCVAction(
  assetId: number,
  conditionFactor: number = 1.0
): Promise<ActionResult<any>> {
  try {
    const res = await capitalValueService.calculateMovableCV({
      assetId,
      valuationMethod: 1, // DepreciatedValue
      conditionFactor,
      createdBy: 1,
    });
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.error ?? 'Movable CV calculation failed' };
  } catch (err: any) {
    logger.error('calculateMovableCVAction Error:', { error: err });
    return { success: false, error: err.message || 'Movable CV calculation failed' };
  }
}
