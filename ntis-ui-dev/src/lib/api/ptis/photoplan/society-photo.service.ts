import 'server-only';

import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import { uploadDocument, deleteDocument } from "../../document.service";
import { DocumentUploadParams } from "@/types/document.types";
import { DEPARTMENT_ID, MODULE_ID, REFERENCE_TABLE } from "../../../constants/document.constants";
import type { 
  SocietyPhotoDto, 
  SocietyPhotoTypeWithStatusDto, 
  SocietyPhotoUploadResponseDto,
  SocietyPhotoGalleryDto
} from "@/types/photoplan.types";

interface BackendApiResponseWrapper<T> {
  success: boolean;
  message?: string;
  items: T;
  errors?: string[];
}

export const societyPhotoService = {
  // 1. GET - All current photos for a society (EntityType = 'S', SocietyDetailId)
  async getPhotosBySociety(societyId: number): Promise<ApiResponse<SocietyPhotoDto[]>> {
    const response = await apiClient.get<BackendApiResponseWrapper<SocietyPhotoDto[]>>(`/society-photos/society/${societyId}`, {
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

  // 1b. GET - All grouped photos for a society (nested by category)
  async getGroupedPhotosBySociety(societyId: number): Promise<ApiResponse<SocietyPhotoGalleryDto>> {
    const response = await apiClient.get<BackendApiResponseWrapper<SocietyPhotoGalleryDto>>(`/society-photos/society/${societyId}/grouped`, {
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

  // 2. GET - All active photo types with status for a society
  async getPhotoTypesWithStatus(societyId: number): Promise<ApiResponse<SocietyPhotoTypeWithStatusDto[]>> {
    const response = await apiClient.get<BackendApiResponseWrapper<SocietyPhotoTypeWithStatusDto[]>>(`/society-photos/types-with-status/${societyId}`, {
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

  // 3. POST - Upload a society photo using global upload API with reference to ptis.PropertyPhoto (SocietyDetailId)
  async uploadSocietyPhoto(
    file: File,
    societyId: number,
    photoTypeId: number,
    societyPhotoId: number = 0,
    displayOrder?: number,
    remarks?: string,
    photoTypeCode?: string
  ): Promise<ApiResponse<SocietyPhotoUploadResponseDto>> {
    try {
      const isNew = societyPhotoId <= 0;

      const uploadParams: DocumentUploadParams = {
        departmentId: DEPARTMENT_ID.PTIS,
        moduleId: MODULE_ID.SocietyPhoto,
        bindingPurpose: remarks || "Society Photo",
        documentType: photoTypeCode || String(photoTypeId),
        isPrimaryDocument: true,
        referenceTableName: REFERENCE_TABLE.PropertyPhoto,
      };

      if (!isNew) {
        uploadParams.referenceTableId = societyPhotoId;
        uploadParams.referencePropertyName = "Id";
      } else {
        uploadParams.referenceTableId = societyId;
        uploadParams.referencePropertyName = "SocietyDetailId";
      }

      const uploadResponse = await uploadDocument(file, uploadParams);

      if (!uploadResponse.documentGuid) {
        throw new Error("Failed to retrieve document GUID from upload.");
      }

      const photosResponse = await this.getPhotosBySociety(societyId);
      const newPhoto = photosResponse.success && photosResponse.data
        ? photosResponse.data.find((p) => p.documentGuid === uploadResponse.documentGuid || p.documentBindingId === uploadResponse.documentBindingId)
        : null;

      return {
        success: true,
        data: {
          societyPhotoId: newPhoto?.societyPhotoId || societyPhotoId,
          documentGuid: newPhoto?.documentGuid || uploadResponse.documentGuid,
          documentId: uploadResponse.documentId,
          documentBindingId: newPhoto?.documentBindingId || uploadResponse.documentBindingId || 0,
          societyId: societyId,
          photoTypeId: photoTypeId,
          displayOrder: displayOrder,
          remarks: remarks || "",
          fileName: file.name,
          fileSizeBytes: file.size,
          storagePath: uploadResponse.storagePath ?? "",
          viewUrl: `/api/documents/${newPhoto?.documentGuid || uploadResponse.documentGuid}/view`,
          downloadUrl: `/api/documents/${newPhoto?.documentGuid || uploadResponse.documentGuid}/download`
        }
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  // 4. DELETE - Delete a society photo document
  async deleteSocietyPhoto(documentGuid: string): Promise<ApiResponse<void>> {
    return await deleteDocument(documentGuid);
  }
};
