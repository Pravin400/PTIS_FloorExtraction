/**
 * Grievance AI API Service (Layer 4 - Domain Service)
 * Path: src/lib/api/grievance/citizen/grievance-ai.service.ts
 *
 * Built on centralized base `apiClient` (@/services/api.service).
 * Uses apiClient.post() consistently with citizen-auth.service & citizen-grievance.service.
 * Communicates with backend NtisPlatform GrievanceAiController:
 * 1. POST /api/grievance-ai/generate-description/{photoIds}
 * 2. POST /api/grievance-ai/refine-description
 */

import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievanceAiAnalysisDto,
  RefineGrievanceDescriptionRequestDto,
} from '@/types/grievance/grievance-ai.types';

export class GrievanceAiService {
  /**
   * 1. Vision Analysis from In-Memory Files: POST /api/grievance-ai/scan-image
   * Directly scans in-memory uploaded image file(s) (1 to 5 images) via multipart/form-data.
   * Auto-generates department, defect type, and bilingual formal description.
   */
  private async createSafeFormData(formData: FormData): Promise<FormData> {
    const safeFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as File;
        const arrayBuffer = await file.arrayBuffer();
        const mimeType = file.type || 'image/jpeg';
        const rawName = (file as { name?: string }).name;
        const fileName = (rawName && rawName !== 'undefined' && rawName.trim().length > 0)
          ? rawName
          : `scan_${Date.now()}.jpg`;
        if (typeof File !== 'undefined') {
          safeFormData.append(key, new File([arrayBuffer], fileName, { type: mimeType }));
        } else {
          safeFormData.append(key, new Blob([arrayBuffer], { type: mimeType }), fileName);
        }
      } else {
        safeFormData.append(key, value);
      }
    }
    return safeFormData;
  }

  async scanImages(
    filesOrFormData: FormData | File[],
    token?: string
  ): Promise<ApiResponse<GrievanceAiAnalysisDto>> {
    let rawFormData: FormData;
    if (typeof FormData !== 'undefined' && filesOrFormData instanceof FormData) {
      rawFormData = filesOrFormData;
    } else {
      rawFormData = new FormData();
      if (Array.isArray(filesOrFormData)) {
        filesOrFormData.forEach((file) => {
          rawFormData.append('photos', file, file.name);
        });
      }
    }

    const safeFormData = await this.createSafeFormData(rawFormData);
    const opt: RequestInit = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    return await apiClient.post<GrievanceAiAnalysisDto>(
      '/grievance-ai/scan-image',
      safeFormData,
      opt,
      false
    );
  }

  /**
   * 2. Vision Analysis from DB Photo IDs: POST /api/grievance-ai/generate-description/{photoIds}
   * Generates department, defect type, and bilingual formal description from existing DB photo records.
   */
  async generateFromPhotos(
    photoIds: number[] | string,
    token?: string
  ): Promise<ApiResponse<GrievanceAiAnalysisDto>> {
    const idParam = Array.isArray(photoIds) ? photoIds.filter((id) => id > 0).join(',') : String(photoIds).trim();

    if (!idParam) {
      return { success: false, message: 'At least one photo ID is required for AI vision analysis' };
    }

    const opt: RequestInit = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    return await apiClient.post<GrievanceAiAnalysisDto>(
      `/grievance-ai/generate-description/${encodeURIComponent(idParam)}`,
      undefined,
      opt,
      true
    );
  }

  /**
   * 2. Text Refinement: POST /api/grievance-ai/refine-description
   * Refines raw citizen text or voice transcription into formal bilingual complaints.
   */
  async refineDescription(
    rawDescription: string,
    token?: string
  ): Promise<ApiResponse<GrievanceAiAnalysisDto>> {
    const cleanText = rawDescription.trim();
    if (!cleanText || cleanText.length < 3) {
      return { success: false, message: 'Please provide at least 3 characters to refine' };
    }

    const payload: RefineGrievanceDescriptionRequestDto = { rawDescription: cleanText };
    const opt: RequestInit = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    return await apiClient.post<GrievanceAiAnalysisDto>(
      '/grievance-ai/refine-description',
      payload,
      opt,
      false
    );
  }
}

export const grievanceAiService = new GrievanceAiService();
