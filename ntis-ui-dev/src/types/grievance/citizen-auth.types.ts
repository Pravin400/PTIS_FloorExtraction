/**
 * Citizen Authentication Types (CitizenAuth API)
 */

export type CitizenOtpPurpose = 'LOGIN' | 'SUBMIT_GRIEVANCE' | 'RTS_APPLICATION' | string;
export type CitizenModuleCode = 'GRV' | 'RTS' | 'PTIS' | 'WTIS' | string;

export interface SendOtpRequest {
  mobileNo: string;
  name?: string;
  purpose?: CitizenOtpPurpose;
  moduleCode?: CitizenModuleCode;
  referenceId?: string;
}

export interface SendOtpResponse {
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

export interface ResendOtpRequest {
  mobileNo: string;
  name?: string;
  purpose?: CitizenOtpPurpose;
  moduleCode?: CitizenModuleCode;
  referenceId?: string;
}

export interface ResendOtpResponse {
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

export interface VerifyOtpRequest {
  mobileNo: string;
  otp: string;
  name?: string;
  purpose?: CitizenOtpPurpose;
  moduleCode?: CitizenModuleCode;
  referenceId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  isNewUser?: boolean;
  citizenId?: number;
  CitizenId?: number;
  id?: number;
  Id?: number;
  name?: string;
  mobileNo?: string;
  isVerified?: boolean;
  lastLoginAt?: string;
}

export interface CitizenProfile {
  id: number;
  name: string;
  mobileNo: string;
  isVerified: boolean;
  lastLoginAt?: string;
  createdDate?: string;
  activeGrievancesCount?: number;
  totalGrievancesCount?: number;
}

export interface UpdateCitizenProfileRequest {
  name: string;
}

export interface CitizenMasterRecord {
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

export interface CreateCitizenMasterRequest {
  name: string;
  mobileNo: string;
  isActive?: boolean;
  createdBy?: number;
}

export interface CitizenAuthApiError {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}
