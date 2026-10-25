import { authService } from './auth.service';
import { logger } from '@/lib/utils/logger';
import type { UlbConfigApiBody } from '@/types/login.types';
import type { UlbMaster } from '@/types/master.types';

/**
 * Maps ULB config API response to master data (login branding).
 */
function mapUlbConfigApiToMaster(raw: UlbConfigApiBody): UlbMaster {
  return {
    id: raw.ulbId,
    ulbCode: raw.ulbCode,
    ulbName: raw.ulbName,
    ulbNameLocal: raw.ulbNameLocal ?? undefined,
    ulbTypeId: 1,
    isActive: true,
    ulbLogo: raw.ulbLogo ?? undefined,
    ulbBackground: raw.ulbBackground ?? undefined,
    email: raw.emailId ?? undefined,
    phoneNo: raw.mobileNo ?? undefined,
    websiteUrl: raw.websiteUrl ?? undefined,
    ulbAddress: raw.ulbAddress ?? undefined,
  };
}

/**
 * Fetches council branding for the login page (GET `/UlbConfig` via `authService`).
 * On failure, returns `undefined` so the page can still render (same contract as
 * construction’s service layer, but with graceful degradation instead of throwing).
 */
export async function getUlbConfigForLogin(): Promise<UlbMaster | undefined> {
  try {
    const res = await authService.getUlbConfig();
    if (!res.success || !res.data) {
      logger.debug('ULB config unavailable for login branding', { success: res.success });
      return undefined;
    }
    return mapUlbConfigApiToMaster(res.data);
  } catch (error) {
    logger.warn('Failed to load ULB config for login branding', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return undefined;
  }
}
