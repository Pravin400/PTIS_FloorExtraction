'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { authService } from '@/lib/api/auth.service';
import { locales, defaultLocale } from '@/i18n/config';
import { AUTH_ERROR_CODES } from '@/components/modules/login/constants';
import { mapAuthErrorToCode } from '@/lib/api/auth-validation';
import type { ForgotPasswordMethod } from '@/types/login.types';
import {
  persistPendingForgotPasswordCookie,
  readPendingForgotPasswordCookie,
  clearPendingForgotPasswordCookie,
  persistPendingPasswordResetCookie,
  readPendingPasswordResetCookie,
  clearPendingPasswordResetCookie,
} from '@/lib/utils/auth-session';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sanitizeLocale(raw: string): string {
  return (locales as readonly string[]).includes(raw) ? raw : defaultLocale;
}

function isRedirectError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'digest' in e &&
    typeof (e as { digest?: unknown }).digest === 'string' &&
    String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

function localeFromForm(formData: FormData): string {
  const localeEntry = formData.get('locale');
  return sanitizeLocale(typeof localeEntry === 'string' ? localeEntry : 'en');
}

function toForgotPasswordMethod(raw: FormDataEntryValue | null): ForgotPasswordMethod | null {
  return raw === 'Email' || raw === 'Sms' || raw === 'Authenticator' ? raw : null;
}

// ---------------------------------------------------------------------------
// Step 0: look up which methods are available for this account
// ---------------------------------------------------------------------------

export async function checkForgotPasswordMethodsAction(formData: FormData) {
  const usernameEntry = formData.get('usernameOrEmail');
  const usernameOrEmail = typeof usernameEntry === 'string' ? usernameEntry.trim() : '';

  if (!usernameOrEmail) {
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.USERNAME_REQUIRED,
      statusCode: 400,
    };
  }

  let response;
  try {
    response = await authService.getForgotPasswordMethods({ usernameOrEmail });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return { success: false as const, errorCode: mapAuthErrorToCode(503, message), statusCode: 503 };
  }

  if (!response?.success || !response.data || response.data.success === false) {
    return {
      success: false as const,
      errorCode: mapAuthErrorToCode(response?.statusCode, response?.error || response?.data?.message),
      statusCode: response?.statusCode ?? 500,
      message: response?.data?.message ?? response?.error,
    };
  }

  const { methods, maskedEmail, maskedMobile, message } = response.data;
  return {
    success: true as const,
    usernameOrEmail,
    methods,
    maskedEmail,
    maskedMobile,
    message,
  };
}

export type CheckForgotPasswordMethodsState = {
  resetKey: string;
  errorCode?: string;
  usernameOrEmail?: string;
  methods?: ForgotPasswordMethod[];
  maskedEmail?: string;
  maskedMobile?: string;
  message?: string;
} | null;

export async function checkForgotPasswordMethodsFormAction(
  _prev: CheckForgotPasswordMethodsState,
  formData: FormData
): Promise<CheckForgotPasswordMethodsState> {
  const result = await checkForgotPasswordMethodsAction(formData);
  if (!result.success) {
    return { resetKey: crypto.randomUUID(), errorCode: result.errorCode || AUTH_ERROR_CODES.RESET_FAILED };
  }
  return {
    resetKey: crypto.randomUUID(),
    usernameOrEmail: result.usernameOrEmail,
    methods: result.methods,
    maskedEmail: result.maskedEmail,
    maskedMobile: result.maskedMobile,
    message: result.message,
  };
}

// ---------------------------------------------------------------------------
// Step 1: request an OTP via the chosen method
// ---------------------------------------------------------------------------

export async function requestForgotPasswordOtpAction(formData: FormData) {
  const usernameEntry = formData.get('usernameOrEmail');
  const locale = localeFromForm(formData);

  const usernameOrEmail = typeof usernameEntry === 'string' ? usernameEntry.trim() : '';
  const method = toForgotPasswordMethod(formData.get('method'));

  if (!usernameOrEmail || !method) {
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.INVALID_REQUEST,
      statusCode: 400,
    };
  }

  let response;
  try {
    response = await authService.forgotPassword({ usernameOrEmail, method });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return { success: false as const, errorCode: mapAuthErrorToCode(503, message), statusCode: 503 };
  }

  // The backend always returns success:true with a generic message unless the self-service
  // feature itself is switched off (SECURITY_AUTH "2FALOGINFORFPASS") — that's the only case
  // that should surface as a real error here.
  if (!response?.success || !response.data || response.data.success === false) {
    return {
      success: false as const,
      errorCode: mapAuthErrorToCode(response?.statusCode, response?.error || response?.data?.message),
      statusCode: response?.statusCode ?? 500,
      message: response?.data?.message ?? response?.error,
    };
  }

  const { challengeId, challengeExpiresAt, message } = response.data;
  if (!challengeId) {
    // Generic "if this account exists" response — nothing to verify, stay on this screen.
    return { success: true as const, hasChallenge: false as const, message };
  }

  const cookieStore = await cookies();
  await persistPendingForgotPasswordCookie(cookieStore, challengeId, usernameOrEmail, method, challengeExpiresAt);

  redirect(`/${locale}/login/forgot-password/verify-otp`);
}

export type ForgotPasswordFormState = {
  message: string;
  resetKey: string;
  info?: string;
  /** Real backend-supplied text (e.g. "feature disabled"), shown as-is instead of a mapped i18n code when present. */
  rawMessage?: string;
} | null;

export async function forgotPasswordFormAction(
  _prev: ForgotPasswordFormState,
  formData: FormData
): Promise<ForgotPasswordFormState> {
  try {
    const result = await requestForgotPasswordOtpAction(formData);
    if (result && 'success' in result) {
      if (result.success === false) {
        return {
          message: result.errorCode || AUTH_ERROR_CODES.RESET_FAILED,
          resetKey: crypto.randomUUID(),
          rawMessage: result.message,
        };
      }
      if (result.hasChallenge === false) {
        return { message: '', resetKey: crypto.randomUUID(), info: result.message };
      }
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
  }
  return { message: AUTH_ERROR_CODES.RESET_FAILED, resetKey: crypto.randomUUID() };
}

// ---------------------------------------------------------------------------
// Step 2: verify the OTP, obtain a reset token
// ---------------------------------------------------------------------------

/**
 * SSR guard for the verify-otp page: redirects back to the request step (never returns) if
 * there's no pending challenge (expired, already used, or a direct hit).
 */
export async function resolvePendingForgotPasswordOrRedirect(
  locale: string
): Promise<{ usernameOrEmail: string; method: ForgotPasswordMethod }> {
  const cookieStore = await cookies();
  const pending = await readPendingForgotPasswordCookie(cookieStore);
  if (!pending) {
    redirect(`/${locale}/login/forgot-password`);
  }
  return { usernameOrEmail: pending.usernameOrEmail, method: pending.method };
}

export async function validateForgotPasswordOtpAction(formData: FormData) {
  const codeEntry = formData.get('code');
  const locale = localeFromForm(formData);

  const rawCode = typeof codeEntry === 'string' ? codeEntry.trim() : '';
  if (!rawCode) {
    return {
      success: false as const,
      errorCode: AUTH_ERROR_CODES.INVALID_OTP_FORMAT,
      statusCode: 400,
    };
  }

  const cookieStore = await cookies();
  const pending = await readPendingForgotPasswordCookie(cookieStore);
  if (!pending) {
    redirect(`/${locale}/login/forgot-password?error=forgotSessionInvalid`);
  }

  let response;
  try {
    response = await authService.verifyForgotPasswordOtp({
      challengeId: pending.challengeId,
      code: rawCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return { success: false as const, errorCode: mapAuthErrorToCode(503, message), statusCode: 503 };
  }

  if (!response?.success || !response.data || response.data.success === false || !response.data.resetToken) {
    return {
      success: false as const,
      errorCode: mapAuthErrorToCode(response?.statusCode, response?.data?.message ?? response?.error),
      statusCode: response?.statusCode ?? 401,
      message: response?.data?.message ?? response?.error,
    };
  }

  await clearPendingForgotPasswordCookie(cookieStore);
  await persistPendingPasswordResetCookie(
    cookieStore,
    response.data.resetToken,
    response.data.resetTokenExpiresAt
  );

  redirect(`/${locale}/login/forgot-password/reset`);
}

export type VerifyForgotPasswordOtpFormState = {
  message: string;
  resetKey: string;
  rawMessage?: string;
} | null;

export async function verifyForgotPasswordOtpFormAction(
  _prev: VerifyForgotPasswordOtpFormState,
  formData: FormData
): Promise<VerifyForgotPasswordOtpFormState> {
  try {
    const result = await validateForgotPasswordOtpAction(formData);
    if (result && 'success' in result && result.success === false) {
      return {
        message: result.errorCode || AUTH_ERROR_CODES.VERIFICATION_FAILED,
        resetKey: crypto.randomUUID(),
        rawMessage: 'message' in result ? result.message : undefined,
      };
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
  }
  return { message: AUTH_ERROR_CODES.VERIFICATION_FAILED, resetKey: crypto.randomUUID() };
}

/** Abandons the pending forgot-password challenge and returns to the request step. */
export async function cancelForgotPasswordAction(locale: string = 'en') {
  const safeLocale = sanitizeLocale(locale);
  const cookieStore = await cookies();
  await clearPendingForgotPasswordCookie(cookieStore);
  redirect(`/${safeLocale}/login/forgot-password`);
}

// ---------------------------------------------------------------------------
// Step 3: set the new password
// ---------------------------------------------------------------------------

/**
 * SSR guard for the reset page: redirects back to the request step (never returns) if there's no
 * verified reset token (expired, already used, or a direct hit).
 */
export async function resolvePendingPasswordResetOrRedirect(locale: string): Promise<void> {
  const cookieStore = await cookies();
  const pending = await readPendingPasswordResetCookie(cookieStore);
  if (!pending) {
    redirect(`/${locale}/login/forgot-password`);
  }
}

export async function validateResetPasswordAction(formData: FormData) {
  const newPasswordEntry = formData.get('newPassword');
  const confirmPasswordEntry = formData.get('confirmPassword');
  const locale = localeFromForm(formData);

  const newPassword = typeof newPasswordEntry === 'string' ? newPasswordEntry : '';
  const confirmPassword = typeof confirmPasswordEntry === 'string' ? confirmPasswordEntry : '';

  if (!newPassword || !confirmPassword) {
    return { success: false as const, errorCode: 'PASSWORDS_REQUIRED', statusCode: 400 };
  }
  if (newPassword !== confirmPassword) {
    return { success: false as const, errorCode: 'PASSWORDS_MISMATCH', statusCode: 400 };
  }

  const cookieStore = await cookies();
  const pending = await readPendingPasswordResetCookie(cookieStore);
  if (!pending) {
    redirect(`/${locale}/login/forgot-password?error=forgotSessionInvalid`);
  }

  let response;
  try {
    response = await authService.resetPassword({ resetToken: pending.resetToken, newPassword });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return { success: false as const, errorCode: mapAuthErrorToCode(503, message), statusCode: 503 };
  }

  if (!response?.success || !response.data || response.data.success === false) {
    return {
      success: false as const,
      errorCode:
        mapAuthErrorToCode(response?.statusCode, response?.data?.message ?? response?.error) ||
        AUTH_ERROR_CODES.RESET_FAILED,
      statusCode: response?.statusCode ?? 400,
      message: response?.data?.message ?? response?.error,
    };
  }

  await clearPendingPasswordResetCookie(cookieStore);
  // SSR success screen — consistent with every other step in this flow (guard page + redirect())
  // rather than a client-managed success state.
  redirect(`/${locale}/login/forgot-password/success`);
}

export type ResetPasswordFormState = {
  message: string;
  resetKey: string;
  rawMessage?: string;
} | null;

export async function resetPasswordFormAction(
  _prev: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  try {
    const result = await validateResetPasswordAction(formData);
    if (result && 'success' in result && result.success === false) {
      return {
        message: result.errorCode || AUTH_ERROR_CODES.RESET_FAILED,
        resetKey: crypto.randomUUID(),
        rawMessage: 'message' in result ? result.message : undefined,
      };
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
  }
  return { message: AUTH_ERROR_CODES.RESET_FAILED, resetKey: crypto.randomUUID() };
}
