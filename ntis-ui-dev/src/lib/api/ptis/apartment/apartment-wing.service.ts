import { apiClient } from '@/services/api.service';
import { handleApiResponse } from '@/lib/utils/api';
import { getTranslations } from 'next-intl/server';
import { WingWiseDetailsItems, WingWiseDetailsResponse } from '@/types/property-tax/apartment';

const wingWiseDetailsCache = new Map<string, { data: WingWiseDetailsItems | null; timestamp: number }>();
const inFlightWingWise = new Map<string, Promise<WingWiseDetailsItems | null>>();
const WING_WISE_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache
const MAX_WING_WISE_CACHE_SIZE = 150;

function setBoundedWingWiseCache(key: string, data: WingWiseDetailsItems | null) {
  if (wingWiseDetailsCache.size >= MAX_WING_WISE_CACHE_SIZE) {
    const oldestKey = wingWiseDetailsCache.keys().next().value;
    if (oldestKey) wingWiseDetailsCache.delete(oldestKey);
  }
  wingWiseDetailsCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateWingWiseDetailsCache(wardId?: string | number, propertyNo?: string) {
  if (!wardId && !propertyNo) {
    wingWiseDetailsCache.clear();
    inFlightWingWise.clear();
    return;
  }
  const cleanWardId = wardId !== undefined && wardId !== null ? wardId.toString().trim() : '';
  const cleanPropertyNo = propertyNo ? propertyNo.trim() : '';
  const key = `${cleanWardId}:${cleanPropertyNo}`;
  wingWiseDetailsCache.delete(key);
  inFlightWingWise.delete(key);
}

export async function getWingWiseDetails(
  wardId: string | number,
  propertyNo: string
): Promise<WingWiseDetailsItems | null> {
  const cleanWardId = wardId !== undefined && wardId !== null ? wardId.toString().trim() : '';
  const cleanPropertyNo = propertyNo ? propertyNo.trim() : '';

  if (!cleanWardId && !cleanPropertyNo) {
    return null;
  }

  const cacheKey = `${cleanWardId}:${cleanPropertyNo}`;
  const cached = wingWiseDetailsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WING_WISE_CACHE_TTL) {
    return cached.data;
  }

  // Request Coalescing: coalesce concurrent in-flight calls for identical parameters
  const existingPromise = inFlightWingWise.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      const params = new URLSearchParams();
      if (cleanWardId) {
        params.append('WardId', cleanWardId);
      }
      if (cleanPropertyNo) {
        params.append('PropertyNo', cleanPropertyNo);
      }

      const url = `/ApartmentQC/wing-wise-details?${params.toString()}`;
      const response = await apiClient.get<WingWiseDetailsResponse>(url);
      const t = await getTranslations('ptisRedesign');

      const responseData = handleApiResponse(
        response,
        t('errors.fetchWingWiseDetails') || 'Failed to fetch wing wise details'
      );
      const result = responseData.items ?? null;
      setBoundedWingWiseCache(cacheKey, result);
      return result;
    } finally {
      inFlightWingWise.delete(cacheKey);
    }
  })();

  inFlightWingWise.set(cacheKey, fetchPromise);
  return fetchPromise;
}


export interface UpdateApartmentQcWingDetailsPayload {
  wingName?: string | null;
  managerName?: string | null;
  managerNameEnglish?: string | null;
  managerMobileNo?: string | null;
  managerEmailId?: string | null;
  secretaryName?: string | null;
  secretaryNameEnglish?: string | null;
  secretaryMobileNo?: string | null;
  secretaryEmailId?: string | null;
}

export async function updateApartmentQcWingDetails(
  wingDetailId: number,
  payload: UpdateApartmentQcWingDetailsPayload
) {
  invalidateWingWiseDetailsCache();
  const url = `/ApartmentQC/wing-details/${wingDetailId}`;
  return await apiClient.patch<Record<string, unknown>>(url, payload);
}
