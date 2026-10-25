"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { getLoggedInUserId } from "@/lib/utils/cookie.server";
import {
  getConnectionCategoryPaged,
  deleteConnectionCategory,
  createConnectionCategory,
  updateConnectionCategory,
  getConnectionCategoryById,
  getBillingFrequencyOptions,
} from "@/lib/api/water-bill/connectionCategoryMaster.service";
import type {
  ConnectionCategory,
  BillingFrequencyOption,
  PagedResponse,
} from "@/types/waterBill/connectionCategoryMaster.types";

export async function getConnectionCategoryPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  statusFilter?: string,
  meteredFilter?: string
): Promise<PagedResponse<ConnectionCategory>> {
  try {
    return await getConnectionCategoryPaged(pageNumber, pageSize, searchTerm, statusFilter, meteredFilter);
  } catch (_error) {
    return {
      items: [],
      pageNumber: 1,
      pageSize,
      totalCount: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  }
}

export async function getConnectionCategoryByIdAction(id: number): Promise<ConnectionCategory> {
  return await getConnectionCategoryById(id);
}

export async function getBillingFrequencyOptionsAction(): Promise<BillingFrequencyOption[]> {
  try {
    return await getBillingFrequencyOptions();
  } catch (_error) {
    return [];
  }
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  statusCode?: number;
  error?: string;
  data?: T;
}

function sanitizeErrorMessage(rawMsg: string | undefined, defaultMsg: string, duplicateMsg: string): string {
  if (!rawMsg) return defaultMsg;
  // Strip any API function context prefix like "createConnectionCategory: " or "updateConnectionCategory: "
  const cleaned = rawMsg.replace(/^([a-zA-Z0-9_]+:\s*)+/, "").trim();
  if (/already exists|duplicate/i.test(cleaned)) {
    return duplicateMsg;
  }
  return cleaned || defaultMsg;
}

export async function deleteConnectionCategoryAction(id: number): Promise<ActionResponse> {
  const t = await getTranslations("connectionCategoryMaster.connectionCategory.messages");
  try {
    await deleteConnectionCategory(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("deleteError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}

export async function createConnectionCategoryAction(data: {
  connectionCategoryCode?: string;
  connectionCategory: string;
  billingFrequencyId?: number | null;
  isMetered: boolean;
  billingMethod: string;
  description?: string | null;
  isActive: boolean;
}) {
  const t = await getTranslations("connectionCategoryMaster.connectionCategory.messages");
  try {
    const userId = await getLoggedInUserId();
    const result = await createConnectionCategory(data, userId !== 0 ? userId : undefined);
    revalidatePath("/", "layout");
    return { success: true, data: result };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("createError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}

export async function updateConnectionCategoryAction(
  id: number,
  data: {
    connectionCategoryCode?: string;
    connectionCategory: string;
    billingFrequencyId?: number | null;
    isMetered: boolean;
    billingMethod: string;
    description?: string | null;
    isActive: boolean;
  }
) {
  const t = await getTranslations("connectionCategoryMaster.connectionCategory.messages");
  try {
    const userId = await getLoggedInUserId();
    const result = await updateConnectionCategory(id, data, userId !== 0 ? userId : undefined);
    revalidatePath("/", "layout");
    return { success: true, data: result };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };
    const errorMsg = sanitizeErrorMessage(err?.message, t("updateError"), t("duplicateError"));
    return { success: false, statusCode: err?.statusCode, error: errorMsg };
  }
}
