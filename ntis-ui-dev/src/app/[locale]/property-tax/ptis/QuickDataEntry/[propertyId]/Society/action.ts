'use server';

import { getPropertySocietyDetails, updatePropertySocietyDetails } from '@/lib/api/property-society.service';
import { UpdatePropertySocietyDetailsDto } from '@/types/property-society-details.types';
import { ActionResult } from '@/types/common.types';
import { revalidatePath } from 'next/cache';

/**
 * Extracts error message from various error structures
 * Prioritizes actual API error messages over generic fallback
 * 
 * @param error - Unknown error object from API or service layer
 * @returns The most specific error message available
 */
function getActionErrorMessage(error: unknown): string {
  // Handle string errors directly
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  // Handle object errors with multiple possible properties
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    // Check common error properties in priority order
    // 1. error.message (standard Error object)
    // 2. error.error (custom error property)
    // 3. error.response.data.message (Axios/HTTP response)
    // 4. error.response.data.error (Axios/HTTP response)
    // 5. error.data.message (API response wrapper)
    // 6. error.data.error (API response wrapper)
    const errorMessage =
      (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.trim() !== '' 
        ? errorObj.message 
        : null) ||
      (errorObj.error && typeof errorObj.error === 'string' && errorObj.error.trim() !== '' 
        ? errorObj.error 
        : null) ||
      (errorObj.response && typeof errorObj.response === 'object' && errorObj.response !== null
        ? (() => {
            const responseObj = errorObj.response as Record<string, unknown>;
            const dataObj = responseObj.data as Record<string, unknown> | null;
            if (dataObj && typeof dataObj === 'object') {
              return (dataObj.message && typeof dataObj.message === 'string' ? dataObj.message : null) ||
                     (dataObj.error && typeof dataObj.error === 'string' ? dataObj.error : null);
            }
            return null;
          })()
        : null) ||
      (errorObj.data && typeof errorObj.data === 'object' && errorObj.data !== null
        ? (() => {
            const dataObj = errorObj.data as Record<string, unknown>;
            return (dataObj.message && typeof dataObj.message === 'string' ? dataObj.message : null) ||
                   (dataObj.error && typeof dataObj.error === 'string' ? dataObj.error : null);
          })()
        : null);

    // Return actual error message if found
    if (errorMessage && errorMessage.trim().length > 0) {
      return errorMessage;
    }
  }

  // Fallback to generic message only when no specific error message is available
  return 'Something went wrong. Please try again.';
}

/**
 * Validates property ID input
 * 
 * @param propertyId - Property ID to validate
 * @returns Error message if invalid, null if valid
 */
function validatePropertyIdInput(propertyId: number): string | null {
  if (!propertyId || !Number.isInteger(propertyId) || propertyId <= 0) {
    return 'Invalid property ID. Must be a positive integer.';
  }
  return null;
}

/** Action to update property society details */
export async function updatePropertySocietyDetailsAction(
  locale: string,
  propertyId: number,
  payload: UpdatePropertySocietyDetailsDto
): Promise<ActionResult<null>> {
  try {
    // Validate input
    const validationError = validatePropertyIdInput(propertyId);
    if (validationError) {
      return { success: false, error: validationError };
    }
    const response = await updatePropertySocietyDetails(propertyId, payload);
    if (!response.success) {
      return response;
    }
    revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Society`, "page");
    return response;
  } catch (error) {
    return { success: false, error: getActionErrorMessage(error) };
  }
}

import { cache } from 'react';

/** Action to fetch property society details */
export const getPropertySocietyDetailsAction = cache(async (
  propertyId: number
): Promise<ActionResult<Awaited<ReturnType<typeof getPropertySocietyDetails>>>> => {
  try {
    // Validate input
    const validationError = validatePropertyIdInput(propertyId);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const response = await getPropertySocietyDetails(propertyId);
    return { success: true, data: response };
  } catch (error) {   
    return { success: false, error: getActionErrorMessage(error) };
  }
});