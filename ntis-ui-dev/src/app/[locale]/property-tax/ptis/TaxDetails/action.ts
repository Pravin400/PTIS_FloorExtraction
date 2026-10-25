'use server';

import { getPtisMainTaxDetailsByPropertyId, getPtisMainTaxDetailsCvByPropertyId } from '@/lib/api/ptis/ptisMain-taxdetails/taxDetails.service';
import { MAX_PROPERTY_ID } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { validatePropertyId } from '@/lib/utils/ptis-normalization';
import { handleServerError } from '@/lib/utils/server-action-error-handler';
import type { ActionResult } from '@/types/common.types';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';

/**
 * Validates property ID input with comprehensive checks
 * 
 * @param propertyId - Property ID to validate (string or number)
 * @param actionName - Name of the action for error messages
 * @returns Validation result with normalized ID or error
 */
function validatePropertyIdInput(
  propertyId: string | number | undefined | null,
  actionName: string
): { valid: false; error: string } | { valid: true; id: number } {
  // Check for null/undefined
  if (propertyId === null || propertyId === undefined) {
    return {
      valid: false,
      error: `Property ID is required for ${actionName}`,
    };
  }

  // Check for empty string
  if (typeof propertyId === 'string' && propertyId.trim().length === 0) {
    return {
      valid: false,
      error: 'Property ID cannot be empty',
    };
  }

  // Validate and normalize using existing utility
  const propertyIdNum = validatePropertyId(propertyId);

  if (!propertyIdNum) {
    return {
      valid: false,
      error: 'Invalid property ID format. Must be a positive integer',
    };
  }

  if (propertyIdNum > MAX_PROPERTY_ID) {
    return {
      valid: false,
      error: `Property ID exceeds maximum allowed value (${MAX_PROPERTY_ID})`,
    };
  }

  return { valid: true, id: propertyIdNum };
}

/**
 * Server action for fetching Rateable Tax Details
 * 
 * Fetches tax details for rateable value tab using the /tax-details endpoint.
 * Includes comprehensive input validation and error handling.
 * 
 * @param propertyId - The unique identifier of the property (positive integer)
 * @returns Promise containing tax details data or error
 * 
 * @example
 * ```ts
 * const result = await getRateableTaxDetails(12345);
 * if (result.success) {
 * }
 * ```
 */
export async function getRateableTaxDetails(
  propertyId: string | number
): Promise<ActionResult<TaxDetailsData>> {
  try {
    // Validate input
    const validation = validatePropertyIdInput(propertyId, 'rateable tax details');

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Fetch data with validated ID
    const result = await getPtisMainTaxDetailsByPropertyId(validation.id);

    return { success: true, data: result };
  } catch (error: unknown) {
    return handleServerError<TaxDetailsData>(error, 'fetching rateable tax details');
  }
}

/**
 * Server action for fetching Capital Tax Details
 * 
 * Fetches tax details for capital value tab using the /tax-details-cv endpoint.
 * Includes comprehensive input validation and error handling.
 * 
 * @param propertyId - The unique identifier of the property (positive integer)
 * @returns Promise containing tax details data or error
 * 
 * @example
 * ```ts
 * const result = await getCapitalTaxDetails(12345);
 * if (result.success) {
 * }
 * ```
 */
export async function getCapitalTaxDetails(
  propertyId: string | number
): Promise<ActionResult<TaxDetailsData>> {
  try {
    // Validate input
    const validation = validatePropertyIdInput(propertyId, 'capital tax details');

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Fetch data with validated ID
    const result = await getPtisMainTaxDetailsCvByPropertyId(validation.id);

    return { success: true, data: result };
  } catch (error: unknown) {
    return handleServerError<TaxDetailsData>(error, 'fetching capital tax details');
  }
}
