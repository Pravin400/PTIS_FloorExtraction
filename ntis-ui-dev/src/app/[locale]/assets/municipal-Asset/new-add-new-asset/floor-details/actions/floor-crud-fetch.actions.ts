/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { floorDetailsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-details.service';
import { floorLookupService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-lookup.service';
import { logger } from '@/lib/utils/logger';
import { FloorDetailApiResponse, FloorDropdownOptions } from '@/types/asset/floor-details.types';
import { ActionResult } from '@/types/common.types';
import { getArray, isRedirectError } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/shared.utils';
import { normalizeFloorRecord } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-offset-normalizer.utils';

export async function fetchFloorsByAsset(
  assetId: number
): Promise<ActionResult<FloorDetailApiResponse[]>> {
  try {
    const res = await floorDetailsService.getFloorsByAsset(assetId);
    if (res.success && res.data) {
      const floors = getArray(res.data);

      // Pre-fetch all room-wise minus data in one call to avoid N+1 query overhead
      let allMinusData: any[] = [];
      try {
        allMinusData = await floorLookupService.getRoomWiseMinusData();
      } catch (err) {
        logger.error('Failed to pre-fetch AssetRoomWiseMinusData in fetchFloorsByAsset:', {
          error: err as Error,
        });
      }

      for (const floor of floors) {
        normalizeFloorRecord(floor, allMinusData);
      }
      return { success: true, data: floors };
    }
    return { success: true, data: [] };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    logger.error('fetchFloorsByAsset Error:', { error: err });
    return { success: true, data: [] };
  }
}

export async function fetchFloorDropdownOptions(
  assetTypeId?: number
): Promise<ActionResult<FloorDropdownOptions>> {
  try {
    const res = await floorDetailsService.getFloorDropdownOptions(assetTypeId);
    return res.success && res.data
      ? { success: true, data: res.data }
      : { success: false, error: res.error ?? 'Failed to fetch dropdown options' };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    return { success: false, error: 'Network error fetching dropdown options' };
  }
}

export interface FloorStepData {
  dropdownOptions: FloorDropdownOptions;
  floors: FloorDetailApiResponse[];
}

export async function fetchFloorStepData(assetId: number): Promise<ActionResult<FloorStepData>> {
  try {
    const [optRes, flrRes] = await Promise.all([
      floorDetailsService.getFloorDropdownOptions(),
      floorDetailsService.getFloorsByAsset(assetId),
    ]);
    if (!optRes.success || !optRes.data)
      return { success: false, error: optRes.error || 'Failed to load dropdown options' };

    return {
      success: true,
      data: {
        dropdownOptions: optRes.data,
        floors: flrRes.success ? getArray(flrRes.data) : [],
      },
    };
  } catch (err: any) {
    logger.error('fetchFloorStepData Error:', { error: err });
    return { success: false, error: 'Network error loading step configurations' };
  }
}

export async function fetchFloorDetailByIdAction(
  id: number
): Promise<ActionResult<FloorDetailApiResponse>> {
  try {
    const res = await floorDetailsService.getFloorById(id);
    return res.success && res.data
      ? { success: true, data: res.data }
      : { success: false, error: res.error ?? 'Failed to fetch floor detail' };
  } catch (err: any) {
    logger.error('fetchFloorDetailByIdAction Error:', { error: err });
    return { success: false, error: 'Network error fetching floor detail' };
  }
}

/**
 * Fetch all lease/rent (Renter / Tenant) details for a given asset (child-unit).
 * The main floor-detail endpoint does NOT embed these — they live in
 * AssetLeaseRentDetails and must be fetched separately at edit time.
 */
export async function fetchAssetLeaseRentDetailsAction(
  assetId: number
): Promise<ActionResult<any[]>> {
  try {
    const items = await floorLookupService.getAssetLeaseRentDetails(assetId);
    return { success: true, data: items };
  } catch (err: any) {
    logger.error('fetchAssetLeaseRentDetailsAction Error:', { error: err });
    return { success: true, data: [] }; // graceful fallback — never block edit
  }
}
