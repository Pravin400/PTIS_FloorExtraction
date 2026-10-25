/**
 * Reusable validation rules, patterns, and limits for Property Search fields.
 */

import type {
  SearchCriteria,
  SearchTab,
  SearchValidationKey,
} from "@/types/property-search";

export type PropertySearchValidationTranslator = (
  key: SearchValidationKey
) => string;

export type SearchFieldErrorMap = Partial<
  Record<keyof SearchCriteria, string>
>;

/** Max lengths per field specification. */
export const PROPERTY_SEARCH_FIELD_LIMITS = {
  propertyNo: 20,
  oldPropertyNo: 25,
  upicId: 15,
  citySurveyNo: 20,
  subZoneNo: 10,
  plotNo: 15,
  holderName: 100,
  occupierName: 100,
  mobile: 10,
  shopBuildingName: 100,
  societyName: 100,
  address: 300,
  rateableValue: 30,
} as const;

/** Alphanumeric with hyphen (/) and slash (-), no leading/trailing separators. */
export const ALPHANUMERIC_WITH_SEPARATORS_PATTERN =
  /^[a-zA-Z0-9]+([/-][a-zA-Z0-9]+)*$/;

/** Alphanumeric only pattern. */
export const ALPHANUMERIC_ONLY_PATTERN = /^[a-zA-Z0-9]+$/;

/** Digits only pattern. */
export const DIGITS_ONLY_PATTERN = /^\d+$/;

/** Sub Zone No.: alphanumeric only. */
export const SUB_ZONE_NO_PATTERN = /^[a-zA-Z0-9]+$/;

/** Property Holder / Occupier Name: alphabets, spaces, combining vowel marks, periods, colons, hyphens. */
export const PERSON_NAME_PATTERN = /^[\p{L}\p{M}\s.:\-]+$/u;

/** Shop/Building Name: alphabets, numbers, combining marks, spaces, /, -, and period. */
export const SHOP_BUILDING_NAME_PATTERN = /^[\p{L}\p{M}\p{N}\s/\-.,]+$/u;

/** Society Name: alphanumeric with combining marks, spaces, period, and hyphen. */
export const SOCIETY_NAME_PATTERN = /^[\p{L}\p{M}\p{N}\s.\-]+$/u;

/** Address: alphabets, numbers, combining marks, spaces, comma, period, slash, hyphen. */
export const ADDRESS_PATTERN = /^[\p{L}\p{M}\p{N}\s,./\-]+$/u;

/** Indian mobile: exactly 10 digits starting with 6–9. */
export const MOBILE_PATTERN = /^[6-9]\d{9}$/;

const HTML_OR_SCRIPT_PATTERN = /<[^>]*>|javascript\s*:|script/i;
const MULTIPLE_SPACES_PATTERN = /\s{2,}/;

export function trimFieldValue(value: string): string {
  return value.trim();
}

export function collapseMultipleSpaces(value: string): string {
  return value.replace(MULTIPLE_SPACES_PATTERN, " ");
}

export function containsHtmlOrScript(value: string): boolean {
  return HTML_OR_SCRIPT_PATTERN.test(value);
}

export function hasMultipleSpaces(value: string): boolean {
  return MULTIPLE_SPACES_PATTERN.test(value);
}

function isWithinMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

function validateAlphanumericWithSeparators(
  value: string,
  max: number
): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  return (
    isWithinMaxLength(trimmed, max) &&
    ALPHANUMERIC_WITH_SEPARATORS_PATTERN.test(trimmed)
  );
}

function validatePersonName(value: string, max: number): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  if (/\d/.test(trimmed)) return false;
  if (hasMultipleSpaces(trimmed)) return false;
  return (
    isWithinMaxLength(trimmed, max) && PERSON_NAME_PATTERN.test(trimmed)
  );
}

function validateShopBuildingName(value: string, max: number): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  if (hasMultipleSpaces(trimmed)) return false;
  return (
    isWithinMaxLength(trimmed, max) &&
    SHOP_BUILDING_NAME_PATTERN.test(trimmed)
  );
}

function validateSocietyName(value: string, max: number): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  if (hasMultipleSpaces(trimmed)) return false;
  return (
    isWithinMaxLength(trimmed, max) && SOCIETY_NAME_PATTERN.test(trimmed)
  );
}

function validateAddress(value: string, max: number): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  if (containsHtmlOrScript(trimmed)) return false;
  if (hasMultipleSpaces(trimmed)) return false;

  // Word count check: must not exceed 500 words
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 500) return false;

  return isWithinMaxLength(trimmed, max) && ADDRESS_PATTERN.test(trimmed);
}

function validateMobile(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return MOBILE_PATTERN.test(trimmed);
}

function validateAmount(value: string, max: number): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > max) return false;

  // Check that it only contains digits, commas, and at most one dot
  if (/[^0-9,.]/.test(trimmed)) return false;

  // Dot count check
  const dotCount = (trimmed.match(/\./g) || []).length;
  if (dotCount > 1) return false;

  // Commas should not be consecutive, leading, or trailing, and not after the dot
  if (trimmed.startsWith(",") || trimmed.endsWith(",")) return false;
  if (trimmed.includes(",,")) return false;

  const dotIndex = trimmed.indexOf(".");
  if (dotIndex !== -1) {
    const integerPart = trimmed.slice(0, dotIndex);
    const decimalPart = trimmed.slice(dotIndex + 1);

    // Decimal part cannot contain commas
    if (decimalPart.includes(",")) return false;
    // Decimal part can have at most 2 digits
    if (decimalPart.length > 2) return false;

    // Integer part must have at least one digit
    const cleanInteger = integerPart.replace(/,/g, "");
    if (!/^\d+$/.test(cleanInteger)) return false;
  } else {
    const cleanInteger = trimmed.replace(/,/g, "");
    if (!/^\d+$/.test(cleanInteger)) return false;
  }

  return true;
}


function validateAlphanumericOnly(value: string, max: number): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  return isWithinMaxLength(trimmed, max) && ALPHANUMERIC_ONLY_PATTERN.test(trimmed);
}

function validateUpicId(value: string): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  return (
    isWithinMaxLength(trimmed, PROPERTY_SEARCH_FIELD_LIMITS.upicId) &&
    ALPHANUMERIC_ONLY_PATTERN.test(trimmed)
  );
}

function validateSubZoneNo(value: string): boolean {
  const trimmed = trimFieldValue(value);
  if (!trimmed) return true;
  return (
    isWithinMaxLength(trimmed, PROPERTY_SEARCH_FIELD_LIMITS.subZoneNo) &&
    SUB_ZONE_NO_PATTERN.test(trimmed)
  );
}

function getValuationInvalidKey(valuationMethod?: string): SearchValidationKey {
  if (valuationMethod === "cv") return "capitalValueInvalid";
  if (valuationMethod === "totalTax") return "totalTaxInvalid";
  return "rateableValueInvalid";
}

function getValuationRangeInvalidKey(valuationMethod?: string): SearchValidationKey {
  if (valuationMethod === "cv") return "capitalValueRangeInvalid";
  if (valuationMethod === "totalTax") return "totalTaxRangeInvalid";
  return "rateableValueRangeInvalid";
}

/** Returns a validation message for a single field, or null when valid / empty. */
export function validateSearchFieldValue(
  field: keyof SearchCriteria,
  rawValue: string | number,
  t: PropertySearchValidationTranslator,
  valuationMethod?: string
): string | null {
  if (typeof rawValue === "number") return null;

  const value = rawValue;
  const trimmed = trimFieldValue(value);
  if (!trimmed) return null;

  switch (field) {
    case "propertyNoFrom":
    case "propertyNoTo":
      if (!/\d/.test(trimmed)) {
        return t("propertyNoInvalid");
      }
      return validateAlphanumericWithSeparators(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.propertyNo
      )
        ? null
        : t("propertyNoInvalid");

    case "oldPropertyNo":
      if (!/\d/.test(trimmed)) {
        return t("oldPropertyNoInvalid");
      }
      return validateAlphanumericOnly(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.oldPropertyNo
      )
        ? null
        : t("oldPropertyNoInvalid");

    case "upicId":
      return validateUpicId(value) ? null : t("upicIdInvalid");

    case "citySurveyNo":
      return validateAlphanumericWithSeparators(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.citySurveyNo
      )
        ? null
        : t("citySurveyNoInvalid");

    case "subZoneNo":
      return validateSubZoneNo(value) ? null : t("subZoneNoInvalid");

    case "plotNo":
      return validateAlphanumericWithSeparators(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.plotNo
      )
        ? null
        : t("plotNoInvalid");

    case "holderName":
      return validatePersonName(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.holderName
      )
        ? null
        : t("holderNameInvalid");

    case "occupierName":
      return validatePersonName(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.occupierName
      )
        ? null
        : t("occupierNameInvalid");

    case "mobile":
      return validateMobile(value) ? null : t("mobileInvalid");

    case "shopBuildingName":
      return validateShopBuildingName(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.shopBuildingName
      )
        ? null
        : t("shopBuildingNameInvalid");

    case "societyName":
      return validateSocietyName(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.societyName
      )
        ? null
        : t("societyNameInvalid");

    case "address":
      return validateAddress(value, PROPERTY_SEARCH_FIELD_LIMITS.address)
        ? null
        : t("addressInvalid");

    case "rateableValueFrom":
    case "rateableValueTo":
      if (!validateAmount(
        value,
        PROPERTY_SEARCH_FIELD_LIMITS.rateableValue
      )) {
        return t(getValuationInvalidKey(valuationMethod));
      }
      const cleanVal = String(value).replace(/,/g, "").trim();
      const numVal = Number(cleanVal);
      if (Number.isFinite(numVal) && numVal <= 0) {
        return t(getValuationInvalidKey(valuationMethod));
      }
      return null;

    default:
      return null;
  }
}

function validatePropertyNoRange(
  criteria: SearchCriteria,
  t: PropertySearchValidationTranslator
): SearchFieldErrorMap {
  const from = trimFieldValue(criteria.propertyNoFrom);
  const to = trimFieldValue(criteria.propertyNoTo);
  const errors: SearchFieldErrorMap = {};

  if (to && !from) {
    errors.propertyNoFrom = t("propertyNoFromRequired");
    return errors;
  }

  if (from && to && to.localeCompare(from, undefined, { numeric: true }) < 0) {
    errors.propertyNoTo = t("propertyNoRangeInvalid");
  }

  return errors;
}

/** Collect per-field validation messages for the active tab. */
export function getPropertySearchFieldErrors(
  criteria: SearchCriteria,
  tab: SearchTab,
  t: PropertySearchValidationTranslator
): SearchFieldErrorMap {
  const errors: SearchFieldErrorMap = {};

  if (criteria.wardId > 0 && criteria.zoneId <= 0) {
    errors.wardId = t("wardRequiresZone");
  }

  if (tab === "quick-search") {
    Object.assign(errors, validatePropertyNoRange(criteria, t));

    for (const field of [
      "scanQR",
      "propertyNoFrom",
      "propertyNoTo",
      "oldPropertyNo",
      "upicId",
      "citySurveyNo",
      "subZoneNo",
      "plotNo",
    ] as const) {
      const message = validateSearchFieldValue(field, criteria[field], t);
      if (message) errors[field] = message;
    }
  }

  if (tab === "kyc") {
    for (const field of [
      "holderName",
      "occupierName",
      "mobile",
      "shopBuildingName",
      "societyName",
      "address",
    ] as const) {
      const message = validateSearchFieldValue(field, criteria[field], t);
      if (message) errors[field] = message;
    }
  }

  if (tab === "values-dues") {
    if (criteria.rateableValueFilter === "top") {
      const fromVal = trimFieldValue(criteria.rateableValueFrom);
      if (fromVal) {
        const clean = fromVal.replace(/,/g, "");
        const num = Number(clean);
        if (!/^\d+$/.test(clean) || num <= 0) {
          errors.rateableValueFrom = t(getValuationInvalidKey(criteria.valuationMethod));
        }
      }
    }

    for (const field of ["rateableValueFrom", "rateableValueTo"] as const) {
      if (!errors[field]) {
        const message = validateSearchFieldValue(
          field,
          criteria[field],
          t,
          criteria.valuationMethod
        );
        if (message) errors[field] = message;
      }
    }

    if (criteria.rateableValueFilter === "between") {
      const fromVal = trimFieldValue(criteria.rateableValueFrom);
      const toVal = trimFieldValue(criteria.rateableValueTo);
      if (fromVal && toVal && !errors.rateableValueFrom && !errors.rateableValueTo) {
        const fromNum = Number(fromVal.replace(/,/g, ""));
        const toNum = Number(toVal.replace(/,/g, ""));
        if (toNum < fromNum) {
          errors.rateableValueTo = t(getValuationRangeInvalidKey(criteria.valuationMethod));
        }
      }
    }
  }

  return errors;
}

export function hasPropertySearchFieldErrors(
  errors: SearchFieldErrorMap
): boolean {
  return Object.keys(errors).length > 0;
}
