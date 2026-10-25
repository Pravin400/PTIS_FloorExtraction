/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';

/**
 * Server action — GET Floor Submissions by parent asset.
 *
 * Calls GET /ManageSubUnits/parent/{parentAssetId}/floor-submissions.
 * Returns direct SubUnitsDetails rows (AssetId = parentAssetId).
 * Each item includes { subUnitsDetailsId, isDirectFloorSubmission: true, floorId, rooms, ... }.
 */
export async function getFloorSubmissionsByParentAction(
  parentAssetId: number
): Promise<ActionResult<any[]>> {
  try {
    const res = await manageSubUnitsService.getFloorSubmissionsByParent(parentAssetId);
    if (res.success) {
      return { success: true, data: Array.isArray(res.data) ? res.data : [] };
    }
    logger.warn(
      `[getFloorSubmissionsByParentAction] parentAssetId=${parentAssetId} returned error: ${res.error}`
    );
    return {
      success: false,
      error: res.error || res.message || 'Failed to fetch floor submissions',
    };
  } catch (err: any) {
    logger.error('getFloorSubmissionsByParentAction Error:', { error: err });
    return {
      success: false,
      error: err?.message || 'Error fetching floor submissions',
    };
  }
}
