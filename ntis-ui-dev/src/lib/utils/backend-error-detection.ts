/**
 * Utility functions for detecting and handling backend API error responses
 */

/**
 * Error keywords that indicate a backend error message
 */
const ERROR_KEYWORDS = ['error', 'failed', 'invalid', 'already exists', 'duplicate'] as const;

/**
 * Duplicate error keywords for specific duplicate detection
 */
const DUPLICATE_KEYWORDS = ['already exists', 'duplicate'] as const;

/**
 * Checks if a message string contains error-indicating keywords
 *
 * @param message - The message string to check
 * @returns True if the message contains error keywords, false otherwise
 *
 * @example
 * isBackendErrorMessage('Operation failed') // true
 * isBackendErrorMessage('Success') // false
 */
export function isBackendErrorMessage(message: string | undefined | null): boolean {
  if (!message) return false;

  const lowerMsg = message.toLowerCase();
  return ERROR_KEYWORDS.some((keyword) => lowerMsg.includes(keyword));
}

/**
 * Checks if a message indicates a duplicate entry error
 *
 * @param message - The message string to check
 * @returns True if the message indicates a duplicate, false otherwise
 *
 * @example
 * isDuplicateError('Record already exists') // true
 * isDuplicateError('Invalid input') // false
 */
export function isDuplicateError(message: string | undefined | null): boolean {
  if (!message) return false;

  const lowerMsg = message.toLowerCase();
  return DUPLICATE_KEYWORDS.some((keyword) => lowerMsg.includes(keyword));
}

/**
 * Determines the appropriate HTTP status code based on error message
 *
 * @param message - The error message string
 * @returns 409 for duplicate errors, 500 for other errors
 *
 * @example
 * getErrorStatusCode('Record already exists') // 409
 * getErrorStatusCode('Operation failed') // 500
 */
export function getErrorStatusCode(message: string | undefined | null): number {
  return isDuplicateError(message) ? 409 : 500;
}

/**
 * Safely extracts a clean, human-readable error message from any error object,
 * JSON string, or standard Error instance, avoiding raw JSON or context prefix wrappers.
 */
export function getCleanErrorMessage(
  err: unknown,
  defaultMessage = 'An unexpected error occurred'
): string {
  if (!err) return defaultMessage;

  const tryParseJsonString = (str: string): string | null => {
    const trimmed = str.trim();
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = trimmed.substring(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
        if (parsed.message && typeof parsed.message === 'string') {
          return parsed.message;
        }
        if (parsed.error && typeof parsed.error === 'string') {
          return parsed.error;
        }
        if (parsed.errors && typeof parsed.errors === 'object') {
          const firstError = Object.values(parsed.errors)[0];
          if (typeof firstError === 'string') return firstError;
          if (Array.isArray(firstError) && typeof firstError[0] === 'string') {
            return firstError[0];
          }
        }
      } catch {}
    }
    return null;
  };

  if (err && typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;

    // Try extracting responseText/error/message from ApiError or standard objects
    const rawText = (errorObj.responseText || errorObj.error || errorObj.message) as
      | string
      | undefined;

    if (rawText && typeof rawText === 'string') {
      const jsonParsed = tryParseJsonString(rawText);
      if (jsonParsed) return jsonParsed;
    }

    if (errorObj.message && typeof errorObj.message === 'string') {
      const jsonParsed = tryParseJsonString(errorObj.message);
      if (jsonParsed) return jsonParsed;

      const match = errorObj.message.match(/^[^:]+:\s*(.+?)\s*\(\d+\)$/);
      if (match && match[1]) {
        const inner = match[1];
        const innerJson = tryParseJsonString(inner);
        if (innerJson) return innerJson;
        return inner;
      }
      return errorObj.message;
    }
  }

  if (err instanceof Error) {
    const jsonParsed = tryParseJsonString(err.message);
    if (jsonParsed) return jsonParsed;
    return err.message;
  }

  const strErr = String(err);
  const jsonParsed = tryParseJsonString(strErr);
  if (jsonParsed) return jsonParsed;

  return strErr;
}

/**
 * Translates a backend error/success/warning message using standard common translation keys.
 * If no translation mapping is found, it returns the original message.
 */
export function translateBackendMessage(
  message: string | undefined | null,
  tCommon: (key: string) => string
): string {
  if (!message) return '';

  const lowerMsg = message.toLowerCase();

  // Map common backend messages to common.json translations
  if (lowerMsg.includes('unexpected response was received') || lowerMsg.includes('unexpected response')) {
    return tCommon('errors.generic');
  }
  if (lowerMsg.includes('network error') || lowerMsg.includes('failed to fetch')) {
    return tCommon('errors.network');
  }
  if (lowerMsg.includes('unauthorized') || lowerMsg.includes('unauthorized: please login')) {
    return tCommon('errors.unauthorized');
  }
  if (lowerMsg.includes('forbidden') || lowerMsg.includes('access denied')) {
    return tCommon('errors.noAccess');
  }
  if (lowerMsg.includes('not found')) {
    return tCommon('errors.notFound');
  }
  if (lowerMsg.includes('server error') || lowerMsg.includes('internal server error')) {
    return tCommon('errors.serverError');
  }
  if (lowerMsg.includes('validation failed') || lowerMsg.includes('validation error')) {
    return tCommon('errors.validationError');
  }
  if (lowerMsg.includes('save failed') || lowerMsg.includes('failed to save')) {
    return tCommon('errors.saveFailed');
  }
  if (lowerMsg.includes('failed to delete') || lowerMsg.includes('delete failed')) {
    return tCommon('errors.deleteError');
  }
  if (lowerMsg.includes('failed to update') || lowerMsg.includes('update failed')) {
    return tCommon('errors.updateError');
  }
  if (lowerMsg.includes('operation failed')) {
    return tCommon('errors.operationFailed');
  }
  if (lowerMsg.includes('success') || lowerMsg.includes('saved successfully') || lowerMsg.includes('updated successfully') || lowerMsg.includes('deleted successfully')) {
    return tCommon('messages.success');
  }

  return message;
}
