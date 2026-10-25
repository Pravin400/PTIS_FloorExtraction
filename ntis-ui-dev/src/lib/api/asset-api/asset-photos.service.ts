import 'server-only';
import { cookies } from 'next/headers';
import { getAppConfig } from '@/config/app.config';
import { serverFetch } from '@/lib/utils/server-fetch';
import type { 
  PropertyPhotoDto, 
  PropertyPhotoTypeWithStatusDto, 
  PropertyPhotoUploadResponseDto, 
  PropertyPhotoGalleryDto
} from '@/types/photoplan.types';
import type { AssetPhotoDiskMatchItem, BackendPhotoResponse } from '@/types/asset/media.types';
import type { ApiResponse } from '@/types/common.types';

export type { BackendPhotoResponse, ApiResponse };

function safeParseJson(text: string, fallback: unknown = {}): unknown {
  if (!text || !text.trim()) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      start = firstBrace;
      end = lastBrace + 1;
    }
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      if (start === -1 || (firstBracket !== -1 && firstBracket < start)) {
        start = firstBracket;
        end = lastBracket + 1;
      }
    }

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end));
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const headers: Record<string, string> = { 'Accept': 'application/json, text/plain, */*' };
  const token = cookieStore.get('auth_token')?.value;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const csrf = cookieStore.get('csrf_token')?.value;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const cookieStr = cookieStore.getAll()
    .filter(c => /auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name))
    .map(c => `${c.name.replace(/[^\x00-\x7F]/g, '')}=${c.value.replace(/[^\x00-\x7F]/g, '')}`)
    .join('; ');
  if (cookieStr) headers['Cookie'] = cookieStr;
  return headers;
}

export const assetPhotosServerService = {
  async getAssetPhotos(assetId: number): Promise<ApiResponse<PropertyPhotoDto[]>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const headers = await getAuthHeaders();
    const allPhotos: PropertyPhotoDto[] = [];

    // 1. First query /asset-photos/asset/${assetId}/grouped — this endpoint joins with DocumentBinding and includes documentGuid / URLs
    try {
      const groupedRes = await this.getGroupedAssetPhotos(assetId);
      if (groupedRes.success && groupedRes.data?.photoTypes) {
        for (const typeGroup of groupedRes.data.photoTypes) {
          for (const p of (typeGroup.photos || [])) {
            const rawP = p as { propertyPhotoId?: number; photoId?: number; id?: number };
            allPhotos.push({
              propertyPhotoId: p.propertyPhotoId || rawP.photoId || rawP.id || 0,
              propertyId: p.propertyId || assetId,
              photoTypeId: p.photoTypeId || typeGroup.photoTypeId,
              photoTypeCode: p.photoTypeCode || typeGroup.photoTypeCode,
              photoTypeName: p.photoTypeName || typeGroup.photoTypeName,
              displayOrder: p.displayOrder,
              remarks: p.remarks,
              documentGuid: p.documentGuid,
              fileName: p.fileName,
              mimeType: p.mimeType,
              viewUrl: p.viewUrl || (p.documentGuid ? `/api/documents/${p.documentGuid}` : undefined),
              downloadUrl: p.downloadUrl || (p.documentGuid ? `/api/documents/download/${p.documentGuid}` : undefined),
            });
          }
        }
        if (allPhotos.length > 0) {
          return { success: true, statusCode: 200, data: allPhotos };
        }
      }
    } catch (err) {
      console.warn("grouped photos endpoint failed, falling back to flat asset-photos", err);
    }

    // 2. Fallback to flat /asset-photos?AssetId=${assetId}
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/asset-photos?AssetId=${assetId}`;
      const response = await serverFetch(url, { method: 'GET', headers, cache: 'no-store' });
      
      let data: { items?: unknown[]; data?: unknown[]; message?: string } = {};
      try {
        const text = await response.text();
        data = safeParseJson(text, {}) as { items?: unknown[]; data?: unknown[]; message?: string };
      } catch {
        return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
      }

      if (response.ok) {
        const rawItems = data.items || data.data || [];
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const mapped: PropertyPhotoDto[] = rawItems.map((rawP: unknown) => {
            const p = rawP as Record<string, unknown>;
            return {
              propertyPhotoId: (p.propertyPhotoId ?? p.photoId ?? p.id) as number,
              propertyId: (p.propertyId ?? p.assetId ?? assetId) as number,
              photoTypeId: p.photoTypeId as number,
              photoTypeCode: p.photoTypeCode as string,
              photoTypeName: p.photoTypeName as string,
              displayOrder: p.displayOrder as number,
              remarks: p.remarks as string,
              documentGuid: p.documentGuid as string,
              fileName: p.fileName as string,
              mimeType: p.mimeType as string,
              viewUrl: (p.viewUrl as string) || (p.documentGuid ? `/api/documents/${p.documentGuid}` : undefined),
              downloadUrl: (p.downloadUrl as string) || (p.documentGuid ? `/api/documents/download/${p.documentGuid}` : undefined),
              isVerified: p.isVerified as boolean,
            };
          });
          return { success: true, statusCode: response.status, data: mapped, message: data.message };
        }
      }
    } catch (err) {
      console.warn("flat asset-photos endpoint failed", err);
    }

    return { success: true, statusCode: 200, data: [] };
  },

  async getGroupedAssetPhotos(assetId: number): Promise<ApiResponse<PropertyPhotoGalleryDto>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/asset/${assetId}/grouped`;
    const headers = await getAuthHeaders();
    const response = await serverFetch(url, { method: 'GET', headers, cache: 'no-store' });
    
    let data: { success?: boolean; items?: PropertyPhotoGalleryDto; message?: string; error?: string };
    try {
      const text = await response.text();
      data = safeParseJson(text, {}) as typeof data;
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Request failed with status ${response.status}` };
    }
    return { success: data.success ?? true, statusCode: response.status, data: data.items, message: data.message };
  },

  /**
   * Finds legacy scanned files (never linked to an AssetPhoto DB row) that match an asset's UPIC code,
   * by asking the backend to search its own wwwroot/Uploads folders. Replaces reading those folders
   * directly off the local disk, which only ever worked when ntis-ui happened to be running next to a
   * checked-out ntis-platform repo.
   */
  async findFilesByUpic(upic: string): Promise<ApiResponse<AssetPhotoDiskMatchItem[]>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl || !upic) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/find-by-upic?upic=${encodeURIComponent(upic)}`;
    const headers = await getAuthHeaders();
    const response = await serverFetch(url, { method: 'GET', headers, cache: 'no-store' });

    let data: { success?: boolean; items?: { matches?: AssetPhotoDiskMatchItem[] }; message?: string; error?: string };
    try {
      const text = await response.text();
      data = safeParseJson(text, {}) as typeof data;
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Request failed with status ${response.status}` };
    }
    return { success: data.success ?? true, statusCode: response.status, data: data.items?.matches || [], message: data.message };
  },

  async getAssetPhotoTypesWithStatus(
    assetId: number,
    assetTypeId?: number,
    assetCategoryId?: number
  ): Promise<ApiResponse<PropertyPhotoTypeWithStatusDto[]>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const headers = await getAuthHeaders();

    // 1. If assetId > 0, query the asset's specific types-with-status endpoint which auto-resolves AssetCategoryId and AssetTypeId from DB!
    if (assetId > 0) {
      try {
        const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/types-with-status/${assetId}`;
        const response = await serverFetch(url, { method: 'GET', headers, cache: 'no-store' });
        if (response.ok) {
          const text = await response.text();
          const data = safeParseJson(text, {}) as { items?: unknown[]; data?: unknown[]; message?: string };
          const items = data.items || data.data;
          if (Array.isArray(items) && items.length > 0) {
            const mappedItems: PropertyPhotoTypeWithStatusDto[] = items.map((raw: unknown) => {
              const item = raw as Record<string, unknown>;
              return {
                photoTypeId: (item.photoTypeId ?? item.id) as number,
                photoTypeCode: item.photoTypeCode as string,
                photoTypeName: item.photoTypeName as string,
                displayOrder: item.displayOrder as number,
                hasPhoto: item.hasPhoto !== undefined ? Boolean(item.hasPhoto) : Boolean(Number(item.photoCount) > 0),
                photoCount: (item.photoCount as number) ?? 0,
                propertyPhotoId: (item.photoId ?? item.propertyPhotoId) as number,
                allowMultiple: true,
                isSubUnit: Boolean(item.isSubUnit ?? item.IsSubUnit ?? false),
                remarks: item.remarks as string,
                documentGuid: item.documentGuid as string,
                fileName: item.fileName as string,
                mimeType: item.mimeType as string,
              };
            });
            return { success: true, statusCode: response.status, data: mappedItems, message: data.message };
          }
        }
      } catch (err) {
        console.warn("types-with-status endpoint failed, falling back to master query", err);
      }
    }

    // 2. Fallback to master photo types endpoint, filtered strictly by Category and Type
    const resolvedCatId = assetCategoryId && assetCategoryId > 0 ? assetCategoryId : 1; // Default: Building (1)
    const resolvedTypeId = assetTypeId && assetTypeId > 0 ? assetTypeId : 2; // Default: Municipal Asset (2)
    const url = `${baseUrl.replace(/\/$/, '')}/master/asset-photo-types?PageSize=-1&IsActive=true&AssetCategoryId=${resolvedCatId}&AssetTypeId=${resolvedTypeId}`;

    const response = await serverFetch(url, { method: 'GET', headers, cache: 'no-store' });
    
    let data: { items?: unknown[]; data?: unknown[]; success?: boolean; message?: string; error?: string };
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Request failed with status ${response.status}` };
    }

    const rawList = data.items || data.data;
    if (Array.isArray(rawList)) {
      // In-memory safety filter by AssetCategoryId & AssetTypeId
      const filtered = rawList.filter((raw: unknown) => {
        const item = raw as Record<string, unknown>;
        const itemCatId = item.assetCategoryId ?? item.AssetCategoryId;
        const itemTypeId = item.assetTypeId ?? item.AssetTypeId;
        const catMatch = itemCatId == null || Number(itemCatId) === Number(resolvedCatId);
        const typeMatch = itemTypeId == null || Number(itemTypeId) === Number(resolvedTypeId);
        return catMatch && typeMatch;
      });

      const listToMap = filtered.length > 0 ? filtered : rawList;

      // Map master data to the DTO expected by UI
      const mappedItems: PropertyPhotoTypeWithStatusDto[] = listToMap.map((raw: unknown) => {
        const item = raw as Record<string, unknown>;
        return {
          photoTypeId: item.id as number,
          photoTypeCode: item.photoTypeCode as string,
          photoTypeName: item.photoTypeName as string,
          hasPhoto: false,
          photoCount: 0,
          allowMultiple: true,
          isSubUnit: Boolean(item.isSubUnit ?? item.IsSubUnit ?? false)
        };
      });
      return { success: data.success ?? true, statusCode: response.status, data: mappedItems, message: data.message };
    }

    return { success: data.success ?? true, statusCode: response.status, data: [], message: data.message };
  },

  async uploadAssetPhoto(formData: FormData): Promise<ApiResponse<PropertyPhotoUploadResponseDto>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/upload`;
    const headers = await getAuthHeaders();

    // Reconstruct FormData to ensure Next.js Server Action File objects are correctly 
    // serialized by Node.js native fetch with proper boundary and filename.
    const safeFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as File;
        const arrayBuffer = await file.arrayBuffer();
        safeFormData.append(key, new Blob([arrayBuffer], { type: file.type }), file.name || "upload.jpg");
      } else {
        safeFormData.append(key, value);
      }
    }

    const response = await serverFetch(url, { method: 'POST', headers, body: safeFormData, cache: 'no-store' });
    
    let data: { success?: boolean; items?: PropertyPhotoUploadResponseDto; message?: string; error?: string };
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Upload failed with status ${response.status}` };
    }
    return { success: data.success ?? true, statusCode: response.status, data: data.items, message: data.message };
  },

  async replaceAssetPhoto(photoId: number, formData: FormData): Promise<ApiResponse<PropertyPhotoUploadResponseDto>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/${photoId}/replace`;
    const headers = await getAuthHeaders();

    const safeFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
        const file = value as File;
        const arrayBuffer = await file.arrayBuffer();
        safeFormData.append(key, new Blob([arrayBuffer], { type: file.type }), file.name || "upload.jpg");
      } else {
        safeFormData.append(key, value);
      }
    }

    const response = await serverFetch(url, { method: 'POST', headers, body: safeFormData, cache: 'no-store' });
    
    let data: { success?: boolean; items?: PropertyPhotoUploadResponseDto; message?: string; error?: string };
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Replace failed with status ${response.status}` };
    }
    return { success: data.success ?? true, statusCode: response.status, data: data.items, message: data.message };
  },

  async deleteAssetPhoto(photoId: number): Promise<ApiResponse<object>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/${photoId}`;
    const headers = await getAuthHeaders();
    const response = await serverFetch(url, { method: 'DELETE', headers, cache: 'no-store' });
    
    let data: { success?: boolean; items?: object; message?: string; error?: string };
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Delete failed with status ${response.status}` };
    }
    return { success: data.success ?? true, statusCode: response.status, data: data.items, message: data.message };
  },

  async bulkSaveAssetPhotos(payload: unknown): Promise<ApiResponse<unknown>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/bulk-save`;
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const response = await serverFetch(url, { method: 'POST', headers, body: JSON.stringify(payload), cache: 'no-store' });
    
    let data: { success?: boolean; items?: unknown; data?: unknown; message?: string; error?: string };
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Bulk save failed with status ${response.status}` };
    }
    return { success: data.success ?? true, statusCode: response.status, data: data.items || data.data || data, message: data.message };
  },

  async bulkUploadAssetPhotos(formData: FormData): Promise<ApiResponse<unknown>> {
    const config = getAppConfig();
    const baseUrl = config.api.baseUrl?.trim();
    if (!baseUrl) return { success: false, statusCode: 500, error: "API base URL is not configured" };

    const url = `${baseUrl.replace(/\/$/, '')}/asset-photos/bulk-upload`;
    const headers = await getAuthHeaders();
    // Do not set Content-Type for FormData
    const response = await serverFetch(url, { method: 'POST', headers, body: formData, cache: 'no-store' });
    
    let data: { success?: boolean; items?: unknown; data?: unknown; message?: string; error?: string };
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      return { success: false, statusCode: response.status, error: "Failed to parse JSON" };
    }

    if (!response.ok) {
      return { success: false, statusCode: response.status, error: data.message || data.error || `Bulk upload failed with status ${response.status}` };
    }
    return { success: data.success ?? true, statusCode: response.status, data: data.items || data.data || data, message: data.message };
  }
};
