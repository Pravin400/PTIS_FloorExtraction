import { validatePropertyId } from './ptis-normalization';
import type { PtisTab } from '@/types/ptis-page.types';
import { VALUATION_TABS } from '@/types/ptis.types';

export interface PtisSearchParams {
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  propertyId?: number;
  tab: PtisTab;
  rateableExpand?: string | string[];
  capitalExpand?: string | string[];
  dualExpand?: string | string[];
  showDetails?: boolean;
}

type SearchParamValue = string | string[] | undefined;

/**
 * Safely extracts a single string value from a search parameter that might be an array.
 * If the same query param appears multiple times, this follows the "last one wins" 
 * standard for scalar UI state (like active tab).
 */
function getSingleSearchParamValue(value: SearchParamValue): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[value.length - 1] : value;
}

/**
 * Parses and validates PTIS search parameters from the URL.
 */
export function parsePtisSearchParams(
  searchParams: Record<string, SearchParamValue>
): PtisSearchParams {
  const propertyIdStr = getSingleSearchParamValue(searchParams.propertyId);
  const tabParam =
    getSingleSearchParamValue(searchParams.valuationTab) ||
    getSingleSearchParamValue(searchParams.tab) ||
    'rateable';
  
  // Validate tab against centralized VALUATION_TABS list
  const tab: PtisTab = (VALUATION_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as PtisTab)
    : 'rateable';

  return {
    wardNo: getSingleSearchParamValue(searchParams.wardNo),
    propertyNo: getSingleSearchParamValue(searchParams.propertyNo),
    partitionNo: getSingleSearchParamValue(searchParams.partitionNo),
    propertyId: propertyIdStr ? (validatePropertyId(propertyIdStr) ?? undefined) : undefined,
    tab,
    rateableExpand: searchParams.rateableExpand,
    capitalExpand: searchParams.capitalExpand,
    dualExpand: searchParams.dualExpand,
    showDetails: getSingleSearchParamValue(searchParams.showDetails) === 'true',
  };
}

/**
 * Builds a PTIS URL with updated search parameters.
 */
export function buildPtisUrl(
  baseParams: Record<string, SearchParamValue>,
  updates: Partial<Record<keyof PtisSearchParams | string, string | number | boolean | null>>
): string {
  const params = new URLSearchParams();

  // 1. Initialize with existing params, preserving arrays (repeated params)
  for (const [key, value] of Object.entries(baseParams)) {
    if (value == null) continue;
    const values = Array.isArray(value) ? value : [value];
    values.forEach((v) => {
      if (v != null) params.append(key, v);
    });
  }
  
  // 2. Apply updates (using set to replace existing values for these specific keys)
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === false) {
      params.delete(key);
    } else {
      params.set(key, value.toString());
    }
  });

  return `?${params.toString()}`;
}

/**
 * Sanitizes a numeric parameter that might be a string "undefined" or NaN.
 * 
 * @param value The value to sanitize
 * @returns The numeric value or undefined
 */
export function sanitizeNumericParam(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null || value === '' || value === 'undefined') {
    return undefined;
  }
  
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? undefined : num;
}

