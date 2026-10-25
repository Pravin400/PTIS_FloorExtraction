import type { PtisTaxDetail } from '@/types/ptis-core.types';

/**
 * Normalizes tax data from various API response formats into a consistent PtisTaxDetail array.
 * Handles both array format and object format with TaxTotal exclusion.
 *
 * @param taxes - The raw tax data from API (array or object)
 * @returns Normalized array of PtisTaxDetail
 */
export function normalizePtisTaxes<T extends PtisTaxDetail>(taxes: unknown): T[] {
  if (Array.isArray(taxes)) {
    const rawTaxes = taxes as Record<string, unknown>[];
    return rawTaxes
      .map((tax) => ({
        taxId: Number(tax.taxId ?? 0),
        taxName: String(tax.taxName ?? ''),
        percentage: Number(tax.percentage ?? 0),
        amount: Number(tax.amount ?? 0),
      })) as T[];
  }

  if (typeof taxes === 'object' && taxes !== null) {
    return Object.entries(taxes as Record<string, unknown>)
      .map(([key, value]) => ({
        taxId: 0,
        taxName: key,
        percentage: 0,
        amount: Number(value ?? 0),
      })) as T[];
  }

  return [];
}

/**
 * Validates and converts property ID to a number.
 *
 * @param propertyId - The property ID (string or number)
 * @returns The validated property ID as a number, or null if invalid
 */
export function validatePropertyId(propertyId: string | number): number | null {
  const propertyIdNum =
    typeof propertyId === 'string'
      ? (() => {
          const trimmed = propertyId.trim();
          if (!/^\d+$/.test(trimmed)) {
            return Number.NaN;
          }
          return Number(trimmed);
        })()
      : propertyId;

  if (!Number.isInteger(propertyIdNum) || propertyIdNum <= 0) {
    return null;
  }

  return propertyIdNum;
}
