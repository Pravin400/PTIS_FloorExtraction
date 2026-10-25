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
  getDeptMaster,
  getDeptMasterPaged,
  createDeptMaster,
  updateDeptMaster,
  deleteDeptMaster,
} from "@/lib/api/payroll/DeptMaster/deptMaster.service";
import type { DeptMasterItem } from "@/types/payroll/MasterModule";
import type { PagedResponse } from "@/types/common.types";
import {
  createDeptMasterActionSchema,
  updateDeptMasterActionSchema,
} from "@/lib/validations/payroll/deptMaster.schema";

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
    revalidatePath(`/${locale}/payroll/organisation-masters/department-master`, "page");
  }
}

export async function getDeptMasterPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<DeptMasterItem>> {
  return await getDeptMasterPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder, isActive);
}

export async function getAllDeptMastersAction(): Promise<DeptMasterItem[]> {
  try {
    return await getDeptMaster();
  } catch (error) {
    logger.error('Error fetching all department masters', { error: error as Error });
    return [];
  }
}

export async function createDeptMasterAction(
  data: Omit<DeptMasterItem, "departmentId">
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const parsed = createDeptMasterActionSchema.safeParse(data);
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
    await createDeptMaster(parsed.data, userId);
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
    const t = await getTranslations("payrollDepartmentMaster");
    return { success: false, message: t("errors.createFailed") };
  }
}

export async function updateDeptMasterAction(
  id: string,
  data: Partial<DeptMasterItem>
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const parsed = updateDeptMasterActionSchema.safeParse(data);
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
    await updateDeptMaster(id, parsed.data, userId);
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
    const t = await getTranslations("payrollDepartmentMaster");
    return { success: false, message: t("errors.updateFailed") };
  }
}

export async function deleteDeptMasterAction(
  id: string
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    await deleteDeptMaster(id);
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
    const t = await getTranslations("payrollDepartmentMaster");
    return { success: false, message: t("errors.deleteFailed") };
  }
}
