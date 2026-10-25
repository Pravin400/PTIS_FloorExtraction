/**
 * Grievance Photo API Service
 * Built on centralized base `apiClient` (@/services/api.service).
 * Handles uploading, fetching, and deleting evidence photos.
 *
 * Path: src/lib/api/grievance/citizen/grievance-photo.service.ts
 */

import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  GrievancePhotoItem,
  UploadGrievancePhotoResponse,
  UploadMultipleGrievancePhotosResponse,
} from '@/types/grievance/grievance-photo.types';

export class GrievancePhotoService {
  /**
   * Helper to reconstruct FormData for Node.js native fetch / undici serialization.
   * Preserves dynamic file metadata without hardcoding filenames or MIME types.
   */
  private async createSafeFormData(formData: FormData): Promise<FormData> {
    const safeFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (/^(Token|token|SessionToken)$/i.test(key)) {
        continue;
      }
      if (typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as File;
        const arrayBuffer = await file.arrayBuffer();
        const mimeType = file.type || 'image/jpeg';
        const rawName = (file as { name?: string }).name;
        const fileName = (rawName && rawName !== 'undefined' && rawName.trim().length > 0)
          ? rawName
          : `evidence_${Date.now()}.jpg`;
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

  /**
   * Internal helper to execute authenticated multipart photo uploads.
   */
  private async executePhotoUpload(
    path: string,
    formData: FormData,
    token?: string
  ): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
    const effectiveToken =
      token ||
      ((formData.get('Token') || formData.get('token') || formData.get('SessionToken')) as string | undefined) ||
      undefined;

    const safeBody = await this.createSafeFormData(formData);
    const opt: RequestInit = {
      method: 'POST',
      body: safeBody,
      ...(effectiveToken ? { headers: { Authorization: `Bearer ${effectiveToken}` } } : {}),
    };

    let res: Response;
    try {
      res = await apiClient.fetch(path, opt);
    } catch (fetchErr) {
      const errStr = (fetchErr as Error).stack || (fetchErr as Error).message;
      console.error(`[executePhotoUpload] Fetch exception for ${path}:`, errStr);
      return { success: false, message: (fetchErr as Error).message || 'Network error uploading photo' };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[executePhotoUpload] Failed ${path} (status ${res.status}):`, errText);
      return { success: false, message: errText || `Photo upload failed with status ${res.status}` };
    }

    const text = await res.text();
    let data: Record<string, unknown> = {};
    if (text && text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }
    const message = String(data.message ?? data.Message ?? text ?? '');
    return { success: true, message, data };
  }

  /**
   * POST /api/grievance-photos/upload
   */
  async uploadPhoto(
    formData: FormData,
    token?: string
  ): Promise<ApiResponse<UploadGrievancePhotoResponse>> {
    const res = await this.executePhotoUpload('/grievance-photos/upload', formData, token);
    if (!res.success || !res.data) {
      return { success: false, message: res.message };
    }
    const photoId = Number(res.data.grievancePhotoId ?? res.data.GrievancePhotoId ?? res.data.id ?? res.data.Id ?? 0);
    return {
      success: true,
      message: res.message,
      data: { message: res.message, grievancePhotoId: photoId },
    };
  }

  /**
   * POST /api/grievance-photos/upload-multiple
   */
  async uploadMultiplePhotos(
    formData: FormData,
    token?: string
  ): Promise<ApiResponse<UploadMultipleGrievancePhotosResponse>> {
    const res = await this.executePhotoUpload('/grievance-photos/upload-multiple', formData, token);
    if (!res.success || !res.data) {
      return { success: false, message: res.message };
    }
    const rawIds = (res.data.grievancePhotoIds ?? res.data.GrievancePhotoIds ?? res.data.items ?? res.data.Items ?? []) as (number | string)[];
    const photoIds = Array.isArray(rawIds) ? rawIds.map((id) => Number(id)) : [];
    return {
      success: true,
      message: res.message,
      data: { message: res.message, grievancePhotoIds: photoIds },
    };
  }

  /**
   * GET /api/grievance-photos/grievance/{grievanceApplicationId}
   */
  async getPhotosByGrievanceId(
    grievanceApplicationId: number
  ): Promise<ApiResponse<GrievancePhotoItem[]>> {
    const res = await apiClient.get<Record<string, unknown>[] | { items?: Record<string, unknown>[] }>(
      `/grievance-photos/grievance/${grievanceApplicationId}`
    );
    if (!res.success || !res.data) {
      return { success: false, message: res.message || res.error || 'Failed to fetch photos', data: [] };
    }
    const raw = res.data;
    const items = (Array.isArray(raw) ? raw : (raw as { items?: Record<string, unknown>[] }).items || []) as Record<string, unknown>[];
    return {
      success: true,
      data: items.map((p) => ({
        id: Number(p.id ?? p.Id ?? 0),
        grievanceApplicationId: Number(p.grievanceApplicationId ?? p.GrievanceApplicationId ?? 0),
        photoTypeId: Number(p.photoTypeId ?? p.PhotoTypeId ?? 0),
        photoTypeCode: String(p.photoTypeCode ?? p.PhotoTypeCode ?? ''),
        photoTypeName: String(p.photoTypeName ?? p.PhotoTypeName ?? ''),
        documentBindingId: p.documentBindingId ? Number(p.documentBindingId) : undefined,
        isLatest: Boolean(p.isLatest ?? p.IsLatest),
        remarks: typeof p.remarks === 'string' ? p.remarks : (typeof p.Remarks === 'string' ? p.Remarks : undefined),
        fileName: typeof p.fileName === 'string' ? p.fileName : (typeof p.FileName === 'string' ? p.FileName : undefined),
        originalFileName: typeof p.originalFileName === 'string' ? p.originalFileName : (typeof p.OriginalFileName === 'string' ? p.OriginalFileName : undefined),
        fileExtension: typeof p.fileExtension === 'string' ? p.fileExtension : (typeof p.FileExtension === 'string' ? p.FileExtension : undefined),
        mimeType: typeof p.mimeType === 'string' ? p.mimeType : (typeof p.MimeType === 'string' ? p.MimeType : undefined),
        storagePath: typeof p.storagePath === 'string' ? p.storagePath : (typeof p.StoragePath === 'string' ? p.StoragePath : undefined),
        documentGuid: typeof p.documentGuid === 'string' ? p.documentGuid : (typeof p.DocumentGuid === 'string' ? p.DocumentGuid : undefined),
      })),
    };
  }

  /**
   * DELETE /api/grievance-photos/{photoId}
   */
  async deletePhoto(photoId: number): Promise<ApiResponse<boolean>> {
    return await apiClient.delete<boolean>(`/grievance-photos/${photoId}`);
  }

  /**
   * Fetches binary photo stream for browser display.
   * Encapsulates backend HTTP fetching logic within the Service layer.
   */
  async getPhotoBinary(photoId: number): Promise<{
    ok: boolean;
    data?: ArrayBuffer;
    contentType?: string;
    contentDisposition?: string | null;
  }> {
    if (!photoId || photoId <= 0) return { ok: false };

    try {
      let backendRes = await apiClient.fetch(
        `/GrievancePhoto/${photoId}/view`,
        { method: 'GET', headers: { Accept: '*/*' } },
        false
      );

      if (!backendRes.ok && (backendRes.status === 404 || backendRes.status === 401)) {
        try {
          const fallbackRes = await apiClient.fetch(
            `/grievance-photos/${photoId}/view`,
            { method: 'GET', headers: { Accept: '*/*' } },
            false
          );
          if (fallbackRes.ok) backendRes = fallbackRes;
        } catch {}
      }

      if (!backendRes.ok) return { ok: false };

      const contentType = backendRes.headers.get('content-type') || 'image/jpeg';
      const contentDisposition = backendRes.headers.get('content-disposition');
      const data = await backendRes.arrayBuffer();

      return {
        ok: true,
        data,
        contentType,
        contentDisposition,
      };
    } catch (err) {
      console.error(`[getPhotoBinary] Error fetching photo binary for id ${photoId}:`, err);
      return { ok: false };
    }
  }
}

export const grievancePhotoService = new GrievancePhotoService();
