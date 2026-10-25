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
  documentTitle: string | null;
  documentDate: string | null;
  documentNumber: string | null;
  remarks: string | null;
  isVerified: boolean;
  verifiedBy: number | null;
  verifiedDate: string | null;
  verificationRemarks: string | null;
  createdDate: string;
  documentCode: string | null;
  documentName: string | null;
  documentGuid: string | null;
  coreDocumentId: number | null;
  documentBindingId: number | null;
  documentId?: number;
  assetDocumentId?: number;
  DocumentDefinitionId?: number;
  DocumentGuid?: string;
  Id?: number;
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

export type DocumentStatus = "pending" | "uploading" | "uploaded" | "error";

export interface DocumentUploadState {
  definitionId: number;
  status: DocumentStatus;
  file?: File;
  uploadedDoc?: AssetDocumentDto;
  error?: string;
}

export interface LegalCompliancePageProps {
  prefetchedDefinitions?: AssetDocumentDefinitionDto[];
  initialUploadedDocs?: AssetDocumentDto[];
}

export interface DocumentUploadCardProps {
  definition: AssetDocumentDefinitionDto;
  state?: DocumentUploadState;
  onFileSelect: (file: File) => void;
  onDelete: () => void;
  onView?: () => void;
  isViewing?: boolean;
  fileInputRef: (el: HTMLInputElement | null) => void;
  t: (key: string, args?: Record<string, unknown>) => string;
}

export interface Encumbrance {
  id: number;
  type: string;
  details: string;
  fromDate: string;
  toDate: string;
  status: 'Active' | 'Pending';
}

export interface ReservationData {
  reservationType: string;
  reservedFor: string;
  dpRemark: string;
  dpApprovalDate: string;
  dpSheetNo: string;
  reservationEndDate: string;
}

export interface LocationOwnershipContentProps {
  onPrevious?: () => void;
  onSaveAsDraft?: () => void;
  onSaveAndNext?: () => void;
}
