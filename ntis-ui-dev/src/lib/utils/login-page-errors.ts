/**
 * Allowlisted `?error=` / `?message=` values for the login page.
 * Unknown values are ignored (never shown as raw user-controlled text).
 */
const LOGIN_ERROR_QUERY_TO_I18N_SUFFIX: Record<string, string> = {
  sessionExpired: 'sessionExpired',
  session_expired: 'sessionExpired',
  SESSION_EXPIRED: 'sessionExpired',
  sessionTimeout: 'sessionExpired',
  session_timeout: 'sessionExpired',
  SESSION_TIMEOUT: 'sessionExpired',
  expired: 'sessionExpired',
  EXPIRED: 'sessionExpired',
  unauthorized: 'sessionExpired',
  UNAUTHORIZED: 'sessionExpired',
  '401': 'sessionExpired',
  requireVerification: 'sessionExpired',
  inactivityTimeout: 'inactivityTimeout',
  inactivity_timeout: 'inactivityTimeout',
  INACTIVITY_TIMEOUT: 'inactivityTimeout',
  inactivity: 'inactivityTimeout',
  INACTIVITY: 'inactivityTimeout',
  inactiveLogout: 'inactivityTimeout',
  inactive_logout: 'inactivityTimeout',
  inactive_timeout: 'inactivityTimeout',
  invalidToken: 'invalidToken',
  LOGIN_FAILED: 'LOGIN_FAILED',
  INVALID_CREDENTIALS: 'invalidCredentials',
  credentialsRequired: 'credentialsRequired',
  serviceUnavailable: 'serviceUnavailable',
  passwordChangeRequired: 'passwordChangeRequired',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  ACCOUNT_INACTIVE: 'accountInactive',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  RESEND_FAILED: 'RESEND_FAILED',
  RESET_FAILED: 'RESET_FAILED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  twoFactorUpdated: 'twoFactorUpdated',
};

function normalizeQueryCode(raw: string | undefined): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Maps an allowlisted query param to `common.login.errors.{suffix}`.
 * Returns `null` when the code must not be displayed.
 */
export function resolveLoginPageErrorI18nSuffix(
  errorParam: string | undefined,
  messageParam?: string | undefined,
  requireVerificationParam?: string | undefined
): string | null {
  const fromError = normalizeQueryCode(errorParam);
  if (fromError) {
    return LOGIN_ERROR_QUERY_TO_I18N_SUFFIX[fromError] ?? null;
  }

  const fromMessage = normalizeQueryCode(messageParam);
  if (fromMessage) {
    return LOGIN_ERROR_QUERY_TO_I18N_SUFFIX[fromMessage] ?? null;
  }

  const fromReqVerification = normalizeQueryCode(requireVerificationParam);
  if (fromReqVerification === '1' || fromReqVerification === 'true') {
    return 'sessionExpired';
  }

  return null;
}
