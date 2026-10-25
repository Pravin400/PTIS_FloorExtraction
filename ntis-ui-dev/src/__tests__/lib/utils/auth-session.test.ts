import { describe, it, expect } from 'vitest';
import { DEFAULT_SESSION_MAX_AGE_SECONDS } from '@/components/modules/login/constants';
import {
  resolveSessionMaxAgeSeconds,
  resolveSessionExpiresAtUnix,
} from '@/lib/utils/auth-session';

function base64UrlEncodeJson(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncodeJson({ alg: 'none', typ: 'JWT' });
  const body = base64UrlEncodeJson(payload);
  return `${header}.${body}.sig`;
}

describe('resolveSessionMaxAgeSeconds', () => {
  it('prefers access token exp over API expiresAt and refresh', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const access = makeJwt({ exp: nowUnix + 400 });
    const refresh = makeJwt({ exp: nowUnix + 800 });
    const apiExpiry = new Date((nowUnix + 200) * 1000).toISOString();

    const maxAge = resolveSessionMaxAgeSeconds(access, refresh, apiExpiry);
    expect(maxAge).toBeGreaterThanOrEqual(395);
    expect(maxAge).toBeLessThanOrEqual(400);
  });

  it('uses API expiresAt when access has no exp', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const access = makeJwt({ sub: 'user' });
    const refresh = makeJwt({ exp: nowUnix + 900 });
    const apiExpiry = new Date((nowUnix + 300) * 1000).toISOString();

    expect(resolveSessionMaxAgeSeconds(access, refresh, apiExpiry)).toBeGreaterThanOrEqual(299);
    expect(resolveSessionMaxAgeSeconds(access, refresh, apiExpiry)).toBeLessThanOrEqual(301);
  });

  it('falls back to refresh exp then default', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const access = makeJwt({});
    const refresh = makeJwt({ exp: nowUnix + 120 });
    expect(resolveSessionMaxAgeSeconds(access, refresh, null)).toBeGreaterThanOrEqual(119);
    expect(resolveSessionMaxAgeSeconds(access, refresh, null)).toBeLessThanOrEqual(121);

    expect(resolveSessionMaxAgeSeconds(makeJwt({}), makeJwt({}), null)).toBe(
      DEFAULT_SESSION_MAX_AGE_SECONDS
    );
  });

  it('falls back to default when access and refresh lack future exp', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const expired = makeJwt({ exp: nowUnix - 10 });
    expect(resolveSessionMaxAgeSeconds(expired, makeJwt({}), null)).toBe(
      DEFAULT_SESSION_MAX_AGE_SECONDS
    );
  });
});

describe('resolveSessionExpiresAtUnix', () => {
  it('uses the earliest future expiry among access, API, and refresh', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const access = makeJwt({ exp: nowUnix + 500 });
    const refresh = makeJwt({ exp: nowUnix + 900 });
    const apiExpiry = new Date((nowUnix + 200) * 1000).toISOString();

    const expiresAt = resolveSessionExpiresAtUnix(access, refresh, apiExpiry, 3600);
    expect(expiresAt).toBeGreaterThanOrEqual(nowUnix + 199);
    expect(expiresAt).toBeLessThanOrEqual(nowUnix + 201);
  });

  it('falls back to now + maxAge when no future exp is available', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const expiresAt = resolveSessionExpiresAtUnix(
      makeJwt({}),
      makeJwt({}),
      null,
      1800
    );
    expect(expiresAt).toBeGreaterThan(nowUnix);
    expect(expiresAt).toBeLessThanOrEqual(nowUnix + 1800 + 2);
  });
});
