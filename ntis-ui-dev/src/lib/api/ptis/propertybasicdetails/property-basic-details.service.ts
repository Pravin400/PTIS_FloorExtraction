//ntis-ui\src\lib\api\property-basic-details.service.ts
import { apiClient } from '@/services/api.service';
import { handleApiResponse, ApiError } from '@/lib/utils/api';
import { getTranslations } from 'next-intl/server';

import {
  PropertyBasicDetailsApiItem,
  PropertyCategoryApiItem,
  PropertyTypeApiItem,
  TaxDetailsApiResponse,
  UpdatePropertyBasicDetailsDto,
  WingItem,
  MoujaItem,
  TaxZoneItem,
} from '@/types/property-basic-details.types';
import { ActionResult } from '@/types/common.types';

import {
  isPropertyBasicDetailsShape,
  normalizePropertyBasicDetails,
  isPropertyTypeShape,
  normalizePropertyType,
  isPropertyCategoryShape,
  normalizePropertyCategory,
  isMoujaShape,
  normalizeMouja,
  isTaxZoneShape,
  normalizeTaxZone,
  isWingShape,
  normalizeWing,
} from './property-basic-details.guard';

const masterCache = new Map<string, { data: unknown; expiresAt: number }>();
const MASTER_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedMaster<T>(key: string): T | null {
  const item = masterCache.get(key);
  if (item && item.expiresAt > Date.now()) {
    return item.data as T;
  }
  return null;
}

function setCachedMaster<T>(key: string, data: T): void {
  masterCache.set(key, { data, expiresAt: Date.now() + MASTER_TTL_MS });
}

/* ---------------- PROPERTY TYPE ---------------- */
export async function getPropertyTypes(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PropertyTypeApiItem[]> {
  const cacheKey = `propertyTypes:${pageNumber}:${pageSize}:${searchTerm || ''}`;
  const cached = getCachedMaster<PropertyTypeApiItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    params.append('PageSize', pageSize.toString());
    if (searchTerm?.trim()) {
      params.append('SearchTerm', searchTerm.trim());
    }
    params.append('PageNo', pageNumber.toString());

    const response = await apiClient.get<unknown>(
      `/PropertyTypeMaster?${params.toString()}`
    );

    if (!response.success || !response.data) return [];

    const rootData = response.data;
    const rawList = Array.isArray(rootData)
      ? rootData
      : (typeof rootData === 'object' && rootData !== null && 'items' in rootData && Array.isArray((rootData as { items: unknown }).items))
        ? (rootData as { items: unknown[] }).items
        : [];

    const result = rawList.filter(isPropertyTypeShape).map(normalizePropertyType);
    if (result.length > 0) setCachedMaster(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

export async function getPropertyCategories(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PropertyCategoryApiItem[]> {
  const cacheKey = `propertyCategories:${pageNumber}:${pageSize}:${searchTerm || ''}`;
  const cached = getCachedMaster<PropertyCategoryApiItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    params.append('PageSize', pageSize.toString());
    if (searchTerm?.trim()) {
      params.append('SearchTerm', searchTerm.trim());
    }
    params.append('PageNo', pageNumber.toString());

    const response = await apiClient.get<unknown>(
      `/PropertyCategory?${params.toString()}`
    );

    if (!response.success || !response.data) return [];

    const rootData = response.data;
    const rawList = Array.isArray(rootData)
      ? rootData
      : (typeof rootData === 'object' && rootData !== null && 'items' in rootData && Array.isArray((rootData as { items: unknown }).items))
        ? (rootData as { items: unknown[] }).items
        : [];

    const result = rawList.filter(isPropertyCategoryShape).map(normalizePropertyCategory);
    if (result.length > 0) setCachedMaster(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

/* ---------------- PROPERTY BASIC DETAILS ---------------- */
const propertyBasicDetailsCache = new Map<number, { data: PropertyBasicDetailsApiItem | null; timestamp: number }>();
const inFlightBasicDetails = new Map<number, Promise<PropertyBasicDetailsApiItem | null>>();
const BASIC_DETAILS_TTL = 60 * 1000; // 60 seconds

export function invalidatePropertyBasicDetailsCache(propertyId?: number): void {
  if (!propertyId) {
    propertyBasicDetailsCache.clear();
    inFlightBasicDetails.clear();
    return;
  }
  propertyBasicDetailsCache.delete(propertyId);
  inFlightBasicDetails.delete(propertyId);
}

export async function getPropertyBasicDetails(
  propertyId: number
): Promise<PropertyBasicDetailsApiItem | null> {
  const cached = propertyBasicDetailsCache.get(propertyId);
  if (cached && Date.now() - cached.timestamp < BASIC_DETAILS_TTL) {
    return cached.data;
  }

  // Request Coalescing: coalesce concurrent in-flight calls for identical propertyId
  const existingPromise = inFlightBasicDetails.get(propertyId);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async () => {
    try {
      const response = await apiClient.get<unknown>(
        `/Property/${propertyId}/basic-details`
      );

      if (response.success && response.data) {
        const rootData = response.data;
        const payload = (typeof rootData === 'object' && rootData !== null && 'items' in rootData)
          ? (rootData as { items: unknown }).items
          : rootData;

        if (isPropertyBasicDetailsShape(payload)) {
          const normalized = normalizePropertyBasicDetails(payload);
          propertyBasicDetailsCache.set(propertyId, { data: normalized, timestamp: Date.now() });
          return normalized;
        }
      }
    } catch (_e) {
      // Primary endpoint failed, fallback below
    }

    // Fallback: Try individual property top section
    try {
      const { fetchIndividualQcTopSection } = await import('@/lib/api/ptis/individual');
      const individualRes = await fetchIndividualQcTopSection(propertyId);
      if (individualRes.success && individualRes.data) {
        const item = individualRes.data;
        if (isPropertyBasicDetailsShape(item)) {
          const normalized = normalizePropertyBasicDetails(item);
          propertyBasicDetailsCache.set(propertyId, { data: normalized, timestamp: Date.now() });
          return normalized;
        }
      }
    } catch (_e) {
      // ignore
    }

    return null;
  })();

  inFlightBasicDetails.set(propertyId, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightBasicDetails.delete(propertyId);
  }
}

/* ---------------- UPDATE PROPERTY BASIC DETAILS ---------------- */
export async function updatePropertyBasicDetails(
  propertyId: number,
  payload: UpdatePropertyBasicDetailsDto
): Promise<ActionResult<null>> {
  invalidatePropertyBasicDetailsCache(propertyId);
  const response = await apiClient.put<ActionResult<null>>(
    `/Property/${propertyId}/basic-details`,
    payload
  );
  const t = await getTranslations('quickDataEntry');
  return handleApiResponse(response, t('property.errors.updatePropertyBasicDetails'));
}

export async function getWingMaster(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<WingItem[]> {
  const cacheKey = `wings:${pageNumber}:${pageSize}:${searchTerm || ''}`;
  const cached = getCachedMaster<WingItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    params.append('PageSize', pageSize.toString());
    if (searchTerm?.trim()) {
      params.append('SearchTerm', searchTerm.trim());
    }
    params.append('PageNo', pageNumber.toString());
    const response = await apiClient.get<unknown>(`/Wing?${params.toString()}`);
    if (!response.success || !response.data) return [];
    const rootData = response.data;
    const rawList = Array.isArray(rootData)
      ? rootData
      : (typeof rootData === 'object' && rootData !== null && 'items' in rootData && Array.isArray((rootData as { items: unknown }).items))
        ? (rootData as { items: unknown[] }).items
        : [];
    const result = rawList.filter(isWingShape).map(normalizeWing);
    if (result.length > 0) setCachedMaster(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

export async function getMoujaMaster(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<MoujaItem[]> {
  const cacheKey = `mouja:${pageNumber}:${pageSize}:${searchTerm || ''}`;
  const cached = getCachedMaster<MoujaItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    params.append('PageSize', pageSize.toString());
    if (searchTerm?.trim()) {
      params.append('SearchTerm', searchTerm.trim());
    }
    params.append('PageNo', pageNumber.toString());
    const response = await apiClient.get<unknown>(`/Mouja?${params.toString()}`);
    if (!response.success || !response.data) return [];
    const rootData = response.data;
    const rawList = Array.isArray(rootData)
      ? rootData
      : (typeof rootData === 'object' && rootData !== null && 'items' in rootData && Array.isArray((rootData as { items: unknown }).items))
        ? (rootData as { items: unknown[] }).items
        : [];
    const result = rawList.filter(isMoujaShape).map(normalizeMouja);
    if (result.length > 0) setCachedMaster(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

/** Fetches CV tax details for a property. */
export async function getTaxDetailsCvByPropertyId(
  propertyId: number
): Promise<{ propertyId: number; taxAmounts: Record<string, number | undefined> }> {
  const response = await apiClient.get<TaxDetailsApiResponse>(
    `/Property/${propertyId}/tax-details-cv`
  );
  const t = await getTranslations('quickDataEntry');
  return handleApiResponse(response, t('property.errors.fetchCvTaxDetails')).items;
}

export async function getTaxZones(
  pageNumber: number = 1,
  pageSize: number = 100,
  searchTerm?: string
): Promise<TaxZoneItem[]> {
  const cacheKey = `taxZones:${pageNumber}:${pageSize}:${searchTerm || ''}`;
  const cached = getCachedMaster<TaxZoneItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    params.append('PageSize', pageSize.toString());
    if (searchTerm?.trim()) {
      params.append('SearchTerm', searchTerm.trim());
    }
    params.append('PageNo', pageNumber.toString());
    const response = await apiClient.get<unknown>(`/TaxZone?${params.toString()}`);
    if (!response.success || !response.data) return [];
    const rootData = response.data;
    const rawList = Array.isArray(rootData)
      ? rootData
      : (typeof rootData === 'object' && rootData !== null && 'items' in rootData && Array.isArray((rootData as { items: unknown }).items))
        ? (rootData as { items: unknown[] }).items
        : [];
    const result = rawList.filter(isTaxZoneShape).map(normalizeTaxZone);
    if (result.length > 0) setCachedMaster(cacheKey, result);
    return result;
  } catch {
    return [];
  }
}

/* ---------------- DELETE ALL DETAILS BY PROPERTY ID ---------------- */
export async function deletePropertyDetails(propertyId: number): Promise<ActionResult<null>> {
  invalidatePropertyBasicDetailsCache(propertyId);
  const response = await apiClient.delete<ActionResult<null>>(
    `/DataEntry/ByPropertyId/${propertyId}`
  );
  const t = await getTranslations('quickDataEntry');
  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || 'Unknown error',
      t('property.errors.deletePropertyDetails')
    );
  }
  // DELETE may return 204 No Content; when the backend provides an
  // ActionResult, preserve it.
  return response.data ?? { success: true, data: null };
}
