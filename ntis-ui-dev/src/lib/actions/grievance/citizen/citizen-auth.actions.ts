'use server';

/**
 * Citizen Authentication Server Actions (Layer 2 - Next.js RPC)
 * Path: src/lib/actions/grievance/citizen/citizen-auth.actions.ts
 */

import { cookies } from 'next/headers';
import { citizenAuthService } from '@/lib/api/grievance/citizen/citizen-auth.service';
import { getJwtExpiryUnix } from '@/lib/utils/jwt-expiry';
import type { ApiResponse } from '@/types/common.types';
import type {
  SendOtpRequest,
  SendOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  CitizenProfile,
  UpdateCitizenProfileRequest,
  CitizenMasterRecord,
  CreateCitizenMasterRequest,
} from '@/types/grievance/citizen-auth.types';

const CITIZEN_AUTH_COOKIES = {
  TOKEN: 'citizen_token',
  TOKEN_EXP: 'citizen_token_exp',
  REFRESH_TOKEN: 'citizen_refresh_token',
  CITIZEN_ID: 'citizen_id',
  CITIZEN_NAME: 'citizen_name',
  CITIZEN_MOBILE: 'citizen_mobile',
  IS_LOGGED_IN: 'citizen_is_logged_in',
} as const;

export async function sendCitizenOtpAction(
  dto: SendOtpRequest
): Promise<ApiResponse<SendOtpResponse>> {
  try {
    const res = await citizenAuthService.sendOtp(dto);
    const errText = res.error || res.message;
    if (!res.success && errText) {
      res.error = errText;
      res.message = errText;
    }
    return res;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to send OTP. Please try again.';
    console.error('sendCitizenOtpAction exception:', err);
    return { success: false, error: msg, message: msg };
  }
}

export async function resendCitizenOtpAction(
  dto: ResendOtpRequest
): Promise<ApiResponse<ResendOtpResponse>> {
  try {
    const res = await citizenAuthService.resendOtp(dto);
    const errText = res.error || res.message;
    if (!res.success && errText) {
      res.error = errText;
      res.message = errText;
    }
    return res;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to resend OTP. Please try again.';
    console.error('resendCitizenOtpAction exception:', err);
    return { success: false, error: msg, message: msg };
  }
}

export async function verifyCitizenOtpAction(
  dto: VerifyOtpRequest
): Promise<ApiResponse<VerifyOtpResponse>> {
  const res = await citizenAuthService.verifyOtp(dto);

  if (res.success && res.data) {
    try {
      const cookieStore = await cookies();
      const isSecure = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_BASE_URL?.includes('localhost');
      const cookieOptions = {
        httpOnly: true,
        secure: isSecure,
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
      const resolvedCitizenId =
        res.data.citizenId ?? res.data.CitizenId ?? res.data.id ?? res.data.Id;
      if (resolvedCitizenId) {
        cookieStore.set(CITIZEN_AUTH_COOKIES.CITIZEN_ID, String(resolvedCitizenId), { ...cookieOptions, httpOnly: false });
      }
      if (res.data.name) {
        cookieStore.set(CITIZEN_AUTH_COOKIES.CITIZEN_NAME, encodeURIComponent(res.data.name), { ...cookieOptions, httpOnly: false });
      }
      if (res.data.mobileNo) {
        cookieStore.set(CITIZEN_AUTH_COOKIES.CITIZEN_MOBILE, res.data.mobileNo, { ...cookieOptions, httpOnly: false });
      }
      cookieStore.set(CITIZEN_AUTH_COOKIES.IS_LOGGED_IN, 'true', { ...cookieOptions, httpOnly: false });

      // Clean up any stale admin/staff auth_token so it does not shadow citizen session
      try {
        cookieStore.delete({ name: 'auth_token', path: '/' });
      } catch {}
    } catch (e) {
      console.warn('Cookie persistence warning in verifyCitizenOtpAction:', e);
    }
  }

  return res;
}

export async function getCurrentCitizenAction(): Promise<ApiResponse<CitizenProfile | null>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CITIZEN_AUTH_COOKIES.TOKEN)?.value;
    if (!token) return { success: false, data: null, message: 'No active citizen session' };
    return await citizenAuthService.getMe(token);
  } catch (err) {
    return { success: false, data: null, message: (err as Error).message || 'Failed to check session' };
  }
}

export async function updateCitizenProfileAction(
  dto: UpdateCitizenProfileRequest
): Promise<ApiResponse<CitizenProfile>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CITIZEN_AUTH_COOKIES.TOKEN)?.value;
  return await citizenAuthService.updateProfile(dto, token);
}

export async function logoutCitizenAction(): Promise<ApiResponse<boolean>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(CITIZEN_AUTH_COOKIES.TOKEN);
    cookieStore.delete(CITIZEN_AUTH_COOKIES.TOKEN_EXP);
    cookieStore.delete(CITIZEN_AUTH_COOKIES.REFRESH_TOKEN);
    cookieStore.delete(CITIZEN_AUTH_COOKIES.CITIZEN_ID);
    cookieStore.delete(CITIZEN_AUTH_COOKIES.CITIZEN_NAME);
    cookieStore.delete(CITIZEN_AUTH_COOKIES.CITIZEN_MOBILE);
    cookieStore.delete(CITIZEN_AUTH_COOKIES.IS_LOGGED_IN);
    return { success: true, data: true };
  } catch {
    return { success: false, data: false, message: 'Logout failed' };
  }
}

export async function checkCitizenByMobileAction(
  mobileNo: string
): Promise<ApiResponse<CitizenMasterRecord | null>> {
  try {
    return await citizenAuthService.getCitizenByMobile(mobileNo);
  } catch (err) {
    return { success: false, data: null, message: (err as Error).message || 'Failed to check citizen existence' };
  }
}

export async function createCitizenMasterAction(
  dto: CreateCitizenMasterRequest
): Promise<ApiResponse<CitizenMasterRecord>> {
  try {
    return await citizenAuthService.createCitizen(dto);
  } catch (err) {
    return {
      success: false,
      data: { name: dto.name, mobileNo: dto.mobileNo, isActive: true },
      message: (err as Error).message || 'Failed to register citizen',
    };
  }
}
