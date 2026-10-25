/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { assetMasterService } from '@/lib/api/asset/asset-master.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';
import { isRedirectError } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/shared.utils';
import { mergeAssetMasterIntoDetail, resolveSubFloorId } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/child-asset-detail-merge.utils';
import { resolveChildAssetRoomOffsets } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/child-asset-detail-offsets.utils';

/**
 * Server action to retrieve complete details (rooms, renter) of a child asset by ID
 */
export async function getChildAssetByIdAction(
  assetId: number,
  preFetchedMinusData?: any[],
  preFetchedAssetMaster?: any,
  preFetchedFloors?: any[]
): Promise<ActionResult<any>> {
  try {
    const subUnitPromise = manageSubUnitsService.getById(assetId);
    const masterPromise = preFetchedAssetMaster
      ? Promise.resolve({ success: true, data: preFetchedAssetMaster })
      : assetMasterService.getAssetById(assetId);

    const [subUnitRes, assetMasterRes] = await Promise.all([subUnitPromise, masterPromise]);

    if (!subUnitRes.success || !subUnitRes.data) {
      return { success: false, error: subUnitRes.error || 'Failed to fetch child asset details' };
    }

    const detail = subUnitRes.data as any;

    // DEBUG: log the top-level keys of the response to diagnose field naming
    logger.info(
      `[DEBUG] getChildAssetByIdAction assetId=${assetId} detail keys: ${Object.keys(detail || {}).join(', ')}`
    );
    logger.info(
      `[DEBUG] getChildAssetByIdAction roomDetails count: ${Array.isArray(detail?.roomDetails) ? detail.roomDetails.length : 'N/A'}, roomWiseDetails count: ${Array.isArray(detail?.roomWiseDetails) ? detail.roomWiseDetails.length : 'N/A'}`
    );

    mergeAssetMasterIntoDetail(detail, assetMasterRes);
    await resolveSubFloorId(detail, preFetchedFloors);
    await resolveChildAssetRoomOffsets(detail, preFetchedMinusData);

    return { success: true, data: detail };
  } catch (err: any) {
    if (isRedirectError(err)) throw err;
    logger.error('getChildAssetByIdAction Error:', { error: err });
    return { success: false, error: 'Network error fetching child asset details: ' + err.message };
  }
}
