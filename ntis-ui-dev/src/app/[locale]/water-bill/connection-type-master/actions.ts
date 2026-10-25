"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { getLoggedInUserId } from "@/lib/utils/cookie.server";
import { getConnectionTypePaged, deleteConnectionType, createConnectionType, updateConnectionType, getConnectionTypeById } from "@/lib/api/water-bill/connectionTypeMaster.service";
import type { ConnectionType, PagedResponse } from "@/types/waterBill/connectionTypeMaster.types";

export async function getConnectionTypePagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  statusFilter?: string
): Promise<PagedResponse<ConnectionType>> {
  try {
    return await getConnectionTypePaged(pageNumber, pageSize, searchTerm, statusFilter);
  } catch (_error) {
    return { items: [], pageNumber: 1, pageSize, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false };
  }
}

export async function getConnectionTypeByIdAction(id: number): Promise<ConnectionType> {
  return await getConnectionTypeById(id);
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  statusCode?: number;
  error?: string;
  data?: T;
}

function sanitizeErrorMessage(rawMsg: string | undefined, defaultMsg: string, duplicateMsg: string): string {
  if (!rawMsg) return defaultMsg;
  // Strip any API function context prefix like "createConnectionType: " or "updateConnectionType: "
  const cleaned = rawMsg.replace(/^([a-zA-Z0-9_]+:\s*)+/, "").trim();
  if (/already exists|duplicate/i.test(cleaned)) {
    return duplicateMsg;
  }
  return cleaned || defaultMsg;
}

export async function deleteConnectionTypeAction(id: number): Promise<ActionResponse> {
  const t = await getTranslations("connectionTypeMaster.connectionType.messages");
  try {
    await deleteConnectionType(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("deleteError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}

export async function createConnectionTypeAction(data: {
  connectionTypeCode?: string;
  connectionType: string;
  description: string;
  isActive: boolean;
}) {
  const t = await getTranslations("connectionTypeMaster.connectionType.messages");
  try {
    const userId = await getLoggedInUserId();
    const result = await createConnectionType(data, userId !== 0 ? userId : undefined);
    revalidatePath("/", "layout");
    return { success: true, data: result };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("createError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}

export async function updateConnectionTypeAction(
  id: number,
  data: {
    connectionTypeCode?: string;
    connectionType: string;
    description: string;
    isActive: boolean;
  }
) {
  const t = await getTranslations("connectionTypeMaster.connectionType.messages");
  try {
    const userId = await getLoggedInUserId();
    const result = await updateConnectionType(id, data, userId !== 0 ? userId : undefined);
    revalidatePath("/", "layout");
    return { success: true, data: result };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("updateError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}

