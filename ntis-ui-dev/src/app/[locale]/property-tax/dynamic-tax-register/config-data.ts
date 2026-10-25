/**
 * Server-side data loader for the "Show Config" overview drawer.
 *
 * Runs inside the RSC route (`config/page.tsx`) — NOT a "use server" action file. Reads the
 * drawer's filter + pagination state from the URL search params and fetches ONLY the active
 * tab's current page from the (now paged + filtered) `config-overview` endpoint, so the browser
 * never receives more than one page. The Hybrid tab is two independently-paged backend sections
 * (condition rules + master mappings), loaded in parallel.
 *
 * Filter option sources (year ranges, TypeOfUse groups, description cascade, master-based tax
 * list) and the condition field metadata are fetched lazily — only for the tab that needs them.
 */
import {
  getConfigOverviewPage,
  getYearRangeOptions,
  getTypeOfUseOptions,
  getRegisterPaged,
} from "@/lib/api/dynamic-tax-register.service";
import { getUseGroupsPagedServer } from "@/lib/api/typeofusegroup.service";
import { loadConditionFieldConfig } from "@/lib/api/dynamic-tax-register-condition.service";
import type {
  ConfigOverviewPage,
  ConfigOverviewQuery,
  OverviewTax,
  TypeOfUseOption,
  YearRangeOption,
  TypeOfUseGroupOption,
} from "@/types/dynamic-tax-register.types";
import type { FieldConfig } from "@/types/rule-engine";

/** UI-level tab. `hybrid` fans out to the two backend sections `hybridCondition`/`hybridMaster`. */
export type ConfigTab = "value" | "condition" | "master" | "hybrid";

const TABS: readonly ConfigTab[] = ["value", "condition", "master", "hybrid"];
const DEFAULT_PAGE_SIZE = 25;

/** All URL search params the config drawer reads. Namespaced (`c*`/`h*`) so they never collide
 *  with the register list's own `search`/`mode`/`status`/`page`/`pageSize` behind the drawer. */
export interface ConfigOverviewSearchParams {
  configTab?: string;
  // Value tab
  cvPage?: string;
  cvSize?: string;
  cvYear?: string; // AssessmentYearRange id
  cvType?: string; // TypeOfUseGroup id ("Type" filter)
  cvDesc?: string; // TypeOfUse id ("Description" filter)
  // Condition tab
  ccPage?: string;
  ccSize?: string;
  // Master tab
  cmPage?: string;
  cmSize?: string;
  cmTax?: string; // TaxId
  cmMaster?: string; // resolved master name
  // Hybrid tab — condition section
  hcPage?: string;
  hcSize?: string;
  // Hybrid tab — master section
  hmPage?: string;
  hmSize?: string;
}

/** Current filter values echoed back so the client Select controls stay in sync with the URL. */
export interface ConfigOverviewFilters {
  valYear: string;
  valType: string;
  valDesc: string;
  mstTax: string;
  mstMaster: string;
}

export interface ConfigOverviewViewData {
  tab: ConfigTab;
  /** Active tab's page(s). Only the fields for `tab` are populated; the rest are null. */
  value: ConfigOverviewPage | null;
  condition: ConfigOverviewPage | null;
  master: ConfigOverviewPage | null;
  hybridCondition: ConfigOverviewPage | null;
  hybridMaster: ConfigOverviewPage | null;
  /** Field metadata for rendering condition summaries (condition + hybrid tabs). */
  conditionFields: FieldConfig[];
  /** Value-tab filter option sources. */
  yearRangeOptions: YearRangeOption[];
  typeOfUseGroups: TypeOfUseGroupOption[];
  /** Description dropdown options — the selected group's TypeOfUse rows, or the full list. */
  descriptionOptions: TypeOfUseOption[];
  /** Master-tab Tax filter options (master-based taxes). */
  masterTaxOptions: OverviewTax[];
  filters: ConfigOverviewFilters;
  /** True when the active tab's own overview fetch failed (network/5xx) rather than genuinely
   *  returning zero rows — the drawer must show "failed to load", not "nothing configured yet". */
  loadFailed: boolean;
}

function clampInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return Math.floor(n);
}

function parseTab(value: string | undefined): ConfigTab {
  const v = (value ?? "value").toLowerCase();
  return (TABS as readonly string[]).includes(v) ? (v as ConfigTab) : "value";
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/** Like `safe`, but also reports whether the promise actually failed — a failed overview fetch
 *  must render "failed to load", not the same empty state as "nothing configured yet" (see
 *  `loadFailed` on ConfigOverviewViewData). */
async function safeTracked<T>(p: Promise<T>, fallback: T): Promise<{ value: T; failed: boolean }> {
  try {
    return { value: await p, failed: false };
  } catch {
    return { value: fallback, failed: true };
  }
}

const EMPTY_PAGE = (query: ConfigOverviewQuery): ConfigOverviewPage => ({
  tab: query.tab,
  totalCount: 0,
  pageNumber: query.pageNumber,
  pageSize: query.pageSize,
  valueTaxes: [],
  valueRows: [],
  conditionRows: [],
  masterRows: [],
});

function pageFor(query: ConfigOverviewQuery): Promise<{ value: ConfigOverviewPage; failed: boolean }> {
  return safeTracked(getConfigOverviewPage(query), EMPTY_PAGE(query));
}

/**
 * Loads everything the ConfigOverviewDrawer needs for the active tab. Nulls out the sections that
 * belong to other tabs so the drawer renders exactly one tab's server-paged data per navigation.
 */
export async function loadConfigOverviewView(
  sp: ConfigOverviewSearchParams
): Promise<ConfigOverviewViewData> {
  const tab = parseTab(sp.configTab);

  const filters: ConfigOverviewFilters = {
    valYear: sp.cvYear && sp.cvYear !== "all" ? sp.cvYear : "all",
    valType: sp.cvType && sp.cvType !== "all" ? sp.cvType : "all",
    valDesc: sp.cvDesc && sp.cvDesc !== "all" ? sp.cvDesc : "all",
    mstTax: sp.cmTax && sp.cmTax !== "all" ? sp.cmTax : "all",
    mstMaster: sp.cmMaster && sp.cmMaster !== "all" ? sp.cmMaster : "all",
  };

  const view: ConfigOverviewViewData = {
    tab,
    value: null,
    condition: null,
    master: null,
    hybridCondition: null,
    hybridMaster: null,
    conditionFields: [],
    yearRangeOptions: [],
    typeOfUseGroups: [],
    descriptionOptions: [],
    masterTaxOptions: [],
    filters,
    loadFailed: false,
  };

  if (tab === "value") {
    const yearId = filters.valYear !== "all" ? Number(filters.valYear) : undefined;
    const groupId = filters.valType !== "all" ? Number(filters.valType) : undefined;
    const typeOfUseId = filters.valDesc !== "all" ? Number(filters.valDesc) : undefined;

    const [{ value: page, failed }, yearRangeOptions, groups, descriptionOptions] = await Promise.all([
      pageFor({
        tab: "value",
        pageNumber: clampInt(sp.cvPage, 1, 1, 100000),
        pageSize: clampInt(sp.cvSize, DEFAULT_PAGE_SIZE, 1, 1000),
        yearRangeRVId: yearId,
        typeOfUseGroupId: groupId,
        typeOfUseId,
      }),
      safe(getYearRangeOptions(), [] as YearRangeOption[]),
      safe(getUseGroupsPagedServer({ pageNumber: 1, pageSize: 100 }), null),
      // Description options cascade from the selected group; the full TypeOfUse list otherwise.
      safe(getTypeOfUseOptions(groupId), [] as TypeOfUseOption[]),
    ]);

    view.value = page;
    view.loadFailed = failed;
    view.yearRangeOptions = yearRangeOptions;
    view.typeOfUseGroups = (groups?.items ?? [])
      .filter((g) => g.isActive)
      .map((g) => ({ value: g.typeOfUseGroupId, label: g.groupName }));
    view.descriptionOptions = descriptionOptions;
    return view;
  }

  if (tab === "condition") {
    const [{ value: page, failed }, fieldConfig] = await Promise.all([
      pageFor({
        tab: "condition",
        pageNumber: clampInt(sp.ccPage, 1, 1, 100000),
        pageSize: clampInt(sp.ccSize, DEFAULT_PAGE_SIZE, 1, 1000),
      }),
      safe(loadConditionFieldConfig(), { scopeId: null, fields: [] } as Awaited<ReturnType<typeof loadConditionFieldConfig>>),
    ]);
    view.condition = page;
    view.loadFailed = failed;
    view.conditionFields = fieldConfig.fields;
    return view;
  }

  if (tab === "master") {
    const taxId = filters.mstTax !== "all" ? Number(filters.mstTax) : undefined;
    const masterName = filters.mstMaster !== "all" ? filters.mstMaster : undefined;

    const [{ value: page, failed }, masterTaxes] = await Promise.all([
      pageFor({
        tab: "master",
        pageNumber: clampInt(sp.cmPage, 1, 1, 100000),
        pageSize: clampInt(sp.cmSize, DEFAULT_PAGE_SIZE, 1, 1000),
        taxId,
        masterName,
      }),
      // Tax dropdown options = master-based taxes (the paged rows only cover one page, so the
      // filter list can't be derived from them — source it from the register instead).
      safe(
        getRegisterPaged({ mode: "MASTER_BASED", pageNumber: 1, pageSize: -1 }),
        { items: [] } as unknown as Awaited<ReturnType<typeof getRegisterPaged>>
      ),
    ]);
    view.master = page;
    view.loadFailed = failed;
    view.masterTaxOptions = masterTaxes.items.map((r) => ({
      taxId: r.taxId,
      taxName: r.taxName,
      taxCode: r.taxCode,
    }));
    return view;
  }

  // hybrid — two independently-paged sections + the condition field metadata.
  const [hybridConditionResult, hybridMasterResult, fieldConfig] = await Promise.all([
    pageFor({
      tab: "hybridCondition",
      pageNumber: clampInt(sp.hcPage, 1, 1, 100000),
      pageSize: clampInt(sp.hcSize, DEFAULT_PAGE_SIZE, 1, 1000),
    }),
    pageFor({
      tab: "hybridMaster",
      pageNumber: clampInt(sp.hmPage, 1, 1, 100000),
      pageSize: clampInt(sp.hmSize, DEFAULT_PAGE_SIZE, 1, 1000),
    }),
    safe(loadConditionFieldConfig(), { scopeId: null, fields: [] } as Awaited<ReturnType<typeof loadConditionFieldConfig>>),
  ]);
  view.hybridCondition = hybridConditionResult.value;
  view.hybridMaster = hybridMasterResult.value;
  // Either section failing means the tab's overall view is incomplete.
  view.loadFailed = hybridConditionResult.failed || hybridMasterResult.failed;
  view.conditionFields = fieldConfig.fields;
  return view;
}
