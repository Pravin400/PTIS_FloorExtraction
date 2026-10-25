import type { ActionResult } from '@/types/common.types';

/**
 * Centralized error handler for server actions.
 * Provides consistent error handling and messaging across all PTIS server actions.
 *
 * @param error - The error object caught in the try-catch block
 * @param context - A string describing the operation context (e.g., "fetching rateable value")
 * @returns ActionResult with success: false and appropriate error message
 */
export function handleServerError<T = never>(
  error: unknown,
  context: string
): ActionResult<T> {
  return {
    success: false,
    error:
      error instanceof Error
        ? error.message
        : `An unexpected error occurred while ${context}`,
  };
}
