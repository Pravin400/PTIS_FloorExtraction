/**
 * Citizen Authentication Types for Fire Audit
 * Symmetrical to Grievance Citizen Auth Architecture
 *
 * Path: src/types/fire-audit/citizen-auth.types.ts
 */

export type FireCitizenOtpPurpose = 'LOGIN' | 'REGISTER' | string;
export type FireCitizenModuleCode = 'FIRE_AUDIT' | 'FA' | string;

export interface FireSendOtpRequest {
  mobileNo: string;
  name?: string;
  purpose?: FireCitizenOtpPurpose;
  moduleCode?: FireCitizenModuleCode;
  referenceId?: string;
}

export interface FireSendOtpResponse {
  success: boolean;
  message: string;
  maskedMobileNo?: string;
  expiresInSeconds?: number;
  otpExpiryMinutes?: number;
  resendInSeconds?: number;
  isRegisteredCitizen?: boolean;
  debugOtp?: string;
  purpose?: string;
  moduleCode?: string;
  referenceId?: string;
}

export interface FireResendOtpRequest {
  mobileNo: string;
  name?: string;
  purpose?: FireCitizenOtpPurpose;
  moduleCode?: FireCitizenModuleCode;
  referenceId?: string;
}

export interface FireResendOtpResponse {
  success: boolean;
  message: string;
  maskedMobileNo?: string;
  expiresInSeconds?: number;
  otpExpiryMinutes?: number;
  resendInSeconds?: number;
  isRegisteredCitizen?: boolean;
  debugOtp?: string;
  purpose?: string;
  moduleCode?: string;
  referenceId?: string;
}

export interface FireVerifyOtpRequest {
  mobileNo: string;
  otp: string;
  name?: string;
  purpose?: FireCitizenOtpPurpose;
  moduleCode?: FireCitizenModuleCode;
  referenceId?: string;
}

export interface FireVerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  isNewUser?: boolean;
  citizenId?: number;
  name?: string;
  mobileNo?: string;
  isVerified?: boolean;
  lastLoginAt?: string;
}

export interface FireCitizenProfile {
  id: number;
  name: string;
  mobileNo: string;
  isVerified: boolean;
  lastLoginAt?: string;
  createdDate?: string;
}

export interface FireCitizenMasterRecord {
  id?: number;
  name: string;
  mobileNo: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdBy?: number;
  createdDate?: string;
  modifiedBy?: number;
  modifiedDate?: string;
}

export interface CreateFireCitizenMasterRequest {
  name: string;
  mobileNo: string;
  isActive?: boolean;
  createdBy?: number;
}
