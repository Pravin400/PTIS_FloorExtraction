'use client';

/**
 * Maps API/auth error codes to localized strings for the login flow.
 * Kept separate from {@link useLoginForm} to keep the form hook under review size limits.
 *
 * @module useLoginErrorMessages
 */

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AUTH_ERROR_CODES } from '@/components/modules/login/constants';

// ---------------------------------------------------------------------------
// Error code → `login.errors` key (when the key differs from the code)
// ---------------------------------------------------------------------------

const AUTH_ERROR_TO_LOGIN_I18N_KEY: Record<string, string> = {
  [AUTH_ERROR_CODES.CREDENTIALS_REQUIRED]: 'credentialsRequired',
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'invalidCredentials',
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: 'Auth_AccountLocked_Temporary',
  [AUTH_ERROR_CODES.ACCOUNT_INACTIVE]: 'ACCOUNT_INACTIVE',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'Auth_UserNotFound',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'SESSION_EXPIRED',
  [AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS]: 'TOO_MANY_ATTEMPTS',
  [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]: 'serviceUnavailable',
  [AUTH_ERROR_CODES.REQUEST_TIMEOUT]: 'REQUEST_TIMEOUT',
  [AUTH_ERROR_CODES.LOGIN_FAILED]: 'LOGIN_FAILED',
  [AUTH_ERROR_CODES.PASSWORD_CHANGE_REQUIRED]: 'passwordChangeRequired',
  [AUTH_ERROR_CODES.INVALID_OTP_FORMAT]: 'enterValidToken',
  [AUTH_ERROR_CODES.VERIFICATION_FAILED]: 'VERIFICATION_FAILED',
  [AUTH_ERROR_CODES.RESEND_FAILED]: 'RESEND_FAILED',
  [AUTH_ERROR_CODES.RESET_FAILED]: 'RESET_FAILED',
  [AUTH_ERROR_CODES.INVALID_REQUEST]: 'INVALID_REQUEST',
  [AUTH_ERROR_CODES.CURRENT_PASSWORD_REQUIRED]: 'currentPasswordRequired',
  [AUTH_ERROR_CODES.NEW_PASSWORD_REQUIRED]: 'newPasswordRequired',
  [AUTH_ERROR_CODES.PASSWORD_TOO_SHORT]: 'passwordMinLength',
  [AUTH_ERROR_CODES.PASSWORD_TOO_LONG]: 'PASSWORD_TOO_LONG',
  [AUTH_ERROR_CODES.PASSWORD_DIFFERENT_REQUIRED]: 'newPasswordMustBeDifferent',
  [AUTH_ERROR_CODES.PASSWORDS_MISMATCH]: 'passwordsMismatch',
  [AUTH_ERROR_CODES.CHANGE_PASSWORD_FAILED]: 'changePasswordFailed',
  [AUTH_ERROR_CODES.INVALID_CURRENT_PASSWORD]: 'invalidCurrentPassword',
  // Common backend and action error text mappings
  'Current password is incorrect.': 'invalidCurrentPassword',
  'Current password is incorrect': 'invalidCurrentPassword',
  'Invalid current password.': 'invalidCurrentPassword',
  'Invalid current password': 'invalidCurrentPassword',
  'Please enter your current password.': 'currentPasswordRequired',
  'Please enter your current password': 'currentPasswordRequired',
  'Current password is required.': 'currentPasswordRequired',
  'Current password is required': 'currentPasswordRequired',
  'Please enter a new password.': 'newPasswordRequired',
  'Please enter a new password': 'newPasswordRequired',
  'New password is required.': 'newPasswordRequired',
  'New password is required': 'newPasswordRequired',
  'New password must be different from current password.': 'newPasswordMustBeDifferent',
  'New password must be different from current password': 'newPasswordMustBeDifferent',
  'New password and confirmation password do not match.': 'passwordsMismatch',
  'New password and confirmation password do not match': 'passwordsMismatch',
  'Passwords do not match.': 'passwordsMismatch',
  'Passwords do not match': 'passwordsMismatch',
  'Password must be at least 6 characters long.': 'passwordMinLength',
  'Password must be at least 6 characters long': 'passwordMinLength',
  'Password cannot exceed 25 characters.': 'PASSWORD_TOO_LONG',
  'Password cannot exceed 25 characters': 'PASSWORD_TOO_LONG',
  'Password cannot exceed 8 characters.': 'PASSWORD_TOO_LONG',
  'Password cannot exceed 8 characters': 'PASSWORD_TOO_LONG',
  'Password must contain at least one uppercase letter (A-Z).': 'passwordRequireUppercase',
  'Password must contain at least one uppercase letter (A-Z)': 'passwordRequireUppercase',
  'Password must contain at least one lowercase letter (a-z).': 'passwordRequireLowercase',
  'Password must contain at least one lowercase letter (a-z)': 'passwordRequireLowercase',
  'Password must contain at least one number (0-9).': 'passwordRequireDigit',
  'Password must contain at least one number (0-9)': 'passwordRequireDigit',
  'Password must contain at least one special character.': 'passwordRequireSpecial',
  'Password must contain at least one special character': 'passwordRequireSpecial',
  'Unable to process the new password. Please choose a different password.': 'passwordProcessError',
  'Unable to process the new password. Please choose a different password': 'passwordProcessError',
  'User not found or account is inactive.': 'ACCOUNT_INACTIVE',
  'User not found or account is inactive': 'ACCOUNT_INACTIVE',
  'User not found.': 'Auth_UserNotFound',
  'User not found': 'Auth_UserNotFound',
  'Failed to change password.': 'changePasswordFailed',
  'Failed to change password': 'changePasswordFailed',
  'Failed to update password.': 'changePasswordFailed',
  'Failed to update password': 'changePasswordFailed',
  'All password fields are required.': 'passwordsRequired',
  'All password fields are required': 'passwordsRequired',
  'Username is required to change password.': 'usernameRequired',
  'Username is required to change password': 'usernameRequired',
  'Username is required.': 'usernameRequired',
  'Username is required': 'usernameRequired',
  'Please enter your username.': 'usernameRequired',
  'Please enter your username': 'usernameRequired',
  'An error occurred while updating the password.': 'changePasswordFailed',
  'An error occurred while updating the password': 'changePasswordFailed',
  'An unexpected error occurred.': 'unexpectedError',
  'An unexpected error occurred': 'unexpectedError',
};

/**
 * Hook to convert error codes to localized messages.
 * Separated for reuse in components that don't need full form management.
 */
export function useLoginErrorMessages() {
  const t = useTranslations('login');

  const getLocalizedError = useCallback(
    (errorCode: string | undefined): string => {
      if (!errorCode) return '';

      const trimmed = errorCode.trim();

      const mappedKey = AUTH_ERROR_TO_LOGIN_I18N_KEY[trimmed] ?? AUTH_ERROR_TO_LOGIN_I18N_KEY[errorCode];
      if (mappedKey) {
        const primary = `errors.${mappedKey}`;
        if (typeof t.has === 'function' && t.has(primary)) {
          return t(primary);
        }
        try {
          return t(primary);
        } catch {
          // fall through
        }
      }

      const directKey = `errors.${trimmed}`;
      if (typeof t.has === 'function' && t.has(directKey)) {
        return t(directKey);
      }

      // Fuzzy / dynamic policy matching
      if (/password must be at least \d+ characters/i.test(trimmed)) {
        if (typeof t.has === 'function' && t.has('errors.passwordMinLength')) {
          return t('errors.passwordMinLength');
        }
      }

      if (/password cannot exceed \d+ characters/i.test(trimmed)) {
        if (typeof t.has === 'function' && t.has('errors.PASSWORD_TOO_LONG')) {
          return t('errors.PASSWORD_TOO_LONG');
        }
      }

      // If the error contains spaces, it's an unmapped natural language message from API/action.
      // Return it as-is to avoid displaying raw i18n missing key prefixes like "login.errors. ...".
      if (trimmed.includes(' ')) {
        return trimmed;
      }

      try {
        return t('errors.LOGIN_FAILED');
      } catch {
        return errorCode;
      }
    },
    [t]
  );

  return { getLocalizedError };
}
