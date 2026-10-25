import { ApiError } from "@/lib/utils/api";

/**
 * Validates ID
 */
export function validateId(id: number | string): boolean {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return Number.isFinite(numId) && numId > 0;
}

/**
 * Validates and prepares search term for API request
 */
export function validateAndPrepareSearchTerm(searchTerm?: string): string | undefined {
  if (typeof searchTerm !== "string") return undefined;
  
  const trimmedSearchTerm = searchTerm.trim();
  if (trimmedSearchTerm.length === 0) return undefined;
  
  const MAX_SEARCH_TERM_LENGTH = 100;
  return trimmedSearchTerm.slice(0, MAX_SEARCH_TERM_LENGTH);
}

/**
 * Determines status code from error message for delete operations
 */
export function getDeleteErrorStatusCode(errorMsg: string): number {
  const lowerMsg = errorMsg.toLowerCase();

  if (lowerMsg.includes("not found") || lowerMsg.includes("does not exist")) {
    return 404; // Not Found
  } else if (
    lowerMsg.includes("in use") ||
    lowerMsg.includes("linked") ||
    lowerMsg.includes("referenced") ||
    lowerMsg.includes("associated") ||
    lowerMsg.includes("cannot delete") ||
    lowerMsg.includes("referenced by other entities")
  ) {
    return 409; // Conflict - record in use
  } else if (
    lowerMsg.includes("invalid") ||
    lowerMsg.includes("bad request")
  ) {
    return 400; // Bad Request
  } else {
    return 500; // Default to server error
  }
}

/**
 * Creates appropriate ApiError based on response status and message
 * @deprecated Use ApiError directly instead for clearer code and to ensure backend messages are used
 * @example
 * // Instead of: throw createApiError(response.statusCode, response.error, defaultMsg);
 * // Use: throw new ApiError(response.statusCode ?? 500, response.error ?? defaultMsg, defaultMsg);
 */
export function createApiError(
  statusCode?: number, 
  errorMessage?: string, 
  defaultMessage: string = "Operation failed"
): ApiError {
  const errorMsg = errorMessage || "";
  const lowerMsg = errorMsg.toLowerCase();
  
  // Detect duplicate error from backend message
  const isDuplicate = lowerMsg.includes("already exists") || lowerMsg.includes("duplicate");
  
  const finalErrorMessage = errorMessage || defaultMessage;
  
  return new ApiError(
    statusCode ?? (isDuplicate ? 409 : 500),
    finalErrorMessage,
    defaultMessage
  );
}

/**
 * Maps reference errors to appropriate i18n keys for specific entity types
 * Handles both DELETE and UPDATE (deactivate) operations
 * @deprecated Not used anymore - backend error messages are displayed directly as they contain more details
 */
export function mapReferenceErrorToI18nKey(
  errorMessage: string,
  entityType: 'group' | 'type' | 'subtype',
  errorConstant: string
): string {
  const lowerMsg = errorMessage.toLowerCase();
  
  // Check if this is a reference constraint error
  if (
    lowerMsg.includes("referenced by other entities") || 
    lowerMsg.includes("referenced in:") ||
    lowerMsg.includes("cannot deactivate") ||
    lowerMsg.includes("cannot delete")
  ) {
    // Map to entity-specific referenced error i18n key
    switch (entityType) {
      case 'group':
        return 'messages.deleteGroupReferenced';
      case 'type':
        return 'messages.deleteTypeReferenced';
      case 'subtype':
        return 'messages.deleteSubTypeReferenced';
      default:
        return errorConstant;
    }
  }
  
  return errorMessage.startsWith('messages.') ? errorMessage : errorConstant;
}
