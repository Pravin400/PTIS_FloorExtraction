import { apiClient } from '@/services/api.service';
import {
  ApartmentQCTopSectionBelowFlexResponseDto,
  ApartmentQCTopSectionBelowFlexItemsDto,
} from '@/types/property-tax/apartment';

export interface ApartmentQCTopSectionBelowFlexParams {
  propertyId?: number | string | null;
  upic?: string | null;
  ward?: number | string | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  wingDetailsId?: number | string | null;
  societyId?: number | string | null;
}

const belowFlexCache = new Map<string, { data: ApartmentQCTopSectionBelowFlexResponseDto; timestamp: number }>();
const inFlightBelowFlex = new Map<string, Promise<ApartmentQCTopSectionBelowFlexResponseDto>>();
const BELOW_FLEX_CACHE_TTL = 60 * 1000; // 60 seconds

export function invalidateBelowFlexCache(keyPrefix?: string) {
  if (!keyPrefix) {
    belowFlexCache.clear();
    inFlightBelowFlex.clear();
    return;
  }
  const cleanKey = String(keyPrefix).trim();
  for (const k of belowFlexCache.keys()) {
    if (k.includes(cleanKey)) belowFlexCache.delete(k);
  }
  for (const k of inFlightBelowFlex.keys()) {
    if (k.includes(cleanKey)) inFlightBelowFlex.delete(k);
  }
}

/**
 * Fetches workflow stages and certificate types for apartment QC top section below flex.
 * Endpoint: GET /ApartmentQC/below-flex?propertyId={propertyId}
 * Supports optional upic, ward, propertyNo, partitionNo, wingDetailsId, societyId.
 * 
 * @param propertyIdOrParams Unique numerical ID of the property or full params object
 */
export async function getApartmentQCTopSectionBelowFlex(
  propertyIdOrParams: number | string | ApartmentQCTopSectionBelowFlexParams
): Promise<ApartmentQCTopSectionBelowFlexResponseDto> {
  try {
    const isObject = typeof propertyIdOrParams === 'object' && propertyIdOrParams !== null;
    const paramsObj: ApartmentQCTopSectionBelowFlexParams | null = isObject
      ? (propertyIdOrParams as ApartmentQCTopSectionBelowFlexParams)
      : null;

    const rawPropId = paramsObj ? paramsObj.propertyId : propertyIdOrParams;
    const numericId = rawPropId ? Number(rawPropId) : null;
    const hasValidPropId = Boolean(numericId && Number.isFinite(numericId) && numericId > 0);
    const hasPropertyNo = Boolean(paramsObj?.propertyNo && String(paramsObj.propertyNo).trim() !== '');
    const hasUpic = Boolean(paramsObj?.upic && String(paramsObj.upic).trim() !== '');

    if (!hasValidPropId && !hasPropertyNo && !hasUpic) {
      return {
        success: false,
        message: 'Valid Property ID, Property No, or UPIC is required',
        items: null,
      };
    }

    const searchParams = new URLSearchParams();
    if (hasValidPropId && numericId) {
      searchParams.set('propertyId', numericId.toString());
    }

    if (paramsObj) {
      if (paramsObj.upic) searchParams.set('upic', String(paramsObj.upic));
      if (paramsObj.ward) searchParams.set('ward', String(paramsObj.ward));
      if (paramsObj.propertyNo) searchParams.set('propertyNo', String(paramsObj.propertyNo));
      if (paramsObj.partitionNo !== undefined && paramsObj.partitionNo !== null) {
        searchParams.set('partitionNo', String(paramsObj.partitionNo));
      }
      if (paramsObj.wingDetailsId) searchParams.set('wingDetailsId', String(paramsObj.wingDetailsId));
      if (paramsObj.societyId) searchParams.set('societyId', String(paramsObj.societyId));
    }

    const cacheKey = searchParams.toString();
    const cached = belowFlexCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < BELOW_FLEX_CACHE_TTL) {
      return cached.data;
    }

    const existingPromise = inFlightBelowFlex.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async () => {
      try {
        const endpoint = `/ApartmentQC/below-flex?${searchParams.toString()}`;
        const response = await apiClient.get<ApartmentQCTopSectionBelowFlexResponseDto>(endpoint, {
          cache: 'no-store',
        });

        if (response.success && response.data) {
          const responsePayload = response.data;
          const itemsPayload = (responsePayload.items || responsePayload.data || responsePayload) as ApartmentQCTopSectionBelowFlexItemsDto;
          const result: ApartmentQCTopSectionBelowFlexResponseDto = {
            success: true,
            message: responsePayload.message || 'Record found successfully',
            items: itemsPayload,
            data: itemsPayload,
            errors: responsePayload.errors || null,
            correlationId: responsePayload.correlationId || null,
          };
          belowFlexCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        }

        return {
          success: false,
          message: response.error || 'Failed to fetch workflow stages',
          items: null,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Network error while fetching workflow stages',
          items: null,
        };
      } finally {
        inFlightBelowFlex.delete(cacheKey);
      }
    })();

    inFlightBelowFlex.set(cacheKey, fetchPromise);
    return fetchPromise;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error while fetching workflow stages',
      items: null,
    };
  }
}

