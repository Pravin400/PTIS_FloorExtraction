/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';

/**
 * Server action — Floor Submission DELETE.
 *
 * Calls DELETE /ManageSubUnits/floor-submission/{subUnitsDetailsId}.
 * Soft-deletes the SubUnitsDetails row + hard-deletes its rooms.
 * Does NOT delete any AssetMaster row.
 */
export async function deleteFloorSubmissionAction(
  subUnitsDetailsId: number
): Promise<ActionResult<void>> {
  try {
    const res = await manageSubUnitsService.deleteFloorSubmission(subUnitsDetailsId);
    return res.success
      ? { success: true }
      : { success: false, error: res.error ?? 'Failed to delete floor submission' };
  } catch (err: any) {
    logger.error('deleteFloorSubmissionAction Error:', { error: err });
    return { success: false, error: 'Network error deleting floor submission' };
  }
}
