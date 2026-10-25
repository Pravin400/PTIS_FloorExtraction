'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { twoFactorService } from '@/lib/api/two-factor.service';
import { clearAuthSessionCookies } from '@/lib/utils/auth-session';
import { locales, defaultLocale } from '@/i18n/config';
import type {
  TwoFactorStatusResponse,
  TwoFactorSetupResponse,
  EnableTwoFactorResponse,
  RecoveryCodesResponse,
  TwoFactorEmailVerificationPendingResponse,
} from '@/types/two-factor.types';

function sanitizeLocale(raw: string): string {
  return (locales as readonly string[]).includes(raw) ? raw : defaultLocale;
}

export type TwoFactorActionErrorCode =
  | 'INVALID_CODE'
  | 'ALREADY_ENABLED'
  | 'NOT_ENABLED'
  | 'SETUP_NOT_STARTED'
  | 'EMAIL_NOT_ON_FILE'
  | 'USER_NOT_FOUND'
  | 'GENERIC_ERROR';

export type TwoFactorActionResult<T> =
  | { success: true; data: T }
  | { success: false; errorCode: TwoFactorActionErrorCode; errorMessage?: string };

/** Maps the controller's plain-text error message to a stable client-facing code (avoids leaking raw server strings). */
function mapErrorMessage(message: string | undefined, statusCode: number | undefined): TwoFactorActionErrorCode {
  const normalized = (message ?? '').toLowerCase();
  if (statusCode === 409) {
    if (normalized.includes('already enabled')) return 'ALREADY_ENABLED';
    if (normalized.includes('not enabled')) return 'NOT_ENABLED';
    if (normalized.includes('not been started')) return 'SETUP_NOT_STARTED';
    if (normalized.includes('no email address') || normalized.includes('email not on file')) return 'EMAIL_NOT_ON_FILE';
  }
  if (statusCode === 401 && normalized.includes('user not found')) {
    return 'USER_NOT_FOUND';
  }
  if (
    statusCode === 401 ||
    statusCode === 400 ||
    normalized.includes('invalid') ||
    normalized.includes('code') ||
    normalized.includes('expired')
  ) {
    return 'INVALID_CODE';
  }
  return 'GENERIC_ERROR';
}

export async function getTwoFactorStatusAction(): Promise<TwoFactorActionResult<TwoFactorStatusResponse>> {
  const res = await twoFactorService.getStatus();
  if (!res.success || !res.data) {
    return { success: false, errorCode: mapErrorMessage(res.error, res.statusCode), errorMessage: res.error };
  }
  return { success: true, data: res.data };
}

export async function beginTwoFactorSetupAction(): Promise<TwoFactorActionResult<TwoFactorSetupResponse>> {
  const res = await twoFactorService.beginSetup();
  if (!res.success || !res.data) {
    return { success: false, errorCode: mapErrorMessage(res.error, res.statusCode), errorMessage: res.error };
  }
  return { success: true, data: res.data };
}

export async function enableTwoFactorAction(
  formData: FormData
): Promise<TwoFactorActionResult<TwoFactorEmailVerificationPendingResponse>> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { success: false, errorCode: 'INVALID_CODE' };

  const res = await twoFactorService.enable({ code });
  if (!res.success || !res.data) {
    return { success: false, errorCode: mapErrorMessage(res.error, res.statusCode), errorMessage: res.error };
  }
  return { success: true, data: res.data };
}

export async function confirmTwoFactorEmailAction(
  formData: FormData
): Promise<TwoFactorActionResult<EnableTwoFactorResponse>> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { success: false, errorCode: 'INVALID_CODE' };

  const res = await twoFactorService.confirmEmail({ code });
  if (!res.success || !res.data) {
    return { success: false, errorCode: mapErrorMessage(res.error, res.statusCode), errorMessage: res.error };
  }
  return { success: true, data: res.data };
}

export async function regenerateRecoveryCodesAction(
  formData: FormData
): Promise<TwoFactorActionResult<RecoveryCodesResponse>> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { success: false, errorCode: 'INVALID_CODE' };

  const res = await twoFactorService.regenerateRecoveryCodes({ code });
  if (!res.success || !res.data) {
    return { success: false, errorCode: mapErrorMessage(res.error, res.statusCode), errorMessage: res.error };
  }
  return { success: true, data: res.data };
}

export async function disableTwoFactorAction(
  formData: FormData
): Promise<TwoFactorActionResult<true>> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { success: false, errorCode: 'INVALID_CODE' };

  const res = await twoFactorService.disable({ code });
  if (!res.success) {
    return { success: false, errorCode: mapErrorMessage(res.error, res.statusCode), errorMessage: res.error };
  }
  return { success: true, data: true };
}

export async function resetTwoFactorAction(
  formData: FormData
): Promise<TwoFactorActionResult<TwoFactorSetupResponse>> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { success: false, errorCode: 'INVALID_CODE' };

  const res = await twoFactorService.reset({ code });
  if (!res.success || !res.data) {
    return { success: false, errorCode: mapErrorMessage(res.error, res.statusCode), errorMessage: res.error };
  }
  return { success: true, data: res.data };
}

/**
 * Enabling, disabling, and resetting 2FA all rotate the account's security stamp server-side,
 * which invalidates the current access token almost immediately (see backend `OnTokenValidated`
 * stamp check) and — for disable/reset — also revokes the refresh token. Rather than let the
 * next unrelated API call surprise-redirect the user via the generic 401 handler, this action
 * ends the session explicitly with a clear reason once the user has acknowledged the change.
 */
export async function endSecurityUpdateSessionAction(locale: string = 'en') {
  const safeLocale = sanitizeLocale(locale);
  await clearAuthSessionCookies(await cookies());
  redirect(`/${safeLocale}/login?message=twoFactorUpdated`);
}
