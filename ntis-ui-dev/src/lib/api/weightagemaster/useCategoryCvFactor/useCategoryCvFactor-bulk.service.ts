import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse } from '@/types/common.types';
import { 
  BulkUseFactorCVMasterCreate,
  BulkUseFactorCVMasterUpdate,
} from '@/types/useCategoryCvFactor.types';
import { ApiError } from '../../../utils/api';
import { getErrorStatusCode } from '../../../utils/backend-error-detection';

// ---------------------------------------------
// Use Factor CV Master Bulk Operation Services
// ---------------------------------------------

/**
 * Bulk creates UseFactorCVMaster records (POST)
 * @param payload The creation payload containing an array of records
 * @returns Promise resolving to ApiResponse containing the created records
 */
export async function bulkCreateUseFactorCVMaster(
  payload: BulkUseFactorCVMasterCreate
): Promise<ApiResponse<unknown>> {
  try {
    if (!payload || payload.length === 0) {
      const t = await getTranslations('useCategoryFactorMaster');
      throw new ApiError(400, t('errors.payloadRequired'), "Validation");
    }

    const requestPayload = payload.map((item) => ({
      isActive: item.isActive,
      createdBy: item.createdBy ?? 1,
      typeOfUseId: item.typeOfUseId,
      subTypeOfUseId: item.subTypeOfUseId,
      factor: Number(item.factor),
      yearRangeCVId: item.yearRangeCVId,
    }));


    const response = await apiClient.post<unknown>('/UseFactorCVMaster/bulk', requestPayload);

    if (!response.success) {
      const t = await getTranslations('useCategoryFactorMaster');
      throw new ApiError(
        response.statusCode || 500,
        response.error || t('errors.bulkCreateFailed'),
        'Bulk create Use Factor CV Master failed'
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(500, t('errors.bulkCreateFailed'), error instanceof Error ? error.message : String(error));
  }
}

/**
 * Bulk updates UseFactorCVMaster records (PUT)
 * @param payload The update payload containing an array of records
 * @returns Promise resolving to void on success
 */
export async function bulkUpdateUseFactorCVMaster(
  payload: BulkUseFactorCVMasterUpdate
): Promise<void> {
  try {
    const t = await getTranslations('useCategoryFactorMaster');

    if (!payload || payload.length === 0) {
      throw new ApiError(400, t('errors.payloadRequired'), "Validation");
    }

    const requestPayload = payload.map((item) => ({
      id: item.id,
      data: {
        isActive: item.data.isActive,
        updatedBy: item.data.updatedBy ?? 1,
        typeOfUseId: item.data.typeOfUseId,
        subTypeOfUseId: item.data.subTypeOfUseId,
        factor: Number(item.data.factor),
        yearRangeCVId: item.data.yearRangeCVId,
      }
    }));


    const response = await apiClient.put<unknown>(
      '/UseFactorCVMaster/bulk',
      requestPayload
    );


    if (!response.success) {
      const errorMsg = response.error || '';
      const statusCode = getErrorStatusCode(errorMsg);

      throw new ApiError(
        statusCode,
        response.error || t('errors.bulkUpdateFailed'),
        'Bulk update Use Factor CV Master failed'
      );
    }

  } catch (error) {
    if (error instanceof ApiError) throw error;
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(500, t('errors.bulkUpdateFailed'), error instanceof Error ? error.message : String(error));
  }
}
