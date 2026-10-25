import { describe, it, expect } from 'vitest';
import {
  buildSessionExpiredLoginPath,
  resolveLocaleFromPathname,
  isNextRedirectError,
} from '@/lib/utils/session-unauthorized';

describe('session-unauthorized', () => {
  it('builds login path with sessionExpired error', () => {
    expect(buildSessionExpiredLoginPath('en')).toBe('/en/login?error=sessionExpired');
  });

  it('resolves locale from pathname', () => {
    expect(resolveLocaleFromPathname('/en/property-tax/ptis')).toBe('en');
    expect(resolveLocaleFromPathname('/property-tax/ptis')).toBe('en');
  });

  it('detects Next.js redirect errors', () => {
    expect(isNextRedirectError({ digest: 'NEXT_REDIRECT;push;/en/login' })).toBe(true);
    expect(isNextRedirectError(new Error('fail'))).toBe(false);
  });
});
