/**
 * Server-side data loader for the Dynamic Tax Register list view.
 *
 * Shared by the list page and the two overlay pages (add/[id], manageRule),
 * all of which render the register grid behind their drawer. Parses the URL
 * search params into a backend query, fetches the grid + hero stats, and
 * returns everything the client `DynamicTaxRegister` component needs as props.
 *
 * This module is NOT a "use server" action file — it exports a plain async
 * helper meant to run inside a React Server Component.
 */
import {
  getRegisterPaged,
  getRegisterStats,
  getRulesPaged,
  getYearRangeOptions,
  getValuePercentages,
  getMasterMappings,
  getHybridConfig,
  getConditionRuleReference,
  getTypeOfUseOptions,
  getPropertyTypeOptions,
  getOwnerTypeOptions,
  toTypeOfUseMasterKeyOptions,
  getTaxCategories,
  getTaxMasterPaged,
  getCalculationModes,
} from "@/lib/api/dynamic-tax-register.service";
import {
  getConditionRuleRows,
  loadConditionFieldConfig,
} from "@/lib/api/dynamic-tax-register-condition.service";
import {
  CalculationMode,
  DynamicTaxRegisterRow,
  DynamicTaxRegisterStats,
  DynamicTaxRule,
  TaxStatus,
  ValueBasedTaxRow,
  TaxMasterMappingRow,
  TaxHybridConfig,
  YearRangeOption,
  RuleCategory,
  MasterSource,
  ConditionRuleRow,
  TypeOfUseOption,
  MasterKeyOption,
  TaxCategoryOption,
  TaxCalculationModeOption,
  categoryForMode,
} from "@/types/dynamic-tax-register.types";
import type { FieldConfig } from "@/types/rule-engine";

const MASTER_SOURCES: readonly MasterSource[] = ["PropertyType", "OwnerType", "TypeOfUse"];

export interface RegisterSearchParams {
  search?: string;
  mode?: string; // all | value | condition | master | hybrid
  status?: string; // all | active | deactive
  page?: string;
  pageSize?: string;
}

export interface RegisterViewData {
  data: DynamicTaxRegisterRow[];
  stats: DynamicTaxRegisterStats;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  search: string;
  mode: string;
  status: string;
}

const MODE_MAP: Record<string, CalculationMode> = {
  value: "VALUE_BASED",
  condition: "CONDITION_BASED",
  master: "MASTER_BASED",
  hybrid: "HYBRID",
};

function clampInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return Math.floor(n);
}

const EMPTY_STATS: DynamicTaxRegisterStats = {
  valueBased: 0,
  conditionBased: 0,
  masterBased: 0,
  hybrid: 0,
  total: 0,
};

export async function loadRegisterView(
  sp: RegisterSearchParams
): Promise<RegisterViewData> {
  const search = (sp.search ?? "").trim();
  const modeParam = (sp.mode ?? "all").toLowerCase();
  const statusParam = (sp.status ?? "all").toLowerCase();
  const pageNumber = clampInt(sp.page, 1, 1, 10000);
  const pageSize = clampInt(sp.pageSize, 10, 1, 100);

  const mode = MODE_MAP[modeParam];
  const status: TaxStatus | undefined =
    statusParam === "active" ? "ACTIVE" : statusParam === "deactive" ? "DEACTIVE" : undefined;

  const [paged, stats] = await Promise.all([
    getRegisterPaged({
      search: search || undefined,
      mode,
      status,
      pageNumber,
      pageSize,
    }),
    getRegisterStats().catch(() => EMPTY_STATS),
  ]);

  return {
    data: paged.items,
    stats,
    pageNumber: paged.pageNumber,
    pageSize: paged.pageSize,
    totalCount: paged.totalCount,
    totalPages: paged.totalPages,
    search,
    mode: modeParam,
    status: statusParam,
  };
}

/** Loads the active + inactive Rule Master list for the manage-rules drawer. */
export async function loadRuleMasterList(): Promise<DynamicTaxRule[]> {
  const res = await safe(
    // DynamicTaxRuleQueryParameters extends BaseQueryParameters, which clamps
    // any positive PageSize to 100 — use -1 (unlimited) so the Manage Rules
    // list never silently drops rows once there are more than 100.
    getRulesPaged({ pageNumber: 1, pageSize: -1 }),
    { items: [] } as unknown as Awaited<ReturnType<typeof getRulesPaged>>
  );
  return [...res.items].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Active calculation modes from PTIS.TaxCalculationModeMaster — the Rule Type dropdown's options.
 *  Falls back to an empty list so a failed fetch degrades to "no options" rather than crashing the
 *  page; the drawer surfaces that state. */
export async function loadCalculationModes(): Promise<TaxCalculationModeOption[]> {
  return safe(getCalculationModes(), [] as TaxCalculationModeOption[]);
}

/** Rule ids currently referenced by at least one tax (TaxMaster.RuleDefinitionId) — the
 *  manage-rules drawer uses this to block deleting/deactivating a rule a tax still depends on. */
export async function loadUsedRuleIds(): Promise<number[]> {
  const register = await safe(
    getRegisterPaged({ pageNumber: 1, pageSize: -1 }),
    { items: [] } as unknown as Awaited<ReturnType<typeof getRegisterPaged>>
  );
  const ids = new Set<number>();
  register.items.forEach((r) => {
    if (r.ruleDefinitionId) ids.add(r.ruleDefinitionId);
  });
  return Array.from(ids);
}

/* ── Drawer (add/[id]) data loader ─────────────────────────── */

export interface RuleSelectOption {
  value: string;
  label: string;
  /** MASTER_BASED | CONDITION_BASED | VALUE_BASED | HYBRID — used to derive CalculationMode when creating a new tax. */
  ruleType: string;
  /** MasterSource value (MASTER_BASED only — unused for CONDITION_BASED/HYBRID, whose
   *  conditions live per-Tax in PTIS.TaxConditionRule, not on the rule slot) — lets the UI
   *  react to a Rule Name change (e.g. reload master data for the newly picked source)
   *  without a server round trip just to look up what the selected rule points to. */
  attachedReference: string | null;
}

export interface TaxDrawerData {
  taxRow: DynamicTaxRegisterRow | null;
  ruleOptions: RuleSelectOption[];
  yearRangeOptions: YearRangeOption[];
  valueRows: ValueBasedTaxRow[];
  /** Total row count across all pages (not just `valueRows.length`, which is one page) —
   *  needed to initialize the Value tab's server-side pagination controls correctly. */
  valueRowsTotalCount: number;
  masterRows: TaxMasterMappingRow[];
  /** Total row count across all pages for masterRows (see valueRowsTotalCount). */
  masterRowsTotalCount: number;
  hybridConfig: TaxHybridConfig | null;
  /** ruleReference narrowed to a valid MasterSource, when applicable. */
  masterSource: MasterSource | null;
  /** This tax's saved CONDITION_BASED rule rows (also populated for HYBRID, whose
   *  nested Condition section uses the same embedded builder). */
  conditionRows: ConditionRuleRow[];
  /** Field metadata for the condition builder's field/operator pickers, resolved from
   *  the Dynamic Tax Register's own RuleScope — empty if that scope isn't configured yet. */
  conditionFields: FieldConfig[];
  /** The resolved RuleScope id backing conditionFields — null if not configured yet. */
  conditionScopeId: number | null;
  /** Active TypeOfUse master rows, for seeding Value-based percentage rows when a tax has none yet. */
  typeOfUseOptions: TypeOfUseOption[];
  /** Active master-key rows per MasterSource, normalized for client-side seeding of the
   *  Master/Data tab's grid when a tax has none yet — see MasterKeyOption. */
  masterKeyOptionsBySource: Record<MasterSource, MasterKeyOption[]>;
  /** Selectable tax categories for the Add-Tax dropdown, from PTIS.TaxCategoryMaster
   *  (active, EDU/EMP excluded) — replaces the former hardcoded TAX_CATEGORY_OPTIONS. */
  taxCategoryOptions: TaxCategoryOption[];
  /** Active taxes (excluding this tax itself), for the Condition tab's "Other Tax" reference
   *  picker. Any CalculationMode is selectable; a non-VALUE_BASED reference currently evaluates
   *  to 0 (see TaxConditionRuleService.EvaluateAsync). */
  referenceTaxOptions: TaxCategoryOption[];
  /** True when the Value tab's percentage fetch threw (network/5xx), as opposed to genuinely
   *  returning zero rows. Without this distinction the auto-seed hook below can't tell "nothing
   *  configured yet" from "couldn't load" and would seed a fresh zero-percentage grid over data
   *  that may still exist server-side — saving it would overwrite the real rows with zeros. */
  valueLoadFailed: boolean;
  /** Same distinction as valueLoadFailed, for the Master/Data tab's mapping fetch. */
  masterLoadFailed: boolean;
  /** Same distinction, for the Hybrid tab's strategy-config fetch — a failed fetch must not be
   *  treated as "no hybrid config yet" (which silently defaults to MASTER_THEN_CONDITION /
   *  DEFAULT_ZERO / NONE and can then get saved over the tax's real strategy). */
  hybridLoadFailed: boolean;
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/** Like `safe`, but also reports whether the promise actually failed — used wherever a bare
 *  empty/null fallback would be indistinguishable from "genuinely nothing configured yet" and
 *  a caller needs to react differently (see valueLoadFailed/masterLoadFailed/hybridLoadFailed). */
async function safeTracked<T>(p: Promise<T>, fallback: T): Promise<{ value: T; failed: boolean }> {
  try {
    return { value: await p, failed: false };
  } catch {
    return { value: fallback, failed: true };
  }
}

/** Value/Master tabs' filter+pagination state, read from the drawer route's URL search params. */
export interface TaxDrawerFilterParams {
  category?: string;
  valYear?: string;
  valGroup?: string;
  valPage?: string;
  valPageSize?: string;
  mstYear?: string;
  mstRule?: string;
  mstPage?: string;
  mstPageSize?: string;
}

/**
 * Loads everything the DynamicTaxDrawer needs for a given tax id. The tax row
 * is resolved from the register grid (no dedicated GetById endpoint exists),
 * and mode-specific config data is fetched only for the relevant calculation
 * mode. Returns empty defaults for a new tax (id === "0").
 */
export async function loadTaxDrawerData(
  id: string,
  filters: TaxDrawerFilterParams
): Promise<TaxDrawerData> {
  const categoryParam = filters.category;
  const numericId = Number(id);
  const isNew = id === "0" || !Number.isFinite(numericId) || numericId <= 0;

  // Resolving the tax row (no GetById endpoint — found via the register grid) and the linked
  // rule's AttachedReference both only need `numericId`, known before any of the 8 fetches below
  // run — so they're folded into the SAME Promise.all instead of two sequential awaits after it
  // (this used to be a 4-stage waterfall for the common "Configure" navigation; now 2). Skipped
  // entirely for a new tax, which returns before either result is used — `Promise.resolve` costs
  // nothing over the network, so "Add Tax" doesn't pay for a register/rule fetch it never reads.
  const registerPromise = isNew
    ? Promise.resolve({ items: [] } as unknown as Awaited<ReturnType<typeof getRegisterPaged>>)
    : safe(
        getRegisterPaged({ pageNumber: 1, pageSize: -1 }),
        { items: [] } as unknown as Awaited<ReturnType<typeof getRegisterPaged>>
      );
  const ruleReferencePromise = isNew
    ? Promise.resolve({ taxId: numericId, ruleReference: null } as Awaited<ReturnType<typeof getConditionRuleReference>>)
    : safe(getConditionRuleReference(numericId), { taxId: numericId, ruleReference: null });

  const [
    ruleOptions, yearRangeOptions, typeOfUseOptions, propertyTypeOptions, ownerTypeOptions,
    conditionFieldConfig, taxCategoryOptions, taxMasterList, register, ruleReferenceResult,
  ] =
    await Promise.all([
      safe(getRulesPaged({ pageNumber: 1, pageSize: -1, isActive: true }), {
        items: [],
      } as unknown as Awaited<ReturnType<typeof getRulesPaged>>).then((r) =>
        r.items.map((rule) => ({
          value: String(rule.id),
          label: rule.displayName ?? `Rule ${rule.id}`,
          ruleType: rule.ruleType ?? 'CONDITION_BASED',
          attachedReference: rule.attachedReference ?? null,
        }))
      ),
      safe(getYearRangeOptions(), [] as YearRangeOption[]),
      safe(getTypeOfUseOptions(), [] as TypeOfUseOption[]),
      safe(getPropertyTypeOptions(), [] as MasterKeyOption[]),
      safe(getOwnerTypeOptions(), [] as MasterKeyOption[]),
      safe(loadConditionFieldConfig(), { scopeId: null, fields: [] } as Awaited<ReturnType<typeof loadConditionFieldConfig>>),
      safe(getTaxCategories(), [] as TaxCategoryOption[]),
      safe(
        getTaxMasterPaged({ pageNumber: 1, pageSize: -1, isActive: true }),
        { items: [] } as unknown as Awaited<ReturnType<typeof getTaxMasterPaged>>
      ),
      registerPromise,
      ruleReferencePromise,
    ]);
  const ruleReference = ruleReferenceResult.ruleReference;

  const masterKeyOptionsBySource: Record<MasterSource, MasterKeyOption[]> = {
    PropertyType: propertyTypeOptions,
    OwnerType: ownerTypeOptions,
    TypeOfUse: toTypeOfUseMasterKeyOptions(typeOfUseOptions),
  };

  // Active taxes (excluding this tax itself) for the Condition rule editor's "Other Tax"
  // reference picker — sourced from TaxMasterController (GET /TaxMaster), the raw master list,
  // rather than the composed register view, since only Id/TaxName/TaxCode are needed here. Any
  // CalculationMode is selectable; a non-VALUE_BASED reference currently evaluates to 0 (see
  // TaxConditionRuleService.EvaluateAsync) until the calculation engine wires up those modes.
  const referenceTaxOptions: TaxCategoryOption[] = taxMasterList.items
    .filter((t) => t.id !== numericId)
    .map((t) => ({ value: t.id, label: t.taxName || t.taxCode || String(t.id) }));

  if (isNew) {
    return {
      taxRow: null,
      ruleOptions,
      yearRangeOptions,
      valueRows: [],
      valueRowsTotalCount: 0,
      masterRows: [],
      masterRowsTotalCount: 0,
      hybridConfig: null,
      masterSource: null,
      conditionRows: [],
      conditionFields: conditionFieldConfig.fields,
      conditionScopeId: conditionFieldConfig.scopeId,
      typeOfUseOptions,
      masterKeyOptionsBySource,
      taxCategoryOptions,
      referenceTaxOptions,
      valueLoadFailed: false,
      masterLoadFailed: false,
      hybridLoadFailed: false,
    };
  }

  // Tax row resolved from the register grid (no GetById endpoint) — fetched above, in the
  // initial Promise.all.
  const taxRow = register.items.find((r) => r.taxId === numericId) ?? null;

  const calcMode: CalculationMode = taxRow?.calculationMode ?? "CONDITION_BASED";
  const category = (categoryParam as RuleCategory) ?? categoryForMode(calcMode);
  const isHybrid = category === "-" || calcMode === "HYBRID";

  // Value tab: defaults to the first available year (it always shows one specific year's rows).
  const valYearId = filters.valYear ? Number(filters.valYear) : yearRangeOptions[0]?.value;
  // valGroup is now the raw TypeOfUse.Type string itself (e.g. "R-Residential"), sourced
  // dynamically from the TypeOfUse master data — not a hardcoded letter translation.
  const valUserGroup = filters.valGroup && filters.valGroup !== "all" ? filters.valGroup : undefined;
  const valPage = clampInt(filters.valPage, 1, 1, 10000);
  const valPageSize = clampInt(filters.valPageSize, 10, 1, 100);

  // Master/Data tab (shared by the standalone Data tab and Hybrid's nested Data section):
  // undefined/0 = no year filter — every row shows its own Assessment Year rather than
  // being scoped to a single selection.
  const mstYearId = filters.mstYear ? Number(filters.mstYear) : undefined;
  // For a standalone MASTER_BASED tax, the tax's own RuleDefinitionId IS the master rule —
  // safe to default to it. For HYBRID, the tax's own RuleDefinitionId points at its
  // condition/Hybrid-strategy rule (a completely different rule from whichever
  // MASTER_BASED rule the Master Data Mapping section is actually linked to) — defaulting
  // to it here would filter out that rule's real, already-seeded rows entirely. Leave it
  // unfiltered (find rows under whatever rule they actually belong to) unless the URL
  // explicitly names one.
  const mstRuleId = filters.mstRule
    ? Number(filters.mstRule)
    : isHybrid
    ? undefined
    : taxRow?.ruleDefinitionId ?? undefined;
  const mstPage = clampInt(filters.mstPage, 1, 1, 10000);
  const mstPageSize = clampInt(filters.mstPageSize, 10, 1, 100);

  let valueRows: ValueBasedTaxRow[] = [];
  let valueRowsTotalCount = 0;
  let masterRows: TaxMasterMappingRow[] = [];
  let masterRowsTotalCount = 0;
  let hybridConfig: TaxHybridConfig | null = null;
  let conditionRows: ConditionRuleRow[] = [];
  let valueLoadFailed = false;
  let masterLoadFailed = false;
  let hybridLoadFailed = false;

  // The linked DynamicTaxRule's AttachedReference is still useful for MASTER_BASED/HYBRID's
  // masterSource detection (used to seed master keys correctly instead of guessing) — no
  // longer resolved into a RuleEngine lookup for CONDITION_BASED (see conditionRows below).
  // Fetched above, in the initial Promise.all.

  if (category === "Value") {
    const { value: paged, failed } = await safeTracked(
      getValuePercentages({ taxId: numericId, yearRangeRVId: valYearId, userGroup: valUserGroup, pageNumber: valPage, pageSize: valPageSize }),
      { items: [], totalCount: 0 } as unknown as Awaited<ReturnType<typeof getValuePercentages>>
    );
    valueRows = paged.items;
    valueRowsTotalCount = paged.totalCount;
    valueLoadFailed = failed;
  } else if (category === "Data" || isHybrid) {
    const [mappingsResult, hybridResult, condRows] = await Promise.all([
      safeTracked(
        getMasterMappings({
          taxId: numericId,
          assessmentYearRangeId: mstYearId,
          pageNumber: mstPage,
          pageSize: mstPageSize,
          ruleDefinitionId: mstRuleId,
        }),
        { items: [], totalCount: 0 } as unknown as Awaited<ReturnType<typeof getMasterMappings>>
      ),
      isHybrid ? safeTracked(getHybridConfig(numericId), null) : Promise.resolve({ value: null, failed: false }),
      isHybrid ? safe(getConditionRuleRows(numericId), [] as ConditionRuleRow[]) : Promise.resolve([] as ConditionRuleRow[]),
    ]);
    masterRows = mappingsResult.value.items;
    masterRowsTotalCount = mappingsResult.value.totalCount;
    masterLoadFailed = mappingsResult.failed;
    hybridConfig = hybridResult.value;
    hybridLoadFailed = hybridResult.failed;
    conditionRows = condRows;
  } else if (category === "Field") {
    conditionRows = await safe(getConditionRuleRows(numericId), [] as ConditionRuleRow[]);
  }

  const masterSource: MasterSource | null =
    ruleReference && (MASTER_SOURCES as readonly string[]).includes(ruleReference)
      ? (ruleReference as MasterSource)
      : null;

  return {
    taxRow,
    ruleOptions,
    yearRangeOptions,
    valueRows,
    valueRowsTotalCount,
    masterRows,
    masterRowsTotalCount,
    hybridConfig,
    masterSource,
    conditionRows,
    conditionFields: conditionFieldConfig.fields,
    conditionScopeId: conditionFieldConfig.scopeId,
    typeOfUseOptions,
    masterKeyOptionsBySource,
    taxCategoryOptions,
    referenceTaxOptions,
    valueLoadFailed,
    masterLoadFailed,
    hybridLoadFailed,
  };
}
