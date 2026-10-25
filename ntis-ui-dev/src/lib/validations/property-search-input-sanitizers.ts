/**
 * Field-level input sanitizers for the Property Search form.
 *
 * Strips invalid characters as the user types so fields cannot hold values that
 * would fail submission validation. Empty input is always preserved.
 */

import type { SearchCriteria } from "@/types/property-search";
import {
  collapseMultipleSpaces,
  PROPERTY_SEARCH_FIELD_LIMITS,
} from "./property-search-field-rules";

type Sanitizer = (value: string) => string;

const ALPHANUMERIC_WITH_SEPARATORS = /[^a-zA-Z0-9/\-]/g;
const ALPHANUMERIC_ONLY = /[^a-zA-Z0-9]/g;
const PERSON_NAME_ALLOWED = /[^\p{L}\p{M}\s.:\-]/gu;
const SHOP_BUILDING_ALLOWED = /[^\p{L}\p{M}\p{N}\s/\-.,]/gu;
const SOCIETY_NAME_ALLOWED = /[^\p{L}\p{M}\p{N}\s.\-]/gu;
const ADDRESS_ALLOWED = /[^\p{L}\p{M}\p{N}\s,./\-]/gu;

const onlyDigits = (max: number): Sanitizer => (value) =>
  value.replace(/\D/g, "").slice(0, max);

const amountField = (max: number): Sanitizer => (value) => {
  // Allow only digits, commas, and dots
  let cleaned = value.replace(/[^0-9,.]/g, "");
  const firstDotIndex = cleaned.indexOf(".");
  if (firstDotIndex !== -1) {
    const integerPart = cleaned.slice(0, firstDotIndex);
    let decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, ""); // strip other dots
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.slice(0, 2);
    }
    // Remove commas from decimal part
    decimalPart = decimalPart.replace(/,/g, "");
    cleaned = integerPart + "." + decimalPart;
  }
  return cleaned.slice(0, max);
};

const alphanumericWithSeparators =
  (max: number): Sanitizer =>
  (value) =>
    value.replace(ALPHANUMERIC_WITH_SEPARATORS, "").slice(0, max);

const alphanumericOnly =
  (max: number): Sanitizer =>
  (value) =>
    value.replace(ALPHANUMERIC_ONLY, "").slice(0, max);

const personName =
  (max: number): Sanitizer =>
  (value) => {
    const cleaned = value
      .replace(PERSON_NAME_ALLOWED, "")
      .replace(/\d/g, "");
    const collapsed = collapseMultipleSpaces(cleaned).replace(/^\s+/, "");
    return collapsed.slice(0, max);
  };

const shopBuildingName =
  (max: number): Sanitizer =>
  (value) => {
    const cleaned = value
      .replace(SHOP_BUILDING_ALLOWED, "")
      .replace(/<[^>]*>/g, "");
    const collapsed = collapseMultipleSpaces(cleaned).replace(/^\s+/, "");
    return collapsed.slice(0, max);
  };

const societyName =
  (max: number): Sanitizer =>
  (value) => {
    const cleaned = value.replace(SOCIETY_NAME_ALLOWED, "");
    const collapsed = collapseMultipleSpaces(cleaned).replace(/^\s+/, "");
    return collapsed.slice(0, max);
  };

const addressField =
  (max: number): Sanitizer =>
  (value) => {
    const cleaned = value
      .replace(ADDRESS_ALLOWED, "")
      .replace(/<[^>]*>/gi, "");
    const collapsed = collapseMultipleSpaces(cleaned).replace(/^\s+/, "");
    return collapsed.slice(0, max);
  };

const SANITIZERS: Partial<Record<keyof SearchCriteria, Sanitizer>> = {
  propertyNoFrom: alphanumericWithSeparators(PROPERTY_SEARCH_FIELD_LIMITS.propertyNo),
  propertyNoTo: alphanumericWithSeparators(PROPERTY_SEARCH_FIELD_LIMITS.propertyNo),
  oldPropertyNo: alphanumericOnly(
    PROPERTY_SEARCH_FIELD_LIMITS.oldPropertyNo
  ),
  upicId: alphanumericOnly(PROPERTY_SEARCH_FIELD_LIMITS.upicId),
  citySurveyNo: alphanumericWithSeparators(
    PROPERTY_SEARCH_FIELD_LIMITS.citySurveyNo
  ),
  subZoneNo: alphanumericOnly(PROPERTY_SEARCH_FIELD_LIMITS.subZoneNo),
  plotNo: alphanumericWithSeparators(PROPERTY_SEARCH_FIELD_LIMITS.plotNo),
  holderName: personName(PROPERTY_SEARCH_FIELD_LIMITS.holderName),
  occupierName: personName(PROPERTY_SEARCH_FIELD_LIMITS.occupierName),
  mobile: onlyDigits(PROPERTY_SEARCH_FIELD_LIMITS.mobile),
  shopBuildingName: shopBuildingName(
    PROPERTY_SEARCH_FIELD_LIMITS.shopBuildingName
  ),
  societyName: societyName(PROPERTY_SEARCH_FIELD_LIMITS.societyName),
  address: addressField(PROPERTY_SEARCH_FIELD_LIMITS.address),
  rateableValueFrom: amountField(PROPERTY_SEARCH_FIELD_LIMITS.rateableValue),
  rateableValueTo: amountField(PROPERTY_SEARCH_FIELD_LIMITS.rateableValue),
};

/**
 * Returns a sanitized version of `value` for the given criteria field.
 * Unknown fields are returned unchanged.
 */
export function sanitizePropertySearchField(
  field: keyof SearchCriteria,
  value: string
): string {
  const sanitizer = SANITIZERS[field];
  return sanitizer ? sanitizer(value) : value;
}
