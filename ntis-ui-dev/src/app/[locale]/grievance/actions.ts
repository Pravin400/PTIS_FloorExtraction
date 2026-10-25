'use server';

import { revalidatePath } from 'next/cache';
import type { ApiResponse } from '@/types/common.types';
import type { Grievance, CreateGrievanceDto } from '@/types/grievance';
import {
  citizenGrievanceService,
  adminGrievanceService,
  sharedGrievanceService,
} from '@/lib/api/grievance';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { createLogger } from '@/lib/utils/server-logger';
import { submitGrievanceApplicationAction as submitGrievanceImpl } from '@/lib/actions/grievance/citizen/grievance-submission.actions';
import type {
  SubmitGrievanceApplicationPayload,
  GrievanceApplicationResult,
} from '@/types/grievance';
import {
  uploadGrievancePhotoAction as uploadPhotoImpl,
  uploadMultipleGrievancePhotosAction as uploadMultiplePhotosImpl,
  fetchGrievancePhotosAction as fetchPhotosImpl,
} from '@/lib/actions/grievance/citizen/grievance-photo.actions';
import type {
  GrievancePhotoItem,
  UploadGrievancePhotoResponse,
  UploadMultipleGrievancePhotosResponse,
} from '@/types/grievance/grievance-photo.types';

const logger = createLogger('grievance/server-actions');

export async function getAllGrievances(): Promise<ApiResponse<Grievance[]>> {
  try {
    return await adminGrievanceService.getAllGrievances();
  } catch (error) {
    logger.error('Failed to get all grievances', { error: (error as Error).message });
    return { success: false, data: [], message: 'Failed to fetch grievances' };
  }
}

export async function getGrievanceById(id: string): Promise<ApiResponse<Grievance | null>> {
  try {
    return await sharedGrievanceService.getGrievanceById(id);
  } catch (error) {
    logger.error('Failed to get grievance by ID', { id, error: (error as Error).message });
    return { success: false, data: null, message: 'Failed to fetch grievance details' };
  }
}

/**
 * @deprecated Legacy submit handler calling `/Grievance`. 
 * Use `submitGrievanceApplicationAction` from `@/lib/actions/grievance/citizen` instead, 
 * which connects to the canonical `/GrievanceApplication/SaveGrievanceApplication` endpoint.
 */
export async function createGrievance(
  dto: CreateGrievanceDto
): Promise<ApiResponse<{ grievance: Grievance; trackingId: string }>> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    const result = await citizenGrievanceService.submitGrievance({
      ...dto,
      reporterId: userId ? String(userId) : undefined,
    });

    if (result.success) {
      revalidatePath('/[locale]/grievance', 'page');
      revalidatePath('/[locale]/grievance/track', 'page');
    }
    return result;
  } catch (error) {
    logger.error('Create grievance action failed', { error: (error as Error).message });
    return { success: false, message: 'Could not register grievance. Please try again.' };
  }
}

export async function updateGrievanceStatus(
  id: string,
  status: string,
  notes?: string
): Promise<ApiResponse<boolean>> {
  try {
    const result = await adminGrievanceService.updateGrievanceStatus(id, status, notes);
    if (result.success) {
      revalidatePath('/[locale]/grievance', 'page');
      revalidatePath('/[locale]/grievance/track', 'page');
    }
    return result;
  } catch (error) {
    logger.error('Update grievance status action failed', { id, status, error: (error as Error).message });
    return { success: false, data: false, message: 'Could not update status' };
  }
}

export async function assignOfficerAction(
  id: string,
  officerId: string
): Promise<ApiResponse<boolean>> {
  try {
    const result = await adminGrievanceService.assignOfficer(id, officerId);
    if (result.success) {
      revalidatePath('/[locale]/grievance', 'page');
      revalidatePath('/[locale]/grievance/track', 'page');
    }
    return result;
  } catch (error) {
    logger.error('Assign officer action failed', { id, officerId, error: (error as Error).message });
    return { success: false, data: false, message: 'Could not assign officer' };
  }
}

export async function submitGrievanceApplicationAction(
  payload: SubmitGrievanceApplicationPayload
): Promise<ApiResponse<GrievanceApplicationResult>> {
  return submitGrievanceImpl(payload);
}

export async function uploadGrievancePhotoAction(
  formData: FormData
): Promise<ApiResponse<UploadGrievancePhotoResponse>> {
  return uploadPhotoImpl(formData);
}

export async function uploadMultipleGrievancePhotosAction(
  formData: FormData
): Promise<ApiResponse<UploadMultipleGrievancePhotosResponse>> {
  return uploadMultiplePhotosImpl(formData);
}

export async function fetchGrievancePhotosAction(
  grievanceApplicationId: number
): Promise<ApiResponse<GrievancePhotoItem[]>> {
  return fetchPhotosImpl(grievanceApplicationId);
}
