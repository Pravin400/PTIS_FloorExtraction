"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  getDesignationMaster,
  getDesignationMasterPaged,
  createDesignationMaster,
  updateDesignationMaster,
  deleteDesignationMaster,
} from "@/lib/api/payroll/DesignationMaster/designationMaster.service";
import type { DesignationMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import {
  createDesignationMasterActionSchema,
  updateDesignationMasterActionSchema,
} from "@/lib/validations/payroll/designationMaster.schema";

function isRedirectError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'digest' in e &&
    typeof (e as { digest?: unknown }).digest === 'string' &&
    String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

function revalidatePayrollPages() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/payroll/organisation-masters`, "page");
    revalidatePath(`/${locale}/payroll/organisation-masters/designation-master`, "page");
  }
}

export async function getDesignationMasterPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<DesignationMasterItem>> {
  return await getDesignationMasterPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder, isActive);
}

export async function getAllDesignationMastersAction(): Promise<DesignationMasterItem[]> {
  try {
    return await getDesignationMaster();
  } catch (error) {
    logger.error('Error fetching all designation masters', { error: error as Error });
    return [];
  }
}

export async function createDesignationMasterAction(
  data: Omit<DesignationMasterItem, "designationId" | "id">
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const parsed = createDesignationMasterActionSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, message: errorMsg, statusCode: 400 };
    }
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    await createDesignationMaster(parsed.data, userId);
    revalidatePayrollPages();
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) return { success: false, message: error.responseText || error.message, statusCode: error.statusCode };
    if (error instanceof Error) return { success: false, message: error.message };
    const t = await getTranslations("payrollDesignationMaster");
    return { success: false, message: t("errors.createFailed") };
  }
}

export async function updateDesignationMasterAction(
  id: string | number,
  data: Partial<DesignationMasterItem>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const parsed = updateDesignationMasterActionSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, message: errorMsg, statusCode: 400 };
    }
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    await updateDesignationMaster(id, parsed.data, userId);
    revalidatePayrollPages();
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) return { success: false, message: error.responseText || error.message, statusCode: error.statusCode };
    if (error instanceof Error) return { success: false, message: error.message };
    const t = await getTranslations("payrollDesignationMaster");
    return { success: false, message: t("errors.updateFailed") };
  }
}

export async function deleteDesignationMasterAction(
  id: string | number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    await deleteDesignationMaster(id);
    revalidatePayrollPages();
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) return { success: false, message: error.responseText || error.message, statusCode: error.statusCode };
    if (error instanceof Error) return { success: false, message: error.message };
    const t = await getTranslations("payrollDesignationMaster");
    return { success: false, message: t("errors.deleteFailed") };
  }
}
