
export interface DocumentUploadParams {
  ownerUserId?: number;
  documentType?: string;
  departmentId?: number;
  moduleId?: number;
  referenceTableName?: string;
  referenceTableId?: number;
  referenceTableIdGuid?: string;
  referencePropertyName?: string;
  bindingPurpose?: string;
  isPrimaryDocument?: boolean;
  authDepartmentId?: number;
  authReferenceId?: number;
}

export interface DocumentUploadResponse {
  documentGuid: string;
  documentId: number;
  documentBindingId?: number;
  fileName?: string;
  fileSizeBytes: number;
  storagePath?: string;
}

export interface DocumentDto {
  id: number;
  documentGuid: string;
  uploadedByUserId?: number;
  fileName?: string;
  originalFileName?: string;
  fileExtension?: string;
  mimeType?: string;
  fileSizeBytes: number;
  storageProvider?: string;
  storagePath?: string;
  documentType?: string;
  documentCategory?: string;
  description?: string;
  uploadStatusCode?: string;
  scanStatusCode?: string;
  downloadCount: number;
  createdDate?: string;
  isActive: boolean;
}

export interface DocumentMetadataDto {
  documentGuid: string;
  documentTitle?: string;
  description?: string;
  documentType?: string;
  documentCategory?: string;
  mimeType: string;
  fileSizeBytes: number;
  originalFileName: string;
  fileExtension: string;
  uploadedByUserId?: number;
  createdDate?: string;
  checksumSha256?: string;
  uploadStatusCode: string;
  scanStatusCode?: string;
  documentBindingIds: number[];
  markedForDeletion: boolean;
  markedForDeletionDate?: string;
  downloadCount: number;
}

export interface DocumentReferenceQuery {
  departmentId: number;
  moduleId: number;
  referenceTableName: string;
  referenceTableId: number;
}
