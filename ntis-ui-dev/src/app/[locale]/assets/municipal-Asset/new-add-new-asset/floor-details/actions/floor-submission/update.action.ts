/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';
import { cookies } from 'next/headers';

/**
 * Server action — Floor Submission UPDATE.
 *
 * Calls PUT /ManageSubUnits/floor-submission/{subUnitsDetailsId}.
 * Updates an existing direct SubUnitsDetails row (AssetId = parentAssetId).
 * NO child AssetMaster row is touched.
 */
export async function updateFloorSubmissionAction(
  subUnitsDetailsId: number,
  data: Record<string, any>
): Promise<ActionResult<any>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    const payload = {
      ...data,
      createdBy: userId ?? data.createdBy ?? 1,
    };

    const res = await manageSubUnitsService.updateFloorSubmission(subUnitsDetailsId, payload);

    if (res.success && res.data) {
      const body = res.data as any;
      if (body && body.success === false) {
        return { success: false, error: body.message || 'Failed to update floor submission' };
      }
      return { success: true, data: body };
    }

    return { success: false, error: res.error ?? 'Failed to update floor submission' };
  } catch (err: any) {
    logger.error('updateFloorSubmissionAction Error:', { error: err });
    return { success: false, error: 'Network error updating floor submission' };
  }
}
