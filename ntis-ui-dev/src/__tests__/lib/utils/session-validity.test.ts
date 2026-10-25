import { describe, it, expect } from 'vitest';
import { getSessionValidityFromTokens } from '@/lib/utils/session-validity';

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

describe('getSessionValidityFromTokens', () => {
  const nowUnix = Math.floor(Date.now() / 1000);

  it('returns missing when both tokens are absent', () => {
    expect(getSessionValidityFromTokens(undefined, undefined, undefined, nowUnix)).toBe(
      'missing'
    );
    expect(getSessionValidityFromTokens('', '', undefined, nowUnix)).toBe('missing');
  });

  it('returns expired when only one token is present', () => {
    const access = makeJwt({ exp: nowUnix + 3600 });
    expect(getSessionValidityFromTokens(access, undefined, undefined, nowUnix)).toBe('expired');
    expect(getSessionValidityFromTokens(undefined, access, undefined, nowUnix)).toBe('expired');
  });

  it('returns expired when session_expires_at cookie is past (with skew)', () => {
    const access = makeJwt({ exp: nowUnix + 3600 });
    const refresh = makeJwt({ exp: nowUnix + 7200 });
    const sessionExpiresAt = String(nowUnix - 1);

    expect(getSessionValidityFromTokens(access, refresh, sessionExpiresAt, nowUnix)).toBe(
      'expired'
    );
  });

  it('returns expired when JWT exp is past (with skew)', () => {
    const access = makeJwt({ exp: nowUnix - 60 });
    const refresh = makeJwt({ exp: nowUnix + 7200 });

    expect(getSessionValidityFromTokens(access, refresh, undefined, nowUnix)).toBe('expired');
  });

  it('returns active for valid token pair and future session cookie', () => {
    const access = makeJwt({ exp: nowUnix + 3600 });
    const refresh = makeJwt({ exp: nowUnix + 7200 });
    const sessionExpiresAt = String(nowUnix + 1800);

    expect(getSessionValidityFromTokens(access, refresh, sessionExpiresAt, nowUnix)).toBe(
      'active'
    );
  });

  it('returns active when session cookie is absent but JWTs are valid', () => {
    const access = makeJwt({ exp: nowUnix + 3600 });
    const refresh = makeJwt({ exp: nowUnix + 7200 });

    expect(getSessionValidityFromTokens(access, refresh, undefined, nowUnix)).toBe('active');
  });
});
