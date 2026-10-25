import { PenaltyRule, RawPenaltyRule, WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";

/**
 * Type guard for PagedResponse<PenaltyRule>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<PenaltyRule> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    typeof obj.totalCount === "number" &&
    typeof obj.pageNumber === "number" &&
    typeof obj.pageSize === "number" &&
    typeof obj.totalPages === "number"
  );
}

/**
 * Type guard for PenaltyRule - validates structure before normalization
 */
export function isPenaltyRuleShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const rawId = obj.id ?? obj.penaltyRuleId;
  return typeof rawId === "number" && Number.isFinite(rawId) && rawId > 0;
}

/**
 * Normalizes and validates a penalty rule object to PenaltyRule
 */
export function normalizePenaltyRule(item: RawPenaltyRule | Record<string, unknown>): PenaltyRule {
  const data = item as Record<string, unknown>;
  const rawId = Number(data.id ?? data.penaltyRuleId);
  if (!Number.isFinite(rawId) || rawId <= 0) {
    throw new ApiError(500, "Invalid data received from server", `Invalid penalty rule id: ${data.id ?? data.penaltyRuleId}`);
  }

  const penaltyCode = String(data.penaltyCode ?? data.code ?? data.penaltyType ?? "").trim();
  const penaltyName = String(data.penaltyName ?? data.name ?? data.penaltyType ?? "").trim();
  
  let calculationType = String(data.calculationType ?? "").trim();
  if (!calculationType) {
    if (data.percentageRate != null && Number(data.percentageRate) > 0) {
      calculationType = "Percentage";
    } else {
      calculationType = "FlatAmount";
    }
  }

  let penaltyValue = 0;
  if (data.penaltyValue != null) {
    penaltyValue = Number(data.penaltyValue) || 0;
  } else if (data.percentageRate != null) {
    penaltyValue = Number(data.percentageRate) || 0;
  } else if (data.flatAmount != null) {
    penaltyValue = Number(data.flatAmount) || 0;
  }

  const gracePeriodDays = Number(data.gracePeriodDays ?? data.fromDay ?? 0) || 0;
  const isActive = parseBoolean(data.isActive);

  return {
    id: rawId,
    penaltyCode,
    penaltyName,
    calculationType,
    penaltyValue,
    gracePeriodDays,
    isActive,
    createdDate: data.createdDate != null ? String(data.createdDate) : null,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
    createdBy: data.createdBy != null ? Number(data.createdBy) : null,
    updatedBy: typeof data.updatedBy === "number" ? data.updatedBy : data.updatedBy != null ? String(data.updatedBy) : null,
  };
}

/**
 * Normalizes and validates a raw response object into WaterPenaltyRuleDto
 */
export function normalizeWaterPenaltyRuleDto(item: RawPenaltyRule | Record<string, unknown>): WaterPenaltyRuleDto {
  const data = item as Record<string, unknown>;
  const rawId = Number(data.penaltyRuleId ?? data.id ?? 0);
  if (!Number.isFinite(rawId) || rawId <= 0) {
    throw new ApiError(500, "Invalid data received from server", `Invalid penalty rule id: ${data.penaltyRuleId ?? data.id}`);
  }

  const penaltyType = String(data.penaltyType ?? data.penaltyCode ?? data.code ?? "Percentage").trim();
  const calculationType = String(data.calculationType ?? (data.percentageRate != null ? "Percentage" : "FlatAmount")).trim();
  const fromDay = Number(data.fromDay ?? data.gracePeriodDays ?? 0) || 0;
  const toDay = data.toDay != null ? Number(data.toDay) : null;
  const percentageRate = data.percentageRate != null
    ? Number(data.percentageRate)
    : (data.penaltyValue != null && calculationType === "Percentage" ? Number(data.penaltyValue) : null);
  const flatAmount = data.flatAmount != null
    ? Number(data.flatAmount)
    : (data.penaltyValue != null && calculationType !== "Percentage" ? Number(data.penaltyValue) : null);
  const maximumAmount = data.maximumAmount != null ? Number(data.maximumAmount) : null;

  return {
    penaltyRuleId: rawId,
    id: rawId,
    financialYearId: Number(data.financialYearId ?? 1),
    financialYearName: data.financialYearName != null ? String(data.financialYearName) : null,
    connectionCategoryId:
      data.connectionCategoryId != null && Number(data.connectionCategoryId) > 0
        ? Number(data.connectionCategoryId)
        : null,
    connectionCategoryName: data.connectionCategoryName != null ? String(data.connectionCategoryName) : null,
    geographyUnitId:
      data.geographyUnitId != null && Number(data.geographyUnitId) > 0
        ? Number(data.geographyUnitId)
        : null,
    geographyName: data.geographyName != null ? String(data.geographyName) : null,
    chargeHeadId:
      data.chargeHeadId != null && Number(data.chargeHeadId) > 0
        ? Number(data.chargeHeadId)
        : null,
    chargeHeadName: data.chargeHeadName != null ? String(data.chargeHeadName) : null,
    penaltyType,
    penaltyCode: String(data.penaltyCode ?? penaltyType),
    penaltyName: String(data.penaltyName ?? penaltyType),
    calculationType,
    penaltyValue: (percentageRate ?? flatAmount ?? 0),
    gracePeriodDays: fromDay,
    fromDay,
    toDay,
    percentageRate,
    flatAmount,
    maximumAmount,
    effectiveFrom: String(data.effectiveFrom ?? new Date().toISOString()),
    effectiveTo: String(data.effectiveTo ?? new Date().toISOString()),
    isCurrentBill: data.isCurrentBill !== undefined ? parseBoolean(data.isCurrentBill) : true,
    isPendingBill: data.isPendingBill !== undefined ? parseBoolean(data.isPendingBill) : false,
    isActive: data.isActive !== undefined ? parseBoolean(data.isActive) : true,
    createdDate: data.createdDate != null ? String(data.createdDate) : null,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
    createdBy: data.createdBy != null ? Number(data.createdBy) : null,
    createdByName: data.createdByName != null ? String(data.createdByName) : null,
    updatedBy: typeof data.updatedBy === "number" ? data.updatedBy : data.updatedBy != null ? String(data.updatedBy) : null,
    updatedByName: data.updatedByName != null ? String(data.updatedByName) : null,
  };
}
