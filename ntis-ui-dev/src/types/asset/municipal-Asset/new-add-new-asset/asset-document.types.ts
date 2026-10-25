export interface BackendApiResponse<T> {
  success: boolean;
  message?: string;
  items?: T;
  data?: T;
}

export interface AssetDocumentDefinitionParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  AssetCategoryId?: number | null;
  AssetTypeId?: number | null;
  IsActive?: boolean | null;
  MarkedForDeletion?: boolean;
  SortBy?: string;
  SortOrder?: string;
}

export interface AssetDocumentDefinitionDto {
  id: number;
  assetCategoryId: number;
  assetTypeId: number | null;
  documentCode: string;
  documentName: string;
  description: string | null;
  isRequired: boolean;
  maxFileSizeMB: number;
  allowedExtensions: string;
  displayOrder: number;
}

export interface AssetDocumentDto {
  id: number;
  assetId: number;
  documentDefinitionId: number;
  floorDetailId: number | null;
  fileName: string;
  storedFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  documentNumber: string | null;
  documentDate: string | null;
  documentTitle: string | null;
  documentType: string | null;
  remarks: string | null;
  isPrimaryDocument: boolean;
  bindingPurpose: string | null;
  uploadedByUserId: number;
  createdDate: string;
  documentDefinitionName?: string;
  documentDefinitionCode?: string;
}

export interface AssetDocumentUploadFormData {
  file: File;
  assetId: number;
  moduleId: number;
  documentDefinitionId: number;
  floorDetailId?: number;
  ownerUserId?: number;
  uploadedByUserId?: number;
  documentType?: string;
  documentTitle?: string;
  documentDate?: string;
  documentNumber?: string;
  remarks?: string;
  isPrimaryDocument?: boolean;
  bindingPurpose?: string;
}

export interface AssetDocumentUploadResponseDto {
  id: number;
  assetId: number;
  documentDefinitionId: number;
  fileName: string;
  storedFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  isPrimaryDocument: boolean;
  bindingPurpose: string | null;
  createdDate: string;
}

export interface FileMetadataItem {
  fileName: string;
  documentDefinitionId?: number;
  documentType?: string;
  documentTitle?: string;
  documentDate?: string;
  documentNumber?: string;
  remarks?: string;
  isPrimaryDocument?: boolean;
  bindingPurpose?: string;
}

export interface AssetDocumentBulkUploadFormData {
  files: File[];
  assetId: number;
  moduleId: number;
  floorDetailId?: number;
  ownerUserId?: number;
  uploadedByUserId?: number;
  fileMetadata?: FileMetadataItem[];
  documentDefinitionId?: number;
  documentType?: string;
  documentTitle?: string;
  documentDate?: string;
  documentNumber?: string;
  remarks?: string;
  isPrimaryDocument?: boolean;
  bindingPurpose?: string;
}

export interface BulkUploadFailureDto {
  fileName: string;
  errorMessage: string;
}

export interface AssetDocumentBulkUploadResponseDto {
  successCount: number;
  failureCount: number;
  successfulUploads: AssetDocumentUploadResponseDto[];
  failedUploads: BulkUploadFailureDto[];
}

export interface CreateDocumentDefinitionPayload {
  assetCategoryId: number;
  assetTypeId?: number | null;
  documentCode: string;
  documentName: string;
  description?: string | null;
  isRequired: boolean;
  maxFileSizeMB: number;
  allowedExtensions: string;
  displayOrder: number;
  isActive?: boolean;
  createdBy?: number | string;
}

export interface UpdateDocumentDefinitionPayload extends CreateDocumentDefinitionPayload {
  updatedBy?: number | string;
}
