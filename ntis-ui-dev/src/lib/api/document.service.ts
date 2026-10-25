import 'server-only';

import { getAppConfig } from '@/config/app.config';
import { apiClient } from '@/services/api.service';
import { serverFetch } from '@/lib/utils/server-fetch';
import { getAuthHeaders } from '@/lib/utils/server-auth-headers';
import { buildDocumentUploadFormData } from '@/lib/utils/document-utils';
import { 
  DocumentUploadParams, 
  DocumentUploadResponse, 
  DocumentDto, 
  DocumentMetadataDto, 
  DocumentReferenceQuery 
} from '@/types/document.types';
import { ApiResponse } from '@/types/common.types';

function getBaseUrl(): string {
  const config = getAppConfig();
  const baseUrl = config.api.baseUrl?.trim();
  if (!baseUrl) throw new Error("Backend API base URL is not configured");
  return baseUrl.replace(/\/+$/, "");
}

export async function uploadDocument(file: File, params?: DocumentUploadParams): Promise<DocumentUploadResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/documents/upload`;
  const headers = await getAuthHeaders();
  const formData = buildDocumentUploadFormData(file, params || {});
  const response = await serverFetch(url, { method: 'POST', headers, body: formData, cache: 'no-store' });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) throw new Error(data.message || data.error || `Upload failed with status ${response.status}`);
  return data.items ?? data.data ?? data;
}

export async function deleteDocument(documentGuid: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/documents/${encodeURIComponent(documentGuid)}`);
}

export async function getDocumentDetails(documentGuid: string): Promise<ApiResponse<DocumentDto>> {
  const response = await apiClient.get<DocumentDto | { items?: DocumentDto; data?: DocumentDto }>(
    `/documents/${encodeURIComponent(documentGuid)}`,
    { cache: 'no-store' }
  );
  if (!response.success) return { success: false, error: response.error, statusCode: response.statusCode };
  const rawData = response.data;
  const unwrapped = (rawData && typeof rawData === 'object' && ('items' in rawData || 'data' in rawData))
    ? ((rawData as Record<string, unknown>).items ?? (rawData as Record<string, unknown>).data ?? rawData)
    : rawData;
  return { success: true, data: unwrapped as DocumentDto, statusCode: response.statusCode };
}

export async function getDocumentByBinding(bindingId: number): Promise<ApiResponse<DocumentDto>> {
  const response = await apiClient.get<DocumentDto | { items?: DocumentDto; data?: DocumentDto }>(
    `/documents/by-binding/${bindingId}`,
    { cache: 'no-store' }
  );
  if (!response.success) return { success: false, error: response.error, statusCode: response.statusCode };
  const rawData = response.data;
  const unwrapped = (rawData && typeof rawData === 'object' && ('items' in rawData || 'data' in rawData))
    ? ((rawData as Record<string, unknown>).items ?? (rawData as Record<string, unknown>).data ?? rawData)
    : rawData;
  return { success: true, data: unwrapped as DocumentDto, statusCode: response.statusCode };
}

export async function getDocumentByReference(params: DocumentReferenceQuery): Promise<ApiResponse<DocumentDto>> {
  const query = new URLSearchParams({
    departmentId: String(params.departmentId),
    moduleId: String(params.moduleId),
    referenceTableName: params.referenceTableName,
    referenceTableId: String(params.referenceTableId),
  }).toString();
  const response = await apiClient.get<DocumentDto | { items?: DocumentDto; data?: DocumentDto }>(
    `/documents/by-reference?${query}`,
    { cache: 'no-store' }
  );
  if (!response.success) return { success: false, error: response.error, statusCode: response.statusCode };
  const rawData = response.data;
  const unwrapped = (rawData && typeof rawData === 'object' && ('items' in rawData || 'data' in rawData))
    ? ((rawData as Record<string, unknown>).items ?? (rawData as Record<string, unknown>).data ?? rawData)
    : rawData;
  return { success: true, data: unwrapped as DocumentDto, statusCode: response.statusCode };
}

export async function getDocumentMetadata(documentGuid: string): Promise<ApiResponse<DocumentMetadataDto>> {
  const response = await apiClient.get<DocumentMetadataDto | { items?: DocumentMetadataDto; data?: DocumentMetadataDto }>(
    `/documents/${encodeURIComponent(documentGuid)}/metadata`,
    { cache: 'no-store' }
  );
  if (!response.success) return { success: false, error: response.error, statusCode: response.statusCode };
  const rawData = response.data;
  const unwrapped = (rawData && typeof rawData === 'object' && ('items' in rawData || 'data' in rawData))
    ? ((rawData as Record<string, unknown>).items ?? (rawData as Record<string, unknown>).data ?? rawData)
    : rawData;
  return { success: true, data: unwrapped as DocumentMetadataDto, statusCode: response.statusCode };
}

export async function updateBindingReference(bindingId: number, refTableId: number): Promise<ApiResponse<void>> {
  return apiClient.put<void>(`/documents/binding/${bindingId}/reference/${refTableId}`);
}

export async function getDocument(documentGuid: string, action: 'view' | 'download') {
  const baseUrl = getBaseUrl();
  const headers = await getAuthHeaders();
  const url = `${baseUrl}/documents/${encodeURIComponent(documentGuid)}/${action}`;

  const response = await serverFetch(url, {
    method: "GET",
    headers: { ...headers, "Accept": "*/*" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch document: ${response.status}`);
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const contentDisposition = response.headers.get("content-disposition") || "";
  const buffer = await response.arrayBuffer();
  return { buffer, contentType, contentDisposition };
}
