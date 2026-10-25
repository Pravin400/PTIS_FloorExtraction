import { ApiResponse, PagedResponse } from "@/types/common.types";

/**
 * API Utilities
 * Common utilities for API error handling
 */

/**
 * Custom error class for API errors with structured information
 */
export class ApiError extends Error {
  public responseText: string;

  constructor(
    public statusCode: number,
    public error: string,
    public contextMessage: string
  ) {
    super(`${contextMessage}: ${error}`);
    this.name = "ApiError";
    this.responseText = error; // Keep compatibility with existing code that uses responseText
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
    // Optionally capture stack trace for V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Identifies wrapped inner API payloads that encode failure with their own success flag.
 * This intentionally excludes generic action/result payloads like { success: false, error }
 * so callers can handle those responses without an exception being thrown.
 */
function isWrappedInnerApiError(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return false;
  }
  const payload = data as Record<string, unknown>;
  // We check for 'items' or 'errors' to identify a wrapped API response vs a simple ActionResult
  return payload["success"] === false && ("items" in payload || "errors" in payload);
}

/**
 * Validates API response and throws ApiError if unsuccessful
 */
export function handleApiResponse<T>(response: ApiResponse<T>, message: string): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "Unknown error",
      message
    );
  }

  // Check for wrapped inner API failures without treating generic ActionResult payloads as exceptions
  const data = response.data as Record<string, unknown>;
  if (isWrappedInnerApiError(data)) {
    throw new ApiError(
      response.statusCode || 500,
      String(data["message"] || data["error"] || "API execution failed"),
      message
    );
  }

  return response.data;
}

/**
 * Validates API response and throws ApiError if not ok
 */
export async function validateResponse(response: Response, context: string): Promise<void> {
  if (!response.ok) {
    const responseText = await response.text();
    throw new ApiError(
      response.status,
      responseText,
      `${context}: ${response.status} ${response.statusText}`
    );
  }
}

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable (default: retries network errors) */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Default function to determine if an error should be retried
 */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retry on network-related errors
    return (
      message.includes('fetch failed') ||
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('timeout')
    );
  }
  return false;
}

/**
 * Retries an async function with exponential backoff
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => fetchData(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or if error is not retryable
      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Normalizes API response to PagedResponse format.
 * Handles double-nested, single-nested, and flat array responses.
 * @param data The data received from the API
 * @returns Normalized PagedResponse
 */
export function normalizePagedResponse<T>(data: unknown): PagedResponse<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootData = data as any;
  
  if (!rootData) return rootData;

  // Handle double-nested items structure: { success, message, items: { items: [], ... } }
  if (rootData?.items && typeof rootData.items === 'object' && 'items' in rootData.items && Array.isArray(rootData.items.items)) {
    return rootData.items as PagedResponse<T>;
  }

  // Handle single-nested items structure: { items: [], ... }
  if (rootData?.items && Array.isArray(rootData.items)) {
    return rootData as PagedResponse<T>;
  }

  // Handle flat array response
  if (Array.isArray(rootData)) {
    return {
      items: rootData,
      totalCount: rootData.length,
      pageNumber: 1,
      pageSize: rootData.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false
    } as PagedResponse<T>;
  }

  return rootData as PagedResponse<T>;
}
