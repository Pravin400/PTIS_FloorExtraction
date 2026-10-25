import 'server-only';

import { apiClient } from '@/services/api.service';
import type { DesignerSourceAsset } from '@/types/report-designer.types';

interface DocumentUploadResult {
  documentGuid?: string;
  fileName?: string;
  fileSizeBytes?: number;
}

interface DocumentUploadEnvelope {
  success?: boolean;
  message?: string;
  items?: DocumentUploadResult;
  Items?: DocumentUploadResult;
}

export async function uploadReportSourceDocument(
  file: File,
  documentType: 'HtmlReportReferencePdf' | 'HtmlReportCrystalSource',
): Promise<DesignerSourceAsset> {
  const form = new FormData();
  form.append('File', file, file.name);
  form.append('DocumentType', documentType);
  form.append('BindingPurpose', 'HTML report design source');
  form.append('IsPrimaryDocument', 'false');

  const response = await apiClient.fetch('/documents/upload', {
    method: 'POST',
    body: form,
  });
  const raw = await response.text();
  let envelope: DocumentUploadEnvelope | null = null;
  try {
    envelope = raw ? JSON.parse(raw) as DocumentUploadEnvelope : null;
  } catch {
    // The caller receives the upstream status and a bounded response excerpt.
  }
  if (!response.ok) {
    throw new Error(
      envelope?.message
      || `Document upload failed (HTTP ${response.status}). ${raw.slice(0, 240)}`,
    );
  }

  const uploaded = envelope?.items ?? envelope?.Items;
  if (!uploaded?.documentGuid) {
    throw new Error('Document storage did not return a document identifier.');
  }

  return {
    documentGuid: uploaded.documentGuid,
    fileName: uploaded.fileName || file.name,
    contentType: file.type || (documentType === 'HtmlReportReferencePdf'
      ? 'application/pdf'
      : 'application/octet-stream'),
    sizeBytes: uploaded.fileSizeBytes ?? file.size,
  };
}

