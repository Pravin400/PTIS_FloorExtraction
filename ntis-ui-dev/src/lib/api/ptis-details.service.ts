import { apiClient } from '@/services/api.service';
import type {
  OldDetailsData,
  OldFloorDetailsData,
  PropertyBasicDetailsApiResponse,
} from '@/types/ptis.types';
import type { OldDetailsApiResponse, OldFloorDetailsApiResponse } from '@/types/ptis-page.types';

export async function getOldDetails(propertyId: string | number): Promise<{
  success: boolean;
  data?: OldDetailsData;
  error?: string;
}> {
  const response = await apiClient.get<Record<string, unknown>>(
    `/Property/${propertyId}/old-details`,
    {
      cache: 'no-store',
    }
  );

  if (!response.success || !response.data) {
    return { success: false, error: response.error || 'Old details not found' };
  }

  let data: OldDetailsApiResponse | undefined;

  if (response.data.items) {
    if (Array.isArray(response.data.items)) {
      data = response.data.items[0] as OldDetailsApiResponse | undefined;
    } else if (typeof response.data.items === 'object' && response.data.items !== null) {
      data = response.data.items as OldDetailsApiResponse;
    }
  } else if ('items' in response.data && !response.data.items) {
    return { success: false, error: 'Old details data not found' };
  } else {
    data = response.data as unknown as OldDetailsApiResponse;
  }

  if (!data) {
    return { success: false, error: 'Old details data not found' };
  }

  return {
    success: true,
    data: {
      oldZoneName: data.oldZoneNo || '',
      oldWardNo: data.oldWardNo || '',
      oldPropertyNo: data.oldPropertyNo || '',
      oldPartitionNo: data.oldPartitionNo || '',
      oldEGovernanceNo: data.oldEgovNo || '',
      oldPlotArea: data.oldPlotArea?.toString() || '',
      oldPlotNo: data.oldPlotNo || '',
      oldRV: data.oldRV?.toString() || '',
      oldCV: data.oldCV?.toString() || '',
      oldALV: data.oldALV?.toString() || '',
      oldPropertyTax: '',
      oldTotalTax: data.oldTotalTax?.toString() || '',
      oldConstructionYear: data.oldConstructionYear || '',
      oldCarpetAreaSqMeter: data.oldCarpetAreaSqMeter?.toString() || '',
      oldCarpetAreaSqFeet: data.oldCarpetAreaSqFeet?.toString() || '',
      oldConstructionTypeId: data.oldConstructionTypeId || '',
      oldTypeOfUseId: data.oldTypeOfUseId || '',
    },
  };
}

export async function getOldFloorDetails(propertyId: string | number): Promise<{
  success: boolean;
  data?: OldFloorDetailsData[];
  error?: string;
}> {
  const response = await apiClient.get<Record<string, unknown>>(
    `/Property/${propertyId}/old-floor-details`,
    {
      cache: 'no-store',
    }
  );

  if (!response.success || !response.data) {
    return { success: false, error: response.error || 'Old floor details not found' };
  }

  const items: OldFloorDetailsApiResponse[] =
    (response.data.items as OldFloorDetailsApiResponse[]) ??
    (Array.isArray(response.data) ? (response.data as OldFloorDetailsApiResponse[]) : []);

  if (!Array.isArray(items)) {
    return { success: false, error: 'Invalid response format: items is not an array' };
  }

  return {
    success: true,
    data: items.map((item: OldFloorDetailsApiResponse) => ({
      wardPropPartNo: '',
      floor: item.floor || '',
      subFloor: '', // Not available in API response
      assessmentYear: '', // Not available in API response
      year: item.year || '',
      constructionType: item.constructionType || '',
      typeOfUse: item.typeOfUse || '',
      subType: '', // Not available in API response
      carpetArea: item.carpetAreaSqft && item.carpetAreaSqmtr 
        ? `${item.carpetAreaSqft} / ${item.carpetAreaSqmtr}` 
        : '',
      builtupArea: '', // Not available in API response
    })),
  };
}

export async function getPropertyBasicDetails(propertyId: number): Promise<{
  success: boolean;
  data?: PropertyBasicDetailsApiResponse;
  error?: string;
}> {
  const endpoint = `/Property/${propertyId}/basic-details`;
  const response = await apiClient.get<PropertyBasicDetailsApiResponse>(endpoint, {
    cache: 'no-store',
  });

  if (!response.success || !response.data) {
    return { success: false, error: response.error || 'Failed to fetch basic details' };
  }

  const actualData =
    (
      response.data as PropertyBasicDetailsApiResponse & {
        items?: PropertyBasicDetailsApiResponse;
      }
    ).items ?? response.data;

  return { success: true, data: actualData };
}
