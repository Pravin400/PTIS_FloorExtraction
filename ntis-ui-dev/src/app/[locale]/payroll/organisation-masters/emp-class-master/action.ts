'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { locales } from '@/i18n/config';
import { ApiError } from '@/lib/utils/api';
import {
  getEmpClassMasterPaged,
  createEmpClassMaster,
  updateEmpClassMaster,
  deleteEmpClassMaster,
} from '@/lib/api/payroll/EmpClassMaster/empClassMaster.service';
import type { EmpClassMasterItem, EmpClassMasterPayload } from '@/types/payroll/MasterModule';
import type { PagedResponse } from '@/types/common.types';
import {
  createEmpClassMasterActionSchema,
  updateEmpClassMasterActionSchema,
  empClassMasterIdActionSchema,
} from '@/lib/validations/payroll/empClassMaster.schema';
import { PAYROLL_LIMITS, PAYROLL_ROUTES } from '@/lib/constants/payroll.constants';

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
    revalidatePath(`/${locale}${PAYROLL_ROUTES.ORGANISATION_MASTERS}`, 'page');
    revalidatePath(`/${locale}${PAYROLL_ROUTES.EMP_CLASS_MASTER}`, 'page');
  }
}

export async function getEmpClassMasterPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<EmpClassMasterItem>> {
  if (
    !Number.isFinite(pageNumber) ||
    !Number.isFinite(pageSize) ||
    pageNumber <= 0 ||
    pageSize <= 0 ||
    pageSize > PAYROLL_LIMITS.MAX_PAGE_SIZE ||
    pageNumber > PAYROLL_LIMITS.MAX_PAGE_NUMBER
  ) {
    throw new ApiError(400, 'Invalid pagination parameters', 'Validation failed');
  }

  return await getEmpClassMasterPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder, isActive);
}

export async function createEmpClassMasterAction(
  data: EmpClassMasterPayload
): Promise<{ success: boolean; errorCode?: string; statusCode?: number }> {
  const parsed = createEmpClassMasterActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errorCode: 'VALIDATION_ERROR', statusCode: 400 };
  }

  try {
    await createEmpClassMaster(parsed.data);
    revalidatePayrollPages();
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}${PAYROLL_ROUTES.LOGIN}`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        statusCode: error.statusCode,
        errorCode: error.statusCode === 409 ? 'DUPLICATE' : 'API_ERROR',
      };
    }
    return { success: false, statusCode: 500, errorCode: 'INTERNAL_ERROR' };
  }
}

export async function updateEmpClassMasterAction(
  id: string,
  data: Partial<EmpClassMasterPayload>
): Promise<{ success: boolean; errorCode?: string; statusCode?: number }> {
  const idValidation = empClassMasterIdActionSchema.safeParse({ id });
  if (!idValidation.success) {
    return { success: false, errorCode: 'INVALID_ID', statusCode: 400 };
  }

  const parsed = updateEmpClassMasterActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errorCode: 'VALIDATION_ERROR', statusCode: 400 };
  }

  try {
    await updateEmpClassMaster(String(idValidation.data.id), parsed.data);
    revalidatePayrollPages();
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}${PAYROLL_ROUTES.LOGIN}`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        statusCode: error.statusCode,
        errorCode: error.statusCode === 409 ? 'DUPLICATE' : error.statusCode === 404 ? 'NOT_FOUND' : 'API_ERROR',
      };
    }
    return { success: false, statusCode: 500, errorCode: 'INTERNAL_ERROR' };
  }
}

export async function deleteEmpClassMasterAction(
  id: string
): Promise<{ success: boolean; errorCode?: string; statusCode?: number }> {
  const idValidation = empClassMasterIdActionSchema.safeParse({ id });
  if (!idValidation.success) {
    return { success: false, errorCode: 'INVALID_ID', statusCode: 400 };
  }

  try {
    await deleteEmpClassMaster(String(idValidation.data.id));
    revalidatePayrollPages();
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}${PAYROLL_ROUTES.LOGIN}`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        statusCode: error.statusCode,
        errorCode: error.statusCode === 409 ? 'IN_USE' : error.statusCode === 404 ? 'NOT_FOUND' : 'API_ERROR',
      };
    }
    return { success: false, statusCode: 500, errorCode: 'INTERNAL_ERROR' };
  }
}
