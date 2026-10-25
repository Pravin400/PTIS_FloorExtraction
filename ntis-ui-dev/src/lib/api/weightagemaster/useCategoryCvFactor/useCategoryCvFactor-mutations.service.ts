import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse } from '@/types/common.types';
import { 
  UseFactorCVMasterUpdate,
  UseFactorCVMasterCreate,
} from '@/types/useCategoryCvFactor.types';
import { ApiError } from '../../../utils/api';
import { isBackendErrorMessage, getErrorStatusCode } from '../../../utils/backend-error-detection';

// ---------------------------------------------
// Use Factor CV Master Mutation Services
// ---------------------------------------------

/**
 * Updates an existing UseFactorCVMaster record
 * @param id The ID of the record to update
 * @param payload The update payload
 * @returns Promise resolving to void on success
 */
export async function updateUseFactorCVMaster(
  id: number,
  payload: UseFactorCVMasterUpdate
): Promise<void> {
  try {
    const t = await getTranslations('useCategoryFactorMaster');
    
    // Validate required fields
    await validateUseFactorCVMasterPayload(payload, id);

    const requestPayload = {
      isActive: payload.isActive,
      updatedBy: payload.updatedBy ?? 1,
      typeOfUseId: payload.typeOfUseId,
      subTypeOfUseId: payload.subTypeOfUseId,
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };


    const response = await apiClient.put<unknown>(
      `/UseFactorCVMaster/${encodeURIComponent(String(id))}`,
      requestPayload
    );

    if (!response.success) {
      const errorMsg = response.error || '';
      const statusCode = getErrorStatusCode(errorMsg);

      throw new ApiError(
        statusCode,
        response.error || t('errors.updateFailed'),
        'Update Use Factor CV Master failed'
      );
    }

    const responseData = response.data as Record<string, unknown> | null;
    if (responseData && typeof responseData === 'object') {
      const message = (responseData.message || responseData.error) as string | undefined;

      if (message && isBackendErrorMessage(message)) {
        const statusCode = getErrorStatusCode(message);
        throw new ApiError(
          statusCode,
          message,
          'Update Use Factor CV Master failed'
        );
      }
    }

  } catch (error) {
    if (error instanceof ApiError) throw error;
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(500, t('errors.updateFailed'), error instanceof Error ? error.message : String(error));
  }
}

/**
 * Creates a new UseFactorCVMaster record (POST)
 * @param payload The creation payload
 * @returns Promise resolving to ApiResponse containing the created record
 */
export async function createUseFactorCVMaster(
  payload: UseFactorCVMasterCreate
): Promise<ApiResponse<unknown>> {
  try {
    const t = await getTranslations('useCategoryFactorMaster');

    await validateUseFactorCVMasterPayload(payload);

    const requestPayload = {
      isActive: payload.isActive,
      createdBy: payload.createdBy ?? 1,
      typeOfUseId: payload.typeOfUseId,
      subTypeOfUseId: payload.subTypeOfUseId,
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };


    const response = await apiClient.post<unknown>('/UseFactorCVMaster', requestPayload);
    
    if (!response.success) {
      throw new ApiError(
        response.statusCode || 500,
        response.error || t('errors.createFailed'),
        'Create Use Factor CV Master failed'
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const t = await getTranslations('useCategoryFactorMaster');
    throw new ApiError(500, t('errors.createFailed'), error instanceof Error ? error.message : String(error));
  }
}

/**
 * Shared validation logic for UseFactorCVMaster payloads
 */
async function validateUseFactorCVMasterPayload(
  payload: UseFactorCVMasterCreate | UseFactorCVMasterUpdate,
  id?: number
): Promise<void> {
  const t = await getTranslations('useCategoryFactorMaster');
  
  if (id !== undefined && (!id || id <= 0)) {
    throw new ApiError(400, t('errors.invalidId'), "Validation");
  }
  if (!payload.typeOfUseId || payload.typeOfUseId <= 0) {
    throw new ApiError(400, t('errors.typeOfUseIdRequired'), "Validation");
  }
  if (!payload.yearRangeCVId || payload.yearRangeCVId <= 0) {
    throw new ApiError(400, t('errors.yearRangeCVIdRequired'), "Validation");
  }
  if (payload.factor !== undefined && payload.factor < 0) {
    throw new ApiError(400, t('errors.factorNegative'), "Validation");
  }
}
