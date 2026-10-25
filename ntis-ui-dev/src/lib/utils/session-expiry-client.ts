import { AUTH_COOKIES, SESSION_TIMEOUT_REDIRECT_SECONDS } from '@/components/modules/login/constants';
import { getCookieValue } from '@/lib/utils/cookie';

/** Align with middleware JWT/session skew (see session-validity.ts). */
export const SESSION_EXPIRY_CLOCK_SKEW_SECONDS = 30;

export function isSessionExpiredAtUnix(
  expiresAtUnix: number,
  nowUnix = Math.floor(Date.now() / 1000)
): boolean {
  return nowUnix >= expiresAtUnix - SESSION_EXPIRY_CLOCK_SKEW_SECONDS;
}

export function isSessionWarningActiveAtUnix(
  expiresAtUnix: number,
  nowUnix = Math.floor(Date.now() / 1000)
): boolean {
  return nowUnix >= expiresAtUnix - SESSION_EXPIRY_CLOCK_SKEW_SECONDS - SESSION_TIMEOUT_REDIRECT_SECONDS;
}

/** Reads session expiry unix seconds from the client-readable cookie set at login. */
export function getSessionExpiresAtUnixFromCookie(): number | null {
  const raw = getCookieValue(AUTH_COOKIES.SESSION_EXPIRES_AT);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function isSessionExpiredByCookie(nowUnix = Math.floor(Date.now() / 1000)): boolean {
  const exp = getSessionExpiresAtUnixFromCookie();
  if (exp === null) return false;
  return isSessionExpiredAtUnix(exp, nowUnix);
}
