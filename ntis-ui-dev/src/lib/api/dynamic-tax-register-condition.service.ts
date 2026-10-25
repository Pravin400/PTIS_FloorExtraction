import { randomUUID } from "node:crypto";
import { apiClient } from "@/services/api.service";
import { ApiError, normalizePagedResponse } from "@/lib/utils/api";
import { getScopes } from "@/lib/api/rule-engine/reference.service";
import { getFieldConfigurations } from "@/lib/api/rule-engine/field-config.service";
import { getDynamicFieldOptions } from "@/lib/api/rule-engine/dynamic-options.service";
import type { FieldConfig, RuleScope } from "@/types/rule-engine";
import {
  ConditionRuleRow,
  SaveConditionRuleRowsPayload,
  EvaluateConditionRulePayload,
  EvaluateConditionRuleResult,
} from "@/types/dynamic-tax-register.types";

function fail(statusCode: number | undefined, error: string | undefined, context: string): ApiError {
  return new ApiError(statusCode ?? 500, error || "Operation failed", context);
}

/** RuleScope name this feature's condition fields must be seeded under in
 *  PTIS.RuleScope (data/config prerequisite — see plan) — matched case-insensitively. */
export const DYNAMIC_TAX_CONDITION_SCOPE_NAME = "DynamicTaxRegisterCondition";

export function resolveDynamicTaxConditionScopeId(scopes: RuleScope[]): number | null {
  const match = scopes.find(
    (s) => s.scopeName.trim().toLowerCase() === DYNAMIC_TAX_CONDITION_SCOPE_NAME.toLowerCase()
  );
  return match?.id ?? null;
}

/**
 * Resolves the Dynamic Tax Register condition scope, then fetches its fields.
 * Returns { scopeId: null, fields: [] } if the scope hasn't been configured yet —
 * callers must show a "not configured" banner, not throw.
 */
export async function loadConditionFieldConfig(): Promise<{ scopeId: number | null; fields: FieldConfig[] }> {
  const scopes = await getScopes();
  const scopeId = resolveDynamicTaxConditionScopeId(scopes);
  if (!scopeId) return { scopeId: null, fields: [] };
  const fields = await getFieldConfigurations(scopeId);
  return { scopeId, fields };
}

/**
 * GET /ConditionBasedTax/rules — this tax's condition rule rows (active + inactive).
 * The backend never stores/returns a condition item's client-only `id` (it's a React
 * list key, not a persisted field — see saveConditionRuleRows below) — assign a fresh
 * one here so every condition loaded from the server has a stable, unique key.
 */
export async function getConditionRuleRows(taxId: number): Promise<ConditionRuleRow[]> {
  const params = new URLSearchParams();
  params.append("taxId", String(taxId));
  params.append("pageNumber", "1");
  params.append("pageSize", "100");
  const res = await apiClient.get<unknown>(`/ConditionBasedTax/rules?${params.toString()}`);
  if (!res.success) throw fail(res.statusCode, res.error, "Get condition rule rows failed");
  if (!res.data) return [];
  const rows = normalizePagedResponse<ConditionRuleRow>(res.data).items;
  return rows.map((row) => ({
    ...row,
    conditions: row.conditions.map((c) => ({ ...c, id: c.id || randomUUID() })),
  }));
}

/**
 * POST /ConditionBasedTax/rules/save — upsert-only save of this tax's condition rows.
 * Strips each condition item's client-only `id` (a React list key, never a backend field)
 * before sending — the row's own `id` IS meaningful (0/negative = insert, positive = update).
 */
export async function saveConditionRuleRows(payload: SaveConditionRuleRowsPayload): Promise<void> {
  const wireRows = payload.rows.map((row) => ({
    ...row,
    conditions: row.conditions.map(({ id: _conditionKey, ...c }) => c),
  }));
  const res = await apiClient.post<unknown>("/ConditionBasedTax/rules/save", { ...payload, rows: wireRows });
  if (!res.success) throw fail(res.statusCode, res.error, "Save condition rule rows failed");
}

/**
 * DELETE /ConditionBasedTax/rules/{id} — permanently purges one condition row (a real SQL
 * DELETE) as soon as the admin confirms, rather than deferring the removal to the next
 * "Save Configuration" (unlike saveConditionRuleRows, which never deletes omitted rows).
 */
export async function deleteConditionRuleRow(id: number, taxId: number): Promise<void> {
  const res = await apiClient.delete<unknown>(`/ConditionBasedTax/rules/${id}?taxId=${taxId}`);
  if (!res.success) throw fail(res.statusCode, res.error, "Delete condition rule row failed");
}

/** POST /ConditionBasedTax/evaluate — tests a tax's already-SAVED condition rows against
 *  one real property. Never touches live billing. */
export async function evaluateConditionRule(
  payload: EvaluateConditionRulePayload
): Promise<EvaluateConditionRuleResult> {
  const res = await apiClient.post<{ items?: EvaluateConditionRuleResult }>(
    "/ConditionBasedTax/evaluate",
    payload
  );
  if (!res.success || !res.data?.items) throw fail(res.statusCode, res.error, "Evaluate condition rule failed");
  return res.data.items;
}

export { getDynamicFieldOptions };
