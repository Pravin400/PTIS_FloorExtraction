import { DocumentUploadParams } from '@/types/document.types';

/**
 * Get the view URL for a document
 */
export function getViewDocumentUrl(documentGuid?: string | null): string {
    if (!documentGuid || typeof documentGuid !== 'string') return '';
    const trimmed = documentGuid.trim();
    return trimmed ? `/api/documents/${encodeURIComponent(trimmed)}/view` : '';
}

/**
 * Alias for getViewDocumentUrl with null return
 */
export function getDocumentViewUrl(documentGuid?: string | null): string | null {
    if (!documentGuid || typeof documentGuid !== 'string') return null;
    const trimmed = documentGuid.trim();
    return trimmed ? `/api/documents/${encodeURIComponent(trimmed)}/view` : null;
}

/**
 * Get the download URL for a document
 */
export function getDownloadDocumentUrl(documentGuid?: string | null): string {
    if (!documentGuid || typeof documentGuid !== 'string') return '';
    const trimmed = documentGuid.trim();
    return trimmed ? `/api/documents/${encodeURIComponent(trimmed)}/download` : '';
}

/**
 * Build FormData for document upload via the global document API
 */
export function buildDocumentUploadFormData(
  file: File,
  params: DocumentUploadParams
): FormData {
  const formData = new FormData();
  formData.append('File', file, file.name);
  if (params.ownerUserId !== undefined) formData.append('OwnerUserId', String(params.ownerUserId));
  if (params.documentType) formData.append('DocumentType', params.documentType);
  if (params.departmentId !== undefined) formData.append('DepartmentId', String(params.departmentId));
  if (params.moduleId !== undefined) formData.append('ModuleId', String(params.moduleId));
  if (params.referenceTableName) formData.append('ReferenceTableName', params.referenceTableName);
  if (params.referenceTableId !== undefined) formData.append('ReferenceTableId', String(params.referenceTableId));
  if (params.referenceTableIdGuid) formData.append('ReferenceTableIdGuid', params.referenceTableIdGuid);
  if (params.referencePropertyName) formData.append('ReferencePropertyName', params.referencePropertyName);
  if (params.bindingPurpose) formData.append('BindingPurpose', params.bindingPurpose);
  if (params.isPrimaryDocument !== undefined) formData.append('IsPrimaryDocument', String(params.isPrimaryDocument));
  if (params.authDepartmentId !== undefined) formData.append('AuthDepartmentId', String(params.authDepartmentId));
  if (params.authReferenceId !== undefined) formData.append('AuthReferenceId', String(params.authReferenceId));
  return formData;
}
