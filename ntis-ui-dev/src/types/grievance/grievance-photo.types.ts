/**
 * Grievance Photo Type Definitions
 * Maps to GRV.GrievancePhoto and CORE.Document entities in backend
 */

export interface GrievancePhotoItem {
  id: number;
  grievanceApplicationId: number;
  photoTypeId: number;
  photoTypeCode?: string;
  photoTypeName?: string;
  documentBindingId?: number;
  isLatest?: boolean;
  remarks?: string;
  fileName?: string;
  originalFileName?: string;
  fileExtension?: string;
  mimeType?: string;
  storagePath?: string;
  documentGuid?: string;
}

export interface UploadGrievancePhotoPayload {
  grievanceApplicationId: number;
  photoTypeId?: number;
  remarks?: string;
  file: File | Blob;
  fileName?: string;
}

export interface UploadGrievancePhotoResponse {
  message: string;
  grievancePhotoId: number;
}

export interface UploadMultipleGrievancePhotosPayload {
  grievanceApplicationId: number;
  photoTypeId?: number;
  remarks?: string;
  files: (File | Blob)[];
}

export interface UploadMultipleGrievancePhotosResponse {
  message: string;
  grievancePhotoIds: number[];
}
