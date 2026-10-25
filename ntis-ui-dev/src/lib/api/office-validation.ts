import { ApiError } from "@/lib/utils/api";
import { OfficeFormModel } from "@/types/office.types";

/**
 * Validates office ID
 */
export function validateOfficeId(id: number): boolean {
  return Number.isFinite(id) && id > 0;
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
 * Validates form data for create operation
 */
export function validateCreateFormData(data: OfficeFormModel): void {
  if (!data.officeCode?.trim()) {
    throw new ApiError(400, "Office code is required", "Validation failed");
  }
  if (!data.officeName?.trim()) {
    throw new ApiError(400, "Office name is required", "Validation failed");
  }
  if (!data.type?.trim()) {
    throw new ApiError(400, "Office type is required", "Validation failed");
  }
}

/**
 * Validates form data for update operation
 */
export function validateUpdateFormData(data: OfficeFormModel): void {
  if (!data.officeId || data.officeId <= 0) {
    throw new ApiError(400, "Valid Office ID is required", "Validation failed");
  }
  validateCreateFormData(data);
}

/**
 * Checks if backend response contains error messages and throws appropriate errors
 */
export function checkBackendResponseErrors(responseData: Record<string, unknown> | null, operation: string): void {
  if (!responseData || typeof responseData !== 'object') return;
  
  const { message: rawMessage, error: rawError } = responseData as {
    message?: unknown;
    error?: unknown;
  };
  const messageValue = rawMessage ?? rawError;
  
  if (typeof messageValue === 'string' && messageValue) {
    const message = messageValue;
    const lowerMsg = message.toLowerCase();

    // Only throw error if message indicates an actual error
    const isErrorMessage =
      lowerMsg.includes("already exists") ||
      lowerMsg.includes("duplicate") ||
      lowerMsg.includes("error") ||
      lowerMsg.includes("failed") ||
      lowerMsg.includes("invalid") ||
      lowerMsg.includes("not found");

    // Skip success messages like "Record inserted successfully"
    const isSuccessMessage =
      lowerMsg.includes("success") ||
      lowerMsg.includes("created") ||
      lowerMsg.includes("inserted") ||
      lowerMsg.includes("updated") ||
      lowerMsg.includes("modified");

    if (isErrorMessage && !isSuccessMessage) {
      const isDuplicate =
        lowerMsg.includes("already exists") ||
        lowerMsg.includes("duplicate");

      throw new ApiError(
        isDuplicate ? 409 : 400,
        message,
        `${operation} failed`
      );
    }
  }
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
    lowerMsg.includes("foreign key")
  ) {
    return 409; // Conflict - record in use
  } else if (lowerMsg.includes("invalid") || lowerMsg.includes("bad request")) {
    return 400; // Bad Request
  } else {
    return 500; // Default to server error
  }
}

/**
 * Creates appropriate ApiError based on response status and message
 */
export function createApiError(statusCode?: number, errorMessage?: string, defaultMessage: string = "Operation failed"): ApiError {
  // Detect duplicate error from backend message
  const errorMsg = errorMessage || "";
  const isDuplicate = errorMsg.toLowerCase().includes("already exists") || 
                      errorMsg.toLowerCase().includes("duplicate");
  
  return new ApiError(
    statusCode ?? (isDuplicate ? 409 : 500),
    errorMessage || defaultMessage,
    defaultMessage
  );
}
