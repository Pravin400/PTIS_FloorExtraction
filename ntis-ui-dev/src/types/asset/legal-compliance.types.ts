/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssetDocumentDefinitionDto, AssetDocumentDto } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-document.service";

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
  t: any;
}
