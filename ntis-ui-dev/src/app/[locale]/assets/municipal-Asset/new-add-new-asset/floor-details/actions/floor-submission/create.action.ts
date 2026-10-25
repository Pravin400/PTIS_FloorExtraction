/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';
import { ActionResult } from '@/types/common.types';
import { cookies } from 'next/headers';

/**
 * Server action — Floor Submission CREATE.
 *
 * Calls POST /ManageSubUnits/floor-submission/create.
 * Saves directly into AMS.SubUnitsDetails with AssetId = parentAssetId.
 * NO child AssetMaster row is created.
 *
 * Returns { subUnitsDetailsId, assetId } on success.
 */
export async function createFloorSubmissionAction(
  data: Record<string, any>
): Promise<ActionResult<any>> {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    const userId = userIdStr ? Number(userIdStr) : undefined;

    const payload = {
      ...data,
      parentAssetId: Number(data.parentAssetId || 0),
      createdBy: userId ?? data.createdBy ?? 1,
    } as any;

    const res = await manageSubUnitsService.createFloorSubmission(payload);

    if (res.success && res.data) {
      const body = res.data as any;
      // Backend wraps response in ApiResponse — unwrap items if needed
      if (body && body.success === false) {
        return { success: false, error: body.message || 'Failed to create floor submission' };
      }
      return { success: true, data: body };
    }

    return { success: false, error: res.error ?? 'Failed to create floor submission' };
  } catch (err: any) {
    logger.error('createFloorSubmissionAction Error:', { error: err });
    return { success: false, error: 'Network error creating floor submission' };
  }
}
