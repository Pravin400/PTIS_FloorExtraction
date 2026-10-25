'use server';

/**
 * Fire Audit Citizen Authentication Server Actions
 * Path: src/lib/actions/fire-audit/citizen/citizen-auth.actions.ts
 */

import { cookies } from 'next/headers';
import { fireCitizenAuthService } from '@/lib/api/fire-audit/citizen/citizen-auth.service';
import { getJwtExpiryUnix } from '@/lib/utils/jwt-expiry';
import type { ApiResponse } from '@/types/common.types';
import type {
  FireSendOtpRequest,
  FireSendOtpResponse,
  FireResendOtpRequest,
  FireResendOtpResponse,
  FireVerifyOtpRequest,
  FireVerifyOtpResponse,
  FireCitizenProfile,
  FireCitizenMasterRecord,
} from '@/types/fire-audit/citizen-auth.types';

const CITIZEN_AUTH_COOKIES = {
  TOKEN: 'citizen_token',
  TOKEN_EXP: 'citizen_token_exp',
  REFRESH_TOKEN: 'citizen_refresh_token',
  CITIZEN_ID: 'citizen_id',
  CITIZEN_NAME: 'citizen_name',
  CITIZEN_MOBILE: 'citizen_mobile',
  IS_LOGGED_IN: 'citizen_is_logged_in',
  FIRE_SESSION: 'fire_audit_citizen_session',
} as const;

export async function checkFireCitizenMobileAction(
  mobileNo: string
): Promise<ApiResponse<FireCitizenMasterRecord | null>> {
  try {
    const res = await fireCitizenAuthService.getCitizenByMobile(mobileNo);
    if (res.success && res.data && (res.data.id || res.data.name)) {
      return res;
    }
    return {
      success: false,
      data: null,
      message: res.message || 'Mobile number is not registered.',
    };
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to check mobile number.';
    return { success: false, data: null, error: msg, message: msg };
  }
}

export async function sendFireCitizenOtpAction(
  dto: FireSendOtpRequest
): Promise<ApiResponse<FireSendOtpResponse>> {
  try {
    const res = await fireCitizenAuthService.sendOtp({
      ...dto,
      purpose: dto.purpose || 'LOGIN',
      moduleCode: dto.moduleCode || 'FIRE_AUDIT',
    });
    const errText = res.error || res.message;
    if (!res.success && errText) {
      res.error = errText;
      res.message = errText;
    }
    return res;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to send OTP. Please try again.';
    return { success: false, error: msg, message: msg };
  }
}

export async function resendFireCitizenOtpAction(
  dto: FireResendOtpRequest
): Promise<ApiResponse<FireResendOtpResponse>> {
  try {
    const res = await fireCitizenAuthService.resendOtp({
      ...dto,
      purpose: dto.purpose || 'LOGIN',
      moduleCode: dto.moduleCode || 'FIRE_AUDIT',
    });
    const errText = res.error || res.message;
    if (!res.success && errText) {
      res.error = errText;
      res.message = errText;
    }
    return res;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to resend OTP. Please try again.';
    return { success: false, error: msg, message: msg };
  }
}

export async function verifyFireCitizenOtpAction(
  dto: FireVerifyOtpRequest
): Promise<ApiResponse<FireVerifyOtpResponse>> {
  try {
    const res = await fireCitizenAuthService.verifyOtp({
      ...dto,
      purpose: dto.purpose || 'LOGIN',
      moduleCode: dto.moduleCode || 'FIRE_AUDIT',
    });

    if (res.success && res.data) {
      try {
        const cookieStore = await cookies();
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax' as const,
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days session
        };

        if (res.data.token) {
          cookieStore.set(CITIZEN_AUTH_COOKIES.TOKEN, res.data.token, cookieOptions);
          const expUnix = getJwtExpiryUnix(res.data.token);
          if (expUnix) {
            cookieStore.set(CITIZEN_AUTH_COOKIES.TOKEN_EXP, String(expUnix), { ...cookieOptions, httpOnly: false });
          }
        }
        if (res.data.refreshToken) {
          cookieStore.set(CITIZEN_AUTH_COOKIES.REFRESH_TOKEN, res.data.refreshToken, cookieOptions);
        }
        if (res.data.citizenId) {
          cookieStore.set(CITIZEN_AUTH_COOKIES.CITIZEN_ID, String(res.data.citizenId), cookieOptions);
        }
        if (res.data.name) {
          cookieStore.set(CITIZEN_AUTH_COOKIES.CITIZEN_NAME, encodeURIComponent(res.data.name), { ...cookieOptions, httpOnly: false });
        }
        if (res.data.mobileNo) {
          cookieStore.set(CITIZEN_AUTH_COOKIES.CITIZEN_MOBILE, res.data.mobileNo, { ...cookieOptions, httpOnly: false });
        }
        cookieStore.set(CITIZEN_AUTH_COOKIES.IS_LOGGED_IN, 'true', { ...cookieOptions, httpOnly: false });
        cookieStore.set(CITIZEN_AUTH_COOKIES.FIRE_SESSION, 'true', { ...cookieOptions, httpOnly: false });

        // Clean up any stale admin/staff auth_token so it does not shadow citizen session
        try {
          cookieStore.delete({ name: 'auth_token', path: '/' });
        } catch {}
      } catch (e) {
        console.warn('Cookie persistence warning in verifyFireCitizenOtpAction:', e);
      }
    }

    const errText = res.error || res.message;
    if (!res.success && errText) {
      res.error = errText;
      res.message = errText;
    }

    return res;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to verify OTP. Please try again.';
    return { success: false, error: msg, message: msg };
  }
}

export async function getCurrentFireCitizenAction(): Promise<ApiResponse<FireCitizenProfile | null>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CITIZEN_AUTH_COOKIES.TOKEN)?.value;
    if (!token) return { success: false, data: null, message: 'No active citizen session' };
    return await fireCitizenAuthService.getMe(token);
  } catch (err) {
    return { success: false, data: null, message: (err as Error).message || 'Failed to check session' };
  }
}

export async function logoutFireCitizenAction(): Promise<ApiResponse<boolean>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.TOKEN, path: '/' });
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.TOKEN_EXP, path: '/' });
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.REFRESH_TOKEN, path: '/' });
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.CITIZEN_ID, path: '/' });
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.CITIZEN_NAME, path: '/' });
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.CITIZEN_MOBILE, path: '/' });
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.IS_LOGGED_IN, path: '/' });
    cookieStore.delete({ name: CITIZEN_AUTH_COOKIES.FIRE_SESSION, path: '/' });
    return { success: true, data: true, message: 'Signed out successfully' };
  } catch (err: unknown) {
    return { success: false, data: false, message: (err as Error)?.message || 'Sign out failed' };
  }
}
