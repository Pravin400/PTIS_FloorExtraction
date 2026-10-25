/**
 * Action Response Normalization Helpers
 * 
 * Provides generic utilities for normalizing action responses
 * Reduces code duplication when handling different response formats
 * 
 * @module action-response-helpers
 */

export type ErrorHandler = (msg: string) => void;

/**
 * Generic action response normalizer
 * Handles multiple response formats from server actions
 * 
 * @template T - Expected return type (object, array, or primitive)
 * @param raw - Raw response from server action
 * @param options - Configuration options
 * @param options.onError - Callback for error handling
 * @param options.expectArray - Whether to expect an array response
 * @param options.expectWrapped - Whether response is wrapped in { success, data }
 * @param options.takeFirst - For paginated arrays, take first element
 * @param options.defaultValue - Default value to return on error
 * @returns Normalized response or default value
 * 
 * @example
 * // Normalize object response
 * const data = handleActionResponse(rawData, {
 *   onError: (msg) => errors.push(msg),
 *   expectArray: false,
 *   expectWrapped: false
 * });
 * 
 * @example
 * // Normalize array response
 * const items = handleActionResponse<MyItem[]>(rawData, {
 *   onError: (msg) => errors.push(msg),
 *   expectArray: true,
 *   defaultValue: []
 * });
 * 
 * @example
 * // Normalize wrapped response with data extraction
 * const record = handleActionResponse(rawData, {
 *   onError: (msg) => errors.push(msg),
 *   expectWrapped: true,
 *   defaultValue: null
 * });
 */
export function handleActionResponse<T = unknown>(
  raw: unknown,
  options: {
    onError?: ErrorHandler;
    expectArray?: boolean;
    expectWrapped?: boolean;
    takeFirst?: boolean;
    defaultValue?: T;
  } = {}
): T | null {
  const {
    onError,
    expectArray = false,
    expectWrapped = false,
    takeFirst = false,
    defaultValue = null
  } = options;

  // Handle null/undefined
  if (!raw) {
    return (defaultValue ?? null) as T | null;
  }

  // Handle non-object primitives
  if (typeof raw !== 'object') {
    return (defaultValue ?? null) as T | null;
  }

  const obj = raw as Record<string, unknown>;

  // Check for error sentinel: { success: false, error }
  if ('success' in obj && !obj.success) {
    if (onError) {
      const errorMsg = (obj.error as string) || 'Action failed';
      onError(errorMsg);
    }
    return (defaultValue ?? null) as T | null;
  }

  // Handle wrapped response: { success: true, data }
  if (expectWrapped && 'data' in obj) {
    return obj.data as T;
  }

  // Handle array responses
  if (expectArray) {
    if (Array.isArray(raw)) {
      return raw as T;
    }
    if (Array.isArray(obj.data)) {
      return obj.data as T;
    }
    // Not an array but expected one - return default
    return (defaultValue ?? []) as T;
  }

  // Handle paginated response - take first element
  if (takeFirst && Array.isArray(raw)) {
    const first = raw[0];
    return (first && typeof first === 'object'
      ? first
      : defaultValue ?? null) as T | null;
  }

  // Return as-is (plain object or already unwrapped)
  return obj as T;
}

/**
 * Specialized helper for normalizing object responses
 * 
 * @param raw - Raw response from action
 * @param onError - Optional error callback
 * @returns Normalized object or null
 * 
 * @example
 * const propertyData = normalizeObjectResponse(rawPropertyData, (msg) => errors.push(msg));
 */
export function normalizeObjectResponse(
  raw: unknown,
  onError?: ErrorHandler
): Record<string, unknown> | null {
  return handleActionResponse<Record<string, unknown>>(raw, {
    onError,
    expectArray: false,
    takeFirst: true, // Handle paginated responses
    defaultValue: undefined
  });
}

/**
 * Specialized helper for normalizing array responses
 * 
 * @param raw - Raw response from action
 * @param onError - Optional error callback
 * @returns Normalized array or empty array
 * 
 * @example
 * const floors = normalizeArrayResponse(rawFloorsData, (msg) => errors.push(msg));
 */
export function normalizeArrayResponse<T = unknown>(
  raw: unknown,
  onError?: ErrorHandler
): T[] {
  return handleActionResponse<T[]>(raw, {
    onError,
    expectArray: true,
    defaultValue: []
  }) || [];
}

/**
 * Specialized helper for normalizing wrapped responses
 * Expects format: { success: true, data: T } or { success: false, error: string }
 * 
 * @param raw - Raw response from action
 * @param onError - Optional error callback
 * @returns Extracted data or null
 * 
 * @example
 * const floorDetails = normalizeWrappedResponse(rawFloorData, (msg) => errors.push(msg));
 */
export function normalizeWrappedResponse<T = unknown>(
  raw: unknown,
  onError?: ErrorHandler
): T | null {
  return handleActionResponse<T>(raw, {
    onError,
    expectWrapped: true,
    defaultValue: undefined
  });
}
