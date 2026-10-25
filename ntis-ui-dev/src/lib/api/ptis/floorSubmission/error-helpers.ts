/**
 * API Error Handling Utilities
 * 
 * Provides utilities for detecting, parsing, and creating appropriate
 * error responses from backend API calls
 * 
 * @module error-helpers
 */

import { ApiError } from "@/lib/utils/api";


/**
 * Determines appropriate HTTP status code from error message for delete operations
 * 
 * Maps common error patterns to HTTP status codes:
 * - 404: Not found / Does not exist
 * - 409: In use / Cannot delete (conflict)
 * - 400: Invalid / Bad request
 * - 500: Default server error
 * 
 * @param errorMsg - Error message from backend
 * @returns Appropriate HTTP status code
 * 
 * @example
 * const statusCode = getDeleteErrorStatusCode("Record not found");
 * // Returns: 404
 * 
 * const statusCode2 = getDeleteErrorStatusCode("Cannot delete - record in use");
 * // Returns: 409
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
        lowerMsg.includes("cannot delete")
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
 * 
 * Automatically detects duplicate errors and assigns 409 status code
 * Falls back to provided status code or 500 for unknown errors
 * 
 * @param statusCode - HTTP status code (optional)
 * @param errorMessage - Error message from backend (optional)
 * @param defaultMessage - Fallback error message (default: "Operation failed")
 * @returns Configured ApiError instance
 * 
 * @example
 * const error = createApiError(400, "Invalid floor ID", "Create Floor failed");
 * throw error;
 * 
 * const duplicateError = createApiError(undefined, "Floor already exists", "Create Floor failed");
 * // Automatically assigns 409 status code
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
