import { appConfig } from '@/config/app.config';

export const getErrorMessage = (error: unknown, defaultMsg: string): string => {
  if (typeof error === 'string') return error;
  const err = error as Record<string, string> | null;
  return err?.message || err?.title || defaultMsg;
};

export function getErrorFormattedMessage(
  error?: { title?: string; message?: string },
  fallback = 'An error occurred'
): string {
  if (!error) return fallback;

  const title = error.title?.trim();
  const message = error.message?.trim();

  if (title && message && title !== message) {
    return `${title}: ${message}`;
  }

  return message || title || fallback;
}

/**
 * Safely extracts an array of items from API response data.
 */
export function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const obj = data as Record<string, unknown> | null;
  if (!obj) return [];
  if (Array.isArray(obj.items)) return obj.items as T[];
  if (Array.isArray(obj.Items)) return obj.Items as T[];
  if (Array.isArray(obj.data)) return obj.data as T[];
  const nested = obj.data as Record<string, unknown> | null;
  if (nested && Array.isArray(nested.items)) return nested.items as T[];
  if (nested && Array.isArray(nested.Items)) return nested.Items as T[];
  return [];
}

/**
 * Safely extracts data from API response, favoring 'items' if it exists.
 */
export function extractData<T>(data: unknown): T | undefined {
  if (!data) return undefined;
  const obj = data as Record<string, unknown>;
  if (obj && obj.items !== undefined) return obj.items as T;
  if (obj && obj.Items !== undefined) return obj.Items as T;
  if (obj && obj.data !== undefined) return obj.data as T;
  return data as T;
}

export async function fetchWithCertSupport<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{
  success: boolean;
  data?: T;
  error?: { title?: string; message?: string };
}> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const apiUrl = `${appConfig.api.baseUrl}${endpoint}`;
  let wasTimedOut = false;
  const controller = new AbortController();
  let signal: AbortSignal = controller.signal;

  const parseBodyForErrors = (
    jsonData: unknown
  ): { success: boolean; data?: T; error?: { title?: string; message?: string } } => {
    const body = jsonData as Record<string, unknown> | null;

    if (body && body.success === false) {
      const apiMessage =
        typeof body.message === 'string' && body.message.trim()
          ? body.message.trim()
          : 'API request failed';

      const apiErrors =
        body.errors == null
          ? ''
          : typeof body.errors === 'string'
            ? body.errors
            : JSON.stringify(body.errors);

      return {
        success: false,
        error: {
          title: 'API Error',
          message: apiErrors ? `${apiMessage}: ${apiErrors}` : apiMessage,
        },
      };
    }

    return { success: true, data: jsonData as T };
  };

  try {
    // ✅ Next.js way: read cookies using next/headers (server-side)
    let accessToken: string | undefined;
    if (typeof window === 'undefined') {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        accessToken = cookieStore.get('auth_token')?.value;
      } catch (_e) {
        // Not in a request context (e.g. static generation)
      }
    }

    timeoutId = setTimeout(() => {
      wasTimedOut = true;
      controller.abort('timeout');
    }, appConfig.api.timeout);

    if (options.signal) {
      if (typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([controller.signal, options.signal]);
      } else if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    const headers = new Headers(options.headers);
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(apiUrl, {
      ...options,
      cache: 'no-store',
      signal,
      headers,
    });

    if (!response.ok) {
      return {
        success: false,
        error: { title: `HTTP ${response.status}`, message: response.statusText },
      };
    }

    if (response.status === 204) return { success: true, data: undefined as T };

    const rawText = await response.text();
    if (!rawText || rawText.trim() === '') return { success: true, data: undefined as T };

    const jsonData = JSON.parse(rawText);
    return parseBodyForErrors(jsonData);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: wasTimedOut
          ? {
              title: 'Request Timeout',
              message: `The request timed out after ${appConfig.api.timeout / 1000} seconds.`,
            }
          : {
              title: 'Request Cancelled',
              message: 'The request was cancelled by the user or application.',
            },
      };
    }

    // Provide more specific error message for common network issues
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common fetch errors
      if (errorMessage.includes('fetch failed') || errorMessage.includes('Failed to fetch')) {
        errorMessage = `Unable to connect to the server at ${appConfig.api.baseUrl}. Please check your network connection or verify the API server is running.`;
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage = `Connection refused to ${appConfig.api.baseUrl}. The API server may be offline.`;
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        errorMessage = `Cannot resolve server address ${appConfig.api.baseUrl}. Please check the API URL configuration.`;
      }
    }

    return {
      success: false,
      error: {
        title: 'Network Error',
        message: errorMessage,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
