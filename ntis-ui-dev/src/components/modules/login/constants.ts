/**
 * Login Module Constants
 *
 * Centralized configuration for the login module following the pattern
 * from construction-type-master/constants.ts.
 *
 * @module login/constants
 */

// ---------------------------------------------------------------------------
// Field Length Constraints
// ---------------------------------------------------------------------------

/** Authentication field constraints */
export const AUTH_CONSTRAINTS = {
  /** Minimum username length */
  USERNAME_MIN_LENGTH: 3,
  /** Maximum username length */
  USERNAME_MAX_LENGTH: 50,
  /** Minimum password length (display only - backend validates actual policy) */
  PASSWORD_MIN_LENGTH: 6,
  /** Maximum password length */
  PASSWORD_MAX_LENGTH: 25,
} as const;

// ---------------------------------------------------------------------------
// Validation Patterns
// ---------------------------------------------------------------------------

/**
 * Username validation regex.
 * Allows: letters, numbers, @, ., _, -
 * Common patterns: email addresses, usernames with dots/underscores
 */
export const USERNAME_REGEX = /^[A-Za-z0-9@._-]+$/;

/**
 * Username sanitization regex.
 * Removes any characters not allowed in usernames.
 */
export const USERNAME_SANITIZE = /[^A-Za-z0-9@._-]/g;

/**
 * Password sanitization regex.
 * Removes zero-width characters and control characters.
 * Preserves all printable characters including special symbols.
 */
export const PASSWORD_SANITIZE = /[\u200B-\u200D\uFEFF\u0000-\u001F]/g;

// ---------------------------------------------------------------------------
// Cookie Names (Centralized)
// ---------------------------------------------------------------------------

/**
 * Authentication-related cookie names.
 * Centralizing these prevents typos and makes refactoring easier.
 */
export const AUTH_COOKIES = {
  /** JWT access token */
  AUTH_TOKEN: 'auth_token',
  /** JWT refresh token */
  REFRESH_TOKEN: 'refresh_token',
  /** Session identifier */
  SESSION_ID: 'session_id',
  /** Client-readable login status flag */
  IS_LOGGED_IN: 'is_logged_in',
  /** User display name (client-readable) */
  USER_NAME: 'user_name',
  /** User ID */
  USER_ID: 'user_id',
  /** User login username */
  LOGIN_USERNAME: 'login_username',
  /** Pending auth state (for multi-step flows) */
  PENDING_AUTH: 'pending_auth',
  /** Unix expiry (seconds) for client session timeout UI — not a secret */
  SESSION_EXPIRES_AT: 'session_expires_at',
  /** Client-readable flag: an admin requires this account to set up 2FA (not yet enrolled) */
  REQUIRES_TWO_FACTOR_SETUP: 'requires_2fa_setup',
  /** Pending forgot-password OTP challenge (step 1 -> step 2 of the reset flow) */
  PENDING_FORGOT_PASSWORD: 'forgot_flow',
  /** Short-lived reset token authorizing the actual password change (step 2 -> step 3) */
  PENDING_PASSWORD_RESET: 'forgot_reset_otp',
} as const;

/** Seconds to show session-timeout message before redirecting to login. */
export const SESSION_TIMEOUT_REDIRECT_SECONDS = 60;

/** Inactivity timeout duration (seconds) before auto logging out (10 minutes). */
export const INACTIVITY_TIMEOUT_SECONDS = 10 * 60;

/**
 * ULB (Urban Local Body) branding cookie names.
 * Client-readable for UI display.
 */
export const ULB_COOKIES = {
  /** Council name in English */
  ULB_NAME: 'ulb_name',
  /** Council name in local language */
  ULB_NAME_LOCAL: 'ulb_name_local',
  /** Council logo URL */
  ULB_LOGO: 'ulb_logo',
  /** Council code */
  ULB_CODE: 'ulb_code',
} as const;

/**
 * Department & Module context cookie names.
 * Set when the user clicks a department card on the home screen
 * so downstream pages know the active department/module.
 */
export const DEPARTMENT_COOKIES = {
  /** Currently selected department ID */
  DEPARTMENT_ID: 'department_id',
  /** Currently selected department name */
  DEPARTMENT_NAME: 'department_name',
  /** Currently selected module ID */
  MODULE_ID: 'module_id',
  /** Currently selected module name */
  MODULE_NAME: 'module_name',
} as const;

/**
 * All cookies that should be cleared on logout.
 */
/** Query param value for login page (`?error=sessionExpired`) after automatic session expiry. */
export const SESSION_EXPIRED_LOGIN_ERROR = 'sessionExpired';

/**
 * Session token cookies that should be cleared when redirecting to login on session expiry or unauthorized access.
 * Does NOT include transient in-flight flow cookies (PENDING_AUTH, PENDING_FORGOT_PASSWORD, PENDING_PASSWORD_RESET).
 */
export const SESSION_TOKEN_COOKIES = [
  AUTH_COOKIES.AUTH_TOKEN,
  AUTH_COOKIES.REFRESH_TOKEN,
  AUTH_COOKIES.SESSION_ID,
  AUTH_COOKIES.IS_LOGGED_IN,
  AUTH_COOKIES.USER_NAME,
  AUTH_COOKIES.USER_ID,
  AUTH_COOKIES.LOGIN_USERNAME,
  AUTH_COOKIES.SESSION_EXPIRES_AT,
  AUTH_COOKIES.REQUIRES_TWO_FACTOR_SETUP,
] as const;

export const LOGOUT_CLEAR_COOKIES = [
  AUTH_COOKIES.AUTH_TOKEN,
  AUTH_COOKIES.REFRESH_TOKEN,
  AUTH_COOKIES.SESSION_ID,
  AUTH_COOKIES.PENDING_AUTH,
  AUTH_COOKIES.IS_LOGGED_IN,
  AUTH_COOKIES.USER_NAME,
  AUTH_COOKIES.USER_ID,
  AUTH_COOKIES.LOGIN_USERNAME,
  AUTH_COOKIES.SESSION_EXPIRES_AT,
  AUTH_COOKIES.REQUIRES_TWO_FACTOR_SETUP,
  AUTH_COOKIES.PENDING_FORGOT_PASSWORD,
  AUTH_COOKIES.PENDING_PASSWORD_RESET,
  ULB_COOKIES.ULB_NAME,
  ULB_COOKIES.ULB_NAME_LOCAL,
  ULB_COOKIES.ULB_LOGO,
  ULB_COOKIES.ULB_CODE,
  DEPARTMENT_COOKIES.DEPARTMENT_ID,
  DEPARTMENT_COOKIES.DEPARTMENT_NAME,
  DEPARTMENT_COOKIES.MODULE_ID,
  DEPARTMENT_COOKIES.MODULE_NAME,
] as const;

// ---------------------------------------------------------------------------
// Cookie Configuration
// ---------------------------------------------------------------------------

/**
 * Fallback session length (seconds) only when JWT/API expiry is absent.
 * Override with `NTIS_SESSION_MAX_AGE_SECONDS` in the environment.
 */
const parsedSessionMaxAge = Number.parseInt(process.env.NTIS_SESSION_MAX_AGE_SECONDS ?? '', 10);
export const DEFAULT_SESSION_MAX_AGE_SECONDS =
  Number.isFinite(parsedSessionMaxAge) && parsedSessionMaxAge > 0 ? parsedSessionMaxAge : 60 * 60; // 1 hour

/**
 * Base options for secure HTTP-only cookies (maxAge set per login from token expiry).
 */
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
} as const;

/**
 * Base options for client-readable cookies (maxAge set per login from token expiry).
 */
export const CLIENT_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
} as const;

// ---------------------------------------------------------------------------
// Error Code Constants
// ---------------------------------------------------------------------------

/**
 * Standard error codes used across the login module.
 * These map to translation keys in the i18n files.
 */
export const AUTH_ERROR_CODES = {
  // Credential errors
  CREDENTIALS_REQUIRED: 'CREDENTIALS_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USERNAME_REQUIRED: 'USERNAME_REQUIRED',
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  USERNAME_TOO_SHORT: 'USERNAME_TOO_SHORT',
  USERNAME_TOO_LONG: 'USERNAME_TOO_LONG',
  PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',

  // Account status errors
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  PASSWORD_CHANGE_REQUIRED: 'PASSWORD_CHANGE_REQUIRED',

  // Rate limiting
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',

  // Service errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // Verification errors (for OTP/2FA flows)
  INVALID_OTP_FORMAT: 'INVALID_OTP_FORMAT',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  RESEND_FAILED: 'RESEND_FAILED',
  RESET_FAILED: 'RESET_FAILED',

  // Change password errors
  CURRENT_PASSWORD_REQUIRED: 'CURRENT_PASSWORD_REQUIRED',
  NEW_PASSWORD_REQUIRED: 'NEW_PASSWORD_REQUIRED',
  PASSWORDS_REQUIRED: 'PASSWORDS_REQUIRED',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORD_DIFFERENT_REQUIRED: 'PASSWORD_DIFFERENT_REQUIRED',
  PASSWORDS_MISMATCH: 'PASSWORDS_MISMATCH',
  CHANGE_PASSWORD_FAILED: 'CHANGE_PASSWORD_FAILED',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

// ---------------------------------------------------------------------------
// UI Constants
// ---------------------------------------------------------------------------

/**
 * CSS class for primary login submit button.
 * Consistent styling across login forms.
 */
export const LOGIN_PRIMARY_SUBMIT_CLASS =
  'w-full max-w-[280px] bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 text-lg rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300';

/** Text input (username) shared styles */
export const LOGIN_FIELD_INPUT_CLASS =
  'rounded-xl border-gray-200 bg-gray-50/50 py-2.5 pl-10 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20';

/** Password field adds right padding for visibility toggle */
export const LOGIN_PASSWORD_INPUT_CLASS = `${LOGIN_FIELD_INPUT_CLASS} pr-11`;

/**
 * Lucide icon position classes for login fields (user / lock).
 */
export const LOGIN_FIELD_ICON_CLASS =
  'pointer-events-none absolute left-3 top-[22px] z-10 -translate-y-1/2';

export const LOGIN_USERNAME_ICON_ACCENT = 'text-cyan-600/80';
export const LOGIN_PASSWORD_ICON_ACCENT = 'text-amber-600/80';

/**
 * When the server returns {@link AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS} without a
 * `Retry-After` value, show this countdown (seconds) for user feedback.
 */
export const RATE_LIMIT_COUNTDOWN_INITIAL_SECONDS = 60;

/**
 * Debounce delay for form validation (ms).
 */
export const VALIDATION_DEBOUNCE_MS = 300;
