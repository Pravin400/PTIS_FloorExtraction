import { apiClient } from '@/services/api.service';
import { getTranslations } from 'next-intl/server';
import type { ApiResponse } from '@/types/common.types';
import {
  UseFactorCVMasterUpdate,
  UseFactorCVMasterCreate,
  TypeOfUseCreate,
  TypeOfUseUpdate,
  SubTypeOfUseCreate,
  SubTypeOfUseUpdate,
} from '@/types/asset-masters/useCategoryCvFactor.types';
import { ApiError } from '@/lib/utils/api';
import { isBackendErrorMessage, getErrorStatusCode } from '@/lib/utils/backend-error-detection';

// ---------------------------------------------
// Use Factor CV Master Mutation Services
// ---------------------------------------------

/**
 * Updates an existing UseFactorCVMaster record
 * @param id      The ID of the record to update
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
      updatedBy: payload.updatedBy,
      typeOfUseId: payload.typeOfUseId,
      subTypeOfUseId: payload.subTypeOfUseId,
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };

    const response = await apiClient.put<unknown>(
      `/asset-management/use-factor-cv/${encodeURIComponent(String(id))}`,
      requestPayload
    ).then(r =>
      r.success ? r : apiClient.put<unknown>(`/UseFactorCVMaster/${encodeURIComponent(String(id))}`, requestPayload)
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
        throw new ApiError(statusCode, message, 'Update Use Factor CV Master failed');
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
      createdBy: payload.createdBy,
      typeOfUseId: payload.typeOfUseId,
      subTypeOfUseId: payload.subTypeOfUseId,
      factor: Number(payload.factor),
      yearRangeCVId: payload.yearRangeCVId,
    };

    const response = await apiClient.post<unknown>('/asset-management/use-factor-cv', requestPayload).then(r =>
      r.success ? r : apiClient.post<unknown>('/UseFactorCVMaster', requestPayload)
    );

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
  if (id !== undefined && (!id || id <= 0)) throw new ApiError(400, t('errors.invalidId'), "Validation");
  if (!payload.typeOfUseId || payload.typeOfUseId <= 0) throw new ApiError(400, t('errors.typeOfUseIdRequired'), "Validation");
  if (!payload.yearRangeCVId || payload.yearRangeCVId <= 0) throw new ApiError(400, t('errors.yearRangeCVIdRequired'), "Validation");
  if (payload.factor !== undefined && payload.factor < 0) throw new ApiError(400, t('errors.factorNegative'), "Validation");
}

// ---------------------------------------------
// Type of Use CRUD Services
// ---------------------------------------------

/**
 * Creates a new TypeOfUse record
 * @param payload The creation payload
 * @returns Promise resolving to ApiResponse containing the created record
 */
export async function createTypeOfUse(
  payload: TypeOfUseCreate
): Promise<ApiResponse<unknown>> {
  return apiClient.post<unknown>('/asset-management/asset-type-of-use', payload).then(r =>
    r.success ? r : apiClient.post<unknown>('/TypeOfUse', payload)
  );
}

/**
 * Updates an existing TypeOfUse record
 * @param id      The ID of the record to update
 * @param payload The update payload
 * @returns Promise resolving to void on success
 */
export async function updateTypeOfUse(
  id: number,
  payload: TypeOfUseUpdate
): Promise<void> {
  const response = await apiClient.put<unknown>(
    `/asset-management/asset-type-of-use/${id}`,
    payload
  ).then(r =>
    r.success ? r : apiClient.put<unknown>(`/TypeOfUse/${id}`, payload)
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || 'Update failed',
      'Update TypeOfUse failed'
    );
  }
}

/**
 * Deletes a TypeOfUse record
 * @param id The ID of the record to delete
 * @returns Promise resolving to void on success
 */
export async function deleteTypeOfUse(id: number): Promise<void> {
  const response = await apiClient.delete<unknown>(
    `/asset-management/asset-type-of-use/${id}`
  ).then(r =>
    r.success ? r : apiClient.delete<unknown>(`/TypeOfUse/${id}`)
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || 'Delete failed',
      'Delete TypeOfUse failed'
    );
  }
}

// ---------------------------------------------
// Sub Type of Use CRUD Services
// ---------------------------------------------

/**
 * Creates a new SubTypeOfUse record
 * @param payload The creation payload
 * @returns Promise resolving to ApiResponse containing the created record
 */
export async function createSubTypeOfUse(
  payload: SubTypeOfUseCreate
): Promise<ApiResponse<unknown>> {
  return apiClient.post<unknown>('/asset-management/asset-sub-type-of-use', payload).then(r =>
    r.success ? r : apiClient.post<unknown>('/SubTypeOfUse', payload)
  );
}

/**
 * Updates an existing SubTypeOfUse record
 * @param id      The ID of the record to update
 * @param payload The update payload
 * @returns Promise resolving to void on success
 */
export async function updateSubTypeOfUse(
  id: number,
  payload: SubTypeOfUseUpdate
): Promise<void> {
  const response = await apiClient.put<unknown>(
    `/asset-management/asset-sub-type-of-use/${id}`,
    payload
  ).then(r =>
    r.success ? r : apiClient.put<unknown>(`/SubTypeOfUse/${id}`, payload)
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || 'Update failed',
      'Update SubTypeOfUse failed'
    );
  }
}

/**
 * Deletes a SubTypeOfUse record
 * @param id The ID of the record to delete
 * @returns Promise resolving to void on success
 */
export async function deleteSubTypeOfUse(id: number): Promise<void> {
  const response = await apiClient.delete<unknown>(
    `/asset-management/asset-sub-type-of-use/${id}`
  ).then(r =>
    r.success ? r : apiClient.delete<unknown>(`/SubTypeOfUse/${id}`)
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || 'Delete failed',
      'Delete SubTypeOfUse failed'
    );
  }
}
