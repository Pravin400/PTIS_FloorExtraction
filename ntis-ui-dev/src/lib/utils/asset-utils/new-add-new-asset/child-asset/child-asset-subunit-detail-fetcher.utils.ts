/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { manageSubUnitsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/manage-subunits.service';
import { logger } from '@/lib/utils/logger';

/** Returns a memoized fetcher for the freshly-created child asset's full
 * subunit detail — the underlying GET is only ever called once no matter how
 * many callers (renter resolution, room-offset sync) need it. */
export function createSubunitDetailFetcher(createdAssetId: number) {
  let cached: any = null;
  return async () => {
    if (cached) return cached;
    try {
      const getRes = await manageSubUnitsService.getById(createdAssetId);
      if (getRes.success && getRes.data) {
        cached = getRes.data;
      }
    } catch (err: any) {
      logger.error('Failed to fetch subunit details:', { error: err as Error });
    }
    return cached;
  };
}
