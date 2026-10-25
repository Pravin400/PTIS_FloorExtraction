import { describe, it, expect } from 'vitest';
import {
  getJwtExpiryUnix,
  getSecondsUntilJwtExpiry,
  getSecondsUntilIsoExpiry,
  isAccessTokenExpired,
  isSessionExpired,
} from '@/lib/utils/jwt-expiry';

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

describe('jwt-expiry', () => {
  it('reads exp from a valid JWT payload', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const token = makeJwt({ exp: nowUnix + 3600 });
    expect(getJwtExpiryUnix(token)).toBe(nowUnix + 3600);
  });

  it('returns null for malformed tokens and missing exp', () => {
    expect(getJwtExpiryUnix('not-a-jwt')).toBeNull();
    expect(getJwtExpiryUnix(makeJwt({ sub: 'user' }))).toBeNull();
    expect(getJwtExpiryUnix(makeJwt({ exp: 'bad' }))).toBeNull();
  });

  it('decodes base64url payloads with utf-8 content', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const token = makeJwt({ exp: nowUnix + 60, name: 'नगर' });
    expect(getJwtExpiryUnix(token)).toBe(nowUnix + 60);
  });

  it('getSecondsUntilJwtExpiry respects clock skew and expired tokens', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const valid = makeJwt({ exp: nowUnix + 100 });
    expect(getSecondsUntilJwtExpiry(valid, nowUnix)).toBe(100);

    const expired = makeJwt({ exp: nowUnix - 1 });
    expect(getSecondsUntilJwtExpiry(expired, nowUnix)).toBeNull();

    const withinSkew = makeJwt({ exp: nowUnix + 60 });
    expect(isAccessTokenExpired(withinSkew, nowUnix)).toBe(false);
    expect(isAccessTokenExpired(withinSkew, nowUnix + 31)).toBe(true);
  });

  it('getSecondsUntilIsoExpiry parses ISO expiresAt', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const nowMs = nowUnix * 1000;
    const future = new Date(nowMs + 120_000).toISOString();
    expect(getSecondsUntilIsoExpiry(future, nowMs)).toBe(120);

    const past = new Date(nowMs - 10_000).toISOString();
    expect(getSecondsUntilIsoExpiry(past, nowMs)).toBeNull();
    expect(getSecondsUntilIsoExpiry('not-a-date', nowMs)).toBeNull();
  });

  it('isSessionExpired prefers access exp then refresh exp', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const access = makeJwt({ exp: nowUnix + 500 });
    const refresh = makeJwt({ exp: nowUnix + 900 });
    expect(isSessionExpired(access, refresh, nowUnix)).toBe(false);

    const expiredAccess = makeJwt({ exp: nowUnix - 60 });
    expect(isSessionExpired(expiredAccess, refresh, nowUnix)).toBe(true);

    const accessNoExp = makeJwt({ sub: 'x' });
    const expiredRefresh = makeJwt({ exp: nowUnix - 1 });
    expect(isSessionExpired(accessNoExp, expiredRefresh, nowUnix)).toBe(true);

    expect(isSessionExpired(makeJwt({}), makeJwt({}), nowUnix)).toBe(false);
  });
});
