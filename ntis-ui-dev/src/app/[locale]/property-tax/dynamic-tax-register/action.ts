"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { ActionResult } from "@/types/common.types";
import {
  updateTaxSettings,
  createTaxRegister,
  saveValueRows,
  bulkApplyValue,
  saveMasterMappings,
  bulkApplyMaster,
  saveHybridConfig,
  getTaxConfigSummary,
} from "@/lib/api/dynamic-tax-register.service";
import {
  saveConditionRuleRows,
  deleteConditionRuleRow,
  evaluateConditionRule,
  getDynamicFieldOptions,
} from "@/lib/api/dynamic-tax-register-condition.service";
import { fetchZones, fetchWardsByZone } from "@/lib/api/property-search";
import { ptisSearchService } from "@/lib/api/ptis/tab/ptis-search";
import { getFinancialYearsPaged } from "@/lib/api/financial-year.service";
import {
  UpdateTaxRegisterSettingsPayload,
  CreateTaxRegisterPayload,
  SaveValueBasedTaxPayload,
  BulkApplyValueBasedTaxPayload,
  SaveMasterMappingPayload,
  BulkApplyMasterMappingPayload,
  TaxHybridConfig,
  SaveConditionRuleRowsPayload,
  EvaluateConditionRulePayload,
  EvaluateConditionRuleResult,
  TestCascadeOption,
  TestPropertyRow,
  TaxConfigSummary,
} from "@/types/dynamic-tax-register.types";

const ROUTE_PATH = "/property-tax/dynamic-tax-register";

/** Revalidates the register list, and — when the mutation ran from the Configure drawer, which
 *  every save action here does — the actual `/add/[id]` route it was called from. Previously only
 *  the list route was revalidated, which was never the route any of these actions ran from; there
 *  is no `layout.tsx` at this segment, so covering the child route means naming it explicitly.
 *  Currently inert either way (every fetch in this feature uses `cache: "no-store"`, so nothing is
 *  ever cached to invalidate — freshness comes from the `router.refresh()` calls next to these) but
 *  correct in intent, so it isn't silently wrong if that ever changes. */
function revalidateRegister(taxId?: number): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}${ROUTE_PATH}`, "page");
    if (taxId !== undefined) {
      revalidatePath(`/${locale}${ROUTE_PATH}/add/${taxId}`, "page");
    }
  }
}

/** Extracts a human-readable message from an ASP.NET ProblemDetails/ValidationProblemDetails JSON body. */
async function parseApiErrorMessage(responseText: string): Promise<string | null> {
  try {
    const parsed = JSON.parse(responseText) as { title?: string; message?: string; errors?: Record<string, string[]> };
    if (parsed.errors) {
      const codes = Array.from(new Set(Object.values(parsed.errors).flat()));
      if (codes.length > 0) {
        const t = await getTranslations("dynamicTaxRegister");
        /** Known backend validation error codes (from [Range]/[Required] ErrorMessage attributes) mapped to readable text. */
        const ERROR_CODE_MESSAGES: Record<string, string> = {
          ValueBasedTax_Percentage_OutOfRange: t("actionErrors.percentageOutOfRange"),
          MasterBasedTax_ResultValue_OutOfRange: t("actionErrors.resultValueOutOfRange"),
          ConditionBasedTax_ResultValue_OutOfRange: t("actionErrors.resultValueOutOfRange"),
        };
        return codes.map((c) => ERROR_CODE_MESSAGES[c] ?? c.replace(/_/g, " ")).join(" ");
      }
    }
    return parsed.message ?? parsed.title ?? null;
  } catch {
    return null;
  }
}

/** Cleans technical backend error messages (such as database field names or raw entity IDs) into user-friendly text. */
function sanitizeErrorMessage(msg: string): string {
  const cleaned = msg.trim();
  if (/RuleDefinitionId\s*=\s*0/i.test(cleaned) || /RuleDefinitionId.*does not exist/i.test(cleaned)) {
    return "Selected Rule Name does not exist or is inactive. Please select a valid Rule Name.";
  }
  return cleaned
    .replace(/RuleDefinitionId/gi, "Rule Name")
    .replace(/TaxId/gi, "Tax ID");
}

/** Wraps an unknown error into a uniform ActionResult failure, extracting a readable
 *  message instead of surfacing the raw ASP.NET error JSON to the user. `fallbackKey` is
 *  a key under the `dynamicTaxRegister.actionErrors` namespace, resolved to the request's locale. */
async function toFailure(error: unknown, fallbackKey: string): Promise<ActionResult<never>> {
  const t = await getTranslations("dynamicTaxRegister");
  const fallback = t(`actionErrors.${fallbackKey}`);
  if (error instanceof ApiError) {
    // Three tiers, most specific first. The middle one matters: ApiError.responseText holds the
    // error STRING, not a JSON body (see ApiError's constructor), so parseApiErrorMessage —
    // which JSON.parses it — returns null for every plain-text backend message. Without this
    // fallback the user always saw the generic text and the real reason was silently dropped.
    const parsed = await parseApiErrorMessage(error.responseText);
    const readable = parsed ?? (error.error?.trim() ? error.error : null);
    const finalError = readable ? sanitizeErrorMessage(readable) : fallback;
    return { success: false, error: finalError, statusCode: error.statusCode };
  }
  if (error instanceof Error) return { success: false, error: sanitizeErrorMessage(error.message) };
  return { success: false, error: fallback };
}

/* ── General-tab settings save ─────────────────────────────── */

export async function saveTaxSettingsAction(
  id: number,
  payload: UpdateTaxRegisterSettingsPayload
): Promise<ActionResult<never>> {
  try {
    await updateTaxSettings(id, payload);
    revalidateRegister(id);
    return { success: true };
  } catch (error) {
    return toFailure(error, "saveTaxSettingsFailed");
  }
}

/** Configuration row counts for one tax — fetched on demand, immediately before warning the admin
 *  that changing the Rule Category will delete the configuration saved under the current mode. */
export async function fetchTaxConfigSummaryAction(
  id: number
): Promise<ActionResult<TaxConfigSummary>> {
  try {
    return { success: true, data: await getTaxConfigSummary(id) };
  } catch (error) {
    return toFailure(error, "saveTaxSettingsFailed");
  }
}

/** Creates a new tax (Add Tax) and returns its assigned TaxId. */
export async function createTaxAction(
  payload: CreateTaxRegisterPayload
): Promise<ActionResult<number>> {
  try {
    const taxId = await createTaxRegister(payload);
    revalidateRegister();
    return { success: true, data: taxId };
  } catch (error) {
    return toFailure(error, "createTaxFailed");
  }
}

/* ── Value-based config ────────────────────────────────────── */

export async function saveValueAction(
  payload: SaveValueBasedTaxPayload
): Promise<ActionResult<never>> {
  try {
    await saveValueRows(payload);
    revalidateRegister(payload.taxId);
    return { success: true };
  } catch (error) {
    return toFailure(error, "saveValuePercentagesFailed");
  }
}

export async function bulkApplyValueAction(
  payload: BulkApplyValueBasedTaxPayload
): Promise<ActionResult<never>> {
  try {
    await bulkApplyValue(payload);
    // Missing on this action alone until now, unlike every sibling save above — added for
    // consistency (see revalidateRegister's own doc-comment on why this is currently inert).
    revalidateRegister(payload.taxId);
    return { success: true };
  } catch (error) {
    return toFailure(error, "bulkApplyValueFailed");
  }
}

/* ── Master-based config ───────────────────────────────────── */

export async function saveMasterAction(
  payload: SaveMasterMappingPayload
): Promise<ActionResult<never>> {
  try {
    await saveMasterMappings(payload);
    revalidateRegister(payload.taxId);
    return { success: true };
  } catch (error) {
    return toFailure(error, "saveMasterMappingsFailed");
  }
}

export async function bulkApplyMasterAction(
  payload: BulkApplyMasterMappingPayload
): Promise<ActionResult<never>> {
  try {
    await bulkApplyMaster(payload);
    // Missing on this action alone until now, unlike every sibling save above — added for
    // consistency (see revalidateRegister's own doc-comment on why this is currently inert).
    revalidateRegister(payload.taxId);
    return { success: true };
  } catch (error) {
    return toFailure(error, "bulkApplyMasterFailed");
  }
}

/* ── Hybrid config ─────────────────────────────────────────── */

export async function saveHybridConfigAction(
  taxId: number,
  payload: TaxHybridConfig
): Promise<ActionResult<never>> {
  try {
    await saveHybridConfig(taxId, payload);
    revalidateRegister(taxId);
    return { success: true };
  } catch (error) {
    return toFailure(error, "saveHybridConfigFailed");
  }
}

/* ── Condition-based rule builder (embedded, self-contained) ── */

export async function saveConditionRuleRowsAction(
  payload: SaveConditionRuleRowsPayload
): Promise<ActionResult<never>> {
  try {
    await saveConditionRuleRows(payload);
    revalidateRegister(payload.taxId);
    return { success: true };
  } catch (error) {
    return toFailure(error, "saveConditionRulesFailed");
  }
}

export async function evaluateConditionRuleAction(
  payload: EvaluateConditionRulePayload
): Promise<ActionResult<EvaluateConditionRuleResult>> {
  try {
    const data = await evaluateConditionRule(payload);
    return { success: true, data };
  } catch (error) {
    return toFailure(error, "evaluateConditionRuleFailed");
  }
}

/** Permanently purges one condition row immediately on confirm — not deferred to the next
 *  "Save Configuration" (unlike saveConditionRuleRowsAction, which never deletes omitted rows). */
export async function deleteConditionRuleRowAction(
  id: number,
  taxId: number
): Promise<ActionResult<never>> {
  try {
    await deleteConditionRuleRow(id, taxId);
    revalidateRegister(taxId);
    return { success: true };
  } catch (error) {
    return toFailure(error, "deleteConditionRuleFailed");
  }
}

/** Mirrors the standalone Rule Engine's fetchDynamicFieldOptionsAction — lets
 *  ConditionValueInput resolve API-sourced dropdown options for a condition field. */
export async function fetchDynamicConditionFieldOptionsAction(
  endpoint: string,
  method: string = "GET",
  params?: string,
  mapping?: string
): Promise<{ label: string; value: string }[]> {
  try {
    return await getDynamicFieldOptions(endpoint, method, params, mapping);
  } catch {
    return [];
  }
}

/* ── "Test this Rule" cascade (Zone → Ward → Property → Partition + Finance Year) ──
 * Powers the dependent dropdowns that replace the raw Property Id / Details Id inputs,
 * resolving the user's selection down to a single PropertyId the evaluate API expects.
 * All are resilient (return [] on failure) — a lookup hiccup must not break the modal. */

export async function fetchTestZonesAction(): Promise<TestCascadeOption[]> {
  try {
    const zones = await fetchZones();
    return zones
      .filter((z) => z.isActive)
      .map((z) => ({ value: z.zoneId, label: z.description ?? z.zoneNo }));
  } catch {
    return [];
  }
}

export async function fetchTestWardsAction(zoneId: number): Promise<TestCascadeOption[]> {
  try {
    const wards = await fetchWardsByZone(zoneId);
    return wards.map((w) => ({ value: w.wardId, label: w.description ?? w.wardNo }));
  } catch {
    return [];
  }
}

/** Every property row for a ward — the client groups these by `propertyNo` (the Property dropdown)
 *  and, within a propertyNo, by `partitionNo` (the Partition dropdown → its `propertyId`). */
export async function fetchTestPropertiesAction(wardId: number): Promise<TestPropertyRow[]> {
  try {
    const res = await ptisSearchService.getPropertyListByWard(wardId);
    if (!res.success || !res.data) return [];
    return res.data.map((p) => ({
      propertyId: p.propertyId,
      propertyNo: p.propertyNo,
      partitionNo: p.partitionNo,
    }));
  } catch {
    return [];
  }
}

export async function fetchTestFinanceYearsAction(): Promise<TestCascadeOption[]> {
  try {
    const res = await getFinancialYearsPaged(1, 2000);
    return res.items
      .filter((y) => y.isActive)
      .map((y) => ({ value: y.year, label: y.yearCode ?? String(y.year) }));
  } catch {
    return [];
  }
}
