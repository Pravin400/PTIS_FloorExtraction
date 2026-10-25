import type { ChangeEvent, Dispatch, FocusEvent, SetStateAction } from 'react';
import { UlbMaster } from '@/types/master.types';

// ---------------------------------------------------------------------------
// Page & Component Props
// ---------------------------------------------------------------------------

export interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Resolved on the server (`getTranslations`) so the login shell ships real copy in the RSC HTML. */
export interface LoginFormCopy {
  loginTitle: string;
  username: string;
  usernamePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  signIn: string;
  showPassword: string;
  hidePassword: string;
  forgotPassword?: string;
  capsLockOn?: string;
}

export interface LoginFormProps {
  username?: string;
  locale: string;
  errorMessage?: string;
  /** SSR flash (e.g. query-driven messages). */
  infoMessage?: string;
  ulbData?: UlbMaster;
  /** Server-resolved UI strings for SSR + shared client fields. */
  copy: LoginFormCopy;
}

// ---------------------------------------------------------------------------
// `useLoginForm` hook
// ---------------------------------------------------------------------------

export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
}

export interface UseLoginFormOptions {
  /** Initial username value (e.g., from URL param or cookie) */
  initialUsername?: string;
  /** Callback when form is submitted successfully (before action) */
  onBeforeSubmit?: (data: LoginFormData) => void;
}

export interface UseLoginFormReturn {
  /** Current form data */
  formData: LoginFormData;
  /** Current validation errors */
  errors: LoginFormErrors;
  /** Which fields have been touched/interacted with */
  touched: Record<string, boolean>;
  /** Whether form has been submitted at least once */
  submittedOnce: boolean;
  /** Handle input change with sanitization */
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Handle input blur for validation */
  handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
  /** Check if error should be shown for a field */
  showError: (field: keyof LoginFormErrors) => boolean;
  /** Validate entire form, returns true if valid */
  validateForm: () => boolean;
  /** Reset form to initial state */
  resetForm: () => void;
  /** Set form data directly (for external updates) */
  setFormData: Dispatch<SetStateAction<LoginFormData>>;
  /** Mark form as submitted */
  markSubmitted: () => void;
  /** Check if form is valid (no errors) */
  isValid: boolean;
  /** Check if form can be submitted (has required data) */
  canSubmit: boolean;
}

// ---------------------------------------------------------------------------
// API Request DTOs
// ---------------------------------------------------------------------------

export interface LogoutRequest {
  sessionId: string;
}

export interface ChangePasswordRequest {
  userName?: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordApiBody {
  success: boolean;
  message?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// API Response DTOs
// ---------------------------------------------------------------------------

export interface UserInfo {
  userId: number;
  userName: string;
  userCode: string;
  name: string;
  email: string;
  phoneNumber: string;
  alternatePhoneNumber: string;
  address: string;
  preferredLanguage: string;
  lastLoginAt: string;
  roles: string[];
  permissions: string[];
}

/**
 * POST `/Auth/login` — response JSON when HTTP succeeds.
 *
 * When `requiresTwoFactor` is true, the account has authenticator-app 2FA enabled: `token` and
 * `refreshToken` are guaranteed absent and no session may be established yet. The caller must
 * continue with `challengeId` via `POST /Auth/two-factor/verify`.
 */
export interface AuthLoginApiBody {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userId?: number;
  username?: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  message?: string;
  expiresAt?: string;
  requiresPasswordChange?: boolean;
  requiresTwoFactor?: boolean;
  /**
   * Which verify flow the pending challenge belongs to when `requiresTwoFactor` is true:
   * `"totp"` (authenticator app / recovery code, via `/Auth/two-factor/verify`) or `"otp"`
   * (emailed/texted one-time code, via `/Auth/login-otp/verify`).
   */
  twoFactorMethod?: 'totp' | 'otp';
  /** Opaque, one-time-use challenge id. Only present when `requiresTwoFactor` is true. */
  challengeId?: string;
  /**
   * ISO-8601 expiry of the pending challenge, in server-local time (no UTC offset — do not
   * assume UTC). Only present when `requiresTwoFactor` is true.
   */
  challengeExpiresAt?: string;
  /**
   * True when an administrator has required this account to set up 2FA but the user hasn't
   * enrolled yet. Unlike `requiresTwoFactor`, this does NOT block login — `token`/`refreshToken`
   * are present as normal. It's a signal to route the user to authenticator setup afterwards.
   */
  requiresTwoFactorSetup?: boolean;
  /**
   * Number of further wrong-password attempts allowed before the account locks. Only present
   * when this attempt's password was wrong and the account isn't locked yet (`success` is
   * false, `message` is a generic invalid-credentials message).
   */
  remainingLoginAttempts?: number;
}

/** POST `/Auth/two-factor/verify` — request body. */
export interface VerifyTwoFactorRequest {
  challengeId: string;
  code: string;
  useRecoveryCode: boolean;
}

/** POST `/Auth/login-otp/verify` — request body. */
export interface VerifyLoginOtpRequest {
  challengeId: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Forgot password (self-service, config-gated by SECURITY_AUTH "2FALOGINFORFPASS")
// ---------------------------------------------------------------------------

/** Delivery method for the forgot-password OTP, as returned by `/Auth/forgot-password/methods`. */
export type ForgotPasswordMethod = 'Email' | 'Sms' | 'Authenticator';

/** POST `/Auth/forgot-password/methods` — request body. */
export interface ForgotPasswordAvailableMethodsRequest {
  usernameOrEmail: string;
}

/**
 * POST `/Auth/forgot-password/methods` — response JSON. An empty `methods` array collapses
 * "feature disabled", "account not found", and "account has no usable channel" into one generic
 * outcome — same enumeration-safe posture as the rest of the flow.
 */
export interface ForgotPasswordAvailableMethodsApiBody {
  success: boolean;
  message?: string;
  methods: ForgotPasswordMethod[];
  maskedEmail?: string;
  maskedMobile?: string;
}

/** POST `/Auth/forgot-password` — request body. */
export interface ForgotPasswordRequest {
  usernameOrEmail: string;
  method: ForgotPasswordMethod;
}

/**
 * POST `/Auth/forgot-password` — response JSON. `message` is deliberately generic and does not
 * reveal whether the account exists. `challengeId` is only present when an OTP was actually sent.
 */
export interface ForgotPasswordApiBody {
  success: boolean;
  message?: string;
  challengeId?: string;
  /** ISO-8601 expiry of the challenge, in server-local time (no UTC offset — do not assume UTC). */
  challengeExpiresAt?: string;
}

/** POST `/Auth/forgot-password/verify-otp` — request body. */
export interface VerifyForgotPasswordOtpRequest {
  challengeId: string;
  code: string;
}

/**
 * POST `/Auth/forgot-password/verify-otp` — response JSON. `resetToken` is only present on
 * success and authorizes exactly one call to `/Auth/forgot-password/reset`.
 */
export interface VerifyForgotPasswordOtpApiBody {
  success: boolean;
  message?: string;
  resetToken?: string;
  /** ISO-8601 expiry of the reset token, in server-local time (no UTC offset — do not assume UTC). */
  resetTokenExpiresAt?: string;
}

/** POST `/Auth/forgot-password/reset` — request body. */
export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

/** POST `/Auth/forgot-password/reset` — response JSON. */
export interface ResetPasswordApiBody {
  success: boolean;
  message?: string;
}

/** GET `/UlbConfig` — response JSON when HTTP succeeds. */
export interface UlbConfigApiBody {
  ulbId: number;
  ulbCode: string;
  ulbName: string;
  ulbNameLocal?: string | null;
  ulbLogo?: string | null;
  ulbBackground?: string | null;
  emailId?: string | null;
  mobileNo?: string | null;
  websiteUrl?: string | null;
  ulbAddress?: string | null;
  state?: string | null;
  district?: string | null;
}

export interface TokenValidationResponse {
  isValid: boolean;
  user?: UserInfo;
  message: string | null;
}

export interface LoginAttempt {
  id: number;
  ipAddress: string | null;
  userAgent: string | null;
  attemptedAt: string;
  wasSuccessful: boolean;
  isCurrentSession: boolean;
}
