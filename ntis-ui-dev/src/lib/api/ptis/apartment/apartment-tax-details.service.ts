import 'server-only';
import { apiClient } from '@/services/api.service';
import { ApartmentTaxDetailsResponse, ApartmentDemandDetailsResponse } from '@/types/property-tax/apartment';

export interface GetApartmentTaxDetailsParams {
  wardId: number | string;
  propertyNo: string;
  taxType?: string;
}

function createErrorResponse(
  message: string,
  errors: string[] = [message]
): ApartmentTaxDetailsResponse {
  return {
    success: false,
    message,
    items: null,
    totalCount: null,
    errors,
    correlationId: null,
  };
}

const apartmentTaxCache = new Map<string, { data: ApartmentTaxDetailsResponse; timestamp: number }>();
const inFlightTax = new Map<string, Promise<ApartmentTaxDetailsResponse>>();
const APARTMENT_TAX_CACHE_TTL = 60 * 1000; // 60 seconds

export function invalidateApartmentTaxDetailsCache(keyPrefix?: string) {
  if (!keyPrefix) {
    apartmentTaxCache.clear();
    inFlightTax.clear();
    return;
  }
  const cleanKey = String(keyPrefix).trim();
  for (const k of apartmentTaxCache.keys()) {
    if (k.includes(cleanKey)) apartmentTaxCache.delete(k);
  }
  for (const k of inFlightTax.keys()) {
    if (k.includes(cleanKey)) inFlightTax.delete(k);
  }
}

/**
 * Fetches tax details (current taxes and arrears) for an apartment property.
 * Endpoint: /ApartmentQC/Taxdetails?wardId={wardId}&propertyNo={propertyNo}&taxType={taxType}
 */
export async function getApartmentTaxDetails({
  wardId,
  propertyNo,
  taxType = 'RV',
}: GetApartmentTaxDetailsParams): Promise<ApartmentTaxDetailsResponse> {
  try {
    const cleanWardId = String(wardId ?? '').trim();
    const cleanPropertyNo = String(propertyNo ?? '').trim();
    const cleanTaxType = (taxType ?? 'RV').trim().toUpperCase() || 'RV';

    if (!cleanWardId || !cleanPropertyNo) {
      return createErrorResponse('Ward ID and Property Number are required', [
        'Missing or invalid required parameters: wardId or propertyNo',
      ]);
    }

    const cacheKey = `${cleanWardId}:${cleanPropertyNo}:${cleanTaxType}`;
    const cached = apartmentTaxCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < APARTMENT_TAX_CACHE_TTL) {
      return cached.data;
    }

    const existingPromise = inFlightTax.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const params = new URLSearchParams({
      wardId: cleanWardId,
      propertyNo: cleanPropertyNo,
      taxType: cleanTaxType,
    });

    const fetchPromise = (async () => {
      try {
        const endpoint = `/ApartmentQC/Taxdetails?${params.toString()}`;
        const response = await apiClient.get<ApartmentTaxDetailsResponse>(endpoint, {
          cache: 'no-store',
        });

        if (response.success && response.data) {
          apartmentTaxCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
          return response.data;
        }

        return createErrorResponse(
          response.error || 'Failed to fetch apartment tax details',
          response.error ? [response.error] : ['Unknown server error']
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Network error while fetching apartment tax details';
        return createErrorResponse(errorMessage, [errorMessage]);
      } finally {
        inFlightTax.delete(cacheKey);
      }
    })();

    inFlightTax.set(cacheKey, fetchPromise);
    return fetchPromise;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Network error while fetching apartment tax details';
    return createErrorResponse(errorMessage, [errorMessage]);
  }
}

/**
 * Fetches demand details for an apartment property.
 * Endpoint: /ApartmentQC/demanddetails?wardId={wardId}&propertyNo={propertyNo}&taxType={taxType}
 */
export async function getApartmentDemandDetails({
  wardId,
  propertyNo,
  taxType = 'RV',
}: GetApartmentTaxDetailsParams): Promise<ApartmentDemandDetailsResponse> {
  try {
    const cleanWardId = String(wardId ?? '').trim();
    const cleanPropertyNo = String(propertyNo ?? '').trim();
    const cleanTaxType = (taxType ?? 'RV').trim().toUpperCase() || 'RV';

    if (!cleanWardId || !cleanPropertyNo) {
      return {
        success: false,
        message: 'Ward ID and Property Number are required',
        items: null,
        totalCount: null,
        errors: ['Missing or invalid required parameters: wardId or propertyNo'],
        correlationId: null,
      };
    }

    const params = new URLSearchParams({
      wardId: cleanWardId,
      propertyNo: cleanPropertyNo,
      taxType: cleanTaxType,
    });

    const endpoint = `/ApartmentQC/demanddetails?${params.toString()}`;
    const response = await apiClient.get<ApartmentDemandDetailsResponse>(endpoint, {
      cache: 'no-store',
    });

    if (response.success && response.data) {
      return response.data;
    }

    return {
      success: false,
      message: response.error || 'Failed to fetch apartment demand details',
      items: null,
      totalCount: null,
      errors: response.error ? [response.error] : ['Unknown server error'],
      correlationId: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Network error while fetching apartment demand details';
    return {
      success: false,
      message: errorMessage,
      items: null,
      totalCount: null,
      errors: [errorMessage],
      correlationId: null,
    };
  }
}

export interface GetApartmentYearWiseDetailsParams {
  wardId: number | string;
  propertyNo: string;
  taxType?: string;
  financeYearId: number | string;
}

/**
 * Fetches year wise details for an apartment property.
 * Endpoint: /ApartmentQC/yearwisedetails?wardId={wardId}&propertyNo={propertyNo}&taxType={taxType}&financeYearId={financeYearId}
 */
export async function getApartmentYearWiseDetails({
  wardId,
  propertyNo,
  taxType = 'RV',
  financeYearId,
}: GetApartmentYearWiseDetailsParams): Promise<ApartmentDemandDetailsResponse> {
  try {
    const cleanWardId = String(wardId ?? '').trim();
    const cleanPropertyNo = String(propertyNo ?? '').trim();
    const cleanTaxType = (taxType ?? 'RV').trim().toUpperCase() || 'RV';
    const cleanFinanceYearId = String(financeYearId ?? '').trim();

    if (!cleanWardId || !cleanPropertyNo || !cleanFinanceYearId) {
      return {
        success: false,
        message: 'Ward ID, Property Number, and Finance Year ID are required',
        items: null,
        totalCount: null,
        errors: ['Missing or invalid required parameters: wardId, propertyNo, or financeYearId'],
        correlationId: null,
      };
    }

    const params = new URLSearchParams({
      wardId: cleanWardId,
      propertyNo: cleanPropertyNo,
      taxType: cleanTaxType,
      financeYearId: cleanFinanceYearId,
    });

    const endpoint = `/ApartmentQC/yearwisedetails?${params.toString()}`;
    const response = await apiClient.get<ApartmentDemandDetailsResponse>(endpoint, {
      cache: 'no-store',
    });

    if (response.success && response.data) {
      return response.data;
    }

    return {
      success: false,
      message: response.error || 'Failed to fetch apartment year wise details',
      items: null,
      totalCount: null,
      errors: response.error ? [response.error] : ['Unknown server error'],
      correlationId: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Network error while fetching apartment year wise details';
    return {
      success: false,
      message: errorMessage,
      items: null,
      totalCount: null,
      errors: [errorMessage],
      correlationId: null,
    };
  }
}

/**
 * Fetches Rateable Value (RV) based tax breakdown for an apartment property
 */
export async function getApartmentPropertyTaxDetailsRv(
  propertyId: number
): Promise<{ success: boolean; data?: Record<string, unknown> | null; message?: string; error?: string }> {
  try {
    if (!propertyId || !Number.isFinite(propertyId) || propertyId <= 0) {
      return { success: false, error: 'Valid Property ID is required' };
    }
    const endpoint = `/Property/apartment-property-tax-details-rv?Id=${encodeURIComponent(propertyId.toString())}`;
    const response = await apiClient.get<Record<string, unknown>>(endpoint, { cache: 'no-store' });

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch apartment RV tax details',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error fetching RV tax details',
    };
  }
}

/**
 * Fetches Capital Value (CV) based tax breakdown for an apartment property
 */
export async function getApartmentPropertyTaxDetailsCv(
  propertyId: number
): Promise<{ success: boolean; data?: Record<string, unknown> | null; message?: string; error?: string }> {
  try {
    if (!propertyId || !Number.isFinite(propertyId) || propertyId <= 0) {
      return { success: false, error: 'Valid Property ID is required' };
    }
    const endpoint = `/Property/apartment-property-tax-details-cv?Id=${encodeURIComponent(propertyId.toString())}`;
    const response = await apiClient.get<Record<string, unknown>>(endpoint, { cache: 'no-store' });

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch apartment CV tax details',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error fetching CV tax details',
    };
  }
}
