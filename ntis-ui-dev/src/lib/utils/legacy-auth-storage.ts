/**
 * Legacy client-side auth keys (pre–httpOnly cookie session).
 * Cleared on logout and when visiting login so tokens are never kept in localStorage.
 */
export const LEGACY_AUTH_STORAGE_KEYS = [
  'ntis_user',
  'employee_data',
  'ntis_employee_code',
  'ntis_user_id',
  'ntis_session_start',
  'ntis_session_id',
  'ntis_user_ip',
  'jwt',
  'ntis_last_activity',
] as const;

const CLIENT_AUTH_COOKIES = [
  'is_logged_in',
  'user_name',
  'login_username',
  'session_expires_at',
  'requires_two_factor_setup',
  'department_id',
  'department_name',
  'module_id',
  'module_name',
] as const;

/** Clears non-httpOnly auth & context cookies from document.cookie */
export function clearClientAuthCookies(): void {
  if (typeof document === 'undefined') return;
  try {
    for (const name of CLIENT_AUTH_COOKIES) {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  } catch {
    // Ignore error
  }
}

/** Removes legacy auth data from localStorage and tab sessionStorage (browser only). */
export function clearLegacyAuthClientStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_AUTH_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    window.sessionStorage.removeItem('is_tab_active_session');
  } catch {
    // Private mode / blocked storage
  }
}

/** Removes all auth data including localStorage, sessionStorage, and client cookies. */
export function clearAllAuthClientStorage(): void {
  clearLegacyAuthClientStorage();
  clearClientAuthCookies();
}

