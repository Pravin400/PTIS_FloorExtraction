/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import type { InventoryBatchDetail, InventoryBatchListResponse } from "@/types/asset/municipal-Asset/new-add-new-asset/inventory-batch.types";
import { getBaseUrl, getBinaryFetchHeaders, documentServerFetch, getInventoryDocumentTypes } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory-document.service";

export const inventoryBatchService = {
  getBatches: async (parentAssetId: number): Promise<ApiResponse<InventoryBatchListResponse>> => {
    return apiClient.get<InventoryBatchListResponse>(
      `/asset-management/AssetInventory/batches/${parentAssetId}`
    );
  },

  getBatchById: async (batchId: number): Promise<ApiResponse<InventoryBatchDetail>> => {
    return apiClient.get<InventoryBatchDetail>(
      `/asset-management/AssetInventory/batch/${batchId}`
    );
  },

  updateBatch: async (batchId: number, updates: any): Promise<ApiResponse<{ message: string; rowsUpdated?: number }>> => {
    return apiClient.put<{ message: string; rowsUpdated?: number }>(
      `/asset-management/AssetInventory/batch/${batchId}`,
      updates
    );
  },

  updateBatchWithFiles: async (batchId: number, formData: FormData): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(
      `/asset-management/AssetInventory/batch/${batchId}/with-files`,
      formData
    );
  },

  deleteBatch: async (batchId: number): Promise<ApiResponse<{ message: string; rowsDeleted?: number }>> => {
    return apiClient.delete<{ message: string; rowsDeleted?: number }>(
      `/asset-management/AssetInventory/batch/${batchId}`
    );
  },

  saveSingleBatchFormData: async (fd: FormData): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const url = `${getBaseUrl()}/asset-management/AssetInventory/batch`;
      const headers = await getBinaryFetchHeaders();

      // Dynamically resolve correct Document Type IDs on the server
      try {
        const typesRes = await getInventoryDocumentTypes();
        if (typesRes.success && typesRes.data) {
          const types = (typesRes.data as any).items || typesRes.data || [];

          const photoType = types.find((t: any) => t.documentTypeName?.toLowerCase().includes("photo") || t.documentTypeCode?.toLowerCase().includes("photo"));
          const realPhotoId = photoType ? (photoType.id || photoType.inventoryDocumentTypeId || 1) : 1;

          const invoiceType = types.find((t: any) => t.documentTypeName?.toLowerCase().includes("invoice") || t.documentTypeCode?.toLowerCase().includes("invoice"));
          const realInvoiceId = invoiceType ? (invoiceType.id || invoiceType.inventoryDocumentTypeId || 2) : 2;

          const metadataStr = fd.get('documentMetadataJson');
          if (metadataStr) {
            const metadata = JSON.parse(String(metadataStr));
            const updatedMetadata = metadata.map((m: any) => {
              if (m.documentTypeId === 1) {
                return { ...m, documentTypeId: Number(realPhotoId) };
              }
              if (m.documentTypeId === 2) {
                return { ...m, documentTypeId: Number(realInvoiceId) };
              }
              return m;
            });
            fd.set('documentMetadataJson', JSON.stringify(updatedMetadata));
          }
        }
      } catch (e) {
        console.warn("Failed to resolve dynamic document type IDs on server, using fallbacks:", e);
      }

      const response = await documentServerFetch(url, {
        method: "POST",
        headers,
        body: fd
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!response.ok || (data && data.success === false)) {
        let errorMsg = data.message || data.error || data.detail || data.title;
        if (data.errors && typeof data.errors === 'object') {
          const errList = Object.entries(data.errors)
            .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          if (errList) errorMsg = errList;
        }
        return { success: false, error: errorMsg || `Failed with status ${response.status}` };
      }

      return { success: true, data: data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save batch"
      };
    }
  },

  postInventoryBatchItem: async (item: any): Promise<{ ok: boolean; data?: any; error?: string }> => {
    const fd = new FormData();

    Object.keys(item).forEach(key => {
      if (key !== 'units' && key !== 'documentFiles' && key !== 'documentMetadata') {
        if (item[key] !== null && item[key] !== undefined && item[key] !== '') {
          if (key === 'inventoryItemModelId' && (Number(item[key]) === 0 || !item[key])) {
            return;
          }
          fd.append(key, String(item[key]));
        }
      }
    });

    if (item.units && Array.isArray(item.units)) {
      fd.append('unitsJson', JSON.stringify(item.units));
    }

    if (item.documentFiles && Array.isArray(item.documentFiles) && item.documentMetadata) {
      fd.append('documentMetadataJson', JSON.stringify(item.documentMetadata));
      item.documentFiles.forEach((file: any, index: number) => {
        const fallbackName = item.documentMetadata[index]?.documentTypeId === 1 ? 'photo.jpg' : 'invoice.pdf';
        fd.append('DocumentFiles', file, file.name || fallbackName);
      });
    }

    const url = `${getBaseUrl()}/asset-management/AssetInventory/batch`;
    const headers = await getBinaryFetchHeaders();

    const response = await documentServerFetch(url, {
      method: "POST",
      headers,
      body: fd
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (response.ok && data && data.success !== false) {
      return { ok: true, data };
    }
    let errorMsg = data?.message || data?.error || data?.detail || data?.title;
    if (data?.errors && typeof data.errors === 'object') {
      const errList = Object.entries(data.errors)
        .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('; ');
      if (errList) errorMsg = errList;
    }
    return { ok: false, error: `${item.itemName}: ${errorMsg || 'Failed with status ' + response.status}` };
  },
};
