import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSessionExpiredByCookie } from '@/lib/utils/session-expiry-client';
import * as cookieUtils from '@/lib/utils/cookie';

describe('isSessionExpiredByCookie', () => {
  beforeEach(() => {
    vi.spyOn(cookieUtils, 'getCookieValue').mockReturnValue(String(Math.floor(Date.now() / 1000) + 60));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false before expiry minus clock skew', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    expect(isSessionExpiredByCookie(nowUnix)).toBe(false);
  });

  it('returns true within 30s clock-skew window of expiry', () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    vi.spyOn(cookieUtils, 'getCookieValue').mockReturnValue(String(nowUnix + 20));
    expect(isSessionExpiredByCookie(nowUnix)).toBe(true);
  });
});
