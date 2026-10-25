/**
 * Dynamic Tax Register types.
 *
 * These interfaces mirror the ntis-platform DTOs. The API serializes with
 * JsonNamingPolicy.CamelCase, so all property names here are camelCase.
 * Grid-row types carry a `[key: string]: unknown` index signature so they
 * satisfy the `Record<string, unknown>` constraint used by `MasterTable<T>`.
 */

/* ── Shared unions ─────────────────────────────────────────── */

export type CalculationMode =
  | 'VALUE_BASED'
  | 'CONDITION_BASED'
  | 'MASTER_BASED'
  | 'HYBRID';

/** User-facing category derived from the calculation mode. */
export type RuleCategory = 'Value' | 'Field' | 'Data' | '-';

export type TaxStatus = 'ACTIVE' | 'DEACTIVE';

/** PER_UNIT multiplies ResultValue by a numeric property field (e.g. "150 per toilet").
 *  Condition rules only — master mappings have no per-property multiplier. */
export type ResultMode = 'FIXED' | 'PERCENT' | 'PER_UNIT';
export type ResultBase = 'NONE' | 'RV' | 'ALV' | 'OTHER_TAX';
export type BaseType = 'RV' | 'ALV';

export type EvaluationPriority =
  | 'MASTER_THEN_CONDITION'
  | 'CONDITION_THEN_MASTER';
export type FallbackStrategy = 'DEFAULT_ZERO' | 'CONDITION_RULE';

/** Master data source used when seeding master-based mappings. */
export type MasterSource = 'PropertyType' | 'OwnerType' | 'TypeOfUse';

/** Descriptive classification only — not wired into any RV/ALV/condition evaluation logic. */
export type AssessmentBasis = 'PROPERTY_BASED' | 'BUILDING_BASED';
export type ConditionEvaluationScope = 'FLOOR_WISE' | 'ALL_FLOORS_AGGREGATED';

/* ── Register grid ─────────────────────────────────────────── */

export interface DynamicTaxRegisterRow {
  [key: string]: unknown;
  taxId: number;
  taxName: string | null;
  /** Regional-language name, preferred over taxName wherever a tax is shown to the public. */
  taxNameAlias: string | null;
  taxCode: string | null;
  calculationMode: CalculationMode;
  ruleDefinitionId: number | null;
  ruleName: string | null;
  ruleCategory: string | null;
  source: string | null;
  status: TaxStatus;
  assessmentStatus: boolean;
  oldTaxStatus: boolean;
  ruleSummary: string | null;
}

export interface DynamicTaxRegisterStats {
  valueBased: number;
  conditionBased: number;
  masterBased: number;
  hybrid: number;
  total: number;
}

export interface DynamicTaxRegisterQuery {
  search?: string;
  /** VALUE_BASED | CONDITION_BASED | MASTER_BASED | HYBRID */
  mode?: CalculationMode;
  status?: TaxStatus;
  pageNumber: number;
  pageSize: number;
}

/** Payload for PUT /DynamicTaxRegister/{id}/settings */
export interface UpdateTaxRegisterSettingsPayload {
  /** Editable Tax Name. Omitted/blank leaves the stored name unchanged. */
  taxName?: string;
  /** Regional-language name. Unlike taxName this is clearable: an empty string stores NULL,
   *  while omitting the field entirely leaves the stored alias unchanged. */
  taxNameAlias?: string;
  status: TaxStatus;
  assessmentStatus: boolean;
  oldTaxStatus: boolean;
  calculationMode: CalculationMode;
  ruleDefinitionId?: number | null;
  updatedBy?: number;
  /** The mode this client believed the tax was in. The backend 409s if it doesn't match what's
   *  stored, rather than deleting configuration the user was never warned about. */
  expectedCurrentMode?: CalculationMode;
  /** Explicit opt-in to deleting the abandoned mode's configuration. Changing calculationMode
   *  without it is rejected with 409 — deletion is never implicit. */
  confirmModeChangeCleanup?: boolean;
}

/**
 * One selectable calculation mode, from GET /DynamicTaxRegister/calculation-modes
 * (PTIS.TaxCalculationModeMaster) rather than a hardcoded list.
 *
 * The `uses*Config` flags are the point: consumers decide which configuration surfaces apply by
 * reading capabilities, NOT by checking `modeCode === 'HYBRID'`. A new mode that reuses an
 * existing mechanism is then a pure DB insert.
 */
export interface TaxCalculationModeOption {
  id: number;
  modeCode: string;
  /** Server-side fallback label. The UI prefers its own i18n string when one exists for this
   *  code, so the screen stays multilingual. */
  modeName: string;
  displayOrder: number;
  usesValueConfig: boolean;
  usesConditionConfig: boolean;
  usesMasterConfig: boolean;
  usesHybridConfig: boolean;
}

/** Per-tax configuration row counts (GET /DynamicTaxRegister/{id}/config-summary) — used to name
 *  exactly what a calculation-mode change would delete before the admin confirms it. */
export interface TaxConfigSummary {
  taxId: number;
  valueRowCount: number;
  conditionRowCount: number;
  masterMappingCount: number;
  hasHybridConfig: boolean;
}

/** Payload for POST /DynamicTaxRegister (Add Tax). */
export interface CreateTaxRegisterPayload {
  taxName: string;
  /** Optional regional-language name (e.g. Marathi/Hindi). */
  taxNameAlias?: string;
  taxCode: string;
  taxCategoryId: number;
  calculationMode: CalculationMode;
  ruleDefinitionId?: number | null;
  status: TaxStatus;
  assessmentStatus: boolean;
  oldTaxStatus: boolean;
  createdBy?: number;
}

/**
 * A selectable tax category for the Add-Tax dropdown — sourced at runtime from
 * PTIS.TaxCategoryMaster via GET /DynamicTaxRegister/tax-categories (active rows only, with
 * EDU/EMP excluded server-side), rather than a hardcoded list.
 */
export interface TaxCategoryOption {
  value: number;
  label: string;
}

/* ── Tax Master (PTIS.TaxMaster, via TaxMasterController) ──── */

/** One row of GET /TaxMaster — the raw master record (used for the Condition rule's "Other Tax"
 *  reference picker. */
export interface TaxMasterListItem {
  id: number;
  taxCode: string | null;
  taxName: string | null;
  calculationMode: CalculationMode;
  isActive: boolean;
}

export interface TaxMasterQuery {
  pageNumber: number;
  pageSize: number;
  isActive?: boolean;
}

/* ── Rule Master (DynamicTaxRule) ──────────────────────────── */

export interface DynamicTaxRule {
  [key: string]: unknown;
  id: number;
  displayName: string | null;
  ruleType: string | null;
  attachedReference: string | null;
  sortOrder: number;
  description: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdDate?: string;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface DynamicTaxRuleQuery {
  displayName?: string;
  ruleType?: string;
  sortOrder?: number;
  isActive?: boolean;
  pageNumber: number;
  pageSize: number;
}

export interface CreateDynamicTaxRulePayload {
  displayName: string;
  ruleType: string;
  attachedReference?: string | null;
  sortOrder: number;
  description?: string | null;
  createdBy?: number;
}

export interface UpdateDynamicTaxRulePayload {
  displayName: string;
  ruleType: string;
  attachedReference?: string | null;
  sortOrder: number;
  description?: string | null;
  isActive: boolean;
  updatedBy?: number;
}

/* ── Value-based configuration ─────────────────────────────── */

export interface ValueBasedTaxRow {
  [key: string]: unknown;
  id: number;
  taxId: number;
  typeOfUseId: number;
  typeOfUseCode: string | null;
  description: string | null;
  yearRangeRVId: number;
  userGroup: string | null;
  baseType: string; // "RV"
  taxPercentage: number;
}

export interface GetValuePercentagesQuery {
  taxId: number;
  yearRangeRVId?: number;
  userGroup?: string;
  pageNumber: number;
  pageSize: number;
}

export interface SaveValueBasedTaxPayload {
  taxId: number;
  yearRangeRVId: number;
  /** Tax+year-wide setting — applied to every row for this tax+year, not just `rows` (typically only the current page). */
  baseType: 'RV' | 'ALV';
  updatedBy?: number;
  rows: ValueBasedTaxRow[];
}

export interface BulkApplyValueBasedTaxPayload {
  taxId: number;
  yearRangeRVId: number;
  userGroup?: string;
  taxPercentage: number;
  updatedBy?: number;
}

/* ── Master-based configuration ────────────────────────────── */

export interface TaxMasterMappingRow {
  [key: string]: unknown;
  id: number;
  taxId: number;
  ruleDefinitionId: number | null;
  masterKey: string;
  displayValue: string | null;
  assessmentYearRangeId: number;
  resultMode: ResultMode;
  resultBase: ResultBase;
  resultValue: number;
}

export interface GetMasterMappingsQuery {
  taxId: number;
  assessmentYearRangeId?: number;
  pageNumber: number;
  pageSize: number;
  /** Scopes results to rows belonging to this rule — a tax can have leftover
   *  mapping rows from a previously-linked "Choose from List" rule. */
  ruleDefinitionId?: number;
}

export interface SaveMasterMappingPayload {
  taxId: number;
  ruleDefinitionId?: number | null;
  assessmentYearRangeId: number;
  updatedBy?: number;
  rows: TaxMasterMappingRow[];
}

export interface BulkApplyMasterMappingPayload {
  taxId: number;
  ruleDefinitionId?: number;
  assessmentYearRangeId: number;
  resultMode: ResultMode;
  resultBase: ResultBase;
  resultValue: number;
  updatedBy?: number;
}

/* ── Hybrid configuration ──────────────────────────────────── */

export interface TaxHybridConfig {
  taxId: number;
  evaluationPriority: EvaluationPriority;
  fallbackStrategy: FallbackStrategy;
  resultBase: ResultBase;
  updatedBy?: number;
}

/** Result of GET /ConditionBasedTax/{taxId}/rule-reference */
export interface ConditionRuleReference {
  taxId: number;
  ruleReference: string | null;
}

/* ── Condition-based configuration ─────────────────────────── */

/** AND | OR — how a ConditionItem joins with the PREVIOUS item in its row's list. */
export type ConditionLogicalOperator = 'AND' | 'OR';

/**
 * A single condition within a ConditionRuleRow's flat list — `logicalOperator` says how it
 * joins the PREVIOUS item (ignored/meaningless for the first item in a row). Evaluated
 * strictly left-to-right, no parentheses/precedence — e.g. "A AND B OR C" means "(A AND B) OR C".
 */
export interface ConditionItem {
  /** Client-only stable key for React lists — never sent to the backend. */
  id: string;
  /** FieldConfig.fieldId, e.g. "Floor". */
  fieldId: string;
  /** OperatorItem.code, e.g. "=", ">", "In", "Not In". */
  operator: string;
  /** Scalar for single-value operators; string[] for IN/NOT IN/BETWEEN. */
  value: string | string[];
  logicalOperator: ConditionLogicalOperator;
}

/** One priority-ordered condition rule for a Tax — analogous to TaxMasterMappingRow,
 *  but keyed per-Tax with its own condition list instead of a masterKey. */
export interface ConditionRuleRow {
  [key: string]: unknown;
  id: number;
  taxId: number;
  ruleDefinitionId: number | null;
  /** 1-based evaluation order — the first ACTIVE row (ascending) whose conditions all
   *  match wins. An empty `conditions` array is a valid "always matches" catch-all row. */
  sortOrder: number;
  conditions: ConditionItem[];
  assessmentYearRangeId: number | null;
  /** UI-only: the set of Assessment Year Ranges this row applies to (the multi-select in the
   *  editor). On save it's fanned out — one persisted row per selected id, each carrying a single
   *  `assessmentYearRangeId` — so it is NEVER sent to the backend. Absent for server-loaded rows;
   *  the editor derives its initial value from `assessmentYearRangeId`. Empty/absent = "all years". */
  assessmentYearRangeIds?: number[];
  resultMode: ResultMode;
  resultBase: ResultBase;
  resultValue: number;
  /** Only meaningful when resultBase is 'OTHER_TAX' — the tax whose already-computed amount
   *  this row's PERCENT result is applied to. Must be a VALUE_BASED tax (the only mode with a
   *  real, non-zero persisted amount today) and cannot be the row's own taxId. */
  referenceTaxId: number | null;
  /** Only meaningful when resultMode is 'PER_UNIT' — the numeric field whose value multiplies
   *  resultValue (e.g. 'NoOfResidentialToilets'). The backend nulls it for other modes. */
  unitFieldId: string | null;
  isActive: boolean;
  /** When true and this row matches during evaluation, rows below it (by sortOrder) are never
   *  evaluated — reproducing the original first-match-wins behavior from this row onward. When
   *  false (the default for new rows), a match here doesn't stop anything; every matching row's
   *  result is summed into the total. Has no effect on a row that doesn't match. */
  stopFurtherProcessing: boolean;
  /** Descriptive classification only — not wired into any RV/ALV/condition evaluation logic. */
  assessmentBasis: AssessmentBasis;
  conditionEvaluationScope?: ConditionEvaluationScope;
}

/** Payload for POST /ConditionBasedTax/rules/save — upsert-only: rows omitted from a
 *  resend are not deleted (matches Master's mapping-save behavior). */
export interface SaveConditionRuleRowsPayload {
  taxId: number;
  ruleDefinitionId?: number | null;
  updatedBy?: number;
  rows: ConditionRuleRow[];
}

/* ── "Test this Rule" cascade (Zone → Ward → Property → Partition) ─────────── */

/** A simple id/label option for the Test-this-Rule cascade dropdowns (zones, wards, finance years). */
export interface TestCascadeOption {
  value: number;
  label: string;
}

/** A ward's property row for the cascade. A "partition" is a Property-level attribute — rows share
 *  a `propertyNo` but each `partitionNo` is a distinct `propertyId` (what the evaluate API needs). */
export interface TestPropertyRow {
  propertyId: number;
  propertyNo: string;
  partitionNo: string;
}

/** Payload for POST /ConditionBasedTax/evaluate — tests a tax's already-SAVED condition
 *  rows against one real property (not unsaved in-editor rows, not manual sample values). */
export interface EvaluateConditionRulePayload {
  taxId: number;
  propertyId: number;
  propertyDetailsId?: number | null;
  financeYear?: number | null;
}

/** Per-condition pass/fail breakdown within one row's list — lets the "Test this Rule"
 *  panel show exactly which conditions passed/failed, not just the row's overall verdict. */
export interface EvaluateConditionItemTrace {
  fieldId: string;
  operator: string;
  logicalOperator: ConditionLogicalOperator;
  expectedValue: string | number | boolean | (string | number | boolean)[] | null;
  actualValue: string | number | boolean | (string | number | boolean)[] | null;
  fieldResolved: boolean;
  isMatch: boolean;
}

export interface EvaluateConditionRuleTrace {
  ruleId: number;
  sortOrder: number;
  isMatch: boolean;
  skipped: boolean;
  skipReason: string | null;
  unresolvedFields: string[];
  conditions: EvaluateConditionItemTrace[];
}

/** One row that matched during evaluation and contributed to EvaluateConditionRuleResult's
 *  computedAmount. Multiple rows can match and execute for a single evaluation — see
 *  ConditionRuleRow.stopFurtherProcessing. */
export interface EvaluateConditionRuleMatchResult {
  ruleId: number;
  sortOrder: number;
  resultMode: ResultMode;
  resultBase: ResultBase;
  /** This row's own contribution — the sum of every matched row's computedAmount is
   *  EvaluateConditionRuleResult.computedAmount. */
  computedAmount: number;
  /** True if this row's own stopFurtherProcessing was set, meaning evaluation halted right after
   *  it — rows below it (by sortOrder) were never evaluated. */
  stoppedFurtherProcessing: boolean;
  /** Populated only when resultBase is 'OTHER_TAX' — the referenced tax's already-persisted
   *  amount that resultValue% was applied to. 0 here is ambiguous on its own — see
   *  referenceTaxAmountResolved. */
  referenceTaxAmountUsed: number | null;
  /** False when resultBase is 'OTHER_TAX' but the referenced tax has no persisted result for this
   *  property (the common case for a non-VALUE_BASED reference) — distinguishes that from the
   *  referenced tax genuinely computing to ₹0. Null for every other result base. */
  referenceTaxAmountResolved: boolean | null;
  /** The multiplier actually read for a PER_UNIT row; null when it couldn't be resolved. */
  unitCountUsed: number | null;
  /** False when a PER_UNIT row matched but its unit field was missing/non-numeric for this
   *  property — computedAmount is 0, and the UI must say why rather than showing a confident ₹0.
   *  Null for every other result mode. */
  unitCountResolved: boolean | null;
}

export interface EvaluateConditionRuleResult {
  taxId: number;
  propertyId: number;
  propertyDetailsId: number;
  /** True if at least one row matched (and therefore contributed to computedAmount). */
  matched: boolean;
  /** Sum of every matched row's own computedAmount — see matchedResults for the per-row
   *  breakdown. */
  computedAmount: number;
  rateableValueUsed: number | null;
  annualRentalValueUsed: number | null;
  /** One entry per row that matched and executed, in evaluation order. Empty when matched is false. */
  matchedResults: EvaluateConditionRuleMatchResult[];
  trace: EvaluateConditionRuleTrace[];
}

/* ── Dropdown option for assessment year ranges ───────────── */

export interface YearRangeOption {
  value: number;
  label: string;
}

/** A TypeOfUseGroup option — drives the overview Value tab's "Type" filter, from which the
 *  Description filter cascades (fetching that group's TypeOfUse rows). */
export interface TypeOfUseGroupOption {
  value: number;
  label: string;
}

/** Minimal TypeOfUse master record, used to seed Value-based percentage rows for a new tax. */
export interface TypeOfUseOption {
  id: number;
  code: string;
  description: string;
  /** Prefix classifier (R/C/I) used to derive the User Group. */
  type: string;
}

/**
 * Uniform shape every MasterSource (PropertyType/OwnerType/TypeOfUse) normalizes into for
 * client-side seeding of the Master/Data tab's grid — callers branch once on MasterSource,
 * then consume {key, display} without knowing each source's differing raw field names.
 * `key` must match the MasterKey convention MasterBasedTaxService used to persist
 * (PropertyType/OwnerType: the numeric id as a string; TypeOfUse: its code).
 */
export interface MasterKeyOption {
  /** The source master row's own numeric PK — used only to build a stable, unique negative
   *  synthetic row id for locally-seeded rows; never sent to the backend as MasterKey itself. */
  id: number;
  key: string;
  display: string;
}

/* ── Config Overview ("Show Config" modal) ─────────────────── */

/** A value-based tax used as a column header in the value pivot. */
export interface OverviewTax {
  taxId: number;
  taxName: string | null;
  taxCode: string | null;
}

/** One pivot row: a type-of-use + year-range, with each value-based tax's percentage.
 *  `percentages` is keyed by the tax's id as a STRING (JSON dictionary keys are strings). */
export interface ValueOverviewRow {
  [key: string]: unknown;
  typeOfUseId: number;
  typeOfUseCode: string | null;
  description: string | null;
  type: string | null;
  yearRangeRVId: number;
  yearRangeLabel: string;
  percentages: Record<string, number>;
}

export interface ValueOverview {
  taxes: OverviewTax[];
  rows: ValueOverviewRow[];
}

/** One condition rule row for the overview tables (Condition tab, or a Hybrid tax's condition side). */
export interface ConditionOverviewRow {
  [key: string]: unknown;
  taxId: number;
  taxName: string | null;
  taxCode: string | null;
  sortOrder: number;
  conditions: ConditionItem[];
  resultMode: ResultMode;
  resultBase: ResultBase;
  resultValue: number;
  /** Set for PER_UNIT rows — without it the overview can't label the effect and would describe a
   *  per-unit rate as a flat amount. */
  unitFieldId: string | null;
  /** Set for OTHER_TAX rows — the referenced tax's name, resolved server-side because the overview
   *  tables receive no tax list of their own. */
  referenceTaxName: string | null;
  isActive: boolean;
  /** When true, this row halts evaluation if it matches — rows below it (by sortOrder) never run. */
  stopFurtherProcessing: boolean;
  /** Descriptive classification only — not wired into any RV/ALV/condition evaluation logic. */
  assessmentBasis: AssessmentBasis;
  conditionEvaluationScope?: ConditionEvaluationScope;
  assessmentYearRangeId: number | null;
  yearRangeLabel: string | null;
}

/** One master-mapping row for the overview tables (Master tab, or a Hybrid tax's master side). */
export interface MasterOverviewRow {
  [key: string]: unknown;
  taxId: number;
  taxName: string | null;
  taxCode: string | null;
  /** Which master this mapping is keyed against (PropertyType / OwnerType / TypeOfUse). */
  masterName: string | null;
  masterKey: string;
  displayValue: string | null;
  resultMode: ResultMode;
  resultBase: ResultBase;
  resultValue: number;
  assessmentYearRangeId: number;
  yearRangeLabel: string | null;
}

export interface HybridOverview {
  condition: ConditionOverviewRow[];
  master: MasterOverviewRow[];
}

/** Full payload of GET /DynamicTaxRegister/config-overview. */
export interface ConfigOverview {
  value: ValueOverview;
  condition: ConditionOverviewRow[];
  master: MasterOverviewRow[];
  hybrid: HybridOverview;
}

/* ── Config Overview — server-side paged sections ("Show Config" drawer) ─── */

/** A single "Show Config" section, fetched one at a time with server-side filtering +
 *  pagination. Hybrid is split into two independently-paged sections because its UI shows
 *  two separate tables (condition rules + master mappings). Mirrors the backend `ConfigOverviewTab`. */
export type ConfigOverviewTab =
  | "value"
  | "condition"
  | "master"
  | "hybridCondition"
  | "hybridMaster";

/** Query for GET /DynamicTaxRegister/config-overview — one section per request. Only the
 *  filters relevant to `tab` are honoured server-side; `pageSize: -1` returns every row. */
export interface ConfigOverviewQuery {
  tab: ConfigOverviewTab;
  pageNumber: number;
  pageSize: number;
  // Value-tab filters
  yearRangeRVId?: number;
  typeOfUseGroupId?: number;
  typeOfUseId?: number;
  // Master-tab filters
  taxId?: number;
  masterName?: string;
}

/** One page of a single config-overview section. Exactly one row list is populated (by `tab`);
 *  `valueTaxes` carries the pivot's column headers for the value tab. */
export interface ConfigOverviewPage {
  tab: ConfigOverviewTab;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  valueTaxes: OverviewTax[];
  valueRows: ValueOverviewRow[];
  conditionRows: ConditionOverviewRow[];
  masterRows: MasterOverviewRow[];
}

/* ── Helpers ───────────────────────────────────────────────── */

/**
 * Maps a backend CalculationMode to the user-facing rule category shown in
 * the register grid and used to pick the config tab.
 */
export function categoryForMode(mode: CalculationMode): RuleCategory {
  switch (mode) {
    case 'VALUE_BASED':
      return 'Value';
    case 'CONDITION_BASED':
      return 'Field';
    case 'MASTER_BASED':
      return 'Data';
    default:
      return '-';
  }
}
