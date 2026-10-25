/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  BackendApiResponse,
  AssetDocumentDefinitionParams,
  AssetDocumentDefinitionDto,
  AssetDocumentDto,
  AssetDocumentUploadFormData,
  AssetDocumentUploadResponseDto,
  FileMetadataItem,
  AssetDocumentBulkUploadFormData,
  BulkUploadFailureDto,
  AssetDocumentBulkUploadResponseDto,
  CreateDocumentDefinitionPayload,
  UpdateDocumentDefinitionPayload,
} from '@/types/asset/municipal-Asset/new-add-new-asset/asset-document.types';

export type {
  AssetDocumentDefinitionParams,
  AssetDocumentDefinitionDto,
  AssetDocumentDto,
  AssetDocumentUploadFormData,
  AssetDocumentUploadResponseDto,
  FileMetadataItem,
  AssetDocumentBulkUploadFormData,
  BulkUploadFailureDto,
  AssetDocumentBulkUploadResponseDto,
  CreateDocumentDefinitionPayload,
  UpdateDocumentDefinitionPayload,
};

import { ApiResponse } from "@/types/common.types";
import { appConfig } from "@/config/app.config";




















const BASE_URL =
  typeof window !== 'undefined'
    ? (window.__RUNTIME_CONFIG__?.apiBaseUrl || appConfig.api.baseUrl)
    : (process.env.NEXT_PUBLIC_API_BASE_URL || appConfig.api.baseUrl);

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, { ...options, cache: 'no-store' });
    const text = await response.text();
    let data: BackendApiResponse<T> | null = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch { }
    }
    if (!response.ok) {
      return { success: false, message: data?.message || `${response.status}: ${response.statusText}`, statusCode: response.status };
    }
    return { success: true, data: data?.items ?? data?.data ?? (data as unknown as T), message: data?.message, statusCode: response.status };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Network error' };
  }
}





export const assetDocumentService = {
  getDefinitions: async (assetCategoryId: number, assetTypeId?: number): Promise<ApiResponse<AssetDocumentDefinitionDto[]>> => {
    const params = new URLSearchParams();
    params.append("assetCategoryId", assetCategoryId.toString());
    if (assetTypeId) params.append("assetTypeId", assetTypeId.toString());
    return apiRequest<AssetDocumentDefinitionDto[]>(`/AssetDocument/definitions?${params.toString()}`);
  },

  createDefinition: async (payload: CreateDocumentDefinitionPayload): Promise<ApiResponse<AssetDocumentDefinitionDto>> => {
    return apiRequest<AssetDocumentDefinitionDto>('/AssetDocument/definitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, isActive: true, createdBy: payload.createdBy ?? 1 }),
    });
  },

  updateDefinition: async (id: number, payload: UpdateDocumentDefinitionPayload): Promise<ApiResponse<AssetDocumentDefinitionDto>> => {
    return apiRequest<AssetDocumentDefinitionDto>(`/AssetDocument/definitions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, isActive: true, updatedBy: payload.updatedBy ?? 1 }),
    });
  },

  deleteDefinition: async (id: number): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/AssetDocument/definitions/${id}`, { method: 'DELETE' });
  },
  getByAssetId: async (assetId: number, includeAdHoc: boolean = false, includeDefinitionBased: boolean = false): Promise<ApiResponse<AssetDocumentDto[]>> => {
    let url = `/AssetDocument/by-asset/${assetId}`;
    const params = new URLSearchParams();
    if (includeAdHoc) params.append("includeAdHoc", "true");
    if (includeDefinitionBased) params.append("includeDefinitionBased", "true");
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    return apiRequest<AssetDocumentDto[]>(url);
  },
  getFileByAssetId: async (assetId: number): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/AssetDocument/by-asset/${assetId}/file`);
    if (!response.ok) throw new Error("Failed to download document");
    return response.blob();
  },
  getFileByDocumentId: async (documentId: number): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/AssetDocument/by-asset-document/${documentId}/file`);
    if (!response.ok) throw new Error("Failed to download document file");
    return response.blob();
  },
  upload: async (data: AssetDocumentUploadFormData): Promise<ApiResponse<AssetDocumentUploadResponseDto>> => {
    const formData = new FormData();
    formData.append("File", data.file);
    formData.append("AssetId", data.assetId.toString());
    formData.append("ModuleId", (data.moduleId || 0).toString());
    formData.append("DocumentDefinitionId", data.documentDefinitionId.toString());
    if (data.floorDetailId) formData.append("FloorDetailId", data.floorDetailId.toString());
    if (data.ownerUserId) formData.append("OwnerUserId", data.ownerUserId.toString());
    formData.append("UploadedByUserId", (data.uploadedByUserId || 1).toString());
    if (data.documentType) formData.append("DocumentType", data.documentType);
    if (data.documentTitle) formData.append("DocumentTitle", data.documentTitle);
    if (data.documentDate) formData.append("DocumentDate", data.documentDate);
    if (data.documentNumber) formData.append("DocumentNumber", data.documentNumber);
    if (data.remarks) formData.append("Remarks", data.remarks);
    if (data.isPrimaryDocument !== undefined) formData.append("IsPrimaryDocument", data.isPrimaryDocument.toString());
    if (data.bindingPurpose) formData.append("BindingPurpose", data.bindingPurpose);
    return apiRequest<AssetDocumentUploadResponseDto>("/AssetDocument/upload", { method: 'POST', body: formData });
  },
  uploadBulk: async (data: AssetDocumentBulkUploadFormData): Promise<ApiResponse<AssetDocumentBulkUploadResponseDto>> => {
    const formData = new FormData();
    data.files.forEach((file: any) => formData.append("Files", file));
    formData.append("AssetId", data.assetId.toString());
    formData.append("ModuleId", (data.moduleId || 0).toString());
    if (data.floorDetailId) formData.append("FloorDetailId", data.floorDetailId.toString());
    if (data.ownerUserId) formData.append("OwnerUserId", data.ownerUserId.toString());
    formData.append("UploadedByUserId", (data.uploadedByUserId || 1).toString());
    if (data.fileMetadata && data.fileMetadata.length > 0) {
      formData.append("FileMetadataJson", JSON.stringify(data.fileMetadata));
    } else {
      if (data.documentDefinitionId) formData.append("DocumentDefinitionId", data.documentDefinitionId.toString());
      if (data.documentType) formData.append("DocumentType", data.documentType);
      if (data.documentTitle) formData.append("DocumentTitle", data.documentTitle);
      if (data.documentDate) formData.append("DocumentDate", data.documentDate);
      if (data.documentNumber) formData.append("DocumentNumber", data.documentNumber);
      if (data.remarks) formData.append("Remarks", data.remarks);
      if (data.isPrimaryDocument !== undefined) formData.append("IsPrimaryDocument", data.isPrimaryDocument.toString());
      if (data.bindingPurpose) formData.append("BindingPurpose", data.bindingPurpose);
    }
    return apiRequest<AssetDocumentBulkUploadResponseDto>("/AssetDocument/upload/bulk", { method: 'POST', body: formData });
  },

  /**
   * Delete an uploaded document by ID
   */
  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiRequest<void>(
      `/AssetDocument/${id}`,
      { method: 'DELETE' }
    );
  },
};

export default assetDocumentService;


// ── Server-side / Raw Document Functions ──
import { cookies } from "next/headers";
import { apiClient } from "@/services/api.service";

const LOCAL_HTTPS_RE = /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;
let relaxedTlsDispatcher: import("undici").Dispatcher | undefined;

function getBaseUrl(): string {
  const override = process.env.SERVER_API_BASE_URL?.trim();
  return (override ?? appConfig.api.baseUrl).replace(/\/+$/, "");
}

async function documentServerFetch(url: string, init: RequestInit): Promise<Response> {
  const useRelaxedTls =
    typeof window === "undefined" &&
    process.env.NODE_ENV === "development" &&
    process.env.NTIS_STRICT_LOCAL_TLS !== "1" &&
    LOCAL_HTTPS_RE.test(url);

  if (useRelaxedTls) {
    const undici = await import("undici");
    relaxedTlsDispatcher ??= new undici.Agent({ connect: { rejectUnauthorized: false } });
    return undici.fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.body === null ? undefined : init.body,
      signal: init.signal,
      dispatcher: relaxedTlsDispatcher,
    } as import("undici").RequestInit) as unknown as Promise<Response>;
  }

  return fetch(url, { ...init, cache: "no-store" });
}

async function getBinaryFetchHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: "*/*" };
  try {
    const store = await cookies();
    const token = store.get("auth_token")?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const csrf = store.get("csrf_token")?.value;
    if (csrf) headers["X-CSRF-Token"] = csrf;
    const cookieStr = store
      .getAll()
      .filter((c) => /auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name))
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (cookieStr) headers["Cookie"] = cookieStr;
  } catch { }
  return headers;
}

export async function getDocumentsByAsset(assetId: number | string, includeAdHoc = true, includeDefinitionBased = true) {
  let url = `/asset-documents/asset/${encodeURIComponent(String(assetId))}`;
  const params = new URLSearchParams();
  if (includeAdHoc) params.append("includeAdHoc", "true");
  if (includeDefinitionBased) params.append("includeDefinitionBased", "true");
  const qs = params.toString();
  if (qs) url += `?${qs}`;
  return apiClient.get<unknown>(url);
}

export async function getPhotosAndPlansByAsset(assetId: number | string) {
  return apiClient.get<unknown>(`/asset-documents/asset/${encodeURIComponent(String(assetId))}`);
}

export async function getDocumentFileRaw(assetDocumentId: number | string): Promise<Response> {
  const url = `${getBaseUrl()}/AssetDocument/by-asset-document/${encodeURIComponent(String(assetDocumentId))}/file`;
  const headers = await getBinaryFetchHeaders();
  return documentServerFetch(url, { method: "GET", headers });
}

export async function getDocumentDefinitions(assetCategoryId: number, assetTypeId?: number) {
  const params = new URLSearchParams();
  params.append("assetCategoryId", assetCategoryId.toString());
  if (assetTypeId) params.append("assetTypeId", assetTypeId.toString());
  return apiClient.get<unknown>(`/master/asset-document-definitions?${params.toString()}`);
}

export async function deleteDocument(id: number) {
  let res = await apiClient.delete<unknown>(`/AssetDocument/${id}`);
  if (res.success) return res;

  res = await apiClient.delete<unknown>(`/asset-documents/${id}`);
  if (res.success) return res;

  res = await apiClient.delete<unknown>(`/AssetDocument/by-asset-document/${id}`);
  if (res.success) return res;

  res = await apiClient.delete<unknown>(`/AssetDocument/binding/${id}`);
  if (res.success) return res;

  return res;
}

export async function uploadDocument(formData: FormData) {
  try {
    // Hardcode ModuleId to avoid fetching the entire Module list on every single document upload.
    // Asset Management module is generally ID 2. If it is provided in formData, use that.
    if (!formData.has("ModuleId")) {
      formData.append("ModuleId", "2");
    }
  } catch (e) {
    console.error("Error setting ModuleId", e);
  }

  try {
    const url = `${getBaseUrl()}/AssetDocument/upload`;
    const headers = await getBinaryFetchHeaders();

    // Do NOT set Content-Type header so fetch automatically handles multipart boundary.
    const response = await documentServerFetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok || (data && data.success === false)) {
      return {
        success: false,
        error: data.message || data.error || `Upload failed with status ${response.status}`,
        statusCode: response.status
      };
    }

    return { success: true, data: data.items || data.data || data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload document" };
  }
}

export async function uploadBulkDocuments(formData: FormData) {
  try {
    if (!formData.has("ModuleId")) {
      formData.append("ModuleId", "2");
    }
  } catch (e) {
    console.error("Error setting ModuleId", e);
  }

  const url = `${getBaseUrl()}/AssetDocument/upload/bulk`;
  const headers = await getBinaryFetchHeaders();

  const response = await documentServerFetch(url, {
    method: "POST",
    headers,
    body: formData
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok || (data && data.success === false)) {
    let detailedErr = data.message || data.error || `Bulk upload failed with status ${response.status}`;
    // If backend provided detailed failedUploads, append it to the error string
    if (data.failedUploads && Array.isArray(data.failedUploads) && data.failedUploads.length > 0) {
      detailedErr += ` | Details: ${data.failedUploads.map((f: any) => f.errorMessage).join(", ")}`;
    } else if (data.data && Array.isArray(data.data.failedUploads) && data.data.failedUploads.length > 0) {
      detailedErr += ` | Details: ${data.data.failedUploads.map((f: any) => f.errorMessage).join(", ")}`;
    } else {
      // Just dump the entire response object!
      detailedErr += ` | RAW: ${JSON.stringify(data)}`;
    }
    return { success: false, error: detailedErr, statusCode: response.status, data: data.items || data.data || data };
  }

  return { success: true, data: data.items || data.data || data };
}

export async function saveDocumentWithUpload(formData: FormData) {
  try {
    const url = `${getBaseUrl()}/asset-documents/save-with-upload`;
    const headers = await getBinaryFetchHeaders();

    const response = await documentServerFetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok || (data && data.success === false)) {
      return {
        success: false,
        error: data.message || data.error || `Upload failed with status ${response.status}`,
        statusCode: response.status
      };
    }

    return { success: true, data: data.items || data.data || data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload document" };
  }
}

/**
 * Uploads a document via global POST /documents/upload API
 * Payload FormData contains File, ReferenceTableName="AssetGrievanceDocument", ReferenceTableId, etc.
 */
export async function uploadGrievanceDocument(formData: FormData) {
  try {
    if (!formData.has("DepartmentId")) {
      formData.append("DepartmentId", "1");
    }
    if (!formData.has("ModuleId")) {
      formData.append("ModuleId", "2");
    }

    const url = `${getBaseUrl()}/documents/upload`;
    const headers = await getBinaryFetchHeaders();

    const response = await documentServerFetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok || (data && data.success === false)) {
      return {
        success: false,
        error: data.message || data.error || `Upload failed with status ${response.status}`,
        statusCode: response.status,
      };
    }

    return { success: true, data: data.items || data.data || data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload document" };
  }
}

/**
 * Uploads a Make Payment "Attachment / Proof" file via the generic POST /documents/upload API,
 * ReferenceTableName="LeaseRentBillTransaction", ReferenceTableId=<payment transaction id>.
 */
export async function uploadLeaseRentPaymentAttachment(formData: FormData) {
  if (!formData.has("ReferenceTableName")) {
    formData.append("ReferenceTableName", "LeaseRentBillTransaction");
  }
  return uploadGrievanceDocument(formData);
}


