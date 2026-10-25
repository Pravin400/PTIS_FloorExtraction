/* eslint-disable @typescript-eslint/no-explicit-any */
import { appConfig } from "@/config/app.config";
import { cookies } from "next/headers";
import { apiClient } from "@/services/api.service";

const LOCAL_HTTPS_RE = /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;
let relaxedTlsDispatcher: import("undici").Dispatcher | undefined;

export function getBaseUrl(): string {
  const override = process.env.SERVER_API_BASE_URL?.trim();
  return (override ?? appConfig.api.baseUrl).replace(/\/+$/, "");
}

export async function documentServerFetch(url: string, init: RequestInit): Promise<Response> {
  const isLocalHttps = typeof window === "undefined" && LOCAL_HTTPS_RE.test(url);
  const isStrictTls = process.env.NTIS_STRICT_LOCAL_TLS === "1";

  if (isLocalHttps && !isStrictTls) {
    const { Agent, fetch: uFetch } = await import("undici");
    relaxedTlsDispatcher ??= new Agent({ connect: { rejectUnauthorized: false } });
    return uFetch(url, {
      ...init,
      body: init.body ?? undefined,
      dispatcher: relaxedTlsDispatcher,
    } as unknown as import("undici").RequestInit) as unknown as Promise<Response>;
  }

  return fetch(url, { ...init, cache: "no-store" });
}

export async function getBinaryFetchHeaders(): Promise<Record<string, string>> {
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

export async function getInventoryDocumentTypes() {
  return apiClient.get<unknown>(`/master/inventory-document-types`);
}

export async function uploadInventoryDocument(formData: FormData) {
  const batchId = Number(formData.get("InventoryBatchId") || formData.get("BatchId") || 0);
  const docTypeId = Number(formData.get("DocumentTypeId") || 2);
  const remarks = String(formData.get("Remarks") || (docTypeId === 1 ? "Inventory Photo" : "Inventory Invoice"));
  const file = (formData.get("File") || formData.get("file")) as File | null;
  const deptId = String(formData.get("DepartmentId") || "1");

  if (batchId > 0 && file) {
    try {
      // ── Step 1: BulkSave to register/get slot in AMS.InventoryDocument ───────
      const slotRes = await apiClient.post<any>("/inventory-documents/bulk-save", {
        inventoryBatchId: batchId,
        documents: [
          {
            documentTypeId: docTypeId,
            displayOrder: 1,
            remarks: remarks,
            isEnabled: true,
          },
        ],
      });

      console.log("[uploadInventoryDocument] bulk-save response:", JSON.stringify(slotRes?.data));

      const rawData = slotRes?.data;
      const savedDocs: any[] =
        rawData?.items?.savedDocuments ||
        rawData?.data?.savedDocuments ||
        rawData?.data?.items?.savedDocuments ||
        rawData?.savedDocuments ||
        rawData?.Items?.SavedDocuments ||
        rawData?.data?.Items?.SavedDocuments ||
        (Array.isArray(rawData?.items) ? rawData.items : []) ||
        (Array.isArray(rawData?.data) ? rawData.data : []) ||
        [];

      const slot = savedDocs.find(
        (d: any) => d.documentTypeId === docTypeId || d.DocumentTypeId === docTypeId
      ) || savedDocs[0];

      const slotId = slot?.inventoryDocumentId || slot?.InventoryDocumentId || slot?.id || slot?.Id;

      console.log("[uploadInventoryDocument] resolved slotId:", slotId);

      if (slotId) {
        // ── Step 2: Upload file to /documents/upload with ReferenceTableName = "InventoryDocument" ──
        const uploadFd = new FormData();
        const arrayBuffer = await file.arrayBuffer();
        const safeBlob = new Blob([arrayBuffer], { type: file.type || "application/octet-stream" });

        uploadFd.append("File", safeBlob, file.name || "upload.file");
        uploadFd.append("ReferenceTableName", "InventoryDocument");
        uploadFd.append("ReferenceTableId", String(slotId));
        uploadFd.append("ModuleId", "2");
        uploadFd.append("DepartmentId", deptId);
        uploadFd.append("AuthDepartmentId", deptId);
        uploadFd.append("DocumentType", slot?.documentTypeCode || slot?.DocumentTypeCode || (docTypeId === 1 ? "PHOTO" : "INVOICE"));

        const url = `${getBaseUrl()}/documents/upload`;
        const headers = await getBinaryFetchHeaders();

        const uploadRes = await documentServerFetch(url, { method: "POST", headers, body: uploadFd });
        const text = await uploadRes.text();
        console.log(`[uploadInventoryDocument] /documents/upload status=${uploadRes.status} body=${text.slice(0, 300)}`);

        let data: any;
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

        if (uploadRes.ok && data?.success !== false) {
          return { success: true, data: data.items || data.data || data };
        }

        const errMsg = data?.message || data?.error || data?.title || `Upload endpoint returned ${uploadRes.status}: ${text.slice(0, 200)}`;
        return { success: false, error: errMsg };
      }
    } catch (e: any) {
      console.warn("[uploadInventoryDocument] BulkSave + /documents/upload error:", e);
    }
  }

  // ── Strategy 2: Direct Inventory Document Endpoints ───────────────────────
  if (!formData.has("ModuleId")) formData.append("ModuleId", "2");
  if (batchId > 0 && !formData.has("AssetId")) formData.append("AssetId", String(batchId));
  const docTypeId2 = Number(formData.get("DocumentTypeId") || 2);
  if (!formData.has("DocumentDefinitionId")) formData.append("DocumentDefinitionId", String(docTypeId2));

  const headers = await getBinaryFetchHeaders();

  const endpoints = [
    `${getBaseUrl()}/asset-management/inventory-documents`,
    `${getBaseUrl()}/inventory-documents`,
    `${getBaseUrl()}/InventoryDocument/upload`,
    `${getBaseUrl()}/InventoryDocument`,
    `${getBaseUrl()}/asset-management/AssetInventory/documents`,
    `${getBaseUrl()}/AssetDocument/upload`,
  ];

  let lastError = "Upload failed";
  let lastStatus = 500;
  let lastData: any = null;

  for (const url of endpoints) {
    try {
      const response = await documentServerFetch(url, { method: "POST", headers, body: formData });
      const text = await response.text();
      let data: any;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

      if (response.ok && data?.success !== false) {
        return { success: true, data: data.items || data.data || data };
      }

      if (response.status !== 404 && response.status !== 405) {
        lastError = data?.message || data?.error || `Upload failed with status ${response.status}`;
        lastStatus = response.status;
        lastData = data;
      }
    } catch (e: any) {
      lastError = e.message || "Network error";
    }
  }

  console.error("[uploadInventoryDocument] All strategies failed. Last error:", lastError);
  return { success: false, error: lastError, statusCode: lastStatus, data: lastData };
}

export async function disableInventoryDocumentSlot(inventoryBatchId: number, documentTypeId: number) {
  return apiClient.post<any>("/inventory-documents/bulk-save", {
    inventoryBatchId,
    documents: [
      {
        documentTypeId,
        displayOrder: 1,
        remarks: documentTypeId === 1 ? "Inventory Photo" : "Inventory Invoice",
        isEnabled: false,
      },
    ],
  });
}

export async function deleteInventoryDocument(inventoryDocumentId: number, _batchId?: number, _docTypeId?: number) {
  // NOTE: Do NOT call disableInventoryDocumentSlot here.
  // That call uses POST /inventory-documents/bulk-save which always INSERTs a new row
  // with DocumentBindId=NULL instead of updating the existing row — causing duplicate records.
  // The caller (useAssetsFacilitiesContentState) handles document replacement by:
  //   1. Deleting the old InventoryDocument record (this function)
  //   2. Uploading the new file via updateInventoryBatchWithFilesAction (multipart PUT)

  let res = await apiClient.delete<unknown>(`/inventory-documents/${inventoryDocumentId}`);
  if (res.success) return res;

  res = await apiClient.delete<unknown>(`/InventoryDocument/${inventoryDocumentId}`);
  if (res.success) return res;

  res = await apiClient.delete<unknown>(`/asset-management/inventory-documents/${inventoryDocumentId}`);
  if (res.success) return res;

  return res;
}

export async function getInventoryDocumentsByBatch(inventoryBatchId: number) {
  let res = await apiClient.get<unknown>(`/inventory-documents/inventory-batch/${inventoryBatchId}`);
  if (res.success && res.data) return res;

  res = await apiClient.get<unknown>(`/asset-management/AssetInventory/batch/${inventoryBatchId}/documents`);
  if (res.success && res.data) return res;

  res = await apiClient.get<unknown>(`/InventoryDocument/by-batch/${inventoryBatchId}`);
  if (res.success && res.data) return res;

  return res;
}

export async function getDocumentFileByGuidRaw(documentGuid: string): Promise<Response> {
  const url = `${getBaseUrl()}/documents/${documentGuid}/download`;
  const headers = await getBinaryFetchHeaders();
  return documentServerFetch(url, { method: "GET", headers });
}
