"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  getPenaltyRulesPaged,
  getPenaltyRuleById,
  createPenaltyRule,
  updatePenaltyRule,
  deletePenaltyRule,
  updatePenaltyRuleStatus,
} from "@/lib/api/water-bill/penalty-rule-master/penalty-rule.service";
import {
  fetchFinancialYearLookupOptions,
  fetchConnectionCategoryLookupOptions,
  fetchGeographyUnitLookupOptions,
  fetchChargeHeadLookupOptions,
} from "@/lib/api/water-bill/penalty-rule-master/lookups.service";
import type {
  WaterPenaltyRuleDto,
  CreateWaterPenaltyRuleModel,
  UpdateWaterPenaltyRuleModel,
  WaterPenaltyRuleQueryParams,
} from "@/types/water-bill/penalty-rule-master.types";
import type { LookupOption, FinancialYearLookupOption } from "@/types/water-bill/lookups.types";
import type { PagedResponse } from "@/types/common.types";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("WaterPenaltyRuleMaster");
const ROUTE_PATH = "/water-bill/penalty-rule-master";

function revalidateAllLocales() {
  for (const loc of locales) {
    revalidatePath(`/${loc}${ROUTE_PATH}`);
    revalidatePath(`/${loc}${ROUTE_PATH}/add`);
    revalidatePath(`/${loc}/water-bill/penalty-rules`);
  }
  revalidatePath(ROUTE_PATH, "layout");
}

export async function fetchPenaltyRulesAction(
  params: WaterPenaltyRuleQueryParams
): Promise<PagedResponse<WaterPenaltyRuleDto>> {
  try {
    return await getPenaltyRulesPaged(params);
  } catch (err: unknown) {
    logger.error("fetchPenaltyRulesAction failed", undefined, err);
    throw err;
  }
}

export async function fetchPenaltyRuleByIdAction(
  id: number
): Promise<WaterPenaltyRuleDto | null> {
  try {
    return await getPenaltyRuleById(id);
  } catch (err: unknown) {
    logger.error("fetchPenaltyRuleByIdAction failed", { id }, err);
    throw err;
  }
}

export async function fetchFinancialYearLookupOptionsAction(): Promise<FinancialYearLookupOption[]> {
  try {
    return await fetchFinancialYearLookupOptions();
  } catch (err: unknown) {
    logger.warn("fetchFinancialYearLookupOptionsAction fallback", undefined, err);
    return [];
  }
}

export async function fetchConnectionCategoryLookupOptionsAction(): Promise<LookupOption[]> {
  try {
    return await fetchConnectionCategoryLookupOptions();
  } catch (err: unknown) {
    logger.warn("fetchConnectionCategoryLookupOptionsAction fallback", undefined, err);
    return [];
  }
}

export async function fetchGeographyLookupOptionsAction(): Promise<LookupOption[]> {
  try {
    return await fetchGeographyUnitLookupOptions();
  } catch (err: unknown) {
    logger.warn("fetchGeographyLookupOptionsAction fallback", undefined, err);
    return [];
  }
}

export async function fetchChargeHeadLookupOptionsAction(): Promise<LookupOption[]> {
  try {
    return await fetchChargeHeadLookupOptions();
  } catch (err: unknown) {
    logger.warn("fetchChargeHeadLookupOptionsAction fallback", undefined, err);
    return [];
  }
}

export async function savePenaltyRuleAction(
  id: number | null,
  data: CreateWaterPenaltyRuleModel
): Promise<{ success: boolean; data?: WaterPenaltyRuleDto; error?: string }> {
  try {
    let result: WaterPenaltyRuleDto;
    if (id && id > 0) {
      result = await updatePenaltyRule(id, { ...data, penaltyRuleId: id } as UpdateWaterPenaltyRuleModel);
    } else {
      result = await createPenaltyRule(data);
    }
    revalidateAllLocales();
    return { success: true, data: result };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Operation failed";
    logger.error("savePenaltyRuleAction failed", { id }, err);
    return { success: false, error: errorMsg };
  }
}

export async function deletePenaltyRuleAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deletePenaltyRule(id);
    if (!success) {
      return { success: false, error: "Failed to delete penalty rule" };
    }
    revalidateAllLocales();
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Delete failed";
    logger.error("deletePenaltyRuleAction failed", { id }, err);
    return { success: false, error: errorMsg };
  }
}

export async function updatePenaltyRuleStatusAction(
  id: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await updatePenaltyRuleStatus(id, isActive);
    if (!success) {
      return { success: false, error: "Failed to update penalty rule status" };
    }
    revalidateAllLocales();
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Status update failed";
    logger.error("updatePenaltyRuleStatusAction failed", { id, isActive }, err);
    return { success: false, error: errorMsg };
  }
}
