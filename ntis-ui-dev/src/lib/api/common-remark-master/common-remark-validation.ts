import { CommonRemarkFormModel } from "@/types/common-remark-master/common-remark.types";
import { ApiError } from "@/lib/utils/api";
import { DESCRIPTION_REGEX } from "@/lib/utils/validation-rules";

/**
 * Validates ID
 */
export function validateId(id: number): boolean {
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
 * Shared validator for remarkType
 */
export function validateRemarkType(remarkType?: string): string | null {
  if (!remarkType || !remarkType.trim()) {
    return "form.validation.remarkTypeRequired";
  }
  return null;
}

/**
 * Shared validator for customRemarkType
 */
export function validateCustomRemarkType(
  customRemarkType: string,
  remarkType: string,
  existingCategories?: Array<{ categoryName: string }> | string[]
): string | null {
  if (remarkType === "Other") {
    const ct = (customRemarkType || "").trim();
    if (!ct) {
      return "form.validation.customRemarkTypeRequired";
    }
    if (ct.length < 3) {
      return "form.validation.customRemarkTypeMinLength";
    }
    if (ct.length > 50) {
      return "form.validation.customRemarkTypeMaxLength";
    }
    if (/^\s+$/.test(customRemarkType)) {
      return "form.validation.customRemarkTypeSpacesOnly";
    }
    if (/\s{2,}/.test(customRemarkType)) {
      return "form.validation.customRemarkTypeConsecutiveSpaces";
    }
    if (!DESCRIPTION_REGEX.test(ct)) {
      return "form.validation.customRemarkTypeFormat";
    }
    if (existingCategories && existingCategories.length > 0) {
      const lowerCt = ct.toLowerCase();
      const isDuplicate = existingCategories.some((cat) => {
        const name = typeof cat === "string" ? cat : cat.categoryName;
        return (name || "").trim().toLowerCase() === lowerCt;
      });
      if (isDuplicate) {
        return "form.validation.customRemarkTypeExists";
      }
    }
  }
  return null;
}

/**
 * Shared validator for remark
 */
export function validateRemark(remark?: string): string | null {
  const remarkVal = (remark || "").trim();
  if (!remarkVal) {
    return "form.validation.remarkRequired";
  }
  if (remarkVal.length < 3) {
    return "form.validation.remarkMinLength";
  }
  if (remarkVal.length > 300) {
    return "form.validation.remarkMaxLength";
  }
  if (remark && /^\s+$/.test(remark)) {
    return "form.validation.remarkSpacesOnly";
  }
  if (remark && /\s{2,}/.test(remark)) {
    return "form.validation.remarkConsecutiveSpaces";
  }
  if (!DESCRIPTION_REGEX.test(remarkVal)) {
    return "form.validation.remarkFormat";
  }
  return null;
}

/**
 * Shared validator for isActive status constraints
 */
export function validateIsActive(isActive: boolean, isEdit: boolean): string | null {
  if (!isActive && !isEdit) {
    return "form.validation.mustBeActive";
  }
  return null;
}

/**
 * Validates form data for create operation
 */
export function validateCreateFormData(data: CommonRemarkFormModel): void {
  const remarkTypeErr = validateRemarkType(data.remarkType);
  if (remarkTypeErr) {
    throw new ApiError(400, "Remark Type is required", "Validation failed");
  }

  const customRemarkTypeErr = validateCustomRemarkType(data.customRemarkType || "", data.remarkType);
  if (customRemarkTypeErr) {
    throw new ApiError(400, "Invalid Custom Remark Type value", "Validation failed");
  }

  const remarkErr = validateRemark(data.remark);
  if (remarkErr) {
    throw new ApiError(400, "Invalid Remark content", "Validation failed");
  }

  const isActiveErr = validateIsActive(data.isActive, false);
  if (isActiveErr) {
    throw new ApiError(400, "Common Remark status must be active on creation", "Validation failed");
  }
}

/**
 * Validates form data for update operation
 */
export function validateUpdateFormData(data: CommonRemarkFormModel): void {
  if (!data.id || data.id <= 0) {
    throw new ApiError(400, "Common Remark ID is required for update", "Validation failed");
  }

  const remarkTypeErr = validateRemarkType(data.remarkType);
  if (remarkTypeErr) {
    throw new ApiError(400, "Remark Type is required", "Validation failed");
  }

  const customRemarkTypeErr = validateCustomRemarkType(data.customRemarkType || "", data.remarkType);
  if (customRemarkTypeErr) {
    throw new ApiError(400, "Invalid Custom Remark Type value", "Validation failed");
  }

  const remarkErr = validateRemark(data.remark);
  if (remarkErr) {
    throw new ApiError(400, "Invalid Remark content", "Validation failed");
  }

  const isActiveErr = validateIsActive(data.isActive, true);
  if (isActiveErr) {
    throw new ApiError(400, "Invalid status configuration", "Validation failed");
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
 */
export function createApiError(statusCode?: number, errorMessage?: string, defaultMessage: string = "Operation failed"): ApiError {
  const errorMsg = errorMessage || "";
  const isDuplicate = errorMsg.toLowerCase().includes("already exists") || 
                      errorMsg.toLowerCase().includes("duplicate");
  
  return new ApiError(
    statusCode ?? (isDuplicate ? 409 : 500),
    errorMessage || defaultMessage,
    defaultMessage
  );
}
