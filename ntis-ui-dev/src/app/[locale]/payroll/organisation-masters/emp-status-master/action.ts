"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import {
  getEmpStatusMasterPaged,
  createEmpStatusMaster,
  updateEmpStatusMaster,
  deleteEmpStatusMaster,
} from "@/lib/api/payroll/EmpStatusMaster/empStatusMaster.service";
import type { EmpStatusMasterPayload, EmpStatusMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import {
  empStatusActionSchema,
  updateEmpStatusActionSchema,
  empStatusIdActionSchema,
} from "@/lib/validations/payroll/empStatusMaster.schema";

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
    revalidatePath(`/${locale}/payroll/organisation-masters/emp-status-master`, "page");
  }
}

export async function getEmpStatusMasterPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<EmpStatusMasterItem>> {
  return await getEmpStatusMasterPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder, isActive);
}

export async function createEmpStatusMasterAction(
  data: EmpStatusMasterPayload
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const parsed = empStatusActionSchema.safeParse(data);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, message: errorMsg, statusCode: 400 };
  }

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    await createEmpStatusMaster(parsed.data, userId);
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
    const t = await getTranslations("payrollEmployeeStatusMaster.messages");
    return { success: false, message: t("createFailed") };
  }
}

export async function updateEmpStatusMasterAction(
  id: string,
  data: Partial<EmpStatusMasterPayload>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const idValidation = empStatusIdActionSchema.safeParse({ id });
  if (!idValidation.success) {
    const t = await getTranslations("payrollEmployeeStatusMaster.messages");
    return { success: false, message: idValidation.error.issues[0]?.message || t("invalidId"), statusCode: 400 };
  }

  const parsed = updateEmpStatusActionSchema.safeParse(data);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
    return { success: false, message: errorMsg, statusCode: 400 };
  }

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    await updateEmpStatusMaster(idValidation.data.id, parsed.data, userId);
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
    const t = await getTranslations("payrollEmployeeStatusMaster.messages");
    return { success: false, message: t("updateFailed") };
  }
}

export async function deleteEmpStatusMasterAction(
  id: string
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const idValidation = empStatusIdActionSchema.safeParse({ id });
  if (!idValidation.success) {
    const t = await getTranslations("payrollEmployeeStatusMaster.messages");
    return { success: false, message: idValidation.error.issues[0]?.message || t("invalidId"), statusCode: 400 };
  }

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    await deleteEmpStatusMaster(idValidation.data.id);
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
    const t = await getTranslations("payrollEmployeeStatusMaster.messages");
    return { success: false, message: t("deleteFailed") };
  }
}
