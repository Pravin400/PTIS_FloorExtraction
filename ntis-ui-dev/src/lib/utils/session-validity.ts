import type { SessionValidity } from '@/lib/utils/auth-session-types';
import { isSessionExpired } from '@/lib/utils/jwt-expiry';

export type { SessionValidity };

const CLOCK_SKEW_SECONDS = 30;

function isExpiredBySessionCookie(
  sessionExpiresAtRaw: string | undefined,
  nowUnix: number
): boolean {
  const raw = (sessionExpiresAtRaw ?? '').trim();
  if (!raw) return false;
  const exp = Number.parseInt(raw, 10);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  return nowUnix >= exp - CLOCK_SKEW_SECONDS;
}

/**
 * Classifies session from cookies (Edge middleware + server actions).
 */
export function getSessionValidityFromTokens(
  accessToken: string | undefined,
  refreshToken: string | undefined,
  sessionExpiresAtRaw?: string | undefined,
  nowUnix = Math.floor(Date.now() / 1000)
): SessionValidity {
  const token = (accessToken ?? '').trim();
  const refresh = (refreshToken ?? '').trim();

  if (!token && !refresh) return 'missing';
  if (!token || !refresh) return 'expired';

  if (isExpiredBySessionCookie(sessionExpiresAtRaw, nowUnix)) {
    return 'expired';
  }

  if (isSessionExpired(token, refresh, nowUnix)) return 'expired';
  return 'active';
}
