import type { SearchCriteria, SearchTab } from "@/types/property-search";

type StringCriteriaField = {
  [K in keyof SearchCriteria]: SearchCriteria[K] extends string ? K : never;
}[keyof SearchCriteria];

/** Shared top-row filters — apply on both Quick Search and KYC Search. */
export const TOP_FILTER_FIELDS: ReadonlyArray<keyof SearchCriteria> = [
  "propertyType",
  "typeFilter",
  "propertyDescription",
  "zoneId",
  "wardId",
];

/** UI-only fields that must not be written to the URL until the API supports them. */
export const NON_PERSISTED_CRITERIA_FIELDS: ReadonlySet<keyof SearchCriteria> =
  new Set([]);

/** Quick Search tab fields (Property No range counts as two keys). */
export const QUICK_SEARCH_FIELDS: ReadonlyArray<StringCriteriaField> = [
  "scanQR",
  "upicId",
  "propertyNoFrom",
  "propertyNoTo",
  "oldPropertyNo",
];

export const KYC_SEARCH_FIELDS: ReadonlyArray<StringCriteriaField> = [
  "occupierName",
  "mobile",
  "societyName",
  "address",
];

export const KYC_UI_FIELDS: ReadonlyArray<StringCriteriaField> = KYC_SEARCH_FIELDS;

/** Values & Dues tab fields. */
export const VALUES_DUES_FIELDS: ReadonlyArray<StringCriteriaField> = [
  "valuesZone",
  "valuesWard",
  "valuationMethod",
  "rateableValueFilter",
  "rateableValueFrom",
  "rateableValueTo",
];

const QUICK_SEARCH_FIELD_SET = new Set<keyof SearchCriteria>(QUICK_SEARCH_FIELDS);
const KYC_SEARCH_FIELD_SET = new Set<keyof SearchCriteria>(KYC_SEARCH_FIELDS);
const VALUES_DUES_FIELD_SET = new Set<keyof SearchCriteria>(VALUES_DUES_FIELDS);

function isNonEmptyCriteriaValue(
  key: keyof SearchCriteria,
  value: SearchCriteria[keyof SearchCriteria]
): boolean {
  if (key === "zoneId" || key === "wardId") {
    return typeof value === "number" && value > 0;
  }
  return typeof value === "string" && value.trim() !== "";
}

function fieldsForTab(tab: SearchTab): ReadonlyArray<keyof SearchCriteria> {
  if (tab === "quick-search") return QUICK_SEARCH_FIELDS;
  if (tab === "values-dues") return VALUES_DUES_FIELDS;
  return KYC_SEARCH_FIELDS;
}

/** Fields that may be written to the URL / sent to the API for the active tab. */
export function getActiveSearchFields(tab: SearchTab): ReadonlyArray<keyof SearchCriteria> {
  return [...TOP_FILTER_FIELDS, ...fieldsForTab(tab)];
}

export function hasTabSearchInput(
  criteria: SearchCriteria,
  tab: SearchTab
): boolean {
  return getActiveSearchFields(tab).some((field) =>
    isNonEmptyCriteriaValue(field, criteria[field])
  );
}

function clearStringCriteriaField(
  criteria: SearchCriteria,
  field: StringCriteriaField
): void {
  criteria[field] = "";
}

/** Strip inactive-tab and disabled fields before URL persistence or API calls. */
export function applyTabSearchCriteria(
  criteria: SearchCriteria,
  tab: SearchTab
): SearchCriteria {
  const next: SearchCriteria = { ...criteria };
  const allTabFields: ReadonlyArray<StringCriteriaField>[] = [
    QUICK_SEARCH_FIELDS,
    KYC_SEARCH_FIELDS,
    VALUES_DUES_FIELDS,
  ];
  const activeFields = new Set<string>(fieldsForTab(tab));

  for (const fieldGroup of allTabFields) {
    for (const field of fieldGroup) {
      if (!activeFields.has(field)) {
        clearStringCriteriaField(next, field);
      }
    }
  }

  if (tab === "values-dues") {
    next.capitalValueFilter = "";
    next.capitalValueFrom = "";
    next.capitalValueTo = "";
  }

  return next;
}

export function clearTabFieldsFromParams(
  params: URLSearchParams,
  tab: SearchTab
): void {
  const allTabFields: ReadonlyArray<StringCriteriaField>[] = [
    QUICK_SEARCH_FIELDS,
    KYC_SEARCH_FIELDS,
    VALUES_DUES_FIELDS,
  ];
  const activeFields = new Set<string>(fieldsForTab(tab));

  for (const fieldGroup of allTabFields) {
    for (const field of fieldGroup) {
      if (!activeFields.has(field)) {
        params.delete(field);
      }
    }
  }

  if (tab === "values-dues") {
    params.delete("capitalValueFilter");
    params.delete("capitalValueFrom");
    params.delete("capitalValueTo");
  }
}

export function isQuickSearchField(field: keyof SearchCriteria): boolean {
  return QUICK_SEARCH_FIELD_SET.has(field);
}

export function isKycSearchField(field: keyof SearchCriteria): boolean {
  return KYC_SEARCH_FIELD_SET.has(field);
}

export function isValuesDuesField(field: keyof SearchCriteria): boolean {
  return VALUES_DUES_FIELD_SET.has(field);
}
