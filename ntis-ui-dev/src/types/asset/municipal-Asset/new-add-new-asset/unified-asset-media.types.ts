export interface UnifiedMediaItem {
  id: string;
  url: string;
  label: string;
  type: 'photo' | 'plan';
  source: 'db' | 'disk';
  photoTypeId?: number;
  photoTypeName?: string;
  photoTypeCode?: string;
  bindingPurpose?: string;
  documentGuid?: string;
  fileName?: string;
}

export interface UnifiedDocumentItem {
  id: string;
  url: string;
  name: string;
  documentTypeName: string;
  bindingPurpose?: string;
  documentDefinitionName?: string;
  documentDefinitionId?: number;
  documentName?: string;
  contentType: string;
  isPdf: boolean;
  fileSize?: number;
  uploadedDate?: string;
  source: 'db' | 'disk';
}

export interface UnifiedAssetMediaResult {
  assetId: number;
  upic: string;
  photos: UnifiedMediaItem[];
  plans: UnifiedMediaItem[];
  documents: UnifiedDocumentItem[];
  counts: {
    photoCount: number;
    planCount: number;
    pdfCount: number;
    docCount: number;
    totalCount: number;
  };
  primaryPhotoUrl?: string;
  primaryPlanUrl?: string;
}
