import type { AssetDocumentListItem } from '@/types/municipal-asset/detail-tabs.types';

export type LoadedDocumentFile = {
  objectUrl: string;
  contentType: string;
  fileName: string;
  id?: number | string;
  name?: string;
  size?: string | number;
  documentGuid?: string;
  [key: string]: unknown;
};

export interface DocumentPreviewDrawerProps {
  selectedDocument: AssetDocumentListItem | null;
  loadedFile: LoadedDocumentFile | null;
  isLoadingFile: boolean;
  fileError: string | null;
  onClose: () => void;
  onDownload: () => void;
}
