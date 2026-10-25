import {
  DualMethodResponse,
  DualMethodTaxes,
  RateableValueResponse,
  CapitalValueResponse,
  OldDetailsData,
  PtisTaxDetail,
  CapitalValueCollection,
} from '@/types/ptis.types';

/**
 * Centralizes PTIS dual-method fallback precedence so the summary and expanded
 * sections resolve totals consistently when one or more APIs are unavailable.
 *
 * @param taxes - Array of tax objects or undefined/null
 * @returns Total sum of tax amounts or null if input is not an array
 */
export function sumTaxAmounts(taxes: PtisTaxDetail[] | null | undefined): number | null {
  if (!Array.isArray(taxes)) {
    return null;
  }

  return taxes
    .filter(
      (t) =>
        t.taxName?.toUpperCase() !== 'TAXTOTAL' &&
        t.taxName?.toUpperCase() !== 'TOTAL'
    )
    .reduce((sum: number, tax: PtisTaxDetail) => sum + (tax.amount || 0), 0);
}

/**
 * Calculates the total old tax, preferring dual method data if available.
 * 
 * Precedence:
 * 1. dualMethodData.oldTaxesTotal (server-provided total)
 * 2. Summation of dualMethodData.oldTaxes (client-side aggregation)
 * 3. oldDetails.oldTotalTax (fallback from initial property details)
 * 
 * @param dualMethodData - Response from dual method API
 * @param oldDetails - Initial property details data
 * @returns Resolved total old tax
 */
export function getOldTaxTotal(
  dualMethodData: DualMethodResponse | null,
  oldDetails: OldDetailsData
): number {
  const oldTotalTax = Number(oldDetails?.oldTotalTax || 0);
  return dualMethodData?.oldTaxesTotal ?? sumTaxAmounts(dualMethodData?.oldTaxes) ?? oldTotalTax;
}

/**
 * Calculates the total old RV, preferring old details data.
 * 
 * @param oldDetails - Initial property details data
 * @returns Resolved total old RV
 */
export function getOldRvTotal(oldDetails: OldDetailsData): number {
  return Number(oldDetails?.oldRV || 0);
}

/**
 * Calculates the total old CV, preferring old details data.
 * 
 * @param oldDetails - Initial property details data
 * @returns Resolved total old CV
 */
export function getOldCvTotal(oldDetails: OldDetailsData): number {
  return Number(oldDetails?.oldCV || 0);
}

/**
 * Resolves the total tax for a specific method (RV, CV, or Retain) with fallbacks.
 *
 * Precedence:
 * 1. serverTotal - Explicit total provided by the server
 * 2. taxes - Aggregated sum of individual tax items
 * 3. fallbackTotal - Ultimate fallback if both above are missing
 * 
 * @param serverTotal - Explicit total from the server
 * @param taxes - Array of tax items to aggregate if serverTotal is missing
 * @param fallbackTotal - Ultimate fallback if both above are missing
 * @returns Resolved total tax or null
 */
export function getMethodTaxTotal(
  serverTotal: number | null | undefined,
  taxes: DualMethodTaxes | null | undefined,
  fallbackTotal?: number | null
): number | null {
  if (serverTotal != null) {
    return serverTotal;
  }

  const aggregatedTaxTotal = sumTaxAmounts(taxes);
  if (aggregatedTaxTotal != null) {
    return aggregatedTaxTotal;
  }

  return fallbackTotal ?? null;
}

/**
 * Calculates the total rateable value and tax from rateable data.
 * Handles server-provided totals with aggregation fallbacks.
 * 
 * @param rateableData - Response from rateable value API
 * @returns Object containing total RV, total Tax, and total ALV
 */
export function calculateRateableTotal(rateableData: RateableValueResponse | null) {
  if (!rateableData) return { rv: 0, tax: 0, alv: 0 };

  const details = rateableData.details ?? rateableData.items ?? [];

  const rv =
    rateableData.totalRateableValue != null
      ? Number(rateableData.totalRateableValue)
      : details.reduce((sum: number, detail) => sum + (detail.rateableValue || 0), 0);

  const alv = details.reduce(
    (sum: number, detail) => sum + (detail.annualRentalValue || 0),
    0
  );

  const tax =
    rateableData.totalTax != null
      ? Number(rateableData.totalTax)
      : details.reduce((sum: number, detail) => sum + (detail.taxTotal || 0), 0) ||
        sumTaxAmounts(rateableData.policy?.taxes) ||
        0;

  return { rv, tax, alv };
}

/**
 * Calculates the total capital value and tax from capital data.
 * Handles server-provided totals with aggregation fallbacks.
 * 
 * @param capitalData - Response from capital value API
 * @returns Object containing total CV and total Tax
 */
export function calculateCapitalTotal(capitalData: CapitalValueResponse | null) {
  if (!capitalData) return { cv: 0, tax: 0 };

  let cv = 0;
  let tax = 0;

  if (Array.isArray(capitalData)) {
    cv = capitalData.reduce((sum: number, item) => sum + (item.capitalValue || 0), 0);
    tax = capitalData.reduce((sum: number, item) => {
      // Prefer server-provided total for the row if available, otherwise aggregate
      return sum + (item.taxTotal ?? sumTaxAmounts(item.taxes) ?? 0);
    }, 0);
  } else {
    const collection = capitalData as CapitalValueCollection;
    const items = collection.items ?? collection.details ?? [];

    cv =
      collection.totalCapitalValue != null
        ? Number(collection.totalCapitalValue)
        : items.reduce((sum: number, item) => sum + (item.capitalValue || 0), 0);

    tax =
      collection.totalTax != null
        ? Number(collection.totalTax)
        : items.reduce((sum: number, item) => {
            return sum + (item.taxTotal ?? sumTaxAmounts(item.taxes) ?? 0);
          }, 0);
  }

  return { cv, tax };
}
