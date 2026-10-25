'use server';

/**
 * Grievance AI Server Actions (Layer 3 - Next.js RPC)
 * Path: src/lib/actions/grievance/citizen/grievance-ai.actions.ts
 *
 * Exposes server-side RPC functions for Gemini AI vision analysis & description refinement.
 */

import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types/common.types';
import type { GrievanceAiAnalysisDto } from '@/types/grievance/grievance-ai.types';
import { grievanceAiService } from '@/lib/api/grievance/citizen/grievance-ai.service';
import { isAccessTokenExpired } from '@/lib/utils/jwt-expiry';

async function getSessionToken(): Promise<string | undefined> {
  try {
    const store = await cookies();
    const citizenToken = store.get('citizen_token')?.value;
    if (citizenToken && !isAccessTokenExpired(citizenToken)) return citizenToken;
    const authToken = store.get('auth_token')?.value;
    if (authToken && !isAccessTokenExpired(authToken)) return authToken;
  } catch {}
  return undefined;
}

/**
 * 1. AI Vision Analysis from In-Memory Uploaded Files: POST /api/grievance-ai/scan-image
 */
export async function scanGrievanceAiImagesAction(
  formData: FormData
): Promise<ApiResponse<GrievanceAiAnalysisDto>> {
  if (!formData) {
    return { success: false, message: 'Please provide at least one image file for AI scanning' };
  }

  // File size and count guards (max 5 photos, <= 5MB each)
  const files = formData.getAll('photos');
  if (files.length > 5) {
    return { success: false, message: 'Maximum 5 photos allowed for AI analysis' };
  }
  for (const entry of files) {
    if (typeof entry === 'object' && entry !== null && 'size' in entry) {
      const file = entry as File;
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, message: 'Each image must be 5MB or smaller' };
      }
      if (file.type && !file.type.startsWith('image/')) {
        return { success: false, message: 'Only image files (JPEG, PNG, WebP) are supported' };
      }
    }
  }

  const token = await getSessionToken();
  return grievanceAiService.scanImages(formData, token);
}

/**
 * 2. AI Vision Analysis from Photo ID(s)
 */
export async function generateGrievanceAiFromPhotosAction(
  photoIds: number[]
): Promise<ApiResponse<GrievanceAiAnalysisDto>> {
  if (!photoIds || photoIds.length === 0) {
    return { success: false, message: 'Please provide at least one photo for AI analysis' };
  }

  const token = await getSessionToken();
  return grievanceAiService.generateFromPhotos(photoIds, token);
}

/**
 * 3. AI Description Refinement from Raw Citizen Text: POST /api/grievance-ai/refine-description
 */
export async function refineGrievanceDescriptionAction(
  rawDescription: string
): Promise<ApiResponse<GrievanceAiAnalysisDto>> {
  const clean = rawDescription?.trim() || '';
  if (!clean || clean.length < 3) {
    return { success: false, message: 'Please provide at least 3 characters to refine' };
  }

  const token = await getSessionToken();
  return grievanceAiService.refineDescription(clean, token);
}
