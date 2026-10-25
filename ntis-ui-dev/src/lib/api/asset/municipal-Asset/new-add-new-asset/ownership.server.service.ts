import { apiClient } from "@/services/api.service";
import { getAppConfig, appConfig } from "@/config/app.config";
import { cookies } from "next/headers";
import { createLogger } from "@/lib/utils/server-logger";
import { getDocument } from "@/lib/api/document.service";
import type { ActionResult } from "@/types/common.types";
import type { AssetDocumentDefinitionDto, AssetDocumentDto } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";

const logger = createLogger("OwnershipServerService");

const LOCAL_HTTPS_RE = /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;
let relaxedTlsDispatcher: import("undici").Dispatcher | undefined;

function getBaseUrl(): string {
  const override = process.env.SERVER_API_BASE_URL?.trim();
  const runtimeUrl = getAppConfig().api.baseUrl?.trim();
  return (override ?? runtimeUrl ?? appConfig.api.baseUrl).replace(/\/+$/, "");
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

async function prepareSafeFormData(formData: FormData): Promise<FormData> {
  const safeFormData = new FormData();
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'object' && value !== null && 'arrayBuffer' in value) {
      const file = value as File;
      const arrayBuffer = await file.arrayBuffer();
      safeFormData.append(key, new Blob([arrayBuffer], { type: file.type || 'application/pdf' }), file.name || "document.pdf");
    } else {
      safeFormData.append(key, value);
    }
  }
  return safeFormData;
}

/**
 * Service function to fetch asset document definitions for a specific category and type.
 */
export async function fetchDocumentDefinitionsService(
  categoryId: number,
  typeId?: number
): Promise<ActionResult<AssetDocumentDefinitionDto[]>> {
  try {
    const params = new URLSearchParams();
    params.append("assetCategoryId", categoryId.toString());
    if (typeId) params.append("assetTypeId", typeId.toString());
    params.append("pageSize", "-1");
    params.append("PageSize", "-1");
    
    const res = await apiClient.get<unknown>(`/master/asset-document-definitions?${params.toString()}`);
    return res as ActionResult<AssetDocumentDefinitionDto[]>;
  } catch (error: unknown) {
    logger.error("fetchDocumentDefinitionsService failed", { categoryId, typeId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch document definitions",
      data: [],
    };
  }
}

/**
 * Service function to fetch uploaded documents for a given asset ID.
 */
export async function fetchUploadedDocumentsService(
  assetId: number | string,
  includeAdHoc = true,
  includeDefinitionBased = true
): Promise<ActionResult<AssetDocumentDto[]>> {
  try {
    if (!assetId) {
      return { success: false, error: "Asset ID is required", data: [] };
    }
    let url = `/asset-documents/asset/${encodeURIComponent(String(assetId))}`;
    const params = new URLSearchParams();
    if (includeAdHoc) params.append("includeAdHoc", "true");
    if (includeDefinitionBased) params.append("includeDefinitionBased", "true");
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await apiClient.get<unknown>(url);
    return res as ActionResult<AssetDocumentDto[]>;
  } catch (error: unknown) {
    logger.error("fetchUploadedDocumentsService failed", { assetId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch uploaded documents",
      data: [],
    };
  }
}

/**
 * Service function to save and upload an asset document with FormData.
 * Performs PUT update when existing document ID is present, else POST.
 */
export async function saveDocumentWithUploadService(
  formData: FormData
): Promise<ActionResult<AssetDocumentDto>> {
  if (!formData.has("ModuleId")) {
    formData.append("ModuleId", "2");
  }

  const rawDocId = formData.get("Id") || formData.get("ExistingDocumentId") || formData.get("AssetDocumentId") || formData.get("id");
  const docId = rawDocId ? String(rawDocId) : null;
  const isUpdate = Boolean(docId && docId !== "0" && docId !== "undefined" && docId !== "null");

  try {
    const headers = await getBinaryFetchHeaders();
    const safeFormData = await prepareSafeFormData(formData);
    const baseUrl = getBaseUrl();

    let response: Response | null = null;

    if (isUpdate && docId) {
      // 1. Try PUT /AssetDocument/{docId}
      try {
        response = await documentServerFetch(`${baseUrl}/AssetDocument/${encodeURIComponent(docId)}`, {
          method: "PUT",
          headers,
          body: safeFormData,
        });
      } catch {}

      // 2. Try PUT /AssetDocument
      if (!response || !response.ok) {
        try {
          response = await documentServerFetch(`${baseUrl}/AssetDocument`, {
            method: "PUT",
            headers,
            body: safeFormData,
          });
        } catch {}
      }

      // 3. Try PUT /asset-documents/{docId}
      if (!response || !response.ok) {
        try {
          response = await documentServerFetch(`${baseUrl}/asset-documents/${encodeURIComponent(docId)}`, {
            method: "PUT",
            headers,
            body: safeFormData,
          });
        } catch {}
      }

      // 4. Try POST /AssetDocument/{docId}/replace
      if (!response || !response.ok) {
        try {
          response = await documentServerFetch(`${baseUrl}/AssetDocument/${encodeURIComponent(docId)}/replace`, {
            method: "POST",
            headers,
            body: safeFormData,
          });
        } catch {}
      }

      // 5. Try PUT /AssetDocument/upload
      if (!response || !response.ok) {
        try {
          response = await documentServerFetch(`${baseUrl}/AssetDocument/upload`, {
            method: "PUT",
            headers,
            body: safeFormData,
          });
        } catch {}
      }
    }

    // New upload or fallback if update endpoints were not available
    if (!response || !response.ok) {
      const primaryUrl = `${baseUrl}/AssetDocument/upload`;
      response = await documentServerFetch(primaryUrl, {
        method: "POST",
        headers,
        body: safeFormData,
      });

      if (!response.ok) {
        const fallbackUrl = `${baseUrl}/asset-documents/save-with-upload`;
        response = await documentServerFetch(fallbackUrl, {
          method: "POST",
          headers,
          body: safeFormData,
        });
      }
    }

    const text = await response.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok || (data && data.success === false)) {
      return {
        success: false,
        error: (data?.message as string) || (data?.error as string) || `Upload failed with status ${response.status}`,
      };
    }

    const item = Array.isArray(data?.items) ? data.items[0] : (data?.data || data);
    return { success: true, data: item as AssetDocumentDto };
  } catch (error: unknown) {
    logger.error("saveDocumentWithUploadService failed", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save document with upload",
    };
  }
}

/**
 * Service function to delete an uploaded document by ID or GUID.
 */
export async function deleteUploadedDocService(
  idOrGuid: number | string
): Promise<ActionResult<unknown>> {
  try {
    if (!idOrGuid) {
      return { success: false, error: "Valid document ID or GUID is required" };
    }

    const str = String(idOrGuid);
    const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

    if (isGuid) {
      return await apiClient.delete<unknown>(`/documents/${str}`);
    }

    const numericId = Number(idOrGuid);
    if (!isNaN(numericId) && numericId > 0) {
      const res = await apiClient.delete<unknown>(`/AssetDocument/${numericId}`);
      if (res.success) return res;
      return await apiClient.delete<unknown>(`/asset-documents/${numericId}`);
    }

    return await apiClient.delete<unknown>(`/documents/${str}`);
  } catch (error: unknown) {
    logger.error("deleteUploadedDocService failed", { idOrGuid, error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

/**
 * Service function to fetch document raw file buffer by asset document ID.
 */
export async function fetchAssetDocumentFileService(assetDocumentId: number | string): Promise<{
  base64: string;
  contentType: string;
  contentDisposition: string | null;
  error: string | null;
}> {
  try {
    if (!assetDocumentId) {
      return { base64: "", contentType: "", contentDisposition: null, error: "Document ID is required" };
    }

    const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(assetDocumentId));
    if (isGuid) {
      return fetchAssetDocumentFileByGuidService(String(assetDocumentId));
    }

    const headers = await getBinaryFetchHeaders();
    const baseUrl = getBaseUrl();
    const idStr = encodeURIComponent(String(assetDocumentId));

    // 1st attempt: try by binding ID to resolve document metadata and GUID
    try {
      const bindingUrl = `${baseUrl}/documents/by-binding/${idStr}`;
      const bindingResp = await documentServerFetch(bindingUrl, { method: "GET", headers });
      if (bindingResp.ok) {
        const bindingJson = await bindingResp.json();
        const docGuid = bindingJson?.items?.documentGuid || bindingJson?.documentGuid || bindingJson?.data?.documentGuid;
        if (docGuid) {
          const byGuidRes = await fetchAssetDocumentFileByGuidService(String(docGuid));
          if (byGuidRes.base64) return byGuidRes;
        }
      }
    } catch {
      // Ignore fallback failure
    }

    // 2nd attempt: /AssetDocument/by-asset-document/{id}/file
    let response = await documentServerFetch(`${baseUrl}/AssetDocument/by-asset-document/${idStr}/file`, { method: "GET", headers });

    // 3rd attempt: /AssetDocument/{id}/file
    if (!response.ok) {
      const r = await documentServerFetch(`${baseUrl}/AssetDocument/${idStr}/file`, { method: "GET", headers });
      if (r.ok) response = r;
    }

    // 4th attempt: /asset-documents/by-asset-document/{id}/file
    if (!response.ok) {
      const r = await documentServerFetch(`${baseUrl}/asset-documents/by-asset-document/${idStr}/file`, { method: "GET", headers });
      if (r.ok) response = r;
    }

    // 5th attempt: /asset-documents/{id}/file
    if (!response.ok) {
      const r = await documentServerFetch(`${baseUrl}/asset-documents/${idStr}/file`, { method: "GET", headers });
      if (r.ok) response = r;
    }

    // 6th attempt: /documents/{id}/view
    if (!response.ok) {
      const r = await documentServerFetch(`${baseUrl}/documents/${idStr}/view`, { method: "GET", headers });
      if (r.ok) response = r;
    }

    // 7th attempt: /AssetDocument/{id}
    if (!response.ok) {
      const r = await documentServerFetch(`${baseUrl}/AssetDocument/${idStr}`, { method: "GET", headers });
      if (r.ok) response = r;
    }

    if (!response.ok) {
      return {
        base64: "",
        contentType: "",
        contentDisposition: null,
        error: response.statusText || "Failed to load document file.",
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      base64,
      contentType: response.headers.get("content-type") || "application/pdf",
      contentDisposition: response.headers.get("content-disposition"),
      error: null,
    };
  } catch (err) {
    logger.error("fetchAssetDocumentFileService failed", { assetDocumentId, error: err });
    return {
      base64: "",
      contentType: "",
      contentDisposition: null,
      error: err instanceof Error ? err.message : "Failed to load document file.",
    };
  }
}

/**
 * Service function to fetch document file buffer by document GUID.
 */
export async function fetchAssetDocumentFileByGuidService(documentGuid: string, action: 'view' | 'download' = 'view'): Promise<{
  base64: string;
  contentType: string;
  contentDisposition: string | null;
  error: string | null;
}> {
  try {
    if (!documentGuid || documentGuid.trim() === "" || documentGuid === "00000000-0000-0000-0000-000000000000") {
      return { base64: "", contentType: "", contentDisposition: null, error: "Invalid document GUID" };
    }

    // 1. Primary: use getDocument from document.service (shared standard)
    try {
      const result = await getDocument(documentGuid, action);
      if (result && result.buffer) {
        const base64 = Buffer.from(result.buffer).toString("base64");
        return {
          base64,
          contentType: result.contentType || "application/pdf",
          contentDisposition: result.contentDisposition || null,
          error: null,
        };
      }
    } catch {
      // Fallback to manual serverFetch
    }

    const endpointPath = action === 'download' ? 'download' : 'view';
    const baseUrl = getBaseUrl();
    const headers = await getBinaryFetchHeaders();
    const primaryUrl = `${baseUrl}/documents/${encodeURIComponent(documentGuid)}/${endpointPath}`;
    let response = await documentServerFetch(primaryUrl, { method: "GET", headers });

    // Fallback attempt 1: try alternate view/download endpoint if primary failed
    if (!response.ok) {
      const alternatePath = action === 'download' ? 'view' : 'download';
      const altUrl = `${baseUrl}/documents/${encodeURIComponent(documentGuid)}/${alternatePath}`;
      const altResp = await documentServerFetch(altUrl, { method: "GET", headers });
      if (altResp.ok) {
        response = altResp;
      }
    }

    // Fallback attempt 2: try direct GET /documents/{documentGuid}
    if (!response.ok) {
      const rawUrl = `${baseUrl}/documents/${encodeURIComponent(documentGuid)}`;
      const rawResp = await documentServerFetch(rawUrl, { method: "GET", headers });
      if (rawResp.ok) {
        response = rawResp;
      }
    }

    // Fallback attempt 3: try /AssetDocument/by-guid/{guid}
    if (!response.ok) {
      const assetDocUrl = `${baseUrl}/AssetDocument/by-guid/${encodeURIComponent(documentGuid)}`;
      const assetDocResp = await documentServerFetch(assetDocUrl, { method: "GET", headers });
      if (assetDocResp.ok) {
        response = assetDocResp;
      }
    }

    if (!response.ok) {
      return {
        base64: "",
        contentType: "",
        contentDisposition: null,
        error: response.statusText || "Failed to load document file by GUID.",
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      base64,
      contentType: response.headers.get("content-type") || "application/pdf",
      contentDisposition: response.headers.get("content-disposition"),
      error: null,
    };
  } catch (err) {
    logger.error("fetchAssetDocumentFileByGuidService failed", { documentGuid, action, error: err });
    return {
      base64: "",
      contentType: "",
      contentDisposition: null,
      error: err instanceof Error ? err.message : "Failed to load document file by GUID.",
    };
  }
}

