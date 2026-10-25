'use server';

import { cookies } from 'next/headers';
import { authService } from '@/lib/api/auth.service';
import { AUTH_COOKIES, AUTH_ERROR_CODES } from '@/components/modules/login/constants';
import type { ChangePasswordRequest } from '@/types/login.types';

export interface ChangePasswordActionResult {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?: string;
}

export async function changePasswordAction(
  data: ChangePasswordRequest
): Promise<ChangePasswordActionResult> {
  const currentPassword = data.currentPassword?.trim();
  const newPassword = data.newPassword?.trim();
  const confirmPassword = data.confirmPassword?.trim();

  if (!currentPassword) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.CURRENT_PASSWORD_REQUIRED,
      error: 'Please enter your current password.',
    };
  }

  if (!newPassword) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.NEW_PASSWORD_REQUIRED,
      error: 'Please enter a new password.',
    };
  }

  if (!confirmPassword) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.PASSWORDS_REQUIRED,
      error: 'All password fields are required.',
    };
  }

  if (newPassword.length < 6) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.PASSWORD_TOO_SHORT,
      error: 'Password must be at least 6 characters long.',
    };
  }

  if (newPassword.length > 25) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.PASSWORD_TOO_LONG,
      error: 'Password cannot exceed 25 characters.',
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.PASSWORDS_MISMATCH,
      error: 'New password and confirmation password do not match.',
    };
  }

  if (newPassword === currentPassword) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.PASSWORD_DIFFERENT_REQUIRED,
      error: 'New password must be different from current password.',
    };
  }

  const userName = data.userName?.trim();

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIES.AUTH_TOKEN)?.value;

  if (!token && !userName) {
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.USERNAME_REQUIRED,
      error: 'Username is required to change password.',
    };
  }

  try {
    const res = await authService.changePassword(
      {
        userName: userName || undefined,
        currentPassword,
        newPassword,
        confirmPassword,
      },
      token
    );

    if (!res.success) {
      return {
        success: false,
        errorCode: res.error || AUTH_ERROR_CODES.CHANGE_PASSWORD_FAILED,
        error: res.error || 'Failed to change password.',
      };
    }

    return {
      success: true,
      message: res.data?.message || 'Password changed successfully!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return {
      success: false,
      errorCode: AUTH_ERROR_CODES.CHANGE_PASSWORD_FAILED,
      error: errorMsg,
    };
  }
}
