/**
 * Fire Audit Citizen Authentication API Service
 * Built on centralized base `apiClient` (@/services/api.service).
 * Follows the proven Grievance citizen authentication pattern.
 *
 * Path: src/lib/api/fire-audit/citizen/citizen-auth.service.ts
 */

import { apiClient } from '@/services/api.service';
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
  CreateFireCitizenMasterRequest,
} from '@/types/fire-audit/citizen-auth.types';

export class FireCitizenAuthService {
  /**
   * GET /api/CitizenMaster/by-mobile/{mobileNo} (Anonymous)
   * Checks if citizen with this mobile number already exists
   */
  async getCitizenByMobile(mobileNo: string): Promise<ApiResponse<FireCitizenMasterRecord | null>> {
    return await apiClient.get<FireCitizenMasterRecord | null>(
      `/CitizenMaster/by-mobile/${encodeURIComponent(mobileNo.trim())}`,
      undefined,
      false // Anonymous
    );
  }

  /**
   * POST /api/CitizenAuth/send-otp (Anonymous)
   */
  async sendOtp(dto: FireSendOtpRequest): Promise<ApiResponse<FireSendOtpResponse>> {
    return await apiClient.post<FireSendOtpResponse>(
      '/CitizenAuth/send-otp',
      {
        mobileNo: dto.mobileNo.trim(),
        name: dto.name ? dto.name.trim() : undefined,
        purpose: dto.purpose || 'LOGIN',
        moduleCode: dto.moduleCode || 'FIRE_AUDIT',
        referenceId: dto.referenceId ? dto.referenceId.trim() : undefined,
      },
      undefined,
      false // Anonymous
    );
  }

  /**
   * POST /api/CitizenAuth/resend-otp (Anonymous)
   */
  async resendOtp(dto: FireResendOtpRequest): Promise<ApiResponse<FireResendOtpResponse>> {
    return await apiClient.post<FireResendOtpResponse>(
      '/CitizenAuth/resend-otp',
      {
        mobileNo: dto.mobileNo.trim(),
        name: dto.name ? dto.name.trim() : undefined,
        purpose: dto.purpose || 'LOGIN',
        moduleCode: dto.moduleCode || 'FIRE_AUDIT',
        referenceId: dto.referenceId ? dto.referenceId.trim() : undefined,
      },
      undefined,
      false // Anonymous
    );
  }

  /**
   * POST /api/CitizenAuth/verify-otp (Anonymous)
   * Verifies OTP, inserts record in CitizenMaster if new user, returns JWT token
   */
  async verifyOtp(dto: FireVerifyOtpRequest): Promise<ApiResponse<FireVerifyOtpResponse>> {
    return await apiClient.post<FireVerifyOtpResponse>(
      '/CitizenAuth/verify-otp',
      {
        mobileNo: dto.mobileNo.trim(),
        otp: dto.otp.trim(),
        name: dto.name ? dto.name.trim() : undefined,
        purpose: dto.purpose || 'LOGIN',
        moduleCode: dto.moduleCode || 'FIRE_AUDIT',
        referenceId: dto.referenceId ? dto.referenceId.trim() : undefined,
      },
      undefined,
      false // Anonymous
    );
  }

  /**
   * POST /api/CitizenMaster (Anonymous / Fallback)
   * Directly register/insert citizen in CitizenMaster if needed
   */
  async createCitizen(dto: CreateFireCitizenMasterRequest): Promise<ApiResponse<FireCitizenMasterRecord>> {
    return await apiClient.post<FireCitizenMasterRecord>(
      '/CitizenMaster',
      {
        name: dto.name.trim(),
        mobileNo: dto.mobileNo.trim(),
        isActive: dto.isActive ?? true,
        createdBy: dto.createdBy ?? null,
      },
      undefined,
      false // Anonymous
    );
  }

  /**
   * GET /api/CitizenAuth/me (Authorized)
   * Retrieves profile of authenticated citizen
   */
  async getMe(token?: string): Promise<ApiResponse<FireCitizenProfile | null>> {
    const opt: RequestInit | undefined = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;

    return await apiClient.get<FireCitizenProfile | null>(
      '/CitizenAuth/me',
      opt,
      true // Authorized
    );
  }
}

export const fireCitizenAuthService = new FireCitizenAuthService();
