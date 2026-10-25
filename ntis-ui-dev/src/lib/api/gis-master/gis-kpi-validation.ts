import { GisKpiMasterFormModel } from "@/types/gis-master/gis-kpi-master.types";
import { ApiError } from "@/lib/utils/api";

/**
 * Validates GIS KPI ID
 */
export function validateGisKpiId(id: number): boolean {
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
export function validateCreateFormData(data: GisKpiMasterFormModel): void {
  if (!data.kpiCode?.trim()) {
    throw new ApiError(400, "KPI code is required", "Validation failed");
  }
  if (!data.defaultTitle?.trim()) {
    throw new ApiError(400, "Title is required", "Validation failed");
  }
}

/**
 * Validates form data for update operation
 */
export function validateUpdateFormData(data: GisKpiMasterFormModel): void {
  if (!data.id || data.id <= 0) {
    throw new ApiError(400, "GIS KPI ID is required for update", "Validation failed");
  }
  if (!data.kpiCode?.trim()) {
    throw new ApiError(400, "KPI code is required", "Validation failed");
  }
  if (!data.defaultTitle?.trim()) {
    throw new ApiError(400, "Title is required", "Validation failed");
  }
}

/**
 * Determines status code from error message for delete operations
 */
export function getDeleteErrorStatusCode(errorMessage: string): number {
  const lower = errorMessage.toLowerCase();
  if (lower.includes("not found") || lower.includes("does not exist")) {
    return 404;
  }
  if (
    lower.includes("reference") ||
    lower.includes("constraint") ||
    lower.includes("conflict") ||
    lower.includes("in use") ||
    lower.includes("linked") ||
    lower.includes("foreign key")
  ) {
    return 409;
  }
  return 500;
}

/**
 * Creates an ApiError with appropriate status code
 */
export function createApiError(statusCode: number | undefined, errorMsg: string | undefined, defaultMsg: string): ApiError {
  let code = statusCode || 500;
  const msg = errorMsg || defaultMsg;
  const lowerMsg = msg.toLowerCase();

  if (code === 500) {
    if (lowerMsg.includes("already exists") || lowerMsg.includes("duplicate")) {
      code = 409;
    } else if (lowerMsg.includes("not found")) {
      code = 404;
    } else if (lowerMsg.includes("required") || lowerMsg.includes("invalid") || lowerMsg.includes("validation")) {
      code = 400;
    }
  }

  return new ApiError(code, msg, defaultMsg);
}
