'use server';

import {
  fetchDocumentDefinitionsService,
  fetchUploadedDocumentsService,
  saveDocumentWithUploadService,
  deleteUploadedDocService,
  fetchAssetDocumentFileService,
  fetchAssetDocumentFileByGuidService,
} from "@/lib/api/asset/municipal-Asset/new-add-new-asset/ownership.server.service";
import type { ActionResult } from "@/types/common.types";

/**
 * Server Action: Fetches document definitions for a specific category and type.
 */
export async function fetchDocumentDefinitionsAction(
  categoryId: number,
  typeId?: number
): Promise<ActionResult<unknown>> {
  return fetchDocumentDefinitionsService(categoryId, typeId);
}

/**
 * Server Action: Fetches uploaded documents for a specific asset ID.
 */
export async function fetchUploadedDocumentsAction(
  assetId: number | string,
  includeAdHoc = true,
  includeDefinitionBased = true
): Promise<ActionResult<unknown>> {
  return fetchUploadedDocumentsService(assetId, includeAdHoc, includeDefinitionBased);
}

/**
 * Server Action: Uploads an asset document file with associated metadata.
 */
export async function saveDocumentWithUploadAction(
  formData: FormData
): Promise<ActionResult<unknown>> {
  return saveDocumentWithUploadService(formData);
}

/**
 * Server Action: Deletes an uploaded asset document record by document ID or GUID.
 */
export async function deleteUploadedDocAction(
  idOrGuid: number | string
): Promise<ActionResult<unknown>> {
  return deleteUploadedDocService(idOrGuid);
}

/**
 * Server Action: Fetches document raw file buffer by asset document ID.
 */
export async function fetchAssetDocumentFileAction(assetDocumentId: number | string) {
  return fetchAssetDocumentFileService(assetDocumentId);
}

/**
 * Server Action: Fetches document file buffer by document GUID.
 */
export async function fetchAssetDocumentFileByGuidAction(documentGuid: string, action: 'view' | 'download' = 'view') {
  return fetchAssetDocumentFileByGuidService(documentGuid, action);
}

