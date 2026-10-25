import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import {
  BulkAgeFactorCVMasterCreate,
  BulkAgeFactorCVMasterUpdate
} from '@/types/ageFactorCv.types';
import { ApiError } from '@/lib/utils/api';

/**
 * Bulk creates AgeFactorCVMaster records (POST)
 * @param payload The creation payload containing an array of records
 * @param t Optional translation function for error messages
 * @returns Promise resolving to ApiResponse containing the created records
 */
export async function bulkCreateAgeFactorCVMaster(
  payload: BulkAgeFactorCVMasterCreate,
  t?: (key: string) => string
): Promise<ApiResponse<unknown>> {
  try {
    if (!payload || payload.length === 0) {
      throw new ApiError(400, t ? t('errors.bulkCreateRequired') : 'Valid payload with ageFactors is required for bulk create', 'Validation');
    }

    const requestPayload = payload.map((f) => ({
      isActive: f.isActive,
      createdBy: f.createdBy,
      constructionTypeId: f.constructionTypeId,
      ageFrom: Number(f.ageFrom),
      ageTo: Number(f.ageTo),
      factor: Number(f.factor),
      yearRangeCVId: f.yearRangeCVId,
    }));

    return await apiClient.post<unknown>('/AgeFactorCVMaster/bulk', requestPayload);
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk updates AgeFactorCVMaster records (PUT)
 * @param payload The update payload containing an array of records
 * @param t Optional translation function for error messages
 * @returns Promise resolving to void on success
 */
export async function bulkUpdateAgeFactorCVMaster(
  payload: BulkAgeFactorCVMasterUpdate,
  t?: (key: string) => string
): Promise<void> {
  try {
    if (!payload || payload.length === 0) {
      throw new ApiError(400, t ? t('errors.bulkUpdateRequired') : 'Valid payload with ageFactors is required for bulk update', 'Validation');
    }

    const requestPayload = payload.map((f) => ({
      id: f.id,
      data: {
        ageFactorId: f.data.ageFactorId,
        constructionTypeId: f.data.constructionTypeId,
        ageFrom: Number(f.data.ageFrom),
        ageTo: Number(f.data.ageTo),
        factor: Number(f.data.factor),
        yearRangeCVId: f.data.yearRangeCVId,
        isActive: f.data.isActive,
        updatedBy: f.data.updatedBy,
      }
    }));

    const response = await apiClient.put<unknown>(
      '/AgeFactorCVMaster/bulk',
      requestPayload
    );

    if (!response.success) {
      throw new ApiError(500, response.error || (t ? t('errors.bulkUpdateFailed') : 'Failed to bulk update Age Factor CV Master'), 'Bulk update Age Factor CV Master failed');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk deletes AgeFactorCVMaster records
 * @param ids Array of AgeFactorCV IDs to delete
 * @param t Optional translation function for error messages
 * @returns Promise resolving to ApiResponse
 */
export async function bulkDeleteAgeFactorCVMaster(
  ids: number[],
  t?: (key: string) => string
): Promise<ApiResponse<unknown>> {
  if (!ids || ids.length === 0) {
    throw new ApiError(400, t ? t('errors.bulkDeleteRequired') : 'Valid list of IDs is required for bulk delete', 'Validation');
  }
  return apiClient.delete<unknown>('/AgeFactorCVMaster/bulk', { body: JSON.stringify({ ids }) });
}
