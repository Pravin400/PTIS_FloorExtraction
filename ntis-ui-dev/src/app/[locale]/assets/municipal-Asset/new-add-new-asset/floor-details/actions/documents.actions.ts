/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import {
  uploadDocument,
  uploadBulkDocuments,
  deleteDocument,
  getDocumentsByAsset,
  getDocumentDefinitions
} from '@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-document.service';
import { ActionResult } from '@/types/common.types';

/**
 * Uploads a document via multipart FormData
 */
export async function uploadDocumentAction(formData: FormData): Promise<ActionResult<any>> {
  try {
    const res = await uploadDocument(formData);
    return res.success
      ? { success: true, data: res.data }
      : { success: false, error: res.error || 'Failed to upload document' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload document' };
  }
}

/**
 * Uploads bulk documents via multipart FormData
 */
export async function uploadBulkDocumentsAction(formData: FormData): Promise<ActionResult<any>> {
  try {
    const res = await uploadBulkDocuments(formData);
    return res.success
      ? { success: true, data: res.data }
      : { success: false, error: res.error || 'Failed to upload documents' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload documents' };
  }
}

/**
 * Deletes a document by ID
 */
export async function deleteUploadedDocAction(docId: number): Promise<ActionResult<any>> {
  try {
    const res = await deleteDocument(docId);
    return res.success
      ? { success: true }
      : { success: false, error: res.error || 'Failed to delete document' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete document' };
  }
}

/**
 * Fetches already uploaded documents for a given asset ID
 */
export async function fetchUploadedDocumentsAction(
  assetId: number,
  includeAdHoc = true,
  includeDefinitionBased = true
): Promise<ActionResult<any>> {
  try {
    const res = await getDocumentsByAsset(assetId, includeAdHoc, includeDefinitionBased);
    if (res.success && res.data) {
      const raw = res.data as any;
      const arrayData = Array.isArray(raw) ? raw : raw.items || raw.data || [];
      return { success: true, data: arrayData };
    }
    return { success: false, error: res.error || 'Failed to fetch uploaded documents' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch uploaded documents' };
  }
}

/**
 * Fetches document definitions (e.g. required legal/compliance doc types)
 */
export async function fetchDocumentDefinitionsAction(
  categoryId?: number,
  typeId?: number
): Promise<ActionResult<any>> {
  try {
    const res = await getDocumentDefinitions(categoryId || 0, typeId);
    if (res.success && res.data) {
      const raw = res.data as any;
      const arrayData = Array.isArray(raw) ? raw : raw.items || raw.data || [];
      return { success: true, data: arrayData };
    }
    return { success: false, error: res.error || 'Failed to fetch document definitions' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch document definitions' };
  }
}

/**
 * Uploads/saves a document with associated metadata
 */
export async function saveDocumentWithUploadAction(
  formData: FormData
): Promise<ActionResult<any>> {
  try {
    const res = await uploadDocument(formData);
    return res.success
      ? { success: true, data: res.data }
      : { success: false, error: res.error || 'Failed to save document' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save document' };
  }
}
