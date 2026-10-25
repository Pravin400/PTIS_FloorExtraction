"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";
import { PagedResponse } from "@/types/common.types";
import {
  ActionResult,
  BulkTaxZoningRangeResult,
  CreateTaxZoningRangePayload,
  CreateUlbDocumentPayload,
  TaxZone,
  TaxZoningCoverage,
  TaxZoningRange,
  TaxZoningRangeQuery,
  UlbDocument,
  UpdateTaxZoningRangePayload,
  Ward,
  WardProperty,
  WardZoningAbstractRow,
} from "@/types/taxZoningRange.types";
import {
  getWardPagedServer,
  getTaxZonePagedServer,
  getTaxZoningRangesPagedServer,
  getTaxZoningRangeByIdServer,
  getTaxZoningCoverageServer,
  getWardAbstractServer,
  getUlbDocumentsServer,
  getPropertiesByWardServer,
  createTaxZoningRange,
  updateTaxZoningRange,
  bulkUpsertTaxZoningRanges,
  deleteUlbDocument,
  uploadUlbDocument,
} from "@/lib/api/taxZoningRange/taxZoningRange.service";

const logger = createLogger("TaxZoningRangeActions");
const BASE_PATH = "/property-tax/taxzoningmaster";

async function getCurrentUserId(): Promise<number> {
  const cookieStore = await cookies();
  return getUserIdFromCookies(cookieStore) ?? 0;
}

function toActionError(error: unknown, fallback: string): { error: string; statusCode?: number } {
  if (error instanceof ApiError) {
    return { error: error.responseText || error.message, statusCode: error.statusCode };
  }
  return { error: error instanceof Error ? error.message : fallback };
}

/* ============================ LOOKUPS ============================ */

export async function fetchWardPagedAction(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<Ward>> {
  return getWardPagedServer(pageNumber, pageSize);
}

export async function fetchTaxZonePagedAction(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<TaxZone>> {
  return getTaxZonePagedServer(pageNumber, pageSize);
}

export async function fetchPropertiesByWardAction(wardId: number): Promise<ActionResult<PagedResponse<WardProperty>>> {
  try {
    const data = await getPropertiesByWardServer(wardId);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch properties by ward", { wardId }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.fetchPropertiesFailed"));
    return { success: false, error: message, statusCode };
  }
}

/* ============================ RANGES ============================ */

export async function fetchTaxZoningRangesPagedAction(
  query: TaxZoningRangeQuery
): Promise<ActionResult<PagedResponse<TaxZoningRange>>> {
  try {
    const data = await getTaxZoningRangesPagedServer(query);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch tax zoning ranges", { query }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.fetchRangesFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function fetchTaxZoningRangeByIdAction(
  id: number
): Promise<ActionResult<TaxZoningRange | null>> {
  try {
    const data = await getTaxZoningRangeByIdServer(id);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch tax zoning range by id", { id }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.fetchRangeFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function fetchTaxZoningCoverageAction(
  wardIds?: number[]
): Promise<ActionResult<TaxZoningCoverage>> {
  try {
    const data = await getTaxZoningCoverageServer(wardIds);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch coverage", { wardIds }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.fetchCoverageFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function fetchWardAbstractAction(
  pageNumber = 1,
  pageSize = 10,
  searchTerm?: string
): Promise<ActionResult<PagedResponse<WardZoningAbstractRow>>> {
  try {
    const data = await getWardAbstractServer(pageNumber, pageSize, searchTerm);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch ward abstract", {}, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.fetchWardAbstractFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function createTaxZoningRangeAction(
  payload: Omit<CreateTaxZoningRangePayload, "createdBy">
): Promise<ActionResult<TaxZoningRange[]>> {
  try {
    const userId = await getCurrentUserId();
    const data = await createTaxZoningRange({ ...payload, createdBy: userId, isActive: true });
    revalidatePath(BASE_PATH);
    const t = await getTranslations("taxZoningRange");
    return { success: true, data, message: t("messages.createSuccess") };
  } catch (error) {
    logger.error("Failed to create tax zoning range", { payload }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.createFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function updateTaxZoningRangeAction(
  id: number,
  payload: Omit<UpdateTaxZoningRangePayload, "updatedBy">
): Promise<ActionResult<TaxZoningRange>> {
  try {
    const userId = await getCurrentUserId();
    const data = await updateTaxZoningRange(id, { ...payload, updatedBy: userId, isActive: true });
    revalidatePath(BASE_PATH);
    const t = await getTranslations("taxZoningRange");
    return { success: true, data, message: t("messages.updateSuccess") };
  } catch (error) {
    logger.error("Failed to update tax zoning range", { id, payload }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.updateFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function bulkUpsertTaxZoningRangesAction(
  items: CreateTaxZoningRangePayload[]
): Promise<ActionResult<BulkTaxZoningRangeResult>> {
  try {
    const userId = await getCurrentUserId();
    const data = await bulkUpsertTaxZoningRanges(
      items.map((i) => ({ ...i, createdBy: userId, isActive: true }))
    );
    revalidatePath(BASE_PATH);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to bulk upsert tax zoning ranges", { count: items.length }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.bulkUpdateFailed"));
    return { success: false, error: message, statusCode };
  }
}

/* ============================ ULB DOCUMENTS ============================ */

export async function fetchUlbDocumentsAction(typeCodes: string[]): Promise<
  ActionResult<UlbDocument[]>
> {
  try {
    const data = await getUlbDocumentsServer(typeCodes);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch ULB documents", { typeCodes }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.fetchCertificatesFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function uploadUlbDocumentAction(
  formData: FormData
): Promise<ActionResult<number>> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      const t = await getTranslations("taxZoningRange");
      return { success: false, error: t("messages.fileRequired") };
    }

    const payload: CreateUlbDocumentPayload = {
      documentTypeCode: String(formData.get("documentTypeCode") || ""),
    };

    const id = await uploadUlbDocument(file, payload);
    revalidatePath(BASE_PATH);
    const t = await getTranslations("taxZoningRange");
    return { success: true, data: id, message: t("messages.uploadCertificateSuccess") };
  } catch (error) {
    logger.error("Failed to upload ULB document", {}, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.uploadCertificateFailed"));
    return { success: false, error: message, statusCode };
  }
}

export async function deleteUlbDocumentAction(id: number): Promise<ActionResult<null>> {
  try {
    await deleteUlbDocument(id);
    revalidatePath(BASE_PATH);
    const t = await getTranslations("taxZoningRange");
    return { success: true, data: null, message: t("messages.deleteCertificateSuccess") };
  } catch (error) {
    logger.error("Failed to delete ULB document", { id }, error);
    const t = await getTranslations("taxZoningRange");
    const { error: message, statusCode } = toActionError(error, t("messages.deleteCertificateFailed"));
    return { success: false, error: message, statusCode };
  }
}
