'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  createTariffWorkbench,
  updateTariffWorkbench,
  purgeTariffWorkbench,
} from '@/lib/api/water-bill/tariff-workbench/tariffWorkbench.service';
import {
  fetchTariffWorkbenchesServer,
  fetchTariffWorkbenchByIdServer,
  getTariffPageLookups,
} from '@/lib/api/water-bill/tariff-workbench/tariffLookups.service';
import {
  validateTariffInput,
  mapToCreateTariffDto,
  mapToUpdateTariffDto,
} from '@/lib/api/water-bill/tariff-workbench/tariffWorkbenchMapper';
import { logger } from '@/lib/utils/server-logger';

import { revalidateModulePaths } from '@/lib/server/revalidation-helper';
import type {
  TariffWorkbench,
  TariffWorkbenchFormState,
  TariffWorkbenchInput,
} from '@/types/water-bill/tariff-workbench/tariffWorkbench.types';

const BASE_PATH = '/[locale]/water-bill/tariff-workbench/master';
const PARENT_WORKBENCH_PATH = '/[locale]/water-bill/tariff-workbench';

type SearchParamsInput = Record<string, string | string[] | undefined> | undefined;

export async function parseSearchParams(sParams: SearchParamsInput) {
  const pageNumber = Math.max(1, Number(sParams?.pageNumber) || 1);
  const pageSize = Math.max(1, Number(sParams?.pageSize) || 10);
  const searchTerm = typeof sParams?.searchTerm === 'string' ? sParams.searchTerm : undefined;
  const sortBy = typeof sParams?.sortBy === 'string' ? sParams.sortBy : undefined;
  const sortOrder: 'asc' | 'desc' | undefined =
    sParams?.sortOrder === 'desc' || sParams?.sortOrder === 'asc'
      ? sParams.sortOrder
      : undefined;

  return { pageNumber, pageSize, searchTerm, sortBy, sortOrder };
}

// ==========================================
// Tariff Master Page Data & Server Actions
// ==========================================
export async function getTariffWorkbenchTableData(sParams: SearchParamsInput) {
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = await parseSearchParams(sParams);

  const [lookups, pagedData] = await Promise.all([
    getTariffPageLookups(),
    fetchTariffWorkbenchesServer({
      pageNumber,
      pageSize,
      searchTerm,
      sortBy: sortBy ?? 'tariffCode',
      sortOrder: sortOrder ?? 'asc',
    }),
  ]);

  return {
    pagedData,
    ...lookups,
    pageParams: { sortBy, sortOrder, searchTerm },
  };
}

export async function fetchTariffWorkbenchByIdAction(id: number): Promise<TariffWorkbench | null> {
  try {
    return await fetchTariffWorkbenchByIdServer(id);
  } catch (err: unknown) {
    logger.error('Error in fetchTariffWorkbenchByIdAction', { id }, err);
    return null;
  }
}

export async function createTariffWorkbenchAction(
  _prevState: TariffWorkbenchFormState,
  input: TariffWorkbenchInput
): Promise<TariffWorkbenchFormState> {
  const t = await getTranslations('tariffWorkbench');

  const validation = validateTariffInput(input, (key, values) => t(key, values));
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      message: t('validation.validationFailed'),
      errors: validation.errors,
    };
  }

  const dto = mapToCreateTariffDto(validation.data);
  try {
    const response = await createTariffWorkbench(dto);
    if (response.success && response.data) {
      revalidateModulePaths(BASE_PATH);
      revalidatePath(PARENT_WORKBENCH_PATH, 'page');
      return { success: true, message: t('messages.createSuccess'), data: response.data };
    }
    return { success: false, message: response.error || t('errors.createFailed') };
  } catch (err: unknown) {
    logger.error('Error in createTariffWorkbenchAction', {}, err);
    return { success: false, message: t('errors.createFailed') };
  }
}

export async function updateTariffWorkbenchAction(
  id: number,
  _prevState: TariffWorkbenchFormState,
  input: TariffWorkbenchInput
): Promise<TariffWorkbenchFormState> {
  const t = await getTranslations('tariffWorkbench');

  const validation = validateTariffInput(input, (key, values) => t(key, values));
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      message: t('validation.validationFailed'),
      errors: validation.errors,
    };
  }

  const dto = mapToUpdateTariffDto(id, validation.data);
  try {
    const response = await updateTariffWorkbench(id, dto);
    if (response.success && response.data) {
      revalidateModulePaths(BASE_PATH);
      revalidatePath(PARENT_WORKBENCH_PATH, 'page');
      return { success: true, message: t('messages.updateSuccess'), data: response.data };
    }
    return { success: false, message: response.error || t('errors.updateFailed') };
  } catch (err: unknown) {
    logger.error('Error in updateTariffWorkbenchAction', { id }, err);
    return { success: false, message: t('errors.updateFailed') };
  }
}

export async function deleteTariffWorkbenchAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const t = await getTranslations('tariffWorkbench');
  try {
    const response = await purgeTariffWorkbench(id);
    if (response.success) {
      revalidateModulePaths(BASE_PATH);
      revalidatePath(PARENT_WORKBENCH_PATH, 'page');
      return { success: true, message: t('messages.deleteSuccess') };
    }
    return { success: false, message: response.error || t('errors.deleteFailed'), statusCode: response.statusCode };
  } catch (err: unknown) {
    logger.error('Error in deleteTariffWorkbenchAction', { id }, err);
    return { success: false, message: t('errors.deleteFailed') };
  }
}
