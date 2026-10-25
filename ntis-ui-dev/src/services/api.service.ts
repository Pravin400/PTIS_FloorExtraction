/**
 * API Client Service
 * Centralized HTTP client for making API requests with built-in Auth, TLS, and error sanitization.
 */
import 'server-only';
import { cookies } from 'next/headers';
import { getAppConfig } from '@/config/app.config';
import type { ApiResponse } from '@/types/common.types';
import { handleHttpUnauthorized } from '@/lib/utils/session-unauthorized.server';
import { isAccessTokenExpired } from '@/lib/utils/jwt-expiry';

export const LOCAL_HTTPS_RE = /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;

interface ApiError extends Error {
  httpStatus?: number;
  rawText?: string;
}

let relaxedTlsDispatcher: unknown;

async function serverFetch(url: string, init: RequestInit): Promise<Response> {
  const useRelaxedTls =
    typeof window === 'undefined' &&
    process.env.NTIS_STRICT_LOCAL_TLS !== '1' &&
    (LOCAL_HTTPS_RE.test(url) ||
      process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ||
      process.env.NODE_ENV === 'development');

  if (useRelaxedTls) {
    const { Agent, fetch: uFetch } = await import('undici');
    relaxedTlsDispatcher ??= new Agent({ connect: { rejectUnauthorized: false } });
    return uFetch(url, {
      ...init,
      body: init.body ?? undefined,
      dispatcher: relaxedTlsDispatcher,
    } as unknown as import('undici').RequestInit) as unknown as Promise<Response>;
  }
  return fetch(url, init);
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private publicEndpoints = [
    '/Auth/login', '/Auth/verify-otp', '/Auth/verify-login-otp', '/Auth/forgot-password',
    '/Auth/reset-password', '/Auth/send-otp', '/Auth/resend-otp', '/Auth/refresh',
    '/Auth/ulb-config', '/Auth/validate-reset-token', '/UlbConfig', '/CitizenAuth/send-otp',
    '/CitizenAuth/resend-otp', '/CitizenAuth/verify-otp', '/CitizenMaster/by-mobile', '/CitizenMaster',
    '/grievance-ai', '/GrievanceDepartment', '/GrievanceType',
    '/api/GrievanceApplication/public', '/GrievanceApplication/public',
  ];

  constructor() {
    const config = getAppConfig();
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  private getBaseUrl(): string {
    try {
      const config = getAppConfig();
      if (config?.api?.baseUrl) return config.api.baseUrl;
    } catch {}
    return process.env.NEXT_PUBLIC_API_BASE_URL || this.baseUrl;
  }

  private isPublicEndpoint(endpoint: string): boolean {
    const path = endpoint.toLowerCase().split('?')[0];
    if (path.includes('/users')) return false;
    return this.publicEndpoints.some(
      (pe) => path === pe.toLowerCase() || path.startsWith(pe.toLowerCase() + '/')
    );
  }

  private async getAuthHeaders(options: RequestInit, skipAuth: boolean): Promise<Record<string, string>> {
    const isFormData = (typeof FormData !== 'undefined' && options.body instanceof FormData) ||
      (options.body !== null && typeof options.body === 'object' && typeof (options.body as FormData).append === 'function');

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json; charset=utf-8' }),
      Accept: 'application/json, text/plain, */*',
      'Accept-Charset': 'utf-8',
      ...(options.headers as Record<string, string>),
    };
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }
    if (skipAuth) return headers;

    try {
      const store = await cookies();
      const has = (n: string) => Object.keys(headers).some((k) => k.toLowerCase() === n.toLowerCase());

      const citizenRaw = store.get('citizen_token')?.value;
      const authRaw = store.get('auth_token')?.value;
      const token = (citizenRaw && !isAccessTokenExpired(citizenRaw))
        ? citizenRaw
        : (authRaw && !isAccessTokenExpired(authRaw)) ? authRaw : undefined;

      if (token && !has('authorization')) headers['Authorization'] = `Bearer ${token}`;

      const csrf = store.get('csrf_token')?.value;
      if (csrf && !has('x-csrf-token') && /POST|PUT|DELETE|PATCH/.test(options.method || 'GET')) {
        headers['X-CSRF-Token'] = csrf;
      }

      const cookieStr = store.getAll()
        .filter((c) => /citizen_token|citizen_id|auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name) && !((c.name === 'auth_token' || c.name === 'citizen_token') && isAccessTokenExpired(c.value)))
        .map((c) => `${c.name.replace(/[^\x00-\x7F]/g, '')}=${c.value.replace(/[^\x00-\x7F]/g, '')}`)
        .join('; ');

      if (cookieStr && !has('cookie')) headers['Cookie'] = cookieStr;
    } catch {}
    return headers;
  }

  private async parseResponseBody<T>(response: Response): Promise<T | undefined> {
    if (response.status === 204 || response.headers.get('Content-Length') === '0') return undefined;
    const text = await response.text();
    if (!text?.trim()) return undefined;

    const isJson = (response.headers.get('Content-Type') ?? '').toLowerCase().includes('json') ||
      text.startsWith('{') || text.startsWith('[');

    if (isJson) {
      try {
        return JSON.parse(text) as T;
      } catch {
        if (response.ok) return undefined;
      }
    }
    if (response.ok) return undefined;
    const err = new Error(text.trim() || response.statusText || 'An error occurred') as ApiError;
    err.httpStatus = response.status;
    err.rawText = text;
    throw err;
  }

  private cleanExceptionString(str: string): string {
    if (!str) return str;
    if (/<(?:!doctype|html|head|body|h\d|p)/i.test(str)) {
      if (/404|not found/i.test(str)) return 'The requested resource was not found on the server (404).';
      if (/500|internal server/i.test(str)) return 'Internal server error occurred (500).';
      if (/502|bad gateway/i.test(str)) return 'Bad gateway: backend service is unavailable (502).';
      if (/503|service unavailable/i.test(str)) return 'Service temporarily unavailable (503).';
      return 'The server encountered an error processing the request.';
    }
    return str
      .replace(/^[A-Za-z0-9_.]+(Exception|Error):\s*'?/i, '')
      .replace(/'?$/, '')
      .replace(/^Validation failed for [A-Za-z0-9_]+:\s*/i, '')
      .replace(/^'|'$/g, '')
      .trim();
  }

  private extractErrorMessage(errBody: unknown, statusText: string): string {
    if (typeof errBody === 'string' && errBody.trim()) {
      const trimmed = errBody.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') return this.extractErrorMessage(parsed, statusText);
        } catch {}
      }
      return this.cleanExceptionString(trimmed) || trimmed;
    }

    const body = errBody as Record<string, unknown> | null | undefined;
    if (body?.errors && typeof body.errors === 'object') {
      const entries = Array.isArray(body.errors) ? body.errors : Object.values(body.errors);
      const collected = entries
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((v): v is string => typeof v === 'string' && !!v.trim())
        .map((v) => this.cleanExceptionString(v.trim()));
      if (collected.length > 0) return collected.join(' ');
    }

    const candidates = [
      body?.message, body?.error, body?.errorMessage, body?.detail,
      body?.title, body?.ExceptionMessage, body?.exceptionMessage, body?.messageDetail, statusText,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) {
        const unwrapped = this.cleanExceptionString(c.trim());
        if (unwrapped) return unwrapped;
      }
    }
    return 'An error occurred while processing your request. Please try again.';
  }

  async fetch(endpoint: string, options: RequestInit = {}, requireAuth = true): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const skipAuth = !requireAuth || this.isPublicEndpoint(endpoint);

    try {
      const headers = await this.getAuthHeaders(options, skipAuth);
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
      const cleanHeaders: Record<string, string> = {};
      Object.entries(headers).forEach(([k, v]) => (cleanHeaders[k] = String(v).replace(/[^\x00-\x7F]/g, '')));

      const response = await serverFetch(url, {
        cache: 'no-store',
        ...options,
        signal: controller.signal,
        headers: cleanHeaders,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, requireAuth = true): Promise<ApiResponse<T>> {
    try {
      const skipAuth = !requireAuth || this.isPublicEndpoint(endpoint);
      const response = await this.fetch(endpoint, options, requireAuth);
      const data = await this.parseResponseBody<T>(response);

      if (!response.ok) {
        if (response.status === 401) {
          const isGrievanceOrCitizen = endpoint.toLowerCase().includes('grievance') || endpoint.toLowerCase().includes('citizen');
          if (!skipAuth) {
            const hasAuth = !!options.headers && typeof options.headers === 'object' &&
              (('Authorization' in options.headers) || ('authorization' in options.headers));
            if (!isGrievanceOrCitizen) await handleHttpUnauthorized(401, hasAuth);
          }
          const rawMessage = (data as { message?: string })?.message;
          const fallbackMsg = isGrievanceOrCitizen ? 'Authentication required. Please verify your mobile number.' : 'Invalid credentials';
          const finalError = rawMessage || fallbackMsg;
          return { success: false, statusCode: 401, error: finalError, message: finalError };
        }
        if (response.status === 403) return { success: false, statusCode: 403, error: 'Forbidden: Access denied' };

        const errorText = this.extractErrorMessage(data, response.statusText);
        const errObj = (typeof data === 'object' && data && !Array.isArray(data)) ? (data as Record<string, unknown>) : null;
        return { success: false, statusCode: response.status, error: errorText, message: errorText, warning: errObj?.warning ? String(errObj.warning) : undefined };
      }

      const resObj = (typeof data === 'object' && data && !Array.isArray(data)) ? (data as Record<string, unknown>) : null;
      if (resObj?.success === false) {
        const errorText = this.extractErrorMessage(data, 'Request failed');
        return { success: false, statusCode: response.status, error: errorText, message: errorText, warning: resObj.warning ? String(resObj.warning) : undefined, data: data as T };
      }

      return {
        success: true,
        statusCode: response.status,
        data: data as T,
        message: resObj?.message ? String(resObj.message) : undefined,
        warning: resObj?.warning ? String(resObj.warning) : undefined,
        ...(resObj?.error ? { error: String(resObj.error) } : {}),
      };
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'digest' in error && String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')) {
        throw error;
      }
      const err = error as ApiError;
      if (err.name === 'AbortError') return { success: false, statusCode: 408, error: 'Request timeout', message: 'Request timeout' };
      const cleanErrMsg = this.cleanExceptionString(err.message || 'Network error');
      return { success: false, ...(err.httpStatus ? { statusCode: err.httpStatus } : {}), error: cleanErrMsg, message: cleanErrMsg };
    }
  }

  private formatRequestBody(body?: unknown): BodyInit | undefined {
    if (body == null) return undefined;
    if (typeof body === 'string' || body instanceof Blob || body instanceof FormData || body instanceof URLSearchParams) return body as BodyInit;
    return JSON.stringify(body);
  }

  async get<T>(url: string, opt?: RequestInit, auth = true) { return this.request<T>(url, { ...opt, method: 'GET' }, auth); }
  async post<T>(url: string, body?: unknown, opt?: RequestInit, auth = true) { return this.request<T>(url, { ...opt, method: 'POST', body: this.formatRequestBody(body) }, auth); }
  async put<T>(url: string, body?: unknown, opt?: RequestInit, auth = true) { return this.request<T>(url, { ...opt, method: 'PUT', body: this.formatRequestBody(body) }, auth); }
  async patch<T>(url: string, body?: unknown, opt?: RequestInit, auth = true) { return this.request<T>(url, { ...opt, method: 'PATCH', body: this.formatRequestBody(body) }, auth); }
  async delete<T>(url: string, opt?: RequestInit, auth = true) { return this.request<T>(url, { ...opt, method: 'DELETE' }, auth); }
}

export const apiClient = new ApiClient();
