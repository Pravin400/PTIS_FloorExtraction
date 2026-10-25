/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';

/**
 * Server action — GET Floor Submission detail by SubUnitsDetailsId.
 * Calls GET /ManageSubUnits/{subUnitsDetailsId}.
 * Returns complete record including roomDetails / roomWiseDetails.
 */
export async function getFloorSubmissionByIdAction(
  subUnitsDetailsId: number
): Promise<ActionResult<any>> {
  try {
    const res = await manageSubUnitsService.getById(subUnitsDetailsId);
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return {
      success: false,
      error: res.error || res.message || 'Failed to fetch floor submission detail',
    };
  } catch (err: any) {
    logger.error('getFloorSubmissionByIdAction Error:', { error: err });
    return { success: false, error: err.message || 'Error fetching floor submission detail' };
  }
}
