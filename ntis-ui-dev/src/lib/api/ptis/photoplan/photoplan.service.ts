import 'server-only';

import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import { uploadDocument, deleteDocument } from "../../document.service";
import { DocumentUploadParams } from "@/types/document.types";
import { DEPARTMENT_ID, MODULE_ID, REFERENCE_TABLE, DOCUMENT_TYPE } from "../../../constants/document.constants";
import type { 
  PropertyPhotoDto, 
  PropertyPhotoTypeWithStatusDto, 
  PropertyPhotoUploadResponseDto,
  PropertyPhotoGalleryDto,
  PropertyPhotoTypeRecord
} from "@/types/photoplan.types";
import { getAppConfig } from "@/config/app.config";

interface BackendApiResponseWrapper<T> {
  success: boolean;
  message?: string;
  items: T;
  errors?: string[];
}

const photosCache = new Map<number, { data: ApiResponse<PropertyPhotoDto[]>; timestamp: number }>();
const inFlightPhotos = new Map<number, Promise<ApiResponse<PropertyPhotoDto[]>>>();

const photoTypesCache = new Map<number, { data: ApiResponse<PropertyPhotoTypeWithStatusDto[]>; timestamp: number }>();
const inFlightPhotoTypes = new Map<number, Promise<ApiResponse<PropertyPhotoTypeWithStatusDto[]>>>();

const PHOTO_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export function invalidatePhotoPlanCache(propertyId?: number): void {
  if (!propertyId) {
    photosCache.clear();
    inFlightPhotos.clear();
    photoTypesCache.clear();
    inFlightPhotoTypes.clear();
    return;
  }
  photosCache.delete(propertyId);
  inFlightPhotos.delete(propertyId);
  photoTypesCache.delete(propertyId);
  inFlightPhotoTypes.delete(propertyId);
}

export const photoPlanService = {
  // 1. GET - All current photos for a property
  async getPhotosByProperty(propertyId: number): Promise<ApiResponse<PropertyPhotoDto[]>> {
    const cached = photosCache.get(propertyId);
    if (cached && Date.now() - cached.timestamp < PHOTO_CACHE_TTL) {
      return cached.data;
    }

    const existingPromise = inFlightPhotos.get(propertyId);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async () => {
      const response = await apiClient.get<BackendApiResponseWrapper<PropertyPhotoDto[]>>(`/property-photos/property/${propertyId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const result: ApiResponse<PropertyPhotoDto[]> = response.success && response.data
        ? { success: response.data.success, statusCode: response.statusCode, data: response.data.items, message: response.data.message || response.message }
        : { success: false, statusCode: response.statusCode, error: response.error, message: response.message };

      if (result.success) {
        photosCache.set(propertyId, { data: result, timestamp: Date.now() });
      }
      return result;
    })();

    inFlightPhotos.set(propertyId, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      inFlightPhotos.delete(propertyId);
    }
  },

  // 1b. GET - All grouped photos for a property (nested by category)
  async getGroupedPhotosByProperty(propertyId: number): Promise<ApiResponse<PropertyPhotoGalleryDto>> {
    const response = await apiClient.get<BackendApiResponseWrapper<PropertyPhotoGalleryDto>>(`/property-photos/property/${propertyId}/grouped`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    return response.success && response.data
      ? { success: response.data.success, statusCode: response.statusCode, data: response.data.items, message: response.data.message || response.message }
      : { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
  },

  // 2. GET - All active photo types with status for a property
  async getPhotoTypesWithStatus(propertyId: number): Promise<ApiResponse<PropertyPhotoTypeWithStatusDto[]>> {
    const cached = photoTypesCache.get(propertyId);
    if (cached && Date.now() - cached.timestamp < PHOTO_CACHE_TTL) {
      return cached.data;
    }

    const existingPromise = inFlightPhotoTypes.get(propertyId);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async () => {
      const response = await apiClient.get<BackendApiResponseWrapper<PropertyPhotoTypeWithStatusDto[]>>(`/property-photos/types-with-status/${propertyId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const result: ApiResponse<PropertyPhotoTypeWithStatusDto[]> = response.success && response.data
        ? { success: response.data.success, statusCode: response.statusCode, data: response.data.items, message: response.data.message || response.message }
        : { success: false, statusCode: response.statusCode, error: response.error, message: response.message };

      if (result.success) {
        photoTypesCache.set(propertyId, { data: result, timestamp: Date.now() });
      }
      return result;
    })();

    inFlightPhotoTypes.set(propertyId, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      inFlightPhotoTypes.delete(propertyId);
    }
  },

  async uploadPhotoViaGlobalApi(
    file: File,
    propertyId: number,
    photoTypeId: number,
    propertyPhotoId: number,
    _displayOrder?: number,
    remarks?: string,
    photoTypeCode?: string,
    wingDetailId?: number,
    _societyId?: number,
    wingName?: string
  ): Promise<ApiResponse<PropertyPhotoUploadResponseDto>> {
    try {
      const isNew = propertyPhotoId <= 0 || propertyPhotoId === propertyId || (!!wingDetailId && propertyPhotoId === wingDetailId) || propertyPhotoId === 9998 || propertyPhotoId === 9999;
      const isWingPhoto = Boolean(photoTypeCode?.toUpperCase().includes('WING'));
      const isSocietyPhoto = Boolean(photoTypeCode?.toUpperCase().includes('SOCIETY'));

      const uploadParams: DocumentUploadParams = {
        departmentId: DEPARTMENT_ID.PTIS,
        moduleId: isSocietyPhoto ? MODULE_ID.SocietyPhoto : (isWingPhoto ? MODULE_ID.WingPhoto : MODULE_ID.PropertyPhoto),
        bindingPurpose: remarks || (isWingPhoto && wingName ? `Wing Photo | ${wingName}` : (isSocietyPhoto ? "Society Photo" : "Photo")),
        documentType: (photoTypeCode?.toUpperCase() === 'PHOTO_PLAN' ? 'PROPERTY_PLAN' : photoTypeCode) || String(photoTypeId),
        isPrimaryDocument: true,
        referenceTableName: REFERENCE_TABLE.PropertyPhoto
      };

      if (!isNew) {
        uploadParams.referenceTableId = propertyPhotoId;
        uploadParams.referencePropertyName = "PropertyPhotoId";
      } else if (isWingPhoto && wingDetailId && wingDetailId > 0) {
        uploadParams.referenceTableId = wingDetailId;
        uploadParams.referencePropertyName = "WingDetailId";
      } else if (isSocietyPhoto && _societyId && _societyId > 0) {
        uploadParams.referenceTableId = _societyId;
        uploadParams.referencePropertyName = "SocietyDetailId";
      } else {
        uploadParams.referenceTableId = propertyId;
        uploadParams.referencePropertyName = "PropertyId";
      }

      let uploadResponse;
      try {
        uploadResponse = await uploadDocument(file, uploadParams);
      } catch (firstError: unknown) {
        if (!isNew && propertyId && propertyId > 0) {
          try {
            uploadParams.referenceTableId = propertyId;
            uploadParams.referencePropertyName = "PropertyId";
            uploadResponse = await uploadDocument(file, uploadParams);
          } catch {
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }

      // Invalidate cache immediately so fresh photos are queried
      invalidatePhotoPlanCache(propertyId);

      const targetDocGuid = (uploadResponse as unknown as Record<string, unknown>)?.documentGuid || (uploadResponse as unknown as Record<string, unknown>)?.DocumentGuid;
      const targetBindingId = (uploadResponse as unknown as Record<string, unknown>)?.documentBindingId || (uploadResponse as unknown as Record<string, unknown>)?.DocumentBindingId || (uploadResponse as unknown as Record<string, unknown>)?.bindingId;

      const docGuidStr = targetDocGuid ? String(targetDocGuid) : '';

      // Best-effort lookup of the updated photo DTO
      let resolvedPhotoId = propertyPhotoId > 0 ? propertyPhotoId : 0;
      let resolvedDocGuid = docGuidStr;
      let resolvedBindingId = targetBindingId ? Number(targetBindingId) : 0;
      let resolvedPhotoTypeId = photoTypeId;
      let resolvedDisplayOrder: number | undefined = _displayOrder;
      let resolvedRemarks = remarks || "";

      try {
        const photosResponse = await this.getPhotosByProperty(propertyId);
        if (photosResponse.success && Array.isArray(photosResponse.data)) {
          const photosList = photosResponse.data;
          let newPhoto = photosList.find(
            (p) =>
              (p.documentGuid && docGuidStr && p.documentGuid.toLowerCase() === docGuidStr.toLowerCase()) ||
              (p.documentBindingId && targetBindingId && Number(p.documentBindingId) === Number(targetBindingId))
          );

          if (!newPhoto && photoTypeCode) {
            const matchingPhotos = photosList
              .filter(
                (p) =>
                  p.photoTypeCode &&
                  p.photoTypeCode.toUpperCase() === String(photoTypeCode).toUpperCase() &&
                  (wingDetailId == null || Number(p.wingDetailId) === Number(wingDetailId)) &&
                  (_societyId == null || Number(p.societyDetailId) === Number(_societyId))
              )
              .sort((a, b) => (b.propertyPhotoId ?? 0) - (a.propertyPhotoId ?? 0));
            newPhoto = matchingPhotos[0];
          }

          if (newPhoto) {
            resolvedPhotoId = newPhoto.propertyPhotoId || resolvedPhotoId;
            resolvedDocGuid = newPhoto.documentGuid || resolvedDocGuid;
            resolvedBindingId = newPhoto.documentBindingId || resolvedBindingId;
            resolvedPhotoTypeId = newPhoto.photoTypeId || resolvedPhotoTypeId;
            resolvedDisplayOrder = newPhoto.displayOrder ?? resolvedDisplayOrder;
            resolvedRemarks = newPhoto.remarks || resolvedRemarks;
          }
        }
      } catch {
        // Non-critical lookup failure — fallback to uploadResponse values directly
      }

      // Ensure cache remains fresh for subsequent queries
      invalidatePhotoPlanCache(propertyId);

      return {
        success: true,
        data: {
          propertyPhotoId: resolvedPhotoId,
          documentGuid: resolvedDocGuid,
          documentId: Number((uploadResponse as unknown as Record<string, unknown>)?.documentId || (uploadResponse as unknown as Record<string, unknown>)?.DocumentId || 0),
          documentBindingId: resolvedBindingId,
          propertyId: propertyId,
          photoTypeId: resolvedPhotoTypeId,
          displayOrder: resolvedDisplayOrder || 1,
          remarks: resolvedRemarks,
          fileName: file.name,
          fileSizeBytes: file.size,
          storagePath: String((uploadResponse as unknown as Record<string, unknown>)?.storagePath || (uploadResponse as unknown as Record<string, unknown>)?.StoragePath || ""),
          viewUrl: `/api/documents/${resolvedDocGuid}/view`,
          downloadUrl: `/api/documents/${resolvedDocGuid}/download`
        }
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  // 4. POST - Replace an existing photo using the global document API
  async replacePhotoViaGlobalApi(
    file: File,
    oldDocumentGuid: string,
    propertyId: number,
    _photoTypeId: number,
    propertyPhotoId: number,
    _referenceTableIdGuid?: string,
    remarks?: string,
    photoTypeCode?: string,
    wingDetailId?: number,
    _societyId?: number,
    wingName?: string
  ): Promise<ApiResponse<PropertyPhotoUploadResponseDto>> {
    try {
      // Determine if this propertyPhotoId looks like a real PropertyPhoto row
      // or if it's actually the propertyId / a placeholder.
      const isLikelyPropertyId = propertyPhotoId === propertyId
        || (!!wingDetailId && propertyPhotoId === wingDetailId)
        || propertyPhotoId <= 0
        || propertyPhotoId === 9998
        || propertyPhotoId === 9999;

      const isWingPhoto = photoTypeCode?.toUpperCase().includes('WING') || photoTypeCode?.toUpperCase().startsWith('WING_');
      const isSocietyPhoto = photoTypeCode?.toUpperCase().includes('SOCIETY') || photoTypeCode?.toUpperCase().startsWith('SOCIETY_');

      const uploadParams: DocumentUploadParams = {
        departmentId: DEPARTMENT_ID.PTIS,
        moduleId: isSocietyPhoto ? MODULE_ID.SocietyPhoto : (isWingPhoto ? MODULE_ID.WingPhoto : MODULE_ID.PropertyPhoto),
        referenceTableName: REFERENCE_TABLE.PropertyPhoto,
        bindingPurpose: remarks || (isWingPhoto && wingName ? `Wing Photo | ${wingName}` : (isSocietyPhoto ? "Society Photo" : "Photo")),
        documentType: (photoTypeCode?.toUpperCase() === 'PHOTO_PLAN' ? 'PROPERTY_PLAN' : photoTypeCode) || DOCUMENT_TYPE.Photo,
        isPrimaryDocument: true
      };

      // When replacing, always reference the existing PropertyPhotoId directly so
      // the backend handler (OnAfterUploadAsync) links the new binding to the
      // existing row instead of creating a new one.
      if (propertyPhotoId && propertyPhotoId > 0 && !isLikelyPropertyId) {
        uploadParams.referenceTableId = propertyPhotoId;
        uploadParams.referencePropertyName = "PropertyPhotoId";
      } else if (isWingPhoto && wingDetailId && wingDetailId > 0) {
        uploadParams.referenceTableId = wingDetailId;
        uploadParams.referencePropertyName = "WingDetailId";
      } else if (isSocietyPhoto && _societyId && _societyId > 0) {
        uploadParams.referenceTableId = _societyId;
        uploadParams.referencePropertyName = "SocietyDetailId";
      } else {
        uploadParams.referenceTableId = propertyId;
        uploadParams.referencePropertyName = "PropertyId";
      }

      if (isLikelyPropertyId) {
        return this.uploadPhotoViaGlobalApi(
          file,
          propertyId,
          _photoTypeId,
          propertyPhotoId,
          undefined,
          remarks,
          photoTypeCode,
          wingDetailId,
          _societyId,
          wingName
        );
      }

      let uploadResponse;
      try {
        uploadResponse = await uploadDocument(file, uploadParams);
      } catch (firstError: unknown) {
        // If referencing PropertyPhotoId failed (row doesn't exist, foreign key constraint, server error),
        // fall back to PropertyId reference so upload succeeds.
        if (!isLikelyPropertyId && propertyId && propertyId > 0) {
          try {
            uploadParams.referenceTableId = propertyId;
            uploadParams.referencePropertyName = "PropertyId";
            uploadResponse = await uploadDocument(file, uploadParams);
          } catch {
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }

      if (!uploadResponse.documentGuid) {
        throw new Error("Failed to retrieve document GUID from upload.");
      }

      // Best-effort cleanup of the old document
      if (oldDocumentGuid && oldDocumentGuid !== uploadResponse.documentGuid) {
        try {
          await deleteDocument(oldDocumentGuid);
        } catch {
          // Non-critical: old document cleanup can fail silently
        }
      }

      // Invalidate cache immediately so fresh photos are queried
      invalidatePhotoPlanCache(propertyId);

      // Best-effort: try to find the newly created/updated photo to get the
      // real PropertyPhotoId. If this lookup fails, we still return success
      // using the upload response data directly.
      let resolvedPropertyPhotoId = propertyPhotoId;
      let resolvedPhotoTypeId = _photoTypeId;
      let resolvedDisplayOrder: number | undefined;
      let resolvedRemarks = remarks || "";
      let resolvedDocumentBindingId = uploadResponse.documentBindingId || 0;
      let resolvedDocumentGuid = uploadResponse.documentGuid;

      try {
        const photosResponse = await this.getPhotosByProperty(propertyId);
        if (photosResponse.success && photosResponse.data) {
          // Try multiple matching strategies
          const newPhoto = photosResponse.data.find(
            (p) => p.documentGuid === uploadResponse.documentGuid
          ) || photosResponse.data.find(
            (p) => uploadResponse.documentBindingId && p.documentBindingId === uploadResponse.documentBindingId
          ) || photosResponse.data.find(
            (p) => p.photoTypeId === _photoTypeId &&
              (wingDetailId == null || Number(p.wingDetailId) === Number(wingDetailId)) &&
              (_societyId == null || Number(p.societyDetailId) === Number(_societyId))
              && p.propertyPhotoId !== propertyPhotoId
              && p.documentGuid
          );

          if (newPhoto) {
            resolvedPropertyPhotoId = newPhoto.propertyPhotoId;
            resolvedPhotoTypeId = newPhoto.photoTypeId;
            resolvedDisplayOrder = newPhoto.displayOrder;
            resolvedRemarks = newPhoto.remarks || remarks || "";
            resolvedDocumentBindingId = newPhoto.documentBindingId || resolvedDocumentBindingId;
            resolvedDocumentGuid = newPhoto.documentGuid || resolvedDocumentGuid;
          }
        }
      } catch {
        // Lookup failure is non-critical — the upload already succeeded.
      }

      // Ensure cache remains fresh for subsequent queries
      invalidatePhotoPlanCache(propertyId);

      return {
        success: true,
        data: {
          propertyPhotoId: resolvedPropertyPhotoId,
          documentGuid: resolvedDocumentGuid,
          documentId: uploadResponse.documentId,
          documentBindingId: resolvedDocumentBindingId,
          propertyId: propertyId,
          photoTypeId: resolvedPhotoTypeId,
          displayOrder: resolvedDisplayOrder,
          remarks: resolvedRemarks,
          fileName: file.name,
          fileSizeBytes: file.size,
          storagePath: uploadResponse.storagePath ?? "",
          viewUrl: `/api/documents/${resolvedDocumentGuid}/view`,
          downloadUrl: `/api/documents/${resolvedDocumentGuid}/download`
        }
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  // 5b. GET - All photo types from ptis.PropertyPhotoType table (optionally filtered by photoScope)
  async getAllPropertyPhotoTypes(scope?: string): Promise<ApiResponse<PropertyPhotoTypeRecord[]>> {
    const response = await apiClient.get<BackendApiResponseWrapper<PropertyPhotoTypeRecord[]>>(
      '/PropertyPhotoType',
      { cache: 'no-store' }
    );
    if (response.success && response.data?.items) {
      let items = response.data.items;
      if (Array.isArray(items)) {
        if (scope) {
          items = items.filter(
            (item) => item.photoScope?.toUpperCase() === scope.toUpperCase() && item.isActive !== false
          );
        }
        return { success: true, statusCode: response.statusCode, data: items };
      }
    }
    return { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
  },

  // 6. PUT - Update a photo type name (rename slot)
  async updatePropertyPhotoType(
    id: number,
    photoTypeCode: string,
    photoTypeName: string
  ): Promise<ApiResponse<object>> {
    const response = await apiClient.put<BackendApiResponseWrapper<object>>(
      `/PropertyPhotoType/${id}`,
      { photoTypeCode, photoTypeName, isActive: true }
    );
    return response.success && response.data
      ? { success: response.data.success, statusCode: response.statusCode, data: response.data.items, message: response.data.message || response.message }
      : { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
  },

  // 7. POST - Create a new photo type (category slot)
  async createPropertyPhotoType(
    photoTypeCode: string,
    photoTypeName: string,
    displayOrder?: number,
    description?: string
  ): Promise<ApiResponse<{ id: number }>> {
    const response = await apiClient.post<BackendApiResponseWrapper<{ id: number }>>(
      '/PropertyPhotoType',
      { photoTypeCode, photoTypeName, displayOrder, description, isActive: true }
    );
    return response.success && response.data
      ? { success: response.data.success, statusCode: response.statusCode, data: response.data.items, message: response.data.message || response.message }
      : { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
  },

  // 8. DELETE - Delete a photo type
  async deletePropertyPhotoType(id: number): Promise<ApiResponse<object>> {
    const response = await apiClient.delete<BackendApiResponseWrapper<object>>(`/PropertyPhotoType/${id}`);
    return response.success && response.data
      ? { success: response.data.success, statusCode: response.statusCode, data: response.data.items, message: response.data.message || response.message }
      : { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
  },

  // 9. DELETE - Purge a photo type and all its associated photos
  async purgePropertyPhotoType(id: number): Promise<ApiResponse<object>> {
    const response = await apiClient.delete<BackendApiResponseWrapper<object>>(`/PropertyPhotoType/${id}/purge`);
    return response.success && response.data
      ? { success: response.data.success, statusCode: response.statusCode, data: response.data.items, message: response.data.message || response.message }
      : { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
  },

  // 10. GET - Authenticate and launch the CAD drawing tool
  async launchDrawingTool(params: {
    propertyId: number;
    councilName: string;
    returnUrl: string;
    ptisUsername?: string;
    ptisDisplayName?: string;
    ptisUserId?: string;
    wardNo?: string;
    propertyNo?: string;
    partitionNo?: string | null;
    ptisBackendUri?: string;
    type?: string | number | null;
    isAmenity?: boolean;
    entityType?: string | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    photoTypeId?: number | null;
  }): Promise<{ success: boolean; launchUrl?: string; planName?: string; error?: string }> {
    try {
      const {
        propertyId,
        councilName,
        returnUrl,
        ptisUsername,
        ptisDisplayName,
        ptisUserId,
        wardNo,
        propertyNo,
        partitionNo,
        ptisBackendUri,
        type,
        isAmenity,
        entityType,
        societyDetailId,
        wingDetailId,
        photoTypeId,
      } = params;

      let cookieUsername = '';
      let cookieDisplayName = '';
      let cookieUserId = '';

      if (typeof window === 'undefined') {
        try {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          cookieUsername = cookieStore.get('login_username')?.value || cookieStore.get('username')?.value || cookieStore.get('user_name')?.value || '';
          const rawDisplayName = cookieStore.get('user_name')?.value || cookieStore.get('display_name')?.value || '';
          cookieDisplayName = rawDisplayName ? decodeURIComponent(rawDisplayName.replace(/\+/g, ' ')) : '';
          cookieUserId = cookieStore.get('user_id')?.value || '';
        } catch {
          // Cookies store unavailable in non-request contexts
        }
      }

      const safeDecode = (val?: string) => {
        if (!val) return '';
        try {
          return decodeURIComponent(val.replace(/\+/g, ' '));
        } catch {
          return val;
        }
      };

      const finalPtisUsername = safeDecode(ptisUsername || cookieUsername) || 'tejas';
      const finalPtisDisplayName = safeDecode(ptisDisplayName || cookieDisplayName) || 'Tejas Kishor';
      const finalPtisUserId = safeDecode(ptisUserId || cookieUserId) || '42';

      if (!finalPtisUsername || !finalPtisUserId) {
        return {
          success: false,
          error: 'Authenticated user context is required to launch drawing tool.',
        };
      }

      const rawCouncil =
        (councilName && councilName.trim() !== '' ? councilName.trim() : undefined) ??
        process.env.NEXT_PUBLIC_COUNCIL_NAME ??
        process.env.COUNCIL_NAME ??
        'THANE_survey';

      let apiCouncilName = rawCouncil;
      if (!apiCouncilName || apiCouncilName.toLowerCase().includes('thane') || apiCouncilName.toLowerCase() === 'tmc') {
        apiCouncilName = 'THANE_survey';
      }

      // 1. Authenticate user with static credentials
      const authBody = {
        username: 'tejas.d',
        password: '123456',
        councilName: apiCouncilName,
      };

      let loginRes = await fetch('https://apiptisplanapp.tabamc.in/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authBody)
      });

      if (!loginRes.ok && apiCouncilName !== 'THANE_survey') {
        apiCouncilName = 'THANE_survey';
        loginRes = await fetch('https://apiptisplanapp.tabamc.in/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...authBody,
            councilName: 'THANE_survey',
          })
        });
      }

      if (!loginRes.ok) {
        let authErrMsg = `Failed to authenticate drawing tool API: ${loginRes.status}`;
        try {
          const errData = await loginRes.json();
          if (errData?.error) authErrMsg = `${errData.error} (${loginRes.status})`;
          else if (errData?.message) authErrMsg = `${errData.message} (${loginRes.status})`;
        } catch {}
        throw new Error(authErrMsg);
      }
      const loginData = await loginRes.json();
      const token = loginData.token || loginData.access_token || (loginData.data && loginData.data.token);

      if (!token) {
         throw new Error('Failed to retrieve authentication token.');
      }

      // 2. Retrieve launch URL for property from /api/plans/ptis/launch
      const isProd = process.env.NODE_ENV === 'production';
      const defaultReturnBase = isProd
        ? (process.env.PHOTO_PLAN_PROD_RETURN_URL || 'https://ptisthane.scipl.info')
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

      const envBackendUrl =
        getAppConfig().api.baseUrl ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'https://ptisthaneapi.scipl.info.in/api';
      const resolvedPtisBackendUri = (ptisBackendUri || envBackendUrl).replace(/\/api\/?$/, '') || 'https://ptisthaneapi.scipl.info.in';

      let safeReturnUrl: string;
      const defaultReturnPath = propertyId ? `/en/property-tax/ptis?propertyId=${propertyId}` : '/en/property-tax/ptis';
      if (!returnUrl || returnUrl.trim() === '') {
        safeReturnUrl = `${defaultReturnBase}${defaultReturnPath}`;
      } else if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
        safeReturnUrl = `${defaultReturnBase}${returnUrl}`;
      } else {
        try {
          const parsedUrl = new URL(returnUrl);
          const allowedOrigins = [
            new URL(defaultReturnBase).origin,
            'https://ptisthane.scipl.info',
            'https://ptisqa.scipl.info.in',
            'https://ptis.scipl.info.in',
            'http://localhost:3000',
          ];
          const isAllowed = allowedOrigins.includes(parsedUrl.origin) ||
            parsedUrl.hostname.includes('scipl.info') ||
            parsedUrl.hostname.includes('tabamc.in') ||
            parsedUrl.hostname.includes('localhost') ||
            parsedUrl.hostname.includes('127.0.0.1');

          if (isAllowed) {
            safeReturnUrl = returnUrl;
          } else {
            safeReturnUrl = `${defaultReturnBase}${defaultReturnPath}`;
          }
        } catch {
          safeReturnUrl = `${defaultReturnBase}${defaultReturnPath}`;
        }
      }

      const cleanPartition = (!partitionNo || partitionNo.trim() === '' || partitionNo.trim() === '-' || partitionNo.trim() === '0' || partitionNo.trim() === 'null')
        ? null
        : partitionNo.trim();

      const isAmenityProp = Boolean(isAmenity) || (type !== undefined && type !== null && Number(type) === 140);
      const resolvedEntityType = entityType || (isAmenityProp ? 'S' : (cleanPartition ? 'P' : (wingDetailId ? 'W' : (societyDetailId ? 'S' : 'P'))));
      const resolvedSocietyDetailId = (societyDetailId !== undefined && societyDetailId !== null && Number(societyDetailId) > 0) ? Number(societyDetailId) : null;
      const resolvedWingDetailId = (wingDetailId !== undefined && wingDetailId !== null && Number(wingDetailId) > 0) ? Number(wingDetailId) : null;
      const resolvedPhotoTypeId = (photoTypeId !== undefined && photoTypeId !== null && Number(photoTypeId) > 0)
        ? Number(photoTypeId)
        : (type !== undefined && type !== null && Number(type) > 0 ? Number(type) : 1);

      const launchPayload: Record<string, unknown> = {
        councilName: apiCouncilName,
        wardNo: wardNo || '',
        propertyNo: propertyNo || '',
        partitionNo: cleanPartition,
        mode: 'draw',
        returnUrl: safeReturnUrl,
        ptisBackendUri: resolvedPtisBackendUri,
        ptisUsername: finalPtisUsername,
        ptisDisplayName: finalPtisDisplayName,
        ptisUserId: String(finalPtisUserId),
        entityType: resolvedEntityType,
        societyDetailId: resolvedSocietyDetailId,
        wingDetailId: resolvedWingDetailId,
        photoTypeId: resolvedPhotoTypeId,
        propertyId: propertyId ? String(propertyId) : undefined,
      };

      if (type !== undefined && type !== null && String(type).trim() !== '' && String(type).trim().toLowerCase() !== 'null') {
        launchPayload.type = String(type);
      }
      if (isAmenity !== undefined) {
        launchPayload.isAmenity = Boolean(isAmenity);
      }

      // Send JSON object payload to the drawing tool launch API
      let launchRes = await fetch('https://apiptisplanapp.tabamc.in/api/plans/ptis/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(launchPayload)
      });

      // Fallback to GET with query parameters if POST endpoint returns 405/404
      if (!launchRes.ok && (launchRes.status === 405 || launchRes.status === 404)) {
        const queryParams = new URLSearchParams();
        Object.entries(launchPayload).forEach(([key, val]) => {
          if (val !== null && val !== undefined) {
            queryParams.set(key, String(val));
          }
        });
        if (cleanPartition === null) {
          queryParams.set('partitionNo', 'null');
        }

        launchRes = await fetch(`https://apiptisplanapp.tabamc.in/api/plans/ptis/launch?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (!launchRes.ok) {
        let errMsg = `Failed to launch drawing tool API: ${launchRes.status}`;
        try {
          const errData = await launchRes.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          } else if (errData && errData.message) {
            errMsg = errData.message;
          }
        } catch {}
        throw new Error(errMsg);
      }
      const launchData = await launchRes.json();
      const launchUrl = launchData.launchUrl || launchData.url || (launchData.data && launchData.data.launchUrl);

      if (!launchUrl) {
        throw new Error('Launch URL not found in response.');
      }

      const launchPlanName = launchData.planName || launchData.property?.planName || (launchData.data && (launchData.data.planName || launchData.data.property?.planName));
      return { success: true, launchUrl, planName: launchPlanName };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while launching drawing tool.',
      };
    }
  },

  // 11. Sync and import saved floor plan from CAD drawing tool into PTIS
  async syncPlanFromDrawingTool(params: {
    propertyId: number;
    councilName?: string;
    wardNo?: string;
    propertyNo?: string;
    partitionNo?: string | null;
    photoTypeId?: number;
    entityType?: string | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    wingName?: string;
    planName?: string;
  }): Promise<ApiResponse<PropertyPhotoUploadResponseDto>> {
    try {
      const {
        propertyId,
        councilName,
        wardNo,
        propertyNo,
        partitionNo,
        photoTypeId = 5,
        entityType,
        societyDetailId,
        wingDetailId,
        wingName,
        planName,
      } = params;

      if (!propertyId || propertyId <= 0) {
        return { success: false, error: 'Valid PropertyId is required to sync plan.' };
      }

      const rawCouncil =
        (councilName && councilName.trim() !== '' ? councilName.trim() : undefined) ??
        process.env.NEXT_PUBLIC_COUNCIL_NAME ??
        process.env.COUNCIL_NAME ??
        'THANE_survey';

      let apiCouncilName = rawCouncil;
      if (!apiCouncilName || apiCouncilName.toLowerCase().includes('thane') || apiCouncilName.toLowerCase() === 'tmc') {
        apiCouncilName = 'THANE_survey';
      }

      // 1. Authenticate with CAD Drawing Tool API
      const authRes = await fetch('https://apiptisplanapp.tabamc.in/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'tejas.d',
          password: '123456',
          councilName: apiCouncilName,
        }),
      });

      if (!authRes.ok) {
        return { success: false, error: `Failed to authenticate with drawing tool API (${authRes.status})` };
      }

      const authData = await authRes.json();
      const token = authData.token || authData.access_token || (authData.data && authData.data.token);
      if (!token) {
        return { success: false, error: 'Failed to retrieve auth token from drawing tool.' };
      }

      // 2. Resolve Plan Name
      let resolvedPlanName = planName?.trim();

      if (!resolvedPlanName && (wardNo || propertyNo)) {
        try {
          const launchRes = await this.launchDrawingTool({
            propertyId,
            councilName: apiCouncilName,
            returnUrl: 'http://localhost:3000',
            wardNo,
            propertyNo,
            partitionNo,
            entityType: entityType || (partitionNo && partitionNo !== '0' && partitionNo !== '-' ? 'P' : undefined),
            societyDetailId,
            wingDetailId,
            photoTypeId,
          });

          if (launchRes.success) {
            if (launchRes.planName) {
              resolvedPlanName = launchRes.planName;
            } else if (launchRes.launchUrl) {
              try {
                const parsedLaunch = new URL(launchRes.launchUrl);
                const queryPlanName = parsedLaunch.searchParams.get('planName');
                if (queryPlanName) {
                  resolvedPlanName = decodeURIComponent(queryPlanName);
                }
              } catch {}
            }
          }
        } catch {
          // Fallback to manual naming heuristic below
        }
      }

      if (!resolvedPlanName && wardNo && propertyNo) {
        const cleanPart = partitionNo?.trim() || '';
        if (cleanPart && cleanPart !== '-' && cleanPart !== '0') {
          const letterMatch = cleanPart.match(/^([A-Za-z]+)(\d+)?$/);
          if (letterMatch) {
            resolvedPlanName = `${wardNo}-${letterMatch[1]}-${propertyNo}-${letterMatch[2] || '1'}`;
          } else {
            resolvedPlanName = `${wardNo}-${cleanPart}-${propertyNo}`;
          }
        } else {
          resolvedPlanName = `${wardNo}-${propertyNo}`;
        }
      }

      if (!resolvedPlanName) {
        return { success: false, error: 'Could not resolve plan name for property.' };
      }

      // 3. Fetch Plan Details from CAD API
      const planRes = await fetch(`https://apiptisplanapp.tabamc.in/api/plans/${encodeURIComponent(apiCouncilName)}/${encodeURIComponent(resolvedPlanName)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!planRes.ok) {
        return { success: false, error: `Plan '${resolvedPlanName}' not found in drawing tool (${planRes.status}).` };
      }

      const planData = await planRes.json();
      const walls = Array.isArray(planData.walls) ? planData.walls : [];
      const annotations = Array.isArray(planData.annotations) ? planData.annotations : [];

      if (walls.length === 0 && annotations.length === 0) {
        return { success: false, error: `Plan '${resolvedPlanName}' exists but has no walls or room annotations saved yet.` };
      }

      // 4. Generate Vector SVG from CAD Walls and Annotations
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const w of walls) {
        if (w.start) {
          minX = Math.min(minX, Number(w.start.x)); minY = Math.min(minY, Number(w.start.y));
          maxX = Math.max(maxX, Number(w.start.x)); maxY = Math.max(maxY, Number(w.start.y));
        }
        if (w.end) {
          minX = Math.min(minX, Number(w.end.x)); minY = Math.min(minY, Number(w.end.y));
          maxX = Math.max(maxX, Number(w.end.x)); maxY = Math.max(maxY, Number(w.end.y));
        }
      }

      for (const a of annotations) {
        if (a.position) {
          const px = Number(a.position.x);
          const py = Number(a.position.y);
          minX = Math.min(minX, px); minY = Math.min(minY, py);
          maxX = Math.max(maxX, px + (Number(a.wrapWidth) || 120)); maxY = Math.max(maxY, py + 50);
        }
      }

      if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 600; maxY = 600; }

      const padding = 40;
      const vbX = Math.floor(minX - padding);
      const vbY = Math.floor(minY - padding);
      const vbW = Math.max(300, Math.ceil(maxX - minX + padding * 2));
      const vbH = Math.max(300, Math.ceil(maxY - minY + padding * 2));

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${vbW}" height="${vbH}" style="background-color:#ffffff; font-family:Arial, sans-serif;">\n`;
      svg += `  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#ffffff"/>\n`;

      // Draw walls
      for (const w of walls) {
        if (w.start && w.end) {
          const color = w.color || '#008000';
          const thickness = w.thickness || 5;
          svg += `  <line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="${color}" stroke-width="${thickness}" stroke-linecap="square"/>\n`;
        }
      }

      // Draw annotations (room names, dimensions, labels)
      for (const a of annotations) {
        if (a.position && a.text) {
          const lines = String(a.text).split('\n');
          const fontSize = Number(a.fontSize) || 14;
          const fontWeight = a.style === 'bold' ? 'bold' : 'normal';
          const color = a.color || '#000000';
          const posX = Number(a.position.x);
          const posY = Number(a.position.y) + fontSize;
          svg += `  <text x="${posX}" y="${posY}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">\n`;
          lines.forEach((lineText: string, idx: number) => {
            const sanitized = lineText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            svg += `    <tspan x="${posX}" dy="${idx === 0 ? 0 : fontSize * 1.25}">${sanitized}</tspan>\n`;
          });
          svg += `  </text>\n`;
        }
      }

      svg += `</svg>`;

      // 5. Build File and Upload into PTIS Documents
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const svgFile = new File([svgBlob], `${resolvedPlanName}.svg`, { type: 'image/svg+xml' });

      // Check if property already has a photo in this photo type slot
      const existingPhotosRes = await this.getPhotosByProperty(propertyId);
      const existingPlanPhoto = existingPhotosRes.success && Array.isArray(existingPhotosRes.data)
        ? existingPhotosRes.data.find(
            (p) =>
              p.propertyId === propertyId &&
              ((p.photoTypeCode && ['PHOTO_PLAN', 'PROPERTY_PLAN'].includes(p.photoTypeCode.toUpperCase())) ||
              p.photoTypeId === photoTypeId)
          )
        : undefined;

      let uploadResult: ApiResponse<PropertyPhotoUploadResponseDto>;

      if (existingPlanPhoto && existingPlanPhoto.documentGuid) {
        uploadResult = await this.replacePhotoViaGlobalApi(
          svgFile,
          existingPlanPhoto.documentGuid,
          propertyId,
          photoTypeId,
          existingPlanPhoto.propertyPhotoId,
          undefined,
          `Floor Plan - ${resolvedPlanName}`,
          'PHOTO_PLAN',
          wingDetailId ?? undefined,
          societyDetailId ?? undefined,
          wingName
        );
      } else {
        uploadResult = await this.uploadPhotoViaGlobalApi(
          svgFile,
          propertyId,
          photoTypeId,
          0,
          1,
          `Floor Plan - ${resolvedPlanName}`,
          'PHOTO_PLAN',
          wingDetailId ?? undefined,
          societyDetailId ?? undefined,
          wingName
        );
      }

      if (uploadResult.success) {
        invalidatePhotoPlanCache(propertyId);
      }

      return uploadResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while syncing floor plan from CAD tool.',
      };
    }
  }
};
