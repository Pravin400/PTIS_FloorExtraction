import { describe, it, expect } from 'vitest';
import { resolveLoginPageErrorI18nSuffix } from '@/lib/utils/login-page-errors';

describe('resolveLoginPageErrorI18nSuffix', () => {
  it('maps allowlisted error codes and aliases for session expiry', () => {
    expect(resolveLoginPageErrorI18nSuffix('sessionExpired')).toBe('sessionExpired');
    expect(resolveLoginPageErrorI18nSuffix('session_expired')).toBe('sessionExpired');
    expect(resolveLoginPageErrorI18nSuffix('SESSION_EXPIRED')).toBe('sessionExpired');
    expect(resolveLoginPageErrorI18nSuffix('sessionTimeout')).toBe('sessionExpired');
    expect(resolveLoginPageErrorI18nSuffix('unauthorized')).toBe('sessionExpired');
    expect(resolveLoginPageErrorI18nSuffix('401')).toBe('sessionExpired');
    expect(resolveLoginPageErrorI18nSuffix('invalidToken')).toBe('invalidToken');
  });

  it('maps inactivity timeout error codes and aliases', () => {
    expect(resolveLoginPageErrorI18nSuffix('inactivityTimeout')).toBe('inactivityTimeout');
    expect(resolveLoginPageErrorI18nSuffix('inactivity_timeout')).toBe('inactivityTimeout');
    expect(resolveLoginPageErrorI18nSuffix('INACTIVITY_TIMEOUT')).toBe('inactivityTimeout');
    expect(resolveLoginPageErrorI18nSuffix('inactivity')).toBe('inactivityTimeout');
    expect(resolveLoginPageErrorI18nSuffix('inactiveLogout')).toBe('inactivityTimeout');
  });

  it('handles requireVerification parameter fallback', () => {
    expect(resolveLoginPageErrorI18nSuffix(undefined, undefined, '1')).toBe('sessionExpired');
    expect(resolveLoginPageErrorI18nSuffix(undefined, undefined, 'true')).toBe('sessionExpired');
  });

  it('ignores arbitrary message text', () => {
    expect(resolveLoginPageErrorI18nSuffix(undefined, 'You have been hacked')).toBeNull();
    expect(resolveLoginPageErrorI18nSuffix(undefined, '<script>alert(1)</script>')).toBeNull();
  });

  it('prefers error over message when both present', () => {
    expect(resolveLoginPageErrorI18nSuffix('sessionExpired', 'LOGIN_FAILED')).toBe('sessionExpired');
  });

  it('allows allowlisted message when error is absent', () => {
    expect(resolveLoginPageErrorI18nSuffix(undefined, 'sessionExpired')).toBe('sessionExpired');
  });
});
