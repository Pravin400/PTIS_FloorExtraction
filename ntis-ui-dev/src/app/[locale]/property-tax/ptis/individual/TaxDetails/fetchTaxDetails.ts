'use server';

import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import type { ValuationTabId } from '@/types/ptis.types';
import { getCapitalTaxDetails, getRateableTaxDetails } from './action';

/**
 * Result type for tax details fetching
 */
export interface TaxDetailsResult {
  rateableTaxDetails?: TaxDetailsData;
  capitalTaxDetails?: TaxDetailsData;
  rateableTaxError?: string;
  capitalTaxError?: string;
}

/**
 * Shared utility for fetching tax details based on valuation tab
 * 
 * Eliminates duplicated logic across the application by centralizing
 * tax details fetching for rateable, capital, and dual valuation tabs.
 * 
 * @param propertyId - The property ID to fetch tax details for
 * @param valuationTab - The active valuation tab ('rateable', 'capital', 'dual', or default)
 * @returns Promise with tax details and errors for both rateable and capital values
 * 
 * @example
 * ```ts
 * const taxDetails = await fetchTaxDetailsByTab(12345, 'capital');
 * if (taxDetails.capitalTaxDetails) {
 *   // Use capital tax details
 * }
 * ```
 */
export async function fetchTaxDetailsByTab(
  propertyId: number | undefined,
  valuationTab?: ValuationTabId,
  _showDetails?: boolean
): Promise<TaxDetailsResult> {
  const result: TaxDetailsResult = {};

  // Return early if no property ID is provided
  if (!propertyId) {
    return result;
  }

  try {
    switch (valuationTab) {
      case 'capital': {
        const capitalResult = await getCapitalTaxDetails(propertyId);
        if (capitalResult.success && capitalResult.data) {
          result.capitalTaxDetails = capitalResult.data;
        } else {
          result.capitalTaxError = capitalResult.error;
        }
        break;
      }

      case 'rateable': {
        const rateableResult = await getRateableTaxDetails(propertyId);
        if (rateableResult.success && rateableResult.data) {
          result.rateableTaxDetails = rateableResult.data;
        } else {
          result.rateableTaxError = rateableResult.error;
        }
        break;
      }

      case 'dual': {
        // Fetch both in parallel for dual view
        const [capitalResult, rateableResult] = await Promise.all([
          getCapitalTaxDetails(propertyId),
          getRateableTaxDetails(propertyId),
        ]);

        if (capitalResult.success && capitalResult.data) {
          result.capitalTaxDetails = capitalResult.data;
        } else {
          result.capitalTaxError = capitalResult.error;
        }

        if (rateableResult.success && rateableResult.data) {
          result.rateableTaxDetails = rateableResult.data;
        } else {
          result.rateableTaxError = rateableResult.error;
        }
        break;
      }

      default: {
        // Default to rateable for apartment or other tabs
        const rateableResult = await getRateableTaxDetails(propertyId);
        if (rateableResult.success && rateableResult.data) {
          result.rateableTaxDetails = rateableResult.data;
        } else {
          result.rateableTaxError = rateableResult.error;
        }
        break;
      }
    }
  } catch (error) {
    // Handle unexpected errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tax details';

    if (valuationTab === 'capital') {
      result.capitalTaxError = errorMessage;
    } else if (valuationTab === 'dual') {
      result.capitalTaxError = errorMessage;
      result.rateableTaxError = errorMessage;
    } else {
      result.rateableTaxError = errorMessage;
    }
  }

  return result;
}
