import { fetchWithCertSupport, extractData, getErrorFormattedMessage } from '@/lib/api/ptis/tab/base-api';
import type {
  OldDetailsData,
  OldFloorDetailsData,
  OldTaxesData,
  MappedPropertyItem,
} from '@/types/ptis.types';
import {
  mapIndividualOldDetails,
  mapIndividualOldFloorDetails,
} from './individual-old-details.mapper';

export { mapIndividualOldDetails, mapIndividualOldFloorDetails };

/**
 * Fetches basic old details for an individual property.
 */
export async function fetchIndividualOldDetails(
  propertyId: number | string
): Promise<{ success: boolean; data?: OldDetailsData; error?: string }> {
  try {
    const endpoint = `/Property/${encodeURIComponent(propertyId)}/old-details`;
    const response = await fetchWithCertSupport<unknown>(endpoint);

    if (!response.success) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'Old details not found'),
      };
    }

    const rawData = extractData<unknown>(response.data);
    const dataToMap = rawData ?? response.data;
    if (!dataToMap) return { success: false, error: 'Old details not found' };
    return { success: true, data: mapIndividualOldDetails(dataToMap) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error fetching old details' };
  }
}

/**
 * Fetches historical floor details for an individual property.
 */
export async function fetchIndividualOldFloorDetails(
  propertyId: number | string
): Promise<{ success: boolean; data?: OldFloorDetailsData[]; error?: string }> {
  try {
    const endpoint = `/Property/${encodeURIComponent(propertyId)}/floor-details-old`;
    const response = await fetchWithCertSupport<unknown>(endpoint);

    if (!response.success) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'Old floor details not found'),
      };
    }

    const rawItems = extractData<unknown>(response.data);
    const dataToMap = rawItems ?? response.data;
    return { success: true, data: mapIndividualOldFloorDetails(dataToMap) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch old floor details' };
  }
}

/**
 * Fetches historical taxes details for an individual property.
 */
export async function fetchIndividualOldTaxesDetails(
  propertyId: number | string
): Promise<{ success: boolean; data?: OldTaxesData; error?: string }> {
  try {
    const endpoint = `/Property/${encodeURIComponent(propertyId)}/old-taxes-details`;
    const response = await fetchWithCertSupport<unknown>(endpoint);

    if (!response.success) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'Old tax details not found'),
      };
    }

    let rawData = extractData<unknown>(response.data) ?? response.data;
    if (Array.isArray(rawData)) {
      rawData = rawData[0] || null;
    }
    return rawData
      ? { success: true, data: rawData as OldTaxesData }
      : { success: false, error: 'Old tax details not found' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch old taxes details' };
  }
}

/**
 * Fetches mapped old properties for an individual property.
 */
export async function fetchIndividualMappedProperties(
  propertyId: number | string
): Promise<{ success: boolean; data?: MappedPropertyItem[]; error?: string }> {
  try {
    const endpoint = `/PropertyMapMaster/mapped-properties?PropertyId=${encodeURIComponent(propertyId)}&PageSize=-1`;
    const response = await fetchWithCertSupport<unknown>(endpoint);

    if (!response.success) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'Mapped properties not found'),
      };
    }

    let rawData = extractData<unknown>(response.data) ?? response.data;
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      const obj = rawData as Record<string, unknown>;
      if (Array.isArray(obj.items)) rawData = obj.items;
      else if (Array.isArray(obj.data)) rawData = obj.data;
    }

    if (!rawData || !Array.isArray(rawData)) {
      return { success: true, data: [] };
    }

    return { success: true, data: rawData as MappedPropertyItem[] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch mapped properties' };
  }
}

