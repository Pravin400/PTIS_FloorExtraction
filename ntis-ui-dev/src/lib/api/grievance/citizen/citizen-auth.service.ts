/**
 * Citizen Authentication API Service
 * Built on centralized base `apiClient` (@/services/api.service).
 * Handles Anonymous (send-otp, resend-otp, verify-otp) and Authorized (me, profile) endpoints.
 *
 * Path: src/lib/api/grievance/citizen/citizen-auth.service.ts
 */

import { apiClient } from '@/services/api.service';
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

export class CitizenAuthService {
  /**
   * POST /api/CitizenAuth/send-otp (Anonymous)
   */
  async sendOtp(dto: SendOtpRequest): Promise<ApiResponse<SendOtpResponse>> {
    return await apiClient.post<SendOtpResponse>(
      '/CitizenAuth/send-otp',
      {
        mobileNo: dto.mobileNo.trim(),
        name: dto.name ? dto.name.trim() : undefined,
        purpose: dto.purpose || 'LOGIN',
        moduleCode: dto.moduleCode || 'GRV',
        referenceId: dto.referenceId ? dto.referenceId.trim() : undefined,
      },
      undefined,
      false // Anonymous
    );
  }

  /**
   * POST /api/CitizenAuth/resend-otp (Anonymous)
   */
  async resendOtp(dto: ResendOtpRequest): Promise<ApiResponse<ResendOtpResponse>> {
    return await apiClient.post<ResendOtpResponse>(
      '/CitizenAuth/resend-otp',
      {
        mobileNo: dto.mobileNo.trim(),
        name: dto.name ? dto.name.trim() : undefined,
        purpose: dto.purpose || 'LOGIN',
        moduleCode: dto.moduleCode || 'GRV',
        referenceId: dto.referenceId ? dto.referenceId.trim() : undefined,
      },
      undefined,
      false // Anonymous
    );
  }

  /**
   * POST /api/CitizenAuth/verify-otp (Anonymous)
   */
  async verifyOtp(dto: VerifyOtpRequest): Promise<ApiResponse<VerifyOtpResponse>> {
    return await apiClient.post<VerifyOtpResponse>(
      '/CitizenAuth/verify-otp',
      {
        mobileNo: dto.mobileNo.trim(),
        otp: dto.otp.trim(),
        name: dto.name ? dto.name.trim() : undefined,
        purpose: dto.purpose || 'LOGIN',
        moduleCode: dto.moduleCode || 'GRV',
        referenceId: dto.referenceId ? dto.referenceId.trim() : undefined,
      },
      undefined,
      false // Anonymous
    );
  }

  /**
   * GET /api/CitizenAuth/me (Authorized)
   */
  async getMe(token?: string): Promise<ApiResponse<CitizenProfile | null>> {
    const opt: RequestInit | undefined = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;

    return await apiClient.get<CitizenProfile | null>(
      '/CitizenAuth/me',
      opt,
      true // Authorized
    );
  }

  /**
   * PUT /api/CitizenAuth/profile (Authorized)
   */
  async updateProfile(
    dto: UpdateCitizenProfileRequest,
    token?: string
  ): Promise<ApiResponse<CitizenProfile>> {
    const opt: RequestInit | undefined = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;

    return await apiClient.put<CitizenProfile>(
      '/CitizenAuth/profile',
      { name: dto.name.trim() },
      opt,
      true // Authorized
    );
  }

  /**
   * GET /api/CitizenMaster/by-mobile/{mobileNo} (Anonymous)
   * Check if a citizen already exists
   */
  async getCitizenByMobile(mobileNo: string): Promise<ApiResponse<CitizenMasterRecord | null>> {
    return await apiClient.get<CitizenMasterRecord | null>(
      `/CitizenMaster/by-mobile/${encodeURIComponent(mobileNo.trim())}`,
      undefined,
      false // Anonymous
    );
  }

  /**
   * POST /api/CitizenMaster (Anonymous)
   * Register a new citizen in CitizenMaster
   */
  async createCitizen(dto: CreateCitizenMasterRequest): Promise<ApiResponse<CitizenMasterRecord>> {
    return await apiClient.post<CitizenMasterRecord>(
      '/CitizenMaster',
      {
        name: dto.name.trim(),
        mobileNo: dto.mobileNo.trim(),
        isActive: dto.isActive ?? true,
        ...(dto.createdBy != null ? { createdBy: dto.createdBy, CreatedBy: dto.createdBy } : {}),
      },
      undefined,
      false // Anonymous
    );
  }
}

export const citizenAuthService = new CitizenAuthService();
