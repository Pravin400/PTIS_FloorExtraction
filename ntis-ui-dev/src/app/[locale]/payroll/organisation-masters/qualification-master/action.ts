"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import {
  getQualificationMaster,
  getQualificationMasterPaged,
  createQualificationMaster,
  updateQualificationMaster,
  deleteQualificationMaster,
} from "@/lib/api/payroll/QualificationMaster/qualificationMaster.service";
import type { QualificationMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import {
  createQualificationMasterActionSchema,
  updateQualificationMasterActionSchema,
} from "@/lib/validations/payroll/qualificationMaster.schema";

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
    revalidatePath(`/${locale}/payroll/organisation-masters/qualification-master`, "page");
  }
}

export async function getQualificationMasterPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<QualificationMasterItem>> {
  return await getQualificationMasterPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder, isActive);
}

export async function getAllQualificationMastersAction(): Promise<QualificationMasterItem[]> {
  try {
    return await getQualificationMaster();
  } catch (error) {
    logger.error('Error fetching all qualification masters', { error: error as Error });
    return [];
  }
}

export async function createQualificationMasterAction(
  data: Omit<QualificationMasterItem, "qualificationId">
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const parsed = createQualificationMasterActionSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, message: errorMsg, statusCode: 400 };
    }
    await createQualificationMaster(parsed.data);
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
    const t = await getTranslations("payrollQualificationMaster");
    return { success: false, message: t("errors.createFailed") };
  }
}

export async function updateQualificationMasterAction(
  id: string,
  data: Partial<QualificationMasterItem>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const parsed = updateQualificationMasterActionSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, message: errorMsg, statusCode: 400 };
    }
    await updateQualificationMaster(id, parsed.data);
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
    const t = await getTranslations("payrollQualificationMaster");
    return { success: false, message: t("errors.updateFailed") };
  }
}

export async function deleteQualificationMasterAction(
  id: string
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await deleteQualificationMaster(id);
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
    const t = await getTranslations("payrollQualificationMaster");
    return { success: false, message: t("errors.deleteFailed") };
  }
}
