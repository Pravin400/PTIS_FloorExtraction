/**
 * Lightweight JWT expiry helpers (decode payload only; no signature verification).
 * Safe for Edge middleware and server actions.
 */

const CLOCK_SKEW_SECONDS = 30;

function base64UrlDecodeToString(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  // Edge/runtime-safe decode (no Node Buffer — used from middleware)
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Reads `exp` (seconds since epoch) from a JWT access token.
 */
export function getJwtExpiryUnix(token: string): number | null {
  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(base64UrlDecodeToString(parts[1])) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
    return payload.exp;
  } catch {
    return null;
  }
}

/**
 * Returns true when the access token is past its `exp` (with clock skew).
 */
export function isAccessTokenExpired(token: string, nowUnix = Math.floor(Date.now() / 1000)): boolean {
  const exp = getJwtExpiryUnix(token);
  if (exp === null) return false;
  return nowUnix >= exp - CLOCK_SKEW_SECONDS;
}

/**
 * Seconds until JWT expiry; null when `exp` is missing or already past.
 */
export function getSecondsUntilJwtExpiry(token: string, nowUnix = Math.floor(Date.now() / 1000)): number | null {
  const exp = getJwtExpiryUnix(token);
  if (exp === null) return null;
  const remaining = exp - nowUnix;
  return remaining > 0 ? remaining : null;
}

/**
 * Parses API `expiresAt` (ISO string) to remaining cookie lifetime in seconds.
 */
export function getSecondsUntilIsoExpiry(expiresAt: string, nowMs = Date.now()): number | null {
  const ms = Date.parse(expiresAt);
  if (!Number.isFinite(ms)) return null;
  const remaining = Math.floor((ms - nowMs) / 1000);
  return remaining > 0 ? remaining : null;
}

/**
 * True when access token is expired, or refresh token is expired if access has no `exp`.
 */
export function isSessionExpired(
  accessToken: string,
  refreshToken: string,
  nowUnix = Math.floor(Date.now() / 1000)
): boolean {
  const accessExp = getJwtExpiryUnix(accessToken);
  if (accessExp !== null) {
    return nowUnix >= accessExp - CLOCK_SKEW_SECONDS;
  }

  const refreshExp = getJwtExpiryUnix(refreshToken);
  if (refreshExp !== null) {
    return nowUnix >= refreshExp - CLOCK_SKEW_SECONDS;
  }

  return false;
}
