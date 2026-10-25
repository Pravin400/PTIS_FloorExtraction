import { PropertyTypeFormModel } from "@/types/property-type.types";
import { ApiError } from "@/lib/utils/api";
import { PROPERTY_TYPE_ERROR_CODES } from "@/lib/constants/property-type-error-codes";

/**
 * Validates property type ID
 */
export function validatePropertyTypeId(id: number): boolean {
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
export function validateCreateFormData(data: PropertyTypeFormModel): void {
  const descEng = (data.descriptionEnglish || data.propertyDescriptionEnglish)?.trim();
  if (!descEng) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.DESCRIPTION_ENGLISH_REQUIRED, "Validation failed");
  }
  if (!data.propertyDescription?.trim()) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.PROPERTY_DESCRIPTION_REQUIRED, "Validation failed");
  }
  if (!data.type?.trim()) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.TYPE_REQUIRED, "Validation failed");
  }
  /*
  if (!data.propertyTypeGroup?.trim()) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.PROPERTY_TYPE_GROUP_REQUIRED, "Validation failed");
  }
  */
  if (
    data.propertyTypeCategoryId === undefined ||
    data.propertyTypeCategoryId === null ||
    data.propertyTypeCategoryId === 0 ||
    !Number.isFinite(data.propertyTypeCategoryId)
  ) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.CATEGORY_REQUIRED, "Validation failed");
  }
}

/**
 * Validates form data for update operation
 */
export function validateUpdateFormData(data: PropertyTypeFormModel): void {
  if (!data.id || data.id <= 0) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.ID_REQUIRED_FOR_UPDATE, "Validation failed");
  }
  const descEng = (data.descriptionEnglish || data.propertyDescriptionEnglish)?.trim();
  if (!descEng) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.DESCRIPTION_ENGLISH_REQUIRED, "Validation failed");
  }
  if (!data.propertyDescription?.trim()) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.PROPERTY_DESCRIPTION_REQUIRED, "Validation failed");
  }
  if (!data.type?.trim()) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.TYPE_REQUIRED, "Validation failed");
  }
  /*
  if (!data.propertyTypeGroup?.trim()) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.PROPERTY_TYPE_GROUP_REQUIRED, "Validation failed");
  }
  */
  if (
    !data.propertyTypeCategoryId ||
    data.propertyTypeCategoryId === 0 ||
    !Number.isFinite(data.propertyTypeCategoryId)
  ) {
    throw new ApiError(400, PROPERTY_TYPE_ERROR_CODES.CATEGORY_REQUIRED, "Validation failed");
  }
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
export function getDeleteErrorStatusCode(errorMessage: string): number {
  const lowerMsg = errorMessage.toLowerCase();
  
  if (lowerMsg.includes("not found")) {
    return 404;
  }
  if (lowerMsg.includes("linked") || lowerMsg.includes("in use") || lowerMsg.includes("constraint")) {
    return 409;
  }
  if (lowerMsg.includes("invalid") || lowerMsg.includes("validation")) {
    return 400;
  }
  
  return 500;
}

/**
 * Creates an ApiError with appropriate status code based on error message
 */
export function createApiError(statusCode: number | undefined, errorMessage: string | undefined, context: string): ApiError {
  const message = errorMessage || "Operation failed";
  const code = statusCode || 500;
  return new ApiError(code, message, context);
}
