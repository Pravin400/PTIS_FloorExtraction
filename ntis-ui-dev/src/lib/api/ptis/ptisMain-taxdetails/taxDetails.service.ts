/**
 * Tax Details Service
 * Provides API methods for fetching property tax details (Rateable Value & Capital Value)
 */

import { apiClient } from '@/services/api.service';
import type { PtisMainTaxDetailsApiResponse, TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import type { ApiResponse } from '@/types/common.types';
import { validateAndExtractApiResponse } from '@/lib/utils/api-response-validators';

/**
 * Extracts TaxDetailsData from the API response with comprehensive error handling.
 * Validates both transport-level success and backend payload success flags.
 *
 * @param apiResponse - The wrapped API response from apiClient
 * @param endpoint - The endpoint name for error messages
 * @returns Extracted TaxDetailsData
 * @throws Error if response structure is invalid, API call failed, or backend returns error
 */
function extractTaxDetailsFromResponse(
  apiResponse: ApiResponse<PtisMainTaxDetailsApiResponse>,
  endpoint: string
): TaxDetailsData {
  return validateAndExtractApiResponse<TaxDetailsData>(apiResponse, endpoint);
}

function isTaxDetailsNotFound(response: ApiResponse<PtisMainTaxDetailsApiResponse>): boolean {
  if (!response) return false;

  const statusCodeStr = String(response.statusCode || response.data?.statusCode || '');
  const errorMessage = String(response.error || (response.data as unknown as Record<string, unknown>)?.error || '').toLowerCase();

  return (
    statusCodeStr === '404' ||
    errorMessage.includes('no tax details found') ||
    errorMessage.includes('no tax details available')
  );
}

/**
 * Fetches general tax details for a property using Rateable Value method.
 * Uses SSR with no-store cache to ensure fresh data on each request.
 *
 * Endpoint: GET /api/Property/{propertyId}/tax-details
 *
 * @param propertyId - The unique identifier of the property
 * @returns Promise containing propertyId and policies array with taxAmounts
 * @throws Error if API call fails or response is invalid
 */
export async function getPtisMainTaxDetailsByPropertyId(propertyId: number): Promise<TaxDetailsData> {
  try {
    const response = await apiClient.get<PtisMainTaxDetailsApiResponse>(
      `/Property/${propertyId}/tax-details`,
      { cache: 'no-store' }
    );

    if (isTaxDetailsNotFound(response)) {
      return {
        propertyId,
        policies: [],
      };
    }

    return extractTaxDetailsFromResponse(response, 'tax-details');
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches Capital Value (CV) tax details for a property.
 * Uses SSR with no-store cache to ensure fresh data on each request.
 *
 * Endpoint: GET /api/Property/{propertyId}/tax-details-cv
 *
 * @param propertyId - The unique identifier of the property
 * @returns Promise containing propertyId and policies array with taxAmounts
 * @throws Error if API call fails or response is invalid
 */
export async function getPtisMainTaxDetailsCvByPropertyId(propertyId: number): Promise<TaxDetailsData> {
  try {
    const response = await apiClient.get<PtisMainTaxDetailsApiResponse>(
      `/Property/${propertyId}/tax-details-cv`,
      { cache: 'no-store' }
    );

    if (isTaxDetailsNotFound(response)) {
      return {
        propertyId,
        policies: [],
      };
    }

    return extractTaxDetailsFromResponse(response, 'tax-details-cv');
  } catch (error) {
    throw error;
  }
}