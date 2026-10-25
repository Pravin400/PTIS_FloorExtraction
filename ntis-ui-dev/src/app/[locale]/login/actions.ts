'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { authService } from '@/lib/api/auth.service';
import { locales, defaultLocale } from '@/i18n/config';
import type { AuthLoginApiBody } from '@/types/login.types';
import type { UlbMaster } from '@/types/master.types';
import { getUlbConfigForLogin } from '@/lib/api/ulb-config.service';

// Import centralized constants and validation utilities
import {
  AUTH_COOKIES,
  ULB_COOKIES,
  AUTH_ERROR_CODES,
} from '@/components/modules/login/constants';
import {
  validateCredentials as validateCredentialsInput,
  mapAuthErrorToCode,
  mapValidationErrorToCode,
  AuthValidationError,
} from '@/lib/api/auth-validation';
import {
  isAuthLoginResponseShape,
  normalizeAuthLoginResponse,
  hasValidSessionTokens,
  hasPendingTwoFactorChallenge,
  extractUserDisplayName,
} from '@/lib/api/auth-types-guard';
import {
  clearAuthSessionCookies,
  persistAuthSessionCookies,
  persistPendingTwoFactorCookie,
  readPendingTwoFactorCookie,
  clearPendingTwoFactorCookie,
  buildClientCookieOptions,
} from '@/lib/utils/auth-session';
import type { VerifyTwoFactorRequest, VerifyLoginOtpRequest } from '@/types/login.types';

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Validates and normalizes locale string.
 * @param raw - Raw locale from form data
 * @returns Valid locale string
 */
function sanitizeLocale(raw: string): string {
  return (locales as readonly string[]).includes(raw) ? raw : defaultLocale;
}

/**
 * Detects Next.js redirect errors to allow them to propagate.
 * @param e - Caught error
 * @returns True if this is a Next.js redirect
 */
function isRedirectError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'digest' in e &&
    typeof (e as { digest?: unknown }).digest === 'string' &&
    String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

// ---------------------------------------------------------------------------
// Cookie Management
// ---------------------------------------------------------------------------

/**
 * Fetches ULB config and applies branding cookies.
 * @param cookieStore - Next.js cookie store
 */
async function applyUlbCookiesFromApi(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  sessionMaxAgeSeconds: number
): Promise<void> {
  const ulbRes = await authService.getUlbConfig();
  if (!ulbRes.success || !ulbRes.data) return;

  const ulb = ulbRes.data;
  const logo = (ulb.ulbLogo ?? '').trim();
  const clientOpts = buildClientCookieOptions(sessionMaxAgeSeconds);

  cookieStore.set(ULB_COOKIES.ULB_NAME, ulb.ulbName || '', clientOpts);
  cookieStore.set(ULB_COOKIES.ULB_NAME_LOCAL, (ulb.ulbNameLocal ?? '').trim(), clientOpts);
  cookieStore.set(ULB_COOKIES.ULB_LOGO, logo, clientOpts);
  cookieStore.set(ULB_COOKIES.ULB_CODE, ulb.ulbCode || '', clientOpts);
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

/**
 * Persists auth + ULB cookies and redirects to dashboard after successful `/Auth/login`.
 * Uses centralized cookie names and validated auth data.
 *
 * @param locale - User's locale for redirect
 * @param auth - Normalized auth response
 * @param sessionId - Generated session ID
 * @param formUsername - Username from form (fallback for display name)
 */
async function completeLoginSession(
  locale: string,
  auth: AuthLoginApiBody,
  sessionId: string,
  formUsername: string
): Promise<never> {
  const cookieStore = await cookies();
  const displayName = extractUserDisplayName(auth, formUsername);

  const sessionMaxAgeSeconds = await persistAuthSessionCookies(
    cookieStore,
    auth,
    sessionId,
    displayName
  );

  // Apply ULB branding cookies (non-blocking)
  try {
    await applyUlbCookiesFromApi(cookieStore, sessionMaxAgeSeconds);
  } catch {
    // ULB branding is optional, don't fail login
  }

  if (auth.requiresTwoFactorSetup) {
    redirect(`/${locale}/account/security?required=1`);
  }

  redirect(`/${locale}/home?loginSuccess=1`);
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Validates user credentials and establishes a session on success.
 * Uses server-side validation utilities for input sanitization and
 * type guards for API response validation.
 *
 * @param formData - Form data containing username, password, and locale
 * @returns Result object with success status and error details if failed
 */
export async function validateCredentialsAction(formData: FormData) {
  const usernameEntry = formData.get('username');
  const passwordEntry = formData.get('password');
  const localeEntry = formData.get('locale');
  const locale = sanitizeLocale(typeof localeEntry === 'string' ? localeEntry : 'en');

  // ---------------------------------------------------------------------------
  // Step 1: Validate and sanitize input using validation utilities
  // ---------------------------------------------------------------------------
  let validatedUsername: string;
  let validatedPassword: string;

  try {
    const validated = validateCredentialsInput(usernameEntry, passwordEntry);
    validatedUsername = validated.username;
    validatedPassword = validated.password;
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return {
        success: false as const,
        errorCode: mapValidationErrorToCode(error),
        statusCode: 400,
      };
    }
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.CREDENTIALS_REQUIRED,
      statusCode: 400,
    };
  }

  // Generate session ID for this login attempt
  const sessionId = crypto.randomUUID();

  // ---------------------------------------------------------------------------
  // Step 2: Call authentication API
  // ---------------------------------------------------------------------------
  let response;
  try {
    response = await authService.validateCredentials({
      username: validatedUsername,
      password: validatedPassword,
    });
  } catch (error) {
    // Network or service error
    const message = error instanceof Error ? error.message : undefined;
    return {
      success: false as const,
      errorCode: mapAuthErrorToCode(503, message),
      statusCode: 503,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 3: Validate API response structure
  // ---------------------------------------------------------------------------
  if (!response?.success || !response.data) {
    const rawRemaining = response?.data?.remainingLoginAttempts;
    return {
      success: false as const,
      errorCode: mapAuthErrorToCode(response?.statusCode, response?.error),
      statusCode: response?.statusCode ?? 500,
      message: response?.error,
      remainingLoginAttempts: typeof rawRemaining === 'number' ? rawRemaining : undefined,
    };
  }

  // Validate response shape using type guard
  if (!isAuthLoginResponseShape(response.data)) {
    const t = await getTranslations({ locale, namespace: 'common' });
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
      statusCode: 500,
      message: t('login.errors.invalidResponseFormat'),
    };
  }

  // Normalize the auth response for consistent field access
  const normalizedAuth = normalizeAuthLoginResponse(response.data as Record<string, unknown>);

  // ---------------------------------------------------------------------------
  // Step 4: Check authentication result
  // ---------------------------------------------------------------------------
  if (!normalizedAuth.success) {
    return {
      success: false as const,
      errorCode: mapAuthErrorToCode(401, normalizedAuth.message),
      statusCode: 401,
      message: normalizedAuth.message,
      remainingLoginAttempts: normalizedAuth.remainingLoginAttempts,
    };
  }

  // Check for password change requirement
  if (normalizedAuth.requiresPasswordChange) {
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.PASSWORD_CHANGE_REQUIRED,
      statusCode: 403,
      message: normalizedAuth.message,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 5: Two-factor challenge — password was valid, but no session yet
  // ---------------------------------------------------------------------------
  if (hasPendingTwoFactorChallenge(normalizedAuth)) {
    const cookieStore = await cookies();
    await persistPendingTwoFactorCookie(
      cookieStore,
      normalizedAuth.challengeId as string,
      normalizedAuth.username || validatedUsername,
      normalizedAuth.challengeExpiresAt,
      normalizedAuth.twoFactorMethod === 'otp' ? 'otp' : 'totp'
    );
    return {
      success: true as const,
      requiresTwoFactor: true as const,
      challengeId: normalizedAuth.challengeId,
      username: normalizedAuth.username || validatedUsername,
      method: (normalizedAuth.twoFactorMethod === 'otp' ? 'otp' : 'totp') as 'otp' | 'totp',
    };
  }

  // ---------------------------------------------------------------------------
  // Step 6: Validate session tokens using type guard utility
  // ---------------------------------------------------------------------------
  if (hasValidSessionTokens(normalizedAuth)) {
    // Success - complete the login session
    await completeLoginSession(locale, normalizedAuth, sessionId, validatedUsername);
    // Note: completeLoginSession redirects and never returns
  }

  // Tokens missing or invalid
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  return {
    success: false as const,
    errorCode: AUTH_ERROR_CODES.LOGIN_FAILED,
    statusCode: 500,
    message: normalizedAuth.message || tCommon('login.errors.sessionEstablishmentFailed'),
  };
}

/**
 * Logs out the user by clearing all auth cookies and calling the logout API.
 * Uses centralized cookie list for consistency.
 *
 * @param locale - User's locale for redirect
 */
export async function logoutAction(locale: string = 'en') {
  const safeLocale = sanitizeLocale(locale);
  const cookieStore = await cookies();

  // Get token using centralized cookie name
  const token = cookieStore.get(AUTH_COOKIES.AUTH_TOKEN)?.value;
  const sessionId = cookieStore.get(AUTH_COOKIES.SESSION_ID)?.value;

  // Attempt to notify server of logout (non-blocking)
  if (token) {
    try {
      await authService.logout(sessionId || '', token);
    } catch {
      // Server logout is best-effort, don't fail client logout
    }
  }

  await clearAuthSessionCookies(cookieStore);

  redirect(`/${safeLocale}/login`);
}

/**
 * SSR: council branding for the login page — delegates to
 * `getUlbConfigForLogin` in `@/lib/api/ulb-config.service` (same layering as
 * construction type: page → action → `lib/api` service).
 */
export async function fetchLoginBrandingAction(): Promise<{ ulbData: UlbMaster | undefined }> {
  const ulbData = await getUlbConfigForLogin();
  return { ulbData };
}
export type LoginCredentialsFormState = {
  message?: string;
  resetKey?: string;
  /** Wrong-password attempts left before lockout — only set alongside INVALID_CREDENTIALS. */
  remainingAttempts?: number;
  requiresTwoFactor?: boolean;
  twoFactorUsername?: string;
  twoFactorMethod?: 'totp' | 'otp';
  challengeId?: string;
} | null;

export async function loginCredentialsFormAction(
  _prev: LoginCredentialsFormState,
  formData: FormData
): Promise<LoginCredentialsFormState> {
  try {
    const result = await validateCredentialsAction(formData);
    if (result && 'requiresTwoFactor' in result && result.requiresTwoFactor) {
      return {
        requiresTwoFactor: true,
        twoFactorUsername: result.username,
        twoFactorMethod: result.method,
        challengeId: result.challengeId,
        resetKey: crypto.randomUUID(),
      };
    }
    if (result && 'success' in result && result.success === false) {
      const errorCode = result.errorCode || 'LOGIN_FAILED';
      const remainingAttempts =
        'remainingLoginAttempts' in result && typeof result.remainingLoginAttempts === 'number'
          ? result.remainingLoginAttempts
          : undefined;
      return { message: errorCode, resetKey: crypto.randomUUID(), remainingAttempts };
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
  }
  return { message: 'LOGIN_FAILED', resetKey: crypto.randomUUID() };
}

// ---------------------------------------------------------------------------
// Two-Factor Verification (login step 2)
// ---------------------------------------------------------------------------

/**
 * SSR guard for the verify-2FA page: reads the pending challenge stashed by
 * {@link redirectToTwoFactorChallenge}. Redirects to `/login` (never returns) if the challenge
 * is missing or has already expired — there's nothing to verify.
 */
export async function resolvePendingTwoFactorOrRedirect(
  locale: string
): Promise<{ username: string; method: 'totp' | 'otp' }> {
  const cookieStore = await cookies();
  const pending = await readPendingTwoFactorCookie(cookieStore);
  if (!pending) {
    redirect(`/${locale}/login`);
  }
  return { username: pending.username, method: pending.method };
}

export async function validateTwoFactorCodeAction(formData: FormData) {
  const codeEntry = formData.get('code');
  const useRecoveryCodeEntry = formData.get('useRecoveryCode');
  const localeEntry = formData.get('locale');
  const formChallengeId = formData.get('challengeId');
  const formMethod = formData.get('method');
  const locale = sanitizeLocale(typeof localeEntry === 'string' ? localeEntry : 'en');
  const useRecoveryCode = useRecoveryCodeEntry === 'true' || useRecoveryCodeEntry === 'on';

  const rawCode = typeof codeEntry === 'string' ? codeEntry.trim() : '';
  if (!rawCode) {
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.INVALID_OTP_FORMAT,
      statusCode: 400,
    };
  }

  const cookieStore = await cookies();
  const pending = await readPendingTwoFactorCookie(cookieStore);
  const challengeId =
    (typeof formChallengeId === 'string' && formChallengeId.trim()) ||
    pending?.challengeId;
  const method = pending?.method || (formMethod === 'otp' ? 'otp' : 'totp');
  const challengeUsername = pending?.username || '';

  if (!challengeId) {
    // Challenge cookie missing or expired client-side — nothing left to verify.
    redirect(`/${locale}/login?error=sessionExpired`);
  }

  const sessionId = crypto.randomUUID();

  let response;
  try {
    if (method === 'otp') {
      const otpRequest: VerifyLoginOtpRequest = { challengeId, code: rawCode };
      response = await authService.verifyLoginOtp(otpRequest);
    } else {
      const verifyRequest: VerifyTwoFactorRequest = {
        challengeId,
        code: rawCode,
        useRecoveryCode,
      };
      response = await authService.verifyTwoFactor(verifyRequest);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return {
      success: false as const,
      errorCode: mapAuthErrorToCode(503, message),
      statusCode: 503,
    };
  }

  if (!response?.success || !response.data) {
    // 423 (locked after too many attempts) and 401 (invalid/expired code) both land here.
    return {
      success: false as const,
      errorCode:
        response?.statusCode === 401 || response?.statusCode === 400
          ? AUTH_ERROR_CODES.VERIFICATION_FAILED
          : mapAuthErrorToCode(response?.statusCode, response?.error),
      statusCode: response?.statusCode ?? 500,
      message: response?.error,
    };
  }

  if (!isAuthLoginResponseShape(response.data)) {
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
      statusCode: 500,
    };
  }

  const normalizedAuth = normalizeAuthLoginResponse(response.data as Record<string, unknown>);

  if (!normalizedAuth.success || !hasValidSessionTokens(normalizedAuth)) {
    return {
      success: false as const,
      errorCode:
        response.statusCode === 401 || response.statusCode === 400
          ? AUTH_ERROR_CODES.VERIFICATION_FAILED
          : mapAuthErrorToCode(response.statusCode ?? 401, normalizedAuth.message),
      statusCode: response.statusCode ?? 401,
      message: normalizedAuth.message,
    };
  }

  // Success — clears the pending-challenge cookie and establishes the real session.
  await completeLoginSession(locale, normalizedAuth, sessionId, challengeUsername);
  // Note: completeLoginSession redirects and never returns
}

export type VerifyTwoFactorFormState = { message: string; resetKey: string } | null;

export async function verifyTwoFactorFormAction(
  _prev: VerifyTwoFactorFormState,
  formData: FormData
): Promise<VerifyTwoFactorFormState> {
  try {
    const result = await validateTwoFactorCodeAction(formData);
    if (result && 'success' in result && result.success === false) {
      const errorCode = result.errorCode || 'VERIFICATION_FAILED';
      return { message: errorCode, resetKey: crypto.randomUUID() };
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
  }
  return { message: 'VERIFICATION_FAILED', resetKey: crypto.randomUUID() };
}

/**
 * Abandons the pending 2FA challenge and returns to the credentials step ("Back to Login").
 */
export async function cancelTwoFactorChallengeAction(locale?: string) {
  const cookieStore = await cookies();
  await clearPendingTwoFactorCookie(cookieStore);
  if (locale) {
    const safeLocale = sanitizeLocale(locale);
    redirect(`/${safeLocale}/login`);
  }
}
