'use server';

/**
 * Grievance Photo Server Actions (Layer 2 - Next.js RPC)
 * Path: src/lib/actions/grievance/citizen/grievance-photo.actions.ts
 *
 * Delegates all photo API calls to grievancePhotoService.
 */

import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievancePhotoItem,
  UploadGrievancePhotoResponse,
  UploadMultipleGrievancePhotosResponse,
} from '@/types/grievance/grievance-photo.types';
import { grievancePhotoService } from '@/lib/api/grievance/citizen/grievance-photo.service';
import { isAccessTokenExpired } from '@/lib/utils/jwt-expiry';
import { createGrievanceUploadServiceToken } from '@/lib/utils/grievance/grievance-service-token';

async function getSessionToken(formData?: FormData): Promise<string | undefined> {
  // 1. Direct FormData token (fail-safe for client-side explicit token passing)
  if (formData) {
    const formToken = (formData.get('Token') || formData.get('token') || formData.get('SessionToken')) as string | null;
    if (formToken && formToken.trim() && !isAccessTokenExpired(formToken.trim())) {
      return formToken.trim();
    }
  }

  // 2. Cookie store inspection with decodeURIComponent
  try {
    const store = await cookies();
    const rawCitizenToken = store.get('citizen_token')?.value?.trim();
    const citizenToken = rawCitizenToken ? decodeURIComponent(rawCitizenToken) : undefined;
    if (citizenToken && !isAccessTokenExpired(citizenToken)) return citizenToken;

    const rawAuthToken = store.get('auth_token')?.value?.trim();
    const authToken = rawAuthToken ? decodeURIComponent(rawAuthToken) : undefined;
    if (authToken && !isAccessTokenExpired(authToken)) return authToken;

    const rawFallback = store.get('token')?.value?.trim() || store.get('access_token')?.value?.trim();
    const fallbackToken = rawFallback ? decodeURIComponent(rawFallback) : undefined;
    if (fallbackToken && !isAccessTokenExpired(fallbackToken)) return fallbackToken;

    return undefined;
  } catch {
    return undefined;
  }
}


async function resolveEffectiveUploadToken(formData?: FormData): Promise<string> {
  const directToken = await getSessionToken(formData);

  // If a valid direct token was supplied via FormData or session cookies, use it directly
  if (directToken) {
    return directToken;
  }

  // Fallback: If no token was found in cookies or FormData, mint a BFF token as last resort
  let citizenId: number | undefined;
  try {
    const store = await cookies();
    const rawId = store.get('citizen_id')?.value;
    if (rawId && !isNaN(Number(rawId)) && Number(rawId) > 0) {
      citizenId = Number(rawId);
    }
  } catch {}

  return createGrievanceUploadServiceToken(citizenId || 1);
}

/**

* 1. Upload a Grievance Evidence Photo to Backend
 */
export async function uploadGrievancePhotoAction(
  formData: FormData
): Promise<ApiResponse<UploadGrievancePhotoResponse>> {
  try {
    const token = await resolveEffectiveUploadToken(formData);
    const result = await grievancePhotoService.uploadPhoto(formData, token);
    return result;
  } catch (error) {
    console.error('[uploadGrievancePhotoAction] error:', error);
    return {
      success: false,
      message: (error as Error).message || 'Failed to upload grievance photo',
    };
  }
}

/**
 * 2. Upload Multiple Grievance Photos in Batch
 */
export async function uploadMultipleGrievancePhotosAction(
  formData: FormData
): Promise<ApiResponse<UploadMultipleGrievancePhotosResponse>> {
  try {
    const token = await resolveEffectiveUploadToken(formData);
    const result = await grievancePhotoService.uploadMultiplePhotos(formData, token);
    return result;
  } catch (error) {
    console.error('[uploadMultipleGrievancePhotosAction] error:', error);
    return {
      success: false,
      message: (error as Error).message || 'Failed to upload multiple photos',
    };
  }
}

/**
 * 3. Fetch all Photos for a Grievance Application
 */
export async function fetchGrievancePhotosAction(
  grievanceApplicationId: number
): Promise<ApiResponse<GrievancePhotoItem[]>> {
  try {
    return await grievancePhotoService.getPhotosByGrievanceId(grievanceApplicationId);
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || 'Failed to fetch grievance photos',
      data: [],
    };
  }
}

/**
 * 4. Delete a Grievance Photo
 */
export async function deleteGrievancePhotoAction(
  photoId: number
): Promise<ApiResponse<boolean>> {
  try {
    return await grievancePhotoService.deletePhoto(photoId);
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || 'Failed to delete photo',
      data: false,
    };
  }
}
