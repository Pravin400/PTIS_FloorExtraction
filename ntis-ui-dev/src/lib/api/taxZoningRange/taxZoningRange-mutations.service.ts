import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError, handleApiResponse } from "@/lib/utils/api";
import { uploadDocument } from "@/lib/api/document.service";
import {
  DEPARTMENT_ID,
  MODULE_ID,
  REFERENCE_TABLE,
  DOCUMENT_TYPE,
} from "@/lib/constants/document.constants";
import {
  BulkTaxZoningRangeResult,
  CreateTaxZoningRangePayload,
  CreateUlbDocumentPayload,
  TaxZoningDocumentKind,
  TaxZoningRange,
  UpdateTaxZoningRangePayload,
} from "@/types/taxZoningRange.types";

/** Shape of every mutation response returned by the backend's ApiResponse<T> (camelCase JSON). */
interface WrappedApiResponse<T> {
  success: boolean;
  message?: string;
  items?: T;
  errors?: string[] | null;
}

/** POST /api/tax-zoning-ranges — returns an array (multi-ward creates multiple rows). */
export async function createTaxZoningRange(
  payload: CreateTaxZoningRangePayload
): Promise<TaxZoningRange[]> {
  const response = await apiClient.post<WrappedApiResponse<TaxZoningRange[]>>(
    "/tax-zoning-ranges",
    payload
  );

  const t = await getTranslations("taxZoningRange");
  const wrapped = handleApiResponse(response, t("messages.createFailed"));
  if (!wrapped.items) {
    throw new ApiError(response.statusCode || 500, wrapped.message || t("messages.createFailed"), "createTaxZoningRange");
  }
  return wrapped.items;
}

/** PUT /api/tax-zoning-ranges/{id} */
export async function updateTaxZoningRange(
  id: number,
  payload: UpdateTaxZoningRangePayload
): Promise<TaxZoningRange> {
  const response = await apiClient.put<WrappedApiResponse<TaxZoningRange>>(
    `/tax-zoning-ranges/${id}`,
    payload
  );

  const t = await getTranslations("taxZoningRange");
  const wrapped = handleApiResponse(response, t("messages.updateFailed"));
  if (!wrapped.items) {
    throw new ApiError(response.statusCode || 500, wrapped.message || t("messages.updateFailed"), "updateTaxZoningRange");
  }
  return wrapped.items;
}

/** POST /api/tax-zoning-ranges/bulk */
export async function bulkUpsertTaxZoningRanges(
  items: CreateTaxZoningRangePayload[]
): Promise<BulkTaxZoningRangeResult> {
  const response = await apiClient.post<WrappedApiResponse<BulkTaxZoningRangeResult>>(
    "/tax-zoning-ranges/bulk",
    { items }
  );

  const t = await getTranslations("taxZoningRange");
  if (!response.success || !response.data?.items) {
    throw new ApiError(
      response.statusCode || 500,
      response.data?.message || response.error || t("messages.bulkUpdateFailed"),
      "bulkUpsertTaxZoningRanges"
    );
  }

  return response.data.items;
}

/** POST /api/ulb-documents — creates the metadata row and returns its Id. */
export async function createUlbDocumentMetadata(
  payload: CreateUlbDocumentPayload
): Promise<number> {
  const response = await apiClient.post<WrappedApiResponse<number>>(
    "/ulb-documents",
    payload
  );

  const t = await getTranslations("taxZoningRange");
  if (!response.success || response.data?.items === undefined || response.data?.items === null) {
    throw new ApiError(
      response.statusCode || 500,
      response.data?.message || response.error || t("messages.createCertificateFailed"),
      "createUlbDocumentMetadata"
    );
  }

  return response.data.items;
}

/** DELETE /api/ulb-documents/{id} */
export async function deleteUlbDocument(id: number): Promise<void> {
  const response = await apiClient.delete<WrappedApiResponse<object>>(`/ulb-documents/${id}`);

  const t = await getTranslations("taxZoningRange");
  if (!response.success || !response.data?.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.data?.message || response.error || t("messages.deleteCertificateFailed"),
      "deleteUlbDocument"
    );
  }
}

/**
 * Two-step upload flow: create the metadata row first (to get its Id), then call the existing
 * generic document-upload endpoint with that Id as ReferenceTableId. The backend's
 * ULBDocumentBindingHandler auto-links DocumentBindingId after the upload.
 */
export async function uploadUlbDocument(
  file: File,
  meta: CreateUlbDocumentPayload
): Promise<number> {
  const id = await createUlbDocumentMetadata(meta);

  await uploadDocument(file, {
    departmentId: DEPARTMENT_ID.PTIS,
    moduleId: MODULE_ID.UlbDocument,
    referenceTableName: REFERENCE_TABLE.UlbDocument,
    referenceTableId: id,
    documentType: DOCUMENT_TYPE.UlbDocument,
    isPrimaryDocument: true,
  });

  return id;
}

export type { TaxZoningDocumentKind };
