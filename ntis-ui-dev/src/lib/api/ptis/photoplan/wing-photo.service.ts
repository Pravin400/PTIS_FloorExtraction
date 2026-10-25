import 'server-only';

import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import { uploadDocument, deleteDocument } from "../../document.service";
import { DocumentUploadParams } from "@/types/document.types";
import { DEPARTMENT_ID, MODULE_ID, REFERENCE_TABLE } from "../../../constants/document.constants";
import type { 
  WingPhotoDto, 
  WingPhotoTypeWithStatusDto, 
  WingPhotoUploadResponseDto,
  WingPhotoGalleryDto
} from "@/types/photoplan.types";

interface BackendApiResponseWrapper<T> {
  success: boolean;
  message?: string;
  items: T;
  errors?: string[];
}

export const wingPhotoService = {
  // 1. GET - All current photos for a wing (EntityType = 'W', WingDetailId)
  async getPhotosByWing(wingId: number): Promise<ApiResponse<WingPhotoDto[]>> {
    const response = await apiClient.get<BackendApiResponseWrapper<WingPhotoDto[]>>(`/wing-photos/wing/${wingId}`, {
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

  // 1b. GET - All grouped photos for a wing (nested by category)
  async getGroupedPhotosByWing(wingId: number): Promise<ApiResponse<WingPhotoGalleryDto>> {
    const response = await apiClient.get<BackendApiResponseWrapper<WingPhotoGalleryDto>>(`/wing-photos/wing/${wingId}/grouped`, {
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

  // 2. GET - All active photo types with status for a wing
  async getPhotoTypesWithStatus(wingId: number): Promise<ApiResponse<WingPhotoTypeWithStatusDto[]>> {
    const response = await apiClient.get<BackendApiResponseWrapper<WingPhotoTypeWithStatusDto[]>>(`/wing-photos/types-with-status/${wingId}`, {
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

  // 3. POST - Upload a wing photo using global upload API with reference to ptis.PropertyPhoto (WingDetailId)
  async uploadWingPhoto(
    file: File,
    wingId: number,
    photoTypeId: number,
    wingPhotoId: number = 0,
    displayOrder?: number,
    remarks?: string,
    photoTypeCode?: string
  ): Promise<ApiResponse<WingPhotoUploadResponseDto>> {
    try {
      const isNew = wingPhotoId <= 0;

      const uploadParams: DocumentUploadParams = {
        departmentId: DEPARTMENT_ID.PTIS,
        moduleId: MODULE_ID.WingPhoto,
        bindingPurpose: remarks || "Wing Photo",
        documentType: photoTypeCode || String(photoTypeId),
        isPrimaryDocument: true,
        referenceTableName: REFERENCE_TABLE.PropertyPhoto,
      };

      if (!isNew) {
        uploadParams.referenceTableId = wingPhotoId;
        uploadParams.referencePropertyName = "Id";
      } else {
        uploadParams.referenceTableId = wingId;
        uploadParams.referencePropertyName = "WingDetailId";
      }

      const uploadResponse = await uploadDocument(file, uploadParams);

      if (!uploadResponse.documentGuid) {
        throw new Error("Failed to retrieve document GUID from upload.");
      }

      const photosResponse = await this.getPhotosByWing(wingId);
      const newPhoto = photosResponse.success && photosResponse.data
        ? photosResponse.data.find((p) => p.documentGuid === uploadResponse.documentGuid || p.documentBindingId === uploadResponse.documentBindingId)
        : null;

      return {
        success: true,
        data: {
          wingPhotoId: newPhoto?.wingPhotoId || wingPhotoId,
          documentGuid: newPhoto?.documentGuid || uploadResponse.documentGuid,
          documentId: uploadResponse.documentId,
          documentBindingId: newPhoto?.documentBindingId || uploadResponse.documentBindingId || 0,
          wingId: wingId,
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

  // 4. DELETE - Delete a wing photo document
  async deleteWingPhoto(documentGuid: string): Promise<ApiResponse<void>> {
    return await deleteDocument(documentGuid);
  }
};
