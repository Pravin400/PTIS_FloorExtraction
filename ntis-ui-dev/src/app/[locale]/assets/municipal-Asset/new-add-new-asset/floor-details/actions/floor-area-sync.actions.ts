/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';
import { recomputeAndPersistFloorArea } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-area-sync.utils';
import { fetchFloorsByAsset } from './floor-crud-fetch.actions';
import { calculateFloorCVAction, calculateBuildingCVAction } from './cv-calculation.actions';

/**
 * Recalculates and updates the total area of a floor by summing all subunits (pool and rooms)
 * along with floor-level open spaces and amenities. Does NOT touch Capital Value — used by
 * Floor Submission's "+ ADD FLOOR" button, which calculates CV separately via
 * POST /AssetCapitalValue/unit/calculate-cv (calculateUnitCVAction) for just the new unit.
 */
export async function syncFloorAreaAction(
  parentAssetId: number,
  floorLevelId: number,
  roomDetailsToSync?: any[] | null
): Promise<ActionResult<any>> {
  try {
    const synced = await recomputeAndPersistFloorArea(parentAssetId, floorLevelId, roomDetailsToSync);
    if (!synced.success) {
      return { success: false, error: synced.error };
    }
    const { floorDetail, totalCarpetSqFt } = synced.result;

    // Refetch the final updated floors list once and return it to keep component state in-sync
    const finalFloorsRes = await fetchFloorsByAsset(parentAssetId);
    const finalFloors = finalFloorsRes.success ? finalFloorsRes.data : [];

    return {
      success: true,
      data: { floorDetailsId: floorDetail.id, totalCarpetSqFt, floors: finalFloors },
    };
  } catch (err: any) {
    logger.error('syncFloorAreaAction Error:', { error: err });
    return { success: false, error: err.message || 'Sync failed' };
  }
}

/**
 * Recalculates and updates the total area of a floor by summing all subunits (pool and rooms)
 * along with floor-level open spaces and amenities, then recalculates the floor's CV.
 */
export async function syncFloorAreaAndCVAction(
  parentAssetId: number,
  floorLevelId: number,
  roomDetailsToSync?: any[] | null
): Promise<ActionResult<any>> {
  try {
    const synced = await recomputeAndPersistFloorArea(parentAssetId, floorLevelId, roomDetailsToSync);
    if (!synced.success) {
      return { success: false, error: synced.error };
    }
    const { floorDetail, totalCarpetSqFt } = synced.result;

    // Trigger CV calculation for this floor
    const cvRes = await calculateFloorCVAction(floorDetail.id);
    if (!cvRes.success) {
      return { success: false, error: cvRes.error || 'Failed to calculate floor CV during sync' };
    }

    // Trigger building-level CV calculation as well to update parent building CV
    await calculateBuildingCVAction(parentAssetId, true);

    // Refetch the final updated floors list once and return it to keep component state in-sync
    const finalFloorsRes = await fetchFloorsByAsset(parentAssetId);
    const finalFloors = finalFloorsRes.success ? finalFloorsRes.data : [];

    return {
      success: true,
      data: { floorDetailsId: floorDetail.id, totalCarpetSqFt, floors: finalFloors },
    };
  } catch (err: any) {
    logger.error('syncFloorAreaAndCVAction Error:', { error: err });
    return { success: false, error: err.message || 'Sync failed' };
  }
}
