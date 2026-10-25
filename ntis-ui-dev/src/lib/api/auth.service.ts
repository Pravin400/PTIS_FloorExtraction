import { getAppConfig } from '@/config/app.config';
import type {
  AuthLoginApiBody,
  LogoutRequest,
  UlbConfigApiBody,
  VerifyTwoFactorRequest,
  VerifyLoginOtpRequest,
  ForgotPasswordAvailableMethodsRequest,
  ForgotPasswordAvailableMethodsApiBody,
  ForgotPasswordRequest,
  ForgotPasswordApiBody,
  VerifyForgotPasswordOtpRequest,
  VerifyForgotPasswordOtpApiBody,
  ResetPasswordRequest,
  ResetPasswordApiBody,
  ChangePasswordRequest,
  ChangePasswordApiBody,
} from '@/types/login.types';
import { ApiResponse } from '@/types/common.types';

// ---------------------------------------------------------------------------
// Server-side auth / ULB calls (Next.js server actions, RSC)
//
// Plain fetch in api.service.ts fails on local ASP.NET HTTPS (self-signed cert).
// Auth endpoints use this layer: SERVER_API_BASE_URL + relaxed TLS for localhost in dev.
// ---------------------------------------------------------------------------

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function getAuthApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const override = process.env.SERVER_API_BASE_URL?.trim();
    if (override) return trimTrailingSlash(override);
  }
  return trimTrailingSlash(getAppConfig().api.baseUrl);
}

const LOCAL_HTTPS_RE = /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;

/** Reused for dev localhost relaxed TLS so connection pools are not recreated per request. */
let relaxedTlsDispatcher: import('undici').Dispatcher | undefined;

async function authServerFetch(url: string, init: RequestInit): Promise<Response> {
  const useRelaxedTls =
    typeof window === 'undefined' &&
    process.env.NTIS_STRICT_LOCAL_TLS !== '1' &&
    (LOCAL_HTTPS_RE.test(url) ||
      process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ||
      process.env.NODE_ENV === 'development');

  if (useRelaxedTls) {
    const undici = await import('undici');
    if (!relaxedTlsDispatcher) {
      relaxedTlsDispatcher = new undici.Agent({ connect: { rejectUnauthorized: false } });
    }
    const res = await undici.fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.body === null ? undefined : init.body,
      signal: init.signal,
      dispatcher: relaxedTlsDispatcher,
    } as import('undici').RequestInit);
    return res as unknown as Response;
  }

  return fetch(url, { ...init, cache: 'no-store' });
}

async function authJsonRequest<T>(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<ApiResponse<T>> {
  const timeout = getAppConfig().api.timeout;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const baseUrl = getAuthApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  try {
    const response = await authServerFetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...extraHeaders,
      },
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data: unknown;
    if (text.trim()) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        return {
          success: false,
          error: 'Invalid JSON from API',
          statusCode: response.status,
        };
      }
    } else {
      data = undefined;
    }

    if (!response.ok) {
      const msg =
        data && typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message?: unknown }).message)
          : undefined;
      return {
        success: false,
        error: msg || 'An error occurred',
        statusCode: response.status,
        // Error responses (e.g. 401 with a bare { message, remainingLoginAttempts } body) still
        // carry fields beyond `message` — preserve the parsed body so callers can read them.
        data: data as T,
      };
    }

    return {
      success: true,
      data: data as T,
      statusCode: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

function readUlbField(obj: Record<string, unknown>, camel: string, pascal: string): unknown {
  if (Object.prototype.hasOwnProperty.call(obj, camel) && obj[camel] != null) return obj[camel];
  if (Object.prototype.hasOwnProperty.call(obj, pascal) && obj[pascal] != null) return obj[pascal];
  return undefined;
}

function ulbStr(v: unknown): string {
  return v == null ? '' : String(v);
}

function ulbOptionalStr(value: unknown): string | null {
  return value == null ? null : String(value);
}

/** Accepts flat camelCase, flat PascalCase (.NET Newtonsoft), or wrapped `{ data }` / `{ result }`. */
function parseUlbConfigPayload(data: unknown): UlbConfigApiBody | null {
  if (data === null || data === undefined || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  let o: Record<string, unknown> = data as Record<string, unknown>;

  const unwrap = (key: string) => {
    const inner = o[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const rec = inner as Record<string, unknown>;
      if (rec.ulbId !== undefined || rec.UlbId !== undefined) {
        o = rec;
      }
    }
  };
  unwrap('data');
  unwrap('result');
  unwrap('value');

  const ulbIdRaw = readUlbField(o, 'ulbId', 'UlbId');
  const ulbId = typeof ulbIdRaw === 'number' ? ulbIdRaw : Number(ulbIdRaw);
  if (!Number.isFinite(ulbId) || ulbId < 1) {
    return null;
  }

  return {
    ulbId,
    ulbCode: ulbStr(readUlbField(o, 'ulbCode', 'UlbCode')),
    ulbName: ulbStr(readUlbField(o, 'ulbName', 'UlbName')),
    ulbNameLocal: ulbOptionalStr(readUlbField(o, 'ulbNameLocal', 'UlbNameLocal')),
    ulbLogo: ulbOptionalStr(readUlbField(o, 'ulbLogo', 'UlbLogo')),
    ulbBackground: ulbOptionalStr(readUlbField(o, 'ulbBackground', 'UlbBackground')),
    emailId: ulbOptionalStr(readUlbField(o, 'emailId', 'EmailId')),
    mobileNo: ulbOptionalStr(readUlbField(o, 'mobileNo', 'MobileNo')),
    websiteUrl: ulbOptionalStr(readUlbField(o, 'websiteUrl', 'WebsiteUrl')),
    ulbAddress: ulbOptionalStr(readUlbField(o, 'ulbAddress', 'UlbAddress')),
    state: ulbOptionalStr(readUlbField(o, 'state', 'State')),
    district: ulbOptionalStr(readUlbField(o, 'district', 'District')),
  };
}

export const authService = {
  /**
   * POST `/Auth/login` — body `{ username, password }` (JSON camelCase).
   * `ApiResponse.data` is the parsed JSON body (includes nested `success`, `token`, …).
   */
  async validateCredentials(credentials: {
    username: string;
    password: string;
  }): Promise<ApiResponse<AuthLoginApiBody>> {
    return authJsonRequest<AuthLoginApiBody>('POST', '/Auth/login', credentials);
  },

  /**
   * POST `/Auth/two-factor/verify` — body `{ challengeId, code, useRecoveryCode }`.
   * Completes a login that returned `requiresTwoFactor`. `ApiResponse.data` has the same shape
   * as `/Auth/login`'s response (token/refreshToken populated only on success).
   */
  async verifyTwoFactor(request: VerifyTwoFactorRequest): Promise<ApiResponse<AuthLoginApiBody>> {
    return authJsonRequest<AuthLoginApiBody>('POST', '/Auth/two-factor/verify', request);
  },

  /**
   * POST `/Auth/login-otp/verify` — body `{ challengeId, code }`.
   * Completes a login that returned `requiresTwoFactor` with `twoFactorMethod: "otp"` (the
   * config-driven email/SMS OTP layer, distinct from authenticator-app TOTP). Same response
   * shape as `/Auth/login`.
   */
  async verifyLoginOtp(request: VerifyLoginOtpRequest): Promise<ApiResponse<AuthLoginApiBody>> {
    return authJsonRequest<AuthLoginApiBody>('POST', '/Auth/login-otp/verify', request);
  },

  /**
   * POST `/Auth/forgot-password/methods` — body `{ usernameOrEmail }`. Looks up which OTP
   * delivery methods are actually usable for this account before the user commits to one. An
   * empty `methods` array is the generic, enumeration-safe "nothing available" response.
   */
  async getForgotPasswordMethods(
    request: ForgotPasswordAvailableMethodsRequest
  ): Promise<ApiResponse<ForgotPasswordAvailableMethodsApiBody>> {
    return authJsonRequest<ForgotPasswordAvailableMethodsApiBody>('POST', '/Auth/forgot-password/methods', request);
  },

  /**
   * POST `/Auth/forgot-password` — body `{ usernameOrEmail }`. Starts the self-service
   * forgot-password flow. Gated server-side by SECURITY_AUTH "2FALOGINFORFPASS" — returns
   * `success:false` only when the feature itself is disabled, otherwise always `success:true`
   * with a generic message (a missing `challengeId` means no OTP was actually sent, without
   * revealing why, to avoid account enumeration).
   */
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ApiResponse<ForgotPasswordApiBody>> {
    return authJsonRequest<ForgotPasswordApiBody>('POST', '/Auth/forgot-password', request);
  },

  /**
   * POST `/Auth/forgot-password/verify-otp` — body `{ challengeId, code }`. On success returns a
   * short-lived `resetToken` authorizing exactly one call to `resetPassword`.
   */
  async verifyForgotPasswordOtp(
    request: VerifyForgotPasswordOtpRequest
  ): Promise<ApiResponse<VerifyForgotPasswordOtpApiBody>> {
    return authJsonRequest<VerifyForgotPasswordOtpApiBody>(
      'POST',
      '/Auth/forgot-password/verify-otp',
      request
    );
  },

  /**
   * POST `/Auth/forgot-password/reset` — body `{ resetToken, newPassword }`. Completes the
   * forgot-password flow; the backend revokes all of the user's existing sessions on success.
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<ResetPasswordApiBody>> {
    return authJsonRequest<ResetPasswordApiBody>('POST', '/Auth/forgot-password/reset', request);
  },

  /**
   * POST `/Auth/change-password` — body `{ currentPassword, newPassword, confirmPassword }`.
   * Changes password for the authenticated user. Requires valid JWT Bearer token.
   */
  async changePassword(
    request: ChangePasswordRequest,
    token?: string
  ): Promise<ApiResponse<ChangePasswordApiBody>> {
    return authJsonRequest<ChangePasswordApiBody>(
      'POST',
      '/Auth/change-password',
      request,
      token ? { Authorization: `Bearer ${token}` } : undefined
    );
  },

  async logout(sessionId: string, token: string): Promise<ApiResponse<void>> {
    return authJsonRequest<void>('POST', '/Auth/logout', { sessionId } as LogoutRequest, {
      Authorization: `Bearer ${token}`,
    });
  },

  /** GET `/UlbConfig` — council branding for login UI and cookies. */
  async getUlbConfig(): Promise<ApiResponse<UlbConfigApiBody>> {
    const res = await authJsonRequest<unknown>('GET', '/UlbConfig');
    if (!res.success || res.data === undefined) {
      return { success: false, error: res.error };
    }
    const parsed = parseUlbConfigPayload(res.data);
    if (!parsed) {
      return {
        success: false,
        error: 'ULB response shape not recognized (expected ulbId, ulbName, …)',
      };
    }
    return { success: true, data: parsed };
  },
};
