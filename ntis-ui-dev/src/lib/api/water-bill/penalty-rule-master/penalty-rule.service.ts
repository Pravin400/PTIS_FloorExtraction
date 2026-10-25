import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import type { PagedResponse } from "@/types/common.types";
import type {
  WaterPenaltyRuleDto,
  CreateWaterPenaltyRuleModel,
  UpdateWaterPenaltyRuleModel,
  WaterPenaltyRuleQueryParams,
  PenaltyRule,
  PenaltyRuleFormModel,
  RawPenaltyRule,
} from "@/types/water-bill/penalty-rule-master.types";
import {
  isPenaltyRuleShape,
  normalizePenaltyRule,
  normalizeWaterPenaltyRuleDto,
} from "./penalty-rule-guard";
import {
  validateid,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  getDeleteErrorStatusCode,
  createApiError,
} from "./penalty-rule-validation";

const logger = createLogger("WaterPenaltyRuleMaster");

/**
 * Normalizes nullable relational IDs (connectionCategoryId, geographyUnitId, chargeHeadId)
 */
function normalizePayloadForeignKeys<T extends Record<string, unknown>>(payload: T): T {
  return {
    ...payload,
    connectionCategoryId:
      payload.connectionCategoryId != null && Number(payload.connectionCategoryId) > 0
        ? Number(payload.connectionCategoryId)
        : null,
    geographyUnitId:
      payload.geographyUnitId != null && Number(payload.geographyUnitId) > 0
        ? Number(payload.geographyUnitId)
        : null,
    chargeHeadId:
      payload.chargeHeadId != null && Number(payload.chargeHeadId) > 0
        ? Number(payload.chargeHeadId)
        : null,
  };
}

/**
 * Builds query parameters for penalty rules list endpoint
 */
function buildPenaltyRuleQueryParams(params: WaterPenaltyRuleQueryParams): URLSearchParams {
  const query = new URLSearchParams();
  query.set("PageNumber", String(Math.max(1, params.pageNumber ?? 1)));
  query.set("PageSize", String(Math.max(1, params.pageSize ?? 10)));

  const safeSearchTerm = validateAndPrepareSearchTerm(params.searchTerm);
  if (safeSearchTerm) query.set("SearchTerm", safeSearchTerm);
  if (params.sortBy?.trim()) query.set("SortBy", params.sortBy.trim());
  if (params.sortOrder?.trim()) query.set("SortOrder", params.sortOrder.trim());
  if (params.financialYearId) query.set("FinancialYearId", String(params.financialYearId));
  if (params.connectionCategoryId) query.set("ConnectionCategoryId", String(params.connectionCategoryId));
  if (params.geographyUnitId) query.set("GeographyUnitId", String(params.geographyUnitId));
  if (params.chargeHeadId) query.set("ChargeHeadId", String(params.chargeHeadId));
  if (params.penaltyType) query.set("PenaltyType", params.penaltyType);
  if (params.isCurrentBill !== undefined) query.set("IsCurrentBill", String(params.isCurrentBill));
  if (params.isPendingBill !== undefined) query.set("IsPendingBill", String(params.isPendingBill));
  if (params.isActive !== undefined) query.set("IsActive", String(params.isActive));

  return query;
}

/**
 * Fetches paginated penalty rules.
 * Supports both modern WaterPenaltyRuleQueryParams object signature and legacy positional parameters.
 */
export async function getPenaltyRulesPaged(
  params: WaterPenaltyRuleQueryParams
): Promise<PagedResponse<WaterPenaltyRuleDto>>;
export async function getPenaltyRulesPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<PenaltyRule>>;
export async function getPenaltyRulesPaged(
  paramOrPageNumber: WaterPenaltyRuleQueryParams | number,
  pageSizeArg?: number,
  searchTermArg?: string,
  sortByArg?: string,
  sortOrderArg?: string
): Promise<PagedResponse<WaterPenaltyRuleDto> | PagedResponse<PenaltyRule>> {
  const isPositional = typeof paramOrPageNumber === "number";
  const params: WaterPenaltyRuleQueryParams = isPositional
    ? {
        pageNumber: paramOrPageNumber,
        pageSize: pageSizeArg ?? 10,
        searchTerm: searchTermArg,
        sortBy: sortByArg,
        sortOrder: sortOrderArg === "desc" ? "desc" : sortOrderArg === "asc" ? "asc" : undefined,
      }
    : paramOrPageNumber;

  const pageNumber = Math.max(1, params.pageNumber ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const query = buildPenaltyRuleQueryParams(params);

  try {
    let response = await apiClient.get<PagedResponse<RawPenaltyRule>>(`/PenaltyRuleMaster?${query.toString()}`);
    if (!response.success && response.statusCode === 404) {
      response = await apiClient.get<PagedResponse<RawPenaltyRule>>(`/PenaltyRule?${query.toString()}`);
    }

    if (!response.success) {
      throw createApiError(
        response.statusCode,
        response.error || "Failed to fetch paged penalty rules",
        "Get paged penalty rules failed"
      );
    }
    if (!response.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }

    const raw = response.data as unknown as Record<string, unknown>;
    const rawItems = ((raw.items ?? raw.data ?? []) as unknown[]);
    const validItems = Array.isArray(rawItems) ? rawItems.filter(isPenaltyRuleShape) : [];

    const totalCount = Number(raw.totalCount ?? validItems.length);
    const totalPages = Number(raw.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

    if (isPositional) {
      const items = validItems.map((item) => normalizePenaltyRule(item as RawPenaltyRule));
      return {
        items,
        totalCount,
        pageNumber,
        pageSize,
        totalPages,
        hasPrevious: Boolean(raw.hasPrevious ?? pageNumber > 1),
        hasNext: Boolean(raw.hasNext ?? pageNumber < totalPages),
      };
    }

    const items = validItems.map((item) => normalizeWaterPenaltyRuleDto(item as RawPenaltyRule));
    return {
      items,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
      hasPrevious: Boolean(raw.hasPrevious ?? pageNumber > 1),
      hasNext: Boolean(raw.hasNext ?? pageNumber < totalPages),
    };
  } catch (error) {
    logger.error("Error fetching paged penalty rules", undefined, error);
    throw error;
  }
}

export const getPenaltyRulePaged = getPenaltyRulesPaged;

/**
 * Fetches a single penalty rule by ID.
 * Enforces ID validation and normalizes response shape.
 */
export async function getPenaltyRuleById(id: number): Promise<WaterPenaltyRuleDto | null> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Penalty Rule ID is required", "Invalid penalty rule ID");
    }

    let response = await apiClient.get<RawPenaltyRule>(`/PenaltyRuleMaster/${encodeURIComponent(String(id))}`);
    if (!response.success && response.statusCode === 404) {
      response = await apiClient.get<RawPenaltyRule>(`/PenaltyRule/${encodeURIComponent(String(id))}`);
    }

    if (!response.success) {
      if (response.statusCode === 404) return null;
      throw createApiError(
        response.statusCode,
        response.error || `Failed to fetch penalty rule ${id}`,
        `Get penalty rule ${id} failed`
      );
    }
    if (!response.data) return null;

    const raw = response.data as Record<string, unknown>;
    const itemData = (raw.items ?? raw.data ?? raw) as RawPenaltyRule;
    return normalizeWaterPenaltyRuleDto(itemData);
  } catch (error) {
    logger.error("Error fetching penalty rule", { id }, error);
    throw error;
  }
}

/**
 * Creates a new penalty rule.
 * Validates model, normalizes payload, and dispatches via apiClient.
 */
export async function createPenaltyRule(
  data: CreateWaterPenaltyRuleModel | PenaltyRuleFormModel
): Promise<WaterPenaltyRuleDto> {
  try {
    validateCreateFormData(data);

    const record = data as unknown as Record<string, unknown>;
    const penaltyCode = (record.penaltyCode ?? record.penaltyType ?? "").toString().trim();
    const penaltyName = (record.penaltyName ?? record.penaltyType ?? "").toString().trim();
    const calculationType = (record.calculationType ?? record.penaltyType ?? "Percentage").toString().trim();
    const isPercentage = calculationType === "Percentage" || calculationType === "MonthlyPercentage";

    const penaltyVal = record.penaltyValue != null
      ? Number(record.penaltyValue)
      : record.percentageRate != null
      ? Number(record.percentageRate)
      : record.flatAmount != null
      ? Number(record.flatAmount)
      : 0;

    const graceVal = Number(record.fromDay ?? record.gracePeriodDays ?? 0) || 0;

    const rawPayload = {
      // Legacy fields
      penaltyCode: penaltyCode || calculationType,
      penaltyName: penaltyName || calculationType,
      calculationType,
      penaltyValue: penaltyVal,
      gracePeriodDays: graceVal,
      // WaterBill specific fields
      financialYearId: Number(record.financialYearId ?? 1),
      connectionCategoryId: record.connectionCategoryId,
      geographyUnitId: record.geographyUnitId,
      chargeHeadId: record.chargeHeadId,
      penaltyType: (record.penaltyType as string)?.trim() || penaltyCode || calculationType,
      percentageRate: isPercentage ? penaltyVal : null,
      flatAmount: !isPercentage ? penaltyVal : null,
      maximumAmount: record.maximumAmount != null ? Number(record.maximumAmount) : null,
      fromDay: graceVal,
      toDay: record.toDay != null ? Number(record.toDay) : null,
      effectiveFrom: (record.effectiveFrom as string) || new Date().toISOString(),
      effectiveTo: (record.effectiveTo as string) || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isCurrentBill: record.isCurrentBill !== false,
      isPendingBill: Boolean(record.isPendingBill),
      isActive: record.isActive !== false,
      createdBy: Number(record.createdBy ?? 1),
    };

    const payload = normalizePayloadForeignKeys(rawPayload);

    let response = await apiClient.post<Record<string, unknown>>("/PenaltyRuleMaster", payload);
    if (!response.success && response.statusCode === 404) {
      response = await apiClient.post<Record<string, unknown>>("/PenaltyRule", payload);
    }

    if (!response.success || !response.data) {
      throw createApiError(response.statusCode, response.error, "Create penalty rule failed");
    }

    const raw = response.data as Record<string, unknown>;
    const item = (raw.items ?? raw.data ?? raw) as RawPenaltyRule;
    if (item && (item.id || item.penaltyRuleId)) {
      return normalizeWaterPenaltyRuleDto(item);
    }
    return normalizeWaterPenaltyRuleDto({ ...payload, penaltyRuleId: Number(raw.id ?? 1) });
  } catch (error) {
    logger.error("Error creating penalty rule", undefined, error);
    throw error;
  }
}

/**
 * Updates an existing penalty rule.
 * Validates ID & model, normalizes payload, and dispatches via apiClient.
 */
export async function updatePenaltyRule(
  idOrData: number | PenaltyRuleFormModel | (UpdateWaterPenaltyRuleModel & { id?: number }),
  dataArg?: UpdateWaterPenaltyRuleModel | PenaltyRuleFormModel
): Promise<WaterPenaltyRuleDto> {
  try {
    let id: number;
    let data: PenaltyRuleFormModel | UpdateWaterPenaltyRuleModel;

    if (typeof idOrData === "number") {
      id = idOrData;
      data = dataArg as UpdateWaterPenaltyRuleModel;
    } else {
      const rec = idOrData as unknown as Record<string, unknown>;
      id = Number(rec.id ?? rec.penaltyRuleId);
      data = idOrData;
    }

    if (!validateid(id)) {
      throw new ApiError(400, "Penalty Rule ID is required for update", "Validation failed");
    }

    validateUpdateFormData(data);

    const record = data as unknown as Record<string, unknown>;
    const penaltyCode = (record.penaltyCode ?? record.penaltyType ?? "").toString().trim();
    const penaltyName = (record.penaltyName ?? record.penaltyType ?? "").toString().trim();
    const calculationType = (record.calculationType ?? record.penaltyType ?? "Percentage").toString().trim();
    const isPercentage = calculationType === "Percentage" || calculationType === "MonthlyPercentage";

    const penaltyVal = record.penaltyValue != null
      ? Number(record.penaltyValue)
      : record.percentageRate != null
      ? Number(record.percentageRate)
      : record.flatAmount != null
      ? Number(record.flatAmount)
      : 0;

    const graceVal = Number(record.fromDay ?? record.gracePeriodDays ?? 0) || 0;

    const rawPayload = {
      id,
      penaltyRuleId: id,
      // Legacy fields
      penaltyCode: penaltyCode || calculationType,
      penaltyName: penaltyName || calculationType,
      calculationType,
      penaltyValue: penaltyVal,
      gracePeriodDays: graceVal,
      // WaterBill specific fields
      financialYearId: Number(record.financialYearId ?? 1),
      connectionCategoryId: record.connectionCategoryId,
      geographyUnitId: record.geographyUnitId,
      chargeHeadId: record.chargeHeadId,
      penaltyType: (record.penaltyType as string)?.trim() || penaltyCode || calculationType,
      percentageRate: isPercentage ? penaltyVal : null,
      flatAmount: !isPercentage ? penaltyVal : null,
      maximumAmount: record.maximumAmount != null ? Number(record.maximumAmount) : null,
      fromDay: graceVal,
      toDay: record.toDay != null ? Number(record.toDay) : null,
      effectiveFrom: (record.effectiveFrom as string) || new Date().toISOString(),
      effectiveTo: (record.effectiveTo as string) || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isCurrentBill: record.isCurrentBill !== false,
      isPendingBill: Boolean(record.isPendingBill),
      isActive: record.isActive !== false,
      updatedBy: Number(record.updatedBy ?? 1),
    };

    const payload = normalizePayloadForeignKeys(rawPayload);

    let response = await apiClient.put<Record<string, unknown>>(
      `/PenaltyRuleMaster/${encodeURIComponent(String(id))}`,
      payload
    );
    if (!response.success && response.statusCode === 404) {
      response = await apiClient.put<Record<string, unknown>>(
        `/PenaltyRule/${encodeURIComponent(String(id))}`,
        payload
      );
    }

    if (!response.success || !response.data) {
      throw createApiError(response.statusCode, response.error, "Update penalty rule failed");
    }

    const raw = response.data as Record<string, unknown>;
    const item = (raw.items ?? raw.data ?? raw) as RawPenaltyRule;
    if (item && (item.id || item.penaltyRuleId)) {
      return normalizeWaterPenaltyRuleDto(item);
    }
    return normalizeWaterPenaltyRuleDto({ ...payload, penaltyRuleId: id });
  } catch (error) {
    logger.error("Error updating penalty rule", undefined, error);
    throw error;
  }
}

/**
 * Deletes a penalty rule by ID.
 * Enforces ID validation and translates error status codes.
 */
export async function deletePenaltyRule(id: number): Promise<boolean> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Penalty Rule ID is required", "Validation failed");
    }

    let response = await apiClient.delete<boolean | void>(
      `/PenaltyRuleMaster/${encodeURIComponent(String(id))}`
    );
    if (!response.success && response.statusCode === 404) {
      response = await apiClient.delete<boolean | void>(
        `/PenaltyRule/${encodeURIComponent(String(id))}`
      );
    }

    if (!response.success) {
      let statusCode = response.statusCode;
      if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(response.error || "");
      }
      throw new ApiError(
        statusCode,
        response.error || "Failed to delete penalty rule",
        `Delete penalty rule ${id} failed`
      );
    }

    return true;
  } catch (error) {
    logger.error("Error deleting penalty rule", { id }, error);
    throw error;
  }
}

/**
 * Updates active status of a penalty rule.
 */
export async function updatePenaltyRuleStatus(id: number, isActive: boolean): Promise<boolean> {
  try {
    if (!validateid(id)) {
      throw new ApiError(400, "Valid Penalty Rule ID is required", "Validation failed");
    }

    const res = await apiClient.patch<boolean>(
      `/PenaltyRuleMaster/${encodeURIComponent(String(id))}/status`,
      { isActive }
    );
    if (!res.success) {
      throw createApiError(res.statusCode, res.error || "Failed to update penalty rule status", "Status update failed");
    }
    return res.data !== false;
  } catch (error) {
    logger.error("Error updating penalty rule status", { id, isActive }, error);
    throw error;
  }
}

/**
 * Validates a penalty rule configuration before save.
 */
export async function validatePenaltyRule(request: {
  financialYearId: number;
  connectionCategoryId?: number | null;
  geographyUnitId?: number | null;
  chargeHeadId?: number | null;
  effectiveFrom: string;
  effectiveTo: string;
  fromDay: number;
  toDay?: number | null;
  excludePenaltyRuleId?: number | null;
}): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
  try {
    const payload = normalizePayloadForeignKeys(request);
    const res = await apiClient.post<{ isValid: boolean; errors?: string[]; warnings?: string[] }>(
      "/PenaltyRuleMaster/validate",
      payload
    );
    return res.data ?? { isValid: true };
  } catch (error) {
    logger.error("Error validating penalty rule", undefined, error);
    return { isValid: false, errors: [error instanceof Error ? error.message : "Validation failed"] };
  }
}
