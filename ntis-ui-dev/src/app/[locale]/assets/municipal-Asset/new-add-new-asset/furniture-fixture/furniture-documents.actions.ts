/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import {
  getInventoryDocumentTypes,
  uploadInventoryDocument,
  deleteInventoryDocument,
  getInventoryDocumentsByBatch,
  disableInventoryDocumentSlot,
  getDocumentFileByGuidRaw
} from "@/lib/api/asset/municipal-Asset/new-add-new-asset/inventory-document.service";

export const fetchInventoryDocumentTypesAction = async () => {
  const res = await getInventoryDocumentTypes();
  if (res.success && res.data && typeof res.data === 'object' && 'items' in res.data) {
    return { success: true, data: (res.data as any).items };
  }
  return res;
};

export const uploadInventoryDocumentAction = async (formData: FormData) => {
  return await uploadInventoryDocument(formData);
};

export const deleteInventoryDocumentAction = async (inventoryDocumentId: number, batchId?: number, docTypeId?: number) => {
  return await deleteInventoryDocument(inventoryDocumentId, batchId, docTypeId);
};

export const disableInventoryDocumentSlotAction = async (inventoryBatchId: number, documentTypeId: number) => {
  return await disableInventoryDocumentSlot(inventoryBatchId, documentTypeId);
};

export const fetchInventoryDocumentsAction = async (inventoryBatchId: number) => {
  const res = await getInventoryDocumentsByBatch(inventoryBatchId);
  if (res.success && res.data && typeof res.data === 'object' && 'items' in res.data) {
    return { success: true, data: (res.data as any).items };
  }
  return res;
};

export const fetchDocumentByGuidAction = async (
  documentGuid: string
): Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }> => {
  try {
    const res = await getDocumentFileByGuidRaw(documentGuid);
    if (!res.ok) {
      return { success: false, error: "Failed to download document" };
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = res.headers.get("Content-Type") || "application/octet-stream";
    return { success: true, data: base64, mimeType };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to download document" };
  }
};
