"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { getLoggedInUserId } from "@/lib/utils/cookie.server";
import { getTapSizePaged, deleteTapSize, createTapSize, updateTapSize, getTapSizeById } from "@/lib/api/water-bill/tapSizeMaster.service";
import type { TapSize, PagedResponse } from "@/types/waterBill/tapSizeMaster.types";

export async function getTapSizePagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  statusFilter?: string
): Promise<PagedResponse<TapSize>> {
  try {
    return await getTapSizePaged(pageNumber, pageSize, searchTerm, statusFilter);
  } catch (_error) {
    return { items: [], pageNumber: 1, pageSize, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false };
  }
}

export async function getTapSizeByIdAction(id: number): Promise<TapSize> {
  return await getTapSizeById(id);
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  statusCode?: number;
  error?: string;
  data?: T;
}

function sanitizeErrorMessage(rawMsg: string | undefined, defaultMsg: string, duplicateMsg: string): string {
  if (!rawMsg) return defaultMsg;
  // Strip any API function context prefix like "createTapSize: " or "updateTapSize: "
  const cleaned = rawMsg.replace(/^([a-zA-Z0-9_]+:\s*)+/, "").trim();
  if (/already exists|duplicate/i.test(cleaned)) {
    return duplicateMsg;
  }
  return cleaned || defaultMsg;
}

export async function deleteTapSizeAction(id: number): Promise<ActionResponse> {
  const t = await getTranslations("tapSizeMaster.tapSize.messages");
  try {
    await deleteTapSize(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("deleteError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}

export async function createTapSizeAction(data: {
  tapSizeCode?: string;
  tapSize: string;
  nominalSizeValue?: number | string | null;
  sizeUnit?: string | null;
  isActive: boolean;
}) {
  const t = await getTranslations("tapSizeMaster.tapSize.messages");
  try {
    const userId = await getLoggedInUserId();
    const result = await createTapSize(data, userId !== 0 ? userId : undefined);
    revalidatePath("/", "layout");
    return { success: true, data: result };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("createError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}

export async function updateTapSizeAction(
  id: number,
  data: {
    tapSizeCode?: string;
    tapSize: string;
    nominalSizeValue?: number | string | null;
    sizeUnit?: string | null;
    isActive: boolean;
  }
) {
  const t = await getTranslations("tapSizeMaster.tapSize.messages");
  try {
    const userId = await getLoggedInUserId();
    const result = await updateTapSize(id, data, userId !== 0 ? userId : undefined);
    revalidatePath("/", "layout");
    return { success: true, data: result };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("updateError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}
