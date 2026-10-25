import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  AUTH_COOKIES,
  LOGOUT_CLEAR_COOKIES,
  SECURE_COOKIE_OPTIONS,
  CLIENT_COOKIE_OPTIONS,
  SESSION_EXPIRED_LOGIN_ERROR,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
} from '@/components/modules/login/constants';
import type { AuthLoginApiBody } from '@/types/login.types';
import {
  getJwtExpiryUnix,
  getSecondsUntilIsoExpiry,
  getSecondsUntilJwtExpiry,
} from '@/lib/utils/jwt-expiry';

/** Fallback pending-challenge cookie lifetime (seconds) if the API omits `challengeExpiresAt`. */
const DEFAULT_PENDING_TWO_FACTOR_MAX_AGE_SECONDS = 5 * 60;

/** Payload stashed server-side between the password step and the 2FA verify step. */
export interface PendingTwoFactorAuth {
  challengeId: string;
  /** Username, for display only ("Signed in as ...") — never used for authorization. */
  username: string;
  /** Which verify endpoint/UI applies: authenticator-app TOTP or emailed/texted OTP. */
  method: 'totp' | 'otp';
}

/** Fallback pending-challenge cookie lifetime (seconds) if the API omits `challengeExpiresAt`. */
const DEFAULT_PENDING_FORGOT_PASSWORD_MAX_AGE_SECONDS = 5 * 60;

/** Fallback reset-token cookie lifetime (seconds) if the API omits `resetTokenExpiresAt`. */
const DEFAULT_PENDING_PASSWORD_RESET_MAX_AGE_SECONDS = 10 * 60;

/** Payload stashed server-side between the forgot-password OTP request and verify steps. */
export interface PendingForgotPasswordChallenge {
  challengeId: string;
  /** Whatever the user typed in (username or email), for display only. */
  usernameOrEmail: string;
  /** Which delivery method this challenge used — drives the verify screen's instruction copy. */
  method: 'Email' | 'Sms' | 'Authenticator';
}

/** Payload stashed server-side between OTP verification and the actual password reset. */
export interface PendingPasswordReset {
  resetToken: string;
}
import { getUserIdFromCookies, type CookieStoreLike } from './cookie';

export { getUserIdFromCookies };
export type { CookieStoreLike };
export type { SessionValidity, AuthSessionTokens } from './auth-session-types';

/**
 * Cookie lifetime aligned with the backend session (JWT `exp` or API `expiresAt`).
 */
export function resolveSessionMaxAgeSeconds(
  accessToken: string,
  refreshToken: string,
  expiresAt?: string | null
): number {
  const accessRemaining = getSecondsUntilJwtExpiry(accessToken);
  if (accessRemaining !== null) return Math.max(1, accessRemaining);

  if (expiresAt) {
    const apiRemaining = getSecondsUntilIsoExpiry(expiresAt);
    if (apiRemaining !== null) return Math.max(1, apiRemaining);
  }

  const refreshRemaining = getSecondsUntilJwtExpiry(refreshToken);
  if (refreshRemaining !== null) return Math.max(1, refreshRemaining);

  return DEFAULT_SESSION_MAX_AGE_SECONDS;
}

export function buildSecureCookieOptions(maxAgeSeconds: number) {
  return { ...SECURE_COOKIE_OPTIONS, maxAge: Math.max(1, maxAgeSeconds) };
}

export function buildClientCookieOptions(maxAgeSeconds: number) {
  return { ...CLIENT_COOKIE_OPTIONS, maxAge: Math.max(1, maxAgeSeconds) };
}

/**
 * Unix timestamp (seconds) when the session ends — must be in the future at login time.
 */
export function resolveSessionExpiresAtUnix(
  accessToken: string,
  refreshToken: string,
  expiresAt: string | null | undefined,
  maxAgeSeconds: number
): number {
  const nowUnix = Math.floor(Date.now() / 1000);
  const futureExps: number[] = [];

  const accessExp = getJwtExpiryUnix(accessToken);
  if (accessExp !== null && accessExp > nowUnix) futureExps.push(accessExp);

  if (expiresAt) {
    const apiRemaining = getSecondsUntilIsoExpiry(expiresAt);
    if (apiRemaining !== null) {
      futureExps.push(nowUnix + apiRemaining);
    }
  }

  const refreshExp = getJwtExpiryUnix(refreshToken);
  if (refreshExp !== null && refreshExp > nowUnix) futureExps.push(refreshExp);

  if (futureExps.length > 0) return Math.min(...futureExps);

  return nowUnix + Math.max(1, maxAgeSeconds);
}

/**
 * Clears all auth/session cookies from a Next.js cookie store (logout / expiry).
 */
export async function clearAuthSessionCookies(
  cookieStore?: Awaited<ReturnType<typeof cookies>>
): Promise<void> {
  const store = cookieStore ?? (await cookies());
  for (const name of LOGOUT_CLEAR_COOKIES) {
    store.delete({ name, path: '/' });
  }
}

/**
 * Persists tokens and profile cookies after successful login.
 * @returns Session maxAge in seconds (for ULB branding cookies).
 */
export async function persistAuthSessionCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  auth: AuthLoginApiBody,
  sessionId: string,
  displayName: string
): Promise<number> {
  const accessToken = (auth.token ?? '').trim();
  const refreshToken = (auth.refreshToken ?? '').trim();
  const maxAge = resolveSessionMaxAgeSeconds(accessToken, refreshToken, auth.expiresAt ?? null);
  const expiresAtUnix = resolveSessionExpiresAtUnix(
    accessToken,
    refreshToken,
    auth.expiresAt ?? null,
    maxAge
  );
  const nowUnix = Math.floor(Date.now() / 1000);
  const cookieMaxAge = Math.max(1, expiresAtUnix - nowUnix);
  const secure = buildSecureCookieOptions(cookieMaxAge);
  const client = buildClientCookieOptions(cookieMaxAge);

  cookieStore.set(AUTH_COOKIES.AUTH_TOKEN, accessToken, secure);
  cookieStore.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, secure);
  cookieStore.set(AUTH_COOKIES.SESSION_ID, sessionId, secure);
  cookieStore.set(AUTH_COOKIES.IS_LOGGED_IN, 'true', client);
  cookieStore.set(AUTH_COOKIES.USER_NAME, displayName, client);
  if (auth.username) {
    cookieStore.set(AUTH_COOKIES.LOGIN_USERNAME, auth.username, client);
  }
  cookieStore.set(AUTH_COOKIES.SESSION_EXPIRES_AT, String(expiresAtUnix), client);

  if (auth.requiresTwoFactorSetup) {
    cookieStore.set(AUTH_COOKIES.REQUIRES_TWO_FACTOR_SETUP, 'true', client);
  } else {
    cookieStore.delete(AUTH_COOKIES.REQUIRES_TWO_FACTOR_SETUP);
  }

  const uid = auth.userId;
  if (typeof uid === 'number' && Number.isFinite(uid) && uid > 0) {
    cookieStore.set(AUTH_COOKIES.USER_ID, String(uid), secure);
  }

  cookieStore.delete(AUTH_COOKIES.PENDING_AUTH);
  return cookieMaxAge;
}

/**
 * Stashes the pending MFA challenge (httpOnly, short-lived) after a password check that
 * returned `requiresTwoFactor`, so the verify-2FA step can complete the login without the
 * challenge id ever touching client JS.
 */
export async function persistPendingTwoFactorCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  challengeId: string,
  username: string,
  challengeExpiresAt?: string | null,
  method: 'totp' | 'otp' = 'totp'
): Promise<void> {
  const maxAgeSeconds =
    (challengeExpiresAt ? getSecondsUntilIsoExpiry(challengeExpiresAt) : null) ??
    DEFAULT_PENDING_TWO_FACTOR_MAX_AGE_SECONDS;

  const payload: PendingTwoFactorAuth = { challengeId, username, method };
  cookieStore.set(
    AUTH_COOKIES.PENDING_AUTH,
    JSON.stringify(payload),
    buildSecureCookieOptions(maxAgeSeconds)
  );
}

/**
 * Reads back the pending MFA challenge stashed by {@link persistPendingTwoFactorCookie}.
 * Returns null if absent, cleared, or malformed (e.g. the challenge has since expired and the
 * cookie was evicted by the browser).
 */
export async function readPendingTwoFactorCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<PendingTwoFactorAuth | null> {
  const raw = cookieStore.get(AUTH_COOKIES.PENDING_AUTH)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingTwoFactorAuth>;
    if (typeof parsed.challengeId === 'string' && parsed.challengeId.length > 0) {
      return {
        challengeId: parsed.challengeId,
        username: parsed.username ?? '',
        method: parsed.method === 'otp' ? 'otp' : 'totp',
      };
    }
  } catch {
    // Malformed cookie — treat as absent.
  }
  return null;
}

export async function clearPendingTwoFactorCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<void> {
  cookieStore.delete(AUTH_COOKIES.PENDING_AUTH);
}

/**
 * Stashes the pending forgot-password OTP challenge (httpOnly, short-lived) after
 * `/Auth/forgot-password` returns a `challengeId`, so the verify-otp step can complete without
 * the challenge id ever touching client JS.
 */
export async function persistPendingForgotPasswordCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  challengeId: string,
  usernameOrEmail: string,
  method: 'Email' | 'Sms' | 'Authenticator',
  challengeExpiresAt?: string | null
): Promise<void> {
  const maxAgeSeconds =
    (challengeExpiresAt ? getSecondsUntilIsoExpiry(challengeExpiresAt) : null) ??
    DEFAULT_PENDING_FORGOT_PASSWORD_MAX_AGE_SECONDS;

  const payload: PendingForgotPasswordChallenge = { challengeId, usernameOrEmail, method };
  cookieStore.set(
    AUTH_COOKIES.PENDING_FORGOT_PASSWORD,
    JSON.stringify(payload),
    buildSecureCookieOptions(maxAgeSeconds)
  );
}

/** Reads back the pending forgot-password challenge stashed by {@link persistPendingForgotPasswordCookie}. */
export async function readPendingForgotPasswordCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<PendingForgotPasswordChallenge | null> {
  const raw = cookieStore.get(AUTH_COOKIES.PENDING_FORGOT_PASSWORD)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingForgotPasswordChallenge>;
    if (typeof parsed.challengeId === 'string' && parsed.challengeId.length > 0) {
      return {
        challengeId: parsed.challengeId,
        usernameOrEmail: parsed.usernameOrEmail ?? '',
        method: parsed.method === 'Sms' || parsed.method === 'Authenticator' ? parsed.method : 'Email',
      };
    }
  } catch {
    // Malformed cookie — treat as absent.
  }
  return null;
}

export async function clearPendingForgotPasswordCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<void> {
  cookieStore.delete(AUTH_COOKIES.PENDING_FORGOT_PASSWORD);
}

/**
 * Stashes the short-lived password-reset bearer token (httpOnly) obtained after a successful
 * forgot-password OTP verification, so the final reset step can complete without the token ever
 * touching client JS.
 */
export async function persistPendingPasswordResetCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  resetToken: string,
  resetTokenExpiresAt?: string | null
): Promise<void> {
  const maxAgeSeconds =
    (resetTokenExpiresAt ? getSecondsUntilIsoExpiry(resetTokenExpiresAt) : null) ??
    DEFAULT_PENDING_PASSWORD_RESET_MAX_AGE_SECONDS;

  const payload: PendingPasswordReset = { resetToken };
  cookieStore.set(
    AUTH_COOKIES.PENDING_PASSWORD_RESET,
    JSON.stringify(payload),
    buildSecureCookieOptions(maxAgeSeconds)
  );
}

/** Reads back the pending reset token stashed by {@link persistPendingPasswordResetCookie}. */
export async function readPendingPasswordResetCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<PendingPasswordReset | null> {
  const raw = cookieStore.get(AUTH_COOKIES.PENDING_PASSWORD_RESET)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingPasswordReset>;
    if (typeof parsed.resetToken === 'string' && parsed.resetToken.length > 0) {
      return { resetToken: parsed.resetToken };
    }
  } catch {
    // Malformed cookie — treat as absent.
  }
  return null;
}

export async function clearPendingPasswordResetCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<void> {
  cookieStore.delete(AUTH_COOKIES.PENDING_PASSWORD_RESET);
}

/**
 * Server actions: clear session and redirect to login with session-expired messaging.
 */
export async function redirectToLoginSessionExpired(locale: string): Promise<never> {
  await clearAuthSessionCookies();
  redirect(`/${locale}/login?error=${SESSION_EXPIRED_LOGIN_ERROR}`);
}
