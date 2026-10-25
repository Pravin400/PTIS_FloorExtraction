/**
 * API Response Validation Utilities
 * 
 * Provides reusable validation functions for API responses with
 * comprehensive error handling and structure validation.
 */

import type { ApiResponse } from '@/types/common.types';

/**
 * Error thrown when API response validation fails
 */
export class ApiResponseValidationError extends Error {
  constructor(message: string, public readonly endpoint?: string) {
    super(message);
    this.name = 'ApiResponseValidationError';
  }
}

/**
 * Standard API response structure with nested success flags
 */
interface StandardApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  items?: unknown;
  errors?: string[] | null;
  message?: string;
}

/**
 * Validates transport-level success (HTTP status)
 * 
 * @param response - API response wrapper
 * @param endpoint - Endpoint name for error messages
 * @throws ApiResponseValidationError if transport failed
 */
export function validateTransportSuccess<T>(
  response: ApiResponse<T>,
  endpoint: string
): asserts response is ApiResponse<T> & { success: true; data: T } {
  if (!response.success || !response.data) {
    throw new ApiResponseValidationError(
      response.error || `Failed to fetch data from ${endpoint} API`,
      endpoint
    );
  }
}

/**
 * Validates backend payload success flag
 * 
 * @param response - Backend response payload
 * @param endpoint - Endpoint name for error messages
 * @throws ApiResponseValidationError if backend returned error flag
 */
export function validateBackendSuccess(
  response: StandardApiResponse,
  endpoint: string
): void {
  if (response.success === false) {
    const errorMsg =
      response.errors?.[0] || response.message || `Backend error from ${endpoint} API`;
    throw new ApiResponseValidationError(errorMsg, endpoint);
  }
}

/**
 * Validates nested data structure success flag
 * 
 * Handles APIs that return { success, data: { success, data: {...} } }
 * 
 * @param response - Backend response payload with nested data
 * @param endpoint - Endpoint name for error messages
 * @throws ApiResponseValidationError if nested data has error flag
 */
export function validateNestedDataSuccess(
  response: StandardApiResponse<StandardApiResponse>,
  endpoint: string
): void {
  if (response.data?.success === false) {
    const nestedErrorMsg =
      response.data.errors?.[0] ||
      response.data.message ||
      `Backend error from ${endpoint} API (nested)`;
    throw new ApiResponseValidationError(nestedErrorMsg, endpoint);
  }
}

/**
 * Extracts items from a response that may have them at multiple levels
 * 
 * Handles both flat structure (response.items) and nested structure (response.data.items)
 * 
 * @param response - Backend response payload
 * @returns Extracted items or null if not found
 */
export function extractItems<T>(response: StandardApiResponse<{ items?: T }>): T | null {
  const items = response?.items || response?.data?.items;
  return items ? (items as T) : null;
}

/**
 * Validates that items were successfully extracted
 * 
 * @param items - Extracted items
 * @param endpoint - Endpoint name for error messages
 * @throws ApiResponseValidationError if items are null/undefined
 */
export function validateItemsExist<T>(items: T | null, endpoint: string): asserts items is T {
  if (!items) {
    throw new ApiResponseValidationError(
      `Invalid response structure from ${endpoint} API`,
      endpoint
    );
  }
}

/**
 * Complete validation pipeline for standard API responses with items
 * 
 * Combines all validation steps into a single function:
 * 1. Validates transport success
 * 2. Validates backend success flag
 * 3. Validates nested data success (if present)
 * 4. Extracts items
 * 5. Validates items exist
 * 
 * @param apiResponse - API response wrapper
 * @param endpoint - Endpoint name for error messages
 * @returns Validated and extracted items
 * @throws ApiResponseValidationError if any validation fails
 * 
 * @example
 * ```ts
 * const data = validateAndExtractApiResponse(response, 'tax-details');
 * // data is guaranteed to be valid TaxDetailsData
 * ```
 */
export function validateAndExtractApiResponse<T>(
  apiResponse: ApiResponse<StandardApiResponse<{ items?: T }>>,
  endpoint: string
): T {
  // Step 1: Validate transport-level success
  validateTransportSuccess(apiResponse, endpoint);

  const response = apiResponse.data;

  // Step 2: Validate backend payload success
  validateBackendSuccess(response, endpoint);

  // Step 3: Validate nested data success (if applicable)
  validateNestedDataSuccess(response, endpoint);

  // Step 4: Extract items from response
  const items = extractItems<T>(response);

  // Step 5: Validate items exist
  validateItemsExist(items, endpoint);

  return items;
}

/**
 * Type guard for checking if response has error structure
 */
export function hasErrorStructure(
  response: unknown
): response is { success: false; error?: string; errors?: string[] } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false
  );
}
