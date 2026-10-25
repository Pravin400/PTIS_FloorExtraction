import { IRateMaster, IZoneDescription, RateCategory, IBackendRateMaster } from "@/types/RVRateMaster";
import { PagedResponse } from "@/types/RVRateMaster";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from 'next-intl/server';

import { transformBackendRatesToMatrix } from "./rvRateMaster.helpers";

/**
 * Get rate master table columns configuration
 */
export async function getRateMasterColumns(constructionTypes: RateCategory[]) {
  return [
    { id: "zoneNo", label: "Zone No" },
    { id: "zoneDescription", label: "Zone Description" },
    ...constructionTypes.map(type => ({
      id: (type.constructionCode || type.constructionId).toLowerCase(),
      label: `${type.constructionCode || type.constructionId} (₹/Sq.mtr)`,
      title: type.description
    }))
  ];
}

/**
 * Get all rate master data from backend (unpaged)
 */
export async function getRateMasterTableData(
  constructionTypes: RateCategory[],
  zoneDescriptions: IZoneDescription[]
): Promise<IRateMaster[]> {
  try {
    const response = await apiClient.get<PagedResponse<IBackendRateMaster>>(`/Rate?PageSize=-1`);
    if (!response.success) {
      const t = await getTranslations('ptis_RVRateMaster');
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || t('rvRateMasterErrors.fetchRateMasterDataFailed'),
        'Get rate master data failed'
      );
    }
    if (!response.data) {
      const t = await getTranslations('ptis_RVRateMaster');
      throw new ApiError(
        500,
        t('rvRateMasterErrors.noDataReceived'),
        'Invalid response format'
      );
    }

    const data = response.data;
    const backendData: IBackendRateMaster[] = data.items || [];
    return transformBackendRatesToMatrix(backendData, constructionTypes, zoneDescriptions, false);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const t = await getTranslations('rvRateMasterErrors');
    throw new ApiError(500, error instanceof Error ? error.message : t('errorsResponse.unknownError'), 'Get rate master data failed');
  }
}

/**
 * Get rate master record by ID
 */
export async function getRateMasterById(
  id: string,
  constructionTypes: RateCategory[],
  zoneDescriptions: IZoneDescription[]
): Promise<IRateMaster | null> {
  try {
    const allData = await getRateMasterTableData(constructionTypes, zoneDescriptions);
    return allData.find((item) => item.id === id) || null;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const t = await getTranslations('rvRateMasterErrors');
    throw new ApiError(500, error instanceof Error ? error.message : t('errorsResponse.unknownError'), `Get rate master ${id} failed`);
  }
}
