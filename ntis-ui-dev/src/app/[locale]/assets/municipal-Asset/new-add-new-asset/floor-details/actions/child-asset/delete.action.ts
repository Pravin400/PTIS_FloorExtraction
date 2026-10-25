/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { assetMasterService } from '@/lib/api/asset/asset-master.service';
import { ActionResult } from '@/types/common.types';
import { logger } from '@/lib/utils/logger';

export async function deleteChildAssetAction(
  childAssetId: number
): Promise<ActionResult<{ message?: string }>> {
  try {
    const res = await assetMasterService.deleteAsset(childAssetId);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to delete child asset' };
    }
    return { success: true, data: { message: 'Subunit deleted successfully' } };
  } catch (err: any) {
    logger.error('deleteChildAssetAction Error:', { error: err });
    return { success: false, error: err.message || 'Failed to delete child asset' };
  }
}
