import { apiClient } from "@/services/api.service";
import { PagedResponse } from "@/types/common.types";
import { ApiError, normalizePagedResponse } from "@/lib/utils/api";
import {
  DynamicTaxRegisterRow,
  DynamicTaxRegisterStats,
  DynamicTaxRegisterQuery,
  UpdateTaxRegisterSettingsPayload,
  CreateTaxRegisterPayload,
  DynamicTaxRule,
  DynamicTaxRuleQuery,
  CreateDynamicTaxRulePayload,
  UpdateDynamicTaxRulePayload,
  ValueBasedTaxRow,
  GetValuePercentagesQuery,
  SaveValueBasedTaxPayload,
  BulkApplyValueBasedTaxPayload,
  TaxMasterMappingRow,
  GetMasterMappingsQuery,
  SaveMasterMappingPayload,
  BulkApplyMasterMappingPayload,
  TaxHybridConfig,
  ConditionRuleReference,
  YearRangeOption,
  TypeOfUseOption,
  MasterKeyOption,
  ConfigOverviewQuery,
  ConfigOverviewPage,
  TaxCategoryOption,
  TaxMasterListItem,
  TaxMasterQuery,
  TaxConfigSummary,
  TaxCalculationModeOption,
} from "@/types/dynamic-tax-register.types";

/* ── internals ─────────────────────────────────────────────── */

function fail(
  statusCode: number | undefined,
  error: string | undefined,
  context: string
): ApiError {
  return new ApiError(statusCode ?? 500, error || "Operation failed", context);
}

function appendIfSet(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined | null
): void {
  if (value === undefined || value === null || value === "") return;
  params.append(key, String(value));
}

/* ── Register grid + stats + settings ──────────────────────── */

export async function getRegisterPaged(
  query: DynamicTaxRegisterQuery
): Promise<PagedResponse<DynamicTaxRegisterRow>> {
  const params = new URLSearchParams();
  params.append("PageNumber", String(query.pageNumber));
  params.append("PageSize", String(query.pageSize));
  appendIfSet(params, "Search", query.search);
  appendIfSet(params, "Mode", query.mode);
  appendIfSet(params, "Status", query.status);

  const res = await apiClient.get<PagedResponse<DynamicTaxRegisterRow>>(
    `/DynamicTaxRegister?${params.toString()}`
  );
  if (!res.success) throw fail(res.statusCode, res.error, "Get tax register failed");
  return normalizePagedResponse<DynamicTaxRegisterRow>(res.data);
}

export async function getRegisterStats(): Promise<DynamicTaxRegisterStats> {
  const res = await apiClient.get<DynamicTaxRegisterStats>("/DynamicTaxRegister/stats");
  if (!res.success || !res.data)
    throw fail(res.statusCode, res.error, "Get register stats failed");
  return res.data;
}

/** Read-only "Show Config" overview — one section (tab) at a time, with server-side filtering +
 *  pagination, so the client only ever receives a single page. See {@link ConfigOverviewQuery}. */
export async function getConfigOverviewPage(
  query: ConfigOverviewQuery
): Promise<ConfigOverviewPage> {
  const params = new URLSearchParams();
  params.append("Tab", query.tab);
  params.append("PageNumber", String(query.pageNumber));
  params.append("PageSize", String(query.pageSize));
  appendIfSet(params, "YearRangeRVId", query.yearRangeRVId);
  appendIfSet(params, "TypeOfUseGroupId", query.typeOfUseGroupId);
  appendIfSet(params, "TypeOfUseId", query.typeOfUseId);
  appendIfSet(params, "TaxId", query.taxId);
  appendIfSet(params, "MasterName", query.masterName);

  const res = await apiClient.get<ConfigOverviewPage>(
    `/DynamicTaxRegister/config-overview?${params.toString()}`
  );
  if (!res.success || !res.data)
    throw fail(res.statusCode, res.error, "Get config overview failed");
  return res.data;
}

/** GET /DynamicTaxRegister/calculation-modes — active calculation modes from
 *  PTIS.TaxCalculationModeMaster, in DisplayOrder. Source for the Rule Type dropdown; each option
 *  carries its capability flags so callers never branch on a mode's code. */
export async function getCalculationModes(): Promise<TaxCalculationModeOption[]> {
  const res = await apiClient.get<{ items?: TaxCalculationModeOption[] }>(
    "/DynamicTaxRegister/calculation-modes"
  );
  if (!res.success) throw fail(res.statusCode, res.error, "Get calculation modes failed");
  return res.data?.items ?? [];
}

/** Selectable tax categories for the Add-Tax dropdown, from PTIS.TaxCategoryMaster
 *  (active only, EDU/EMP excluded server-side). */
export async function getTaxCategories(): Promise<TaxCategoryOption[]> {
  const res = await apiClient.get<{ id: number; code: string; name: string }[]>(
    "/DynamicTaxRegister/tax-categories"
  );
  if (!res.success || !res.data) throw fail(res.statusCode, res.error, "Get tax categories failed");
  return res.data.map((c) => ({ value: c.id, label: c.name }));
}

export async function updateTaxSettings(
  id: number,
  payload: UpdateTaxRegisterSettingsPayload
): Promise<void> {
  const res = await apiClient.put<unknown>(`/DynamicTaxRegister/${id}/settings`, payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Save tax settings failed");
}

/** GET /DynamicTaxRegister/{id}/config-summary — configuration row counts for one tax, so the UI
 *  can name exactly what a calculation-mode change would delete. Fetched on demand at confirm
 *  time (never cached into the drawer's initial load) so the numbers are always current. */
export async function getTaxConfigSummary(id: number): Promise<TaxConfigSummary> {
  const res = await apiClient.get<{ items?: TaxConfigSummary }>(
    `/DynamicTaxRegister/${id}/config-summary`
  );
  if (!res.success || !res.data?.items)
    throw fail(res.statusCode, res.error, "Get tax config summary failed");
  return res.data.items;
}

/** Creates a new tax (Add Tax) and returns its assigned TaxId. */
export async function createTaxRegister(payload: CreateTaxRegisterPayload): Promise<number> {
  const res = await apiClient.post<{ items?: number }>("/DynamicTaxRegister", payload);
  if (!res.success || res.data?.items === undefined)
    throw fail(res.statusCode, res.error, "Create tax failed");
  return res.data.items;
}

/* ── Rule Master (DynamicTaxRule) CRUD ─────────────────────── */

export async function getRulesPaged(
  query: DynamicTaxRuleQuery
): Promise<PagedResponse<DynamicTaxRule>> {
  const params = new URLSearchParams();
  params.append("PageNumber", String(query.pageNumber));
  params.append("PageSize", String(query.pageSize));
  appendIfSet(params, "DisplayName", query.displayName);
  appendIfSet(params, "RuleType", query.ruleType);
  appendIfSet(params, "SortOrder", query.sortOrder);
  if (query.isActive !== undefined) params.append("IsActive", String(query.isActive));

  const res = await apiClient.get<PagedResponse<DynamicTaxRule>>(
    `/DynamicTaxRule?${params.toString()}`
  );
  if (!res.success) throw fail(res.statusCode, res.error, "Get rules failed");
  return normalizePagedResponse<DynamicTaxRule>(res.data);
}

/* ── Tax Master (PTIS.TaxMaster, via TaxMasterController) ──── */

/** GET /TaxMaster — the raw master list (not the composed register view). Used by the Condition
 *  rule editor's "Other Tax" reference picker, which only needs Id/TaxName/TaxCode/CalculationMode
 *  rather than the register grid's rule/status columns. */
export async function getTaxMasterPaged(
  query: TaxMasterQuery
): Promise<PagedResponse<TaxMasterListItem>> {
  const params = new URLSearchParams();
  params.append("PageNumber", String(query.pageNumber));
  params.append("PageSize", String(query.pageSize));
  if (query.isActive !== undefined) params.append("IsActive", String(query.isActive));

  const res = await apiClient.get<PagedResponse<TaxMasterListItem>>(
    `/TaxMaster?${params.toString()}`
  );
  if (!res.success) throw fail(res.statusCode, res.error, "Get tax master list failed");
  return normalizePagedResponse<TaxMasterListItem>(res.data);
}

export async function getRuleById(id: number): Promise<DynamicTaxRule | null> {
  const res = await apiClient.get<DynamicTaxRule>(`/DynamicTaxRule/${id}`);
  if (!res.success) throw fail(res.statusCode, res.error, `Get rule ${id} failed`);
  return res.data ?? null;
}

export async function createRule(payload: CreateDynamicTaxRulePayload): Promise<void> {
  const res = await apiClient.post<unknown>("/DynamicTaxRule", payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Create rule failed");
}

export async function updateRule(
  id: number,
  payload: UpdateDynamicTaxRulePayload
): Promise<void> {
  const res = await apiClient.put<unknown>(`/DynamicTaxRule/${id}`, payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Update rule failed");
}

/** Permanently removes the rule (hard delete, not the soft-delete `/DynamicTaxRule/{id}`) — the
 *  backend rejects this with a 409 if any tax's RuleDefinitionId still points at it (a real FK
 *  constraint, `DeleteBehavior.Restrict`), which apiClient surfaces via `res.success === false`. */
export async function deleteRule(id: number): Promise<void> {
  const res = await apiClient.delete<unknown>(`/DynamicTaxRule/${id}/purge`);
  if (!res.success) throw fail(res.statusCode, res.error, `Delete rule ${id} failed`);
}

/* ── Value-based configuration ─────────────────────────────── */

export async function getValuePercentages(
  query: GetValuePercentagesQuery
): Promise<PagedResponse<ValueBasedTaxRow>> {
  const params = new URLSearchParams();
  params.append("taxId", String(query.taxId));
  params.append("pageNumber", String(query.pageNumber));
  params.append("pageSize", String(query.pageSize));
  appendIfSet(params, "yearRangeRVId", query.yearRangeRVId);
  appendIfSet(params, "userGroup", query.userGroup);

  const res = await apiClient.get<PagedResponse<ValueBasedTaxRow>>(
    `/ValueBasedTax/percentages?${params.toString()}`
  );
  if (!res.success) throw fail(res.statusCode, res.error, "Get value percentages failed");
  return normalizePagedResponse<ValueBasedTaxRow>(res.data);
}

export async function saveValueRows(payload: SaveValueBasedTaxPayload): Promise<void> {
  const res = await apiClient.post<unknown>("/ValueBasedTax/save", payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Save value percentages failed");
}

export async function bulkApplyValue(
  payload: BulkApplyValueBasedTaxPayload
): Promise<void> {
  const res = await apiClient.post<unknown>("/ValueBasedTax/bulk-apply", payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Bulk-apply value failed");
}

/* ── Master-based configuration ────────────────────────────── */

export async function getMasterMappings(
  query: GetMasterMappingsQuery
): Promise<PagedResponse<TaxMasterMappingRow>> {
  const params = new URLSearchParams();
  params.append("taxId", String(query.taxId));
  params.append("pageNumber", String(query.pageNumber));
  params.append("pageSize", String(query.pageSize));
  appendIfSet(params, "assessmentYearRangeId", query.assessmentYearRangeId);
  appendIfSet(params, "ruleDefinitionId", query.ruleDefinitionId);

  const res = await apiClient.get<PagedResponse<TaxMasterMappingRow>>(
    `/MasterBasedTax/mappings?${params.toString()}`
  );
  if (!res.success) throw fail(res.statusCode, res.error, "Get master mappings failed");
  return normalizePagedResponse<TaxMasterMappingRow>(res.data);
}

export async function saveMasterMappings(
  payload: SaveMasterMappingPayload
): Promise<void> {
  const res = await apiClient.post<unknown>("/MasterBasedTax/save", payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Save master mappings failed");
}

export async function bulkApplyMaster(
  payload: BulkApplyMasterMappingPayload
): Promise<void> {
  const res = await apiClient.post<unknown>("/MasterBasedTax/bulk-apply", payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Bulk-apply master failed");
}

/* ── Hybrid configuration ──────────────────────────────────── */

export async function getHybridConfig(taxId: number): Promise<TaxHybridConfig | null> {
  const res = await apiClient.get<TaxHybridConfig>(`/HybridTax/${taxId}/config`);
  if (!res.success) throw fail(res.statusCode, res.error, "Get hybrid config failed");
  return res.data ?? null;
}

export async function saveHybridConfig(
  taxId: number,
  payload: TaxHybridConfig
): Promise<void> {
  const res = await apiClient.put<unknown>(`/HybridTax/${taxId}/config`, payload);
  if (!res.success) throw fail(res.statusCode, res.error, "Save hybrid config failed");
}

/* ── Condition-based (kept for MASTER_BASED/HYBRID masterSource detection) ── */

/**
 * Resolves the linked DynamicTaxRule's AttachedReference — still needed for MASTER_BASED
 * (a MasterSource name) and HYBRID's master-half detection. No longer resolves to a
 * RuleEngine RuleCode for CONDITION_BASED — that mode's conditions now live in
 * PTIS.TaxConditionRule, authored entirely within this screen (see
 * dynamic-tax-register-condition.service.ts).
 */
export async function getConditionRuleReference(
  taxId: number
): Promise<ConditionRuleReference> {
  const res = await apiClient.get<{ items?: ConditionRuleReference }>(
    `/ConditionBasedTax/${taxId}/rule-reference`
  );
  if (!res.success) throw fail(res.statusCode, res.error, "Get rule reference failed");
  return res.data?.items ?? { taxId, ruleReference: null };
}

/**
 * Lists active TypeOfUse master rows, used to seed Value-based percentage
 * rows for a tax that has none yet (a brand-new Value-based tax has zero
 * TaxPercentageMasterRV rows until seeded). Pass `groupId` to scope to a single
 * TypeOfUseGroup (uses the API's `TypeOfUseGroupId` filter) — used by the overview
 * Value tab's Type→Description cascade.
 */
export async function getTypeOfUseOptions(groupId?: number): Promise<TypeOfUseOption[]> {
  const params = new URLSearchParams();
  params.append("PageNumber", "1");
  // TypeOfUseQueryParameters extends BaseQueryParameters, which silently
  // clamps any positive PageSize to 100 — use -1 so seeding never silently
  // misses TypeOfUse rows once there are more than 100.
  params.append("PageSize", "-1");
  if (typeof groupId === "number") params.append("TypeOfUseGroupId", String(groupId));
  const res = await apiClient.get<unknown>(`/TypeOfUse?${params.toString()}`);
  if (!res.success || !res.data) return [];
  const paged = normalizePagedResponse<{
    id: number;
    typeOfUseCode: string;
    description: string;
    type: string;
    isActive: boolean;
  }>(res.data);
  return paged.items
    .filter((t) => t.isActive)
    .map((t) => ({ id: t.id, code: t.typeOfUseCode, description: t.description, type: t.type }));
}

/**
 * Lists active PropertyType master rows, normalized to MasterKeyOption for client-side
 * seeding of the Master/Data tab's grid (a brand-new Master-based tax has zero
 * TaxMasterMapping rows until the admin edits and saves). MasterKey convention here
 * (numeric id as a string) must match MasterBasedTaxService.SaveAsync's natural-key
 * matching on the backend.
 */
export async function getPropertyTypeOptions(): Promise<MasterKeyOption[]> {
  const params = new URLSearchParams();
  params.append("PageNumber", "1");
  params.append("PageSize", "-1");
  const res = await apiClient.get<unknown>(`/PropertyTypeMaster?${params.toString()}`);
  if (!res.success || !res.data) return [];
  const paged = normalizePagedResponse<{
    id: number;
    propertyDescription: string;
    isActive: boolean;
  }>(res.data);
  return paged.items
    .filter((p) => p.isActive)
    .map((p) => ({ id: p.id, key: String(p.id), display: p.propertyDescription }));
}

/**
 * Lists active OwnerType master rows, normalized to MasterKeyOption — see
 * getPropertyTypeOptions for the MasterKey-convention rationale.
 */
export async function getOwnerTypeOptions(): Promise<MasterKeyOption[]> {
  const params = new URLSearchParams();
  params.append("PageNumber", "1");
  params.append("PageSize", "-1");
  const res = await apiClient.get<unknown>(`/OwnerType?${params.toString()}`);
  if (!res.success || !res.data) return [];
  const paged = normalizePagedResponse<{ id: number; ownerType: string; isActive: boolean }>(
    res.data
  );
  return paged.items
    .filter((o) => o.isActive)
    .map((o) => ({ id: o.id, key: String(o.id), display: o.ownerType }));
}

/**
 * Re-normalizes the already-fetched TypeOfUse options (used to seed the Value tab) into
 * MasterKeyOption for the Master tab — not a new HTTP call. MasterKey is the numeric id
 * as a string, same convention as PropertyType/OwnerType — this must match what
 * ReferenceValidationService's TypeOfUse reference check compares against
 * (`MasterKey == id.ToString()`) and what PropertyDetailsEntity.TypeOfUseId /
 * TaxPercentageMasterRVEntity.TypeOfUseId store (both numeric FKs, never the code).
 */
export function toTypeOfUseMasterKeyOptions(options: TypeOfUseOption[]): MasterKeyOption[] {
  return options.map((t) => ({ id: t.id, key: String(t.id), display: t.description }));
}

/* ── Assessment year-range options (for dropdowns) ─────────── */

/**
 * Fetches active Rateable-Value (RV) assessment year ranges — the route
 * resolves from the controller class name `AssessmentYearRangeController`,
 * i.e. `/AssessmentYearRange`, NOT `/AssessmentYearRangeRV`.
 *
 * NOTE: ALV/Capital-Value has no equivalent wired up — ValueBasedTaxController
 * only reads/writes TaxPercentageMasterRVEntity, so there is currently no
 * backend endpoint to source or save ALV percentages against. This function
 * intentionally only covers RV.
 */
export async function getYearRangeOptions(): Promise<YearRangeOption[]> {
  const params = new URLSearchParams();
  params.append("PageNumber", "1");
  params.append("PageSize", "100");
  const res = await apiClient.get<unknown>(`/AssessmentYearRange?${params.toString()}`);
  if (!res.success || !res.data) return [];
  const paged = normalizePagedResponse<{
    id: number;
    fromYear: number;
    toYear: number;
    isActive: boolean;
  }>(res.data);
  return paged.items
    .filter((r) => r.isActive)
    .sort((a, b) => b.fromYear - a.fromYear)
    .map((r) => ({ value: r.id, label: `${r.fromYear}-${r.toYear}` }));
}
