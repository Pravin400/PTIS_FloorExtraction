"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { PagedResponse, ActionResult } from "@/types/common.types";
import {
  getRulesPaged,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
} from "@/lib/api/dynamic-tax-register.service";
import {
  DynamicTaxRule,
  DynamicTaxRuleQuery,
  CreateDynamicTaxRulePayload,
  UpdateDynamicTaxRulePayload,
} from "@/types/dynamic-tax-register.types";

const ROUTE_PATH = "/property-tax/dynamic-tax-register";

function revalidateRules(): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}${ROUTE_PATH}/manageRule`, "page");
    revalidatePath(`/${locale}${ROUTE_PATH}`, "page");
  }
}

/** `fallbackKey` is a key under the `dynamicTaxRegister.actionErrors` namespace, resolved to the request's locale. */
async function toFailure(error: unknown, fallbackKey: string): Promise<ActionResult<never>> {
  if (error instanceof ApiError) {
    return { success: false, error: error.responseText, statusCode: error.statusCode };
  }
  if (error instanceof Error) return { success: false, error: error.message };
  const t = await getTranslations("dynamicTaxRegister");
  return { success: false, error: t(`actionErrors.${fallbackKey}`) };
}

export async function fetchRulesAction(
  query: DynamicTaxRuleQuery
): Promise<ActionResult<PagedResponse<DynamicTaxRule>>> {
  try {
    const data = await getRulesPaged(query);
    return { success: true, data };
  } catch (error) {
    return toFailure(error, "loadRulesFailed");
  }
}

export async function getRuleByIdAction(
  id: number
): Promise<ActionResult<DynamicTaxRule | null>> {
  try {
    const data = await getRuleById(id);
    return { success: true, data };
  } catch (error) {
    return toFailure(error, "loadRuleFailed");
  }
}

export async function createRuleAction(
  payload: CreateDynamicTaxRulePayload
): Promise<ActionResult<never>> {
  try {
    await createRule(payload);
    revalidateRules();
    return { success: true };
  } catch (error) {
    return toFailure(error, "createRuleFailed");
  }
}

export async function updateRuleAction(
  id: number,
  payload: UpdateDynamicTaxRulePayload
): Promise<ActionResult<never>> {
  try {
    await updateRule(id, payload);
    revalidateRules();
    return { success: true };
  } catch (error) {
    return toFailure(error, "updateRuleFailed");
  }
}

export async function deleteRuleAction(id: number): Promise<ActionResult<never>> {
  try {
    await deleteRule(id);
    revalidateRules();
    return { success: true };
  } catch (error) {
    return toFailure(error, "deleteRuleFailed");
  }
}
