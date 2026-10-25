import {
  PenaltyRuleFormModel,
  CreateWaterPenaltyRuleModel,
  UpdateWaterPenaltyRuleModel,
} from "@/types/water-bill/penalty-rule-master.types";
import { ApiError } from "@/lib/utils/api";

/**
 * Validates penalty rule ID
 */
export function validateid(id: number): boolean {
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
export function validateCreateFormData(data: PenaltyRuleFormModel | CreateWaterPenaltyRuleModel): void {
  const record = data as unknown as Record<string, unknown>;
  const code = (record.penaltyCode ?? record.penaltyType)?.toString().trim();
  if (!code) {
    throw new ApiError(400, "Penalty code is required", "Validation failed");
  }

  const name = (record.penaltyName ?? record.penaltyType)?.toString().trim();
  if (!name) {
    throw new ApiError(400, "Penalty name is required", "Validation failed");
  }

  const allowedCalculationTypes = ["Percentage", "FlatAmount", "PerDay", "Flat", "MonthlyPercentage"];
  const calcType = (record.calculationType ?? record.penaltyType)?.toString().trim();
  if (calcType && !allowedCalculationTypes.includes(calcType)) {
    throw new ApiError(400, "Valid calculation type is required", "Validation failed");
  }

  const penaltyVal = record.penaltyValue != null
    ? Number(record.penaltyValue)
    : record.percentageRate != null
    ? Number(record.percentageRate)
    : record.flatAmount != null
    ? Number(record.flatAmount)
    : 0;

  if (!Number.isFinite(penaltyVal) || penaltyVal < 0) {
    throw new ApiError(400, "Penalty value must be a non-negative number", "Validation failed");
  }

  const isPercentage = calcType === "Percentage" || calcType === "MonthlyPercentage" || record.percentageRate != null;
  if (isPercentage && penaltyVal > 999) {
    throw new ApiError(400, "Percentage rate cannot exceed 999%", "Validation failed");
  }

  if (record.fromDay != null) {
    const fromDay = Number(record.fromDay);
    if (!Number.isFinite(fromDay) || fromDay < 0 || !Number.isInteger(fromDay)) {
      throw new ApiError(400, "From Overdue Day must be an integer 0 or greater", "Validation failed");
    }
  } else if (record.gracePeriodDays != null) {
    const grace = Number(record.gracePeriodDays);
    if (!Number.isFinite(grace) || grace < 0 || !Number.isInteger(grace) || grace > 100) {
      throw new ApiError(400, "Grace period must be an integer between 0 and 100", "Validation failed");
    }
  }

  if (record.toDay != null) {
    const toDay = Number(record.toDay);
    const fromDay = record.fromDay != null ? Number(record.fromDay) : 0;
    if (!Number.isFinite(toDay) || toDay < 0 || !Number.isInteger(toDay) || toDay < fromDay) {
      throw new ApiError(400, "To Day must be an integer greater than or equal to From Day", "Validation failed");
    }
  }

  if (record.effectiveFrom && record.effectiveTo) {
    const fromTime = new Date(String(record.effectiveFrom)).getTime();
    const toTime = new Date(String(record.effectiveTo)).getTime();
    if (!Number.isNaN(fromTime) && !Number.isNaN(toTime) && toTime < fromTime) {
      throw new ApiError(400, "Effective To date must be on or after Effective From date", "Validation failed");
    }
  }
}

/**
 * Validates form data for update operation
 */
export function validateUpdateFormData(data: PenaltyRuleFormModel | UpdateWaterPenaltyRuleModel): void {
  const record = data as unknown as Record<string, unknown>;
  const rawId = Number(record.id ?? record.penaltyRuleId);
  if (!validateid(rawId)) {
    throw new ApiError(400, "Penalty Rule ID is required for update", "Validation failed");
  }
  validateCreateFormData(data as PenaltyRuleFormModel);
}

export const validatePenaltyRuleModel = validateCreateFormData;

/**
 * Determines status code from error message for delete operations
 */
export function getDeleteErrorStatusCode(errorMsg: string): number {
  const lowerMsg = errorMsg.toLowerCase();

  if (lowerMsg.includes("not found") || lowerMsg.includes("does not exist")) {
    return 404;
  } else if (
    lowerMsg.includes("in use") ||
    lowerMsg.includes("linked") ||
    lowerMsg.includes("referenced") ||
    lowerMsg.includes("associated") ||
    lowerMsg.includes("cannot delete")
  ) {
    return 409;
  } else if (lowerMsg.includes("invalid") || lowerMsg.includes("bad request")) {
    return 400;
  } else {
    return 500;
  }
}

/**
 * Creates appropriate ApiError based on response status and message
 */
export function createApiError(
  statusCode?: number,
  errorMessage?: string,
  defaultMessage: string = "Operation failed"
): ApiError {
  const errorMsg = errorMessage || "";
  const isDuplicate =
    errorMsg.toLowerCase().includes("already exists") ||
    errorMsg.toLowerCase().includes("duplicate") ||
    errorMsg.toLowerCase().includes("penaltyrule_code_duplicate");

  return new ApiError(
    statusCode ?? (isDuplicate ? 409 : 500),
    errorMessage || defaultMessage,
    defaultMessage
  );
}
