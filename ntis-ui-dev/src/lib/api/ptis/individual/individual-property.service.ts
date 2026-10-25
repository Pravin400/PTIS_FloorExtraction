import { apiClient } from '@/services/api.service';
import type {
  IndividualPropertyDto,
  IndividualPropertyApiResponse,
  IndividualPatchPayload,
  IndividualPatchResponseDto,
  IndividualPatchApiResponse,
} from '@/types/property-tax/individual';

const individualQcCache = new Map<string, { data: IndividualPropertyDto; timestamp: number }>();
const inFlightIndividualQc = new Map<string, Promise<{ success: boolean; data?: IndividualPropertyDto; error?: string }>>();
const INDIVIDUAL_QC_CACHE_TTL = 60 * 1000; // 60 seconds

export function invalidateIndividualQcCache(propertyId?: string | number) {
  if (!propertyId) {
    individualQcCache.clear();
    inFlightIndividualQc.clear();
    return;
  }
  const cleanId = String(propertyId).trim();
  individualQcCache.delete(cleanId);
  inFlightIndividualQc.delete(cleanId);
}

export async function fetchIndividualQcTopSection(
  propertyId: number | string
): Promise<{ success: boolean; data?: IndividualPropertyDto; error?: string }> {
  const cleanId = String(propertyId).trim();
  if (!cleanId) {
    return { success: false, error: 'Property identifier is missing.' };
  }

  const cached = individualQcCache.get(cleanId);
  if (cached && Date.now() - cached.timestamp < INDIVIDUAL_QC_CACHE_TTL) {
    return { success: true, data: cached.data };
  }

  const existingPromise = inFlightIndividualQc.get(cleanId);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      const endpoint = `/Property/${encodeURIComponent(propertyId)}/individual`;
      const response = await apiClient.get<IndividualPropertyApiResponse>(endpoint, {
        cache: 'no-store',
      });

      if (response.success && response.data && response.data.success !== false) {
        const data = response.data.items || (response.data as unknown as IndividualPropertyDto);
        individualQcCache.set(cleanId, { data, timestamp: Date.now() });
        return {
          success: true,
          data,
        };
      }

      // Try alternate lowercase path if needed
      const lowerEndpoint = `/property/${encodeURIComponent(propertyId)}/individual`;
      const lowerResponse = await apiClient.get<IndividualPropertyApiResponse>(lowerEndpoint, {
        cache: 'no-store',
      });

      if (lowerResponse.success && lowerResponse.data && lowerResponse.data.success !== false) {
        const data = lowerResponse.data.items || (lowerResponse.data as unknown as IndividualPropertyDto);
        individualQcCache.set(cleanId, { data, timestamp: Date.now() });
        return {
          success: true,
          data,
        };
      }

      return {
        success: false,
        error: response.error || lowerResponse.error || 'Unable to retrieve individual property details. Please try again.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred while fetching individual property details.',
      };
    } finally {
      inFlightIndividualQc.delete(cleanId);
    }
  })();

  inFlightIndividualQc.set(cleanId, fetchPromise);
  return fetchPromise;
}

export async function patchIndividualProperty(
  propertyId: number | string,
  payload: IndividualPatchPayload
): Promise<{ success: boolean; data?: IndividualPatchResponseDto | unknown; error?: string }> {
  try {
    invalidateIndividualQcCache(propertyId);
    const endpoint = `/Property/${encodeURIComponent(propertyId)}/individual`;
    const response = await apiClient.patch<IndividualPatchApiResponse>(
      endpoint,
      payload
    );

    if (response.success && response.data?.success !== false) {
      return {
        success: true,
        data: response.data?.items ?? response.data,
      };
    }

    // Fallback: try root /Property/{id} endpoint if specific individual patch not found
    const rootEndpoint = `/Property/${encodeURIComponent(propertyId)}`;
    const rootResponse = await apiClient.patch<IndividualPatchApiResponse>(
      rootEndpoint,
      payload
    );

    if (rootResponse.success && rootResponse.data?.success !== false) {
      return {
        success: true,
        data: rootResponse.data?.items ?? rootResponse.data,
      };
    }

    return {
      success: false,
      error: response.error || rootResponse.error || 'Failed to update property details. Please try again.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred while updating property details.',
    };
  }
}
