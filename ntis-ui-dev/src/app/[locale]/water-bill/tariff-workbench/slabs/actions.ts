'use server';
import { validateTariffSlabInput } from '@/lib/api/water-bill/tariff-workbench/tariffWorkbenchMapper';
import { revalidatePath } from 'next/cache';
import { revalidateModulePaths } from '@/lib/server/revalidation-helper';
import { getTranslations } from 'next-intl/server';
import {
  getTariffSlabDetailsPaged,
  getTariffSlabDetailById,
  createTariffSlabDetail,
  updateTariffSlabDetail,
  deleteTariffSlabDetail,
  type TariffSlabPagedResponse,
} from '@/lib/api/water-bill/tariff-workbench/tariffSlabDetail.service';
import { getTariffWorkbenchesPaged } from '@/lib/api/water-bill/tariff-workbench/tariffWorkbench.service';
import { getGeographyUnitPaged } from '@/lib/api/water-bill/geographyunitmaster/geography-unit-crud.service';
import { logger } from '@/lib/utils/server-logger';

import type { TariffSlabData } from '@/types/water-bill/tariff-workbench/tariffWorkbench.types';

const SLABS_PATH = '/[locale]/water-bill/tariff-workbench/slabs';
const PARENT_WORKBENCH_PATH = '/[locale]/water-bill/tariff-workbench';

export type { TariffSlabData, TariffSlabPagedResponse };

export interface TariffSlabLookupOption {
  value: string;
  label: string;
}

type SearchParamsInput = Record<string, string | string[] | undefined> | undefined;

export async function parseSlabsSearchParams(sParams: SearchParamsInput) {
  const pageNumber = Math.max(1, Number(sParams?.pageNumber) || 1);
  const pageSize = Math.max(1, Number(sParams?.pageSize) || 10);
  const searchTerm = typeof sParams?.searchTerm === 'string' ? sParams.searchTerm : undefined;
  const sortBy = typeof sParams?.sortBy === 'string' ? sParams.sortBy : undefined;
  const sortOrder: 'asc' | 'desc' | undefined =
    sParams?.sortOrder === 'desc' || sParams?.sortOrder === 'asc'
      ? sParams.sortOrder
      : undefined;
  const parsedTariffId = Number(sParams?.tariffId);
  const tariffId = !isNaN(parsedTariffId) && parsedTariffId > 0 ? parsedTariffId : undefined;

  return { pageNumber, pageSize, searchTerm, sortBy, sortOrder, tariffId };
}

export async function getTariffSlabsTableData(sParams?: SearchParamsInput): Promise<{
  pagedData: TariffSlabPagedResponse;
  pageParams: {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    tariffId?: number;
  };
}> {
  const pageParams = await parseSlabsSearchParams(sParams);

  try {
    const response = await getTariffSlabDetailsPaged({
      pageNumber: pageParams.pageNumber,
      pageSize: pageParams.pageSize,
      searchTerm: pageParams.searchTerm,
      sortBy: pageParams.sortBy,
      sortOrder: pageParams.sortOrder,
      tariffId: pageParams.tariffId,
    });
    if (response.success && response.data) {
      return { pagedData: response.data, pageParams };
    }
  } catch (error) {
    logger.error('Failed to fetch tariff slabs', {}, error);
  }

  return {
    pagedData: {
      items: [],
      totalCount: 0,
      pageNumber: pageParams.pageNumber,
      pageSize: pageParams.pageSize,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
    pageParams,
  };
}

export async function fetchTariffSlabByIdAction(id: number): Promise<TariffSlabData | null> {
  try {
    const response = await getTariffSlabDetailById(id);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    logger.error('Failed to fetch tariff slab by id', { id }, error);
    return null;
  }
}

/** Fetches Tariff Name dropdown choices for the server-rendered slab form page. */
export async function fetchTariffSlabTariffOptionsAction(): Promise<TariffSlabLookupOption[]> {
  try {
    const response = await getTariffWorkbenchesPaged({ pageNumber: 1, pageSize: 2000 });
    if (!response.success || !response.data) return [];

    return response.data.items.map((tariff) => ({
      value: String(tariff.id),
      label: tariff.tariffName || tariff.tariffCode || String(tariff.id),
    }));
  } catch (error) {
    logger.error('Failed to fetch tariff slab tariff options', {}, error);
    return [];
  }
}

/** Fetches Geography Unit dropdown choices for the server-rendered slab form page. */
export async function fetchTariffSlabGeographyUnitOptionsAction(): Promise<TariffSlabLookupOption[]> {
  try {
    const response = await getGeographyUnitPaged(1, 2000);
    return response.items.map((unit) => ({
      value: String(unit.id),
      label: unit.geographyUnitName || unit.geographyUnitCode || String(unit.id),
    }));
  } catch (error) {
    logger.error('Failed to fetch tariff slab geography-unit options', {}, error);
    return [];
  }
}

export async function createTariffSlabAction(
  data: Partial<TariffSlabData>
): Promise<{ success: boolean; message?: string; data?: TariffSlabData }> {
  const t = await getTranslations('tariffWorkbench');

  const validation = validateTariffSlabInput(data, (key, values) => t(key, values));
  if (!validation.isValid || !validation.data) {
    return { success: false, message: t('validation.validationFailed') || t('errors.validationFailed') };
  }

  try {
    let nextSortOrder = 1;
    if (validation.data.tariffId) {
      const existing = await getTariffSlabDetailsPaged({
        tariffId: validation.data.tariffId,
        pageSize: 2000,
      });
      if (existing.success && existing.data && existing.data.items.length > 0) {
        nextSortOrder = Math.max(...existing.data.items.map(r => Number(r.sortOrder) || 0)) + 1;
      }
    }
    const createPayload = { ...validation.data, sortOrder: nextSortOrder };

    const response = await createTariffSlabDetail(createPayload);
    if (response.success && response.data) {
      revalidateModulePaths(SLABS_PATH);
      revalidatePath(PARENT_WORKBENCH_PATH, 'page');
      return { success: true, message: t('messages.createSuccess'), data: response.data };
    }
    return { success: false, message: response.error || t('errors.createFailed') };
  } catch (err: unknown) {
    logger.error('Error in createTariffSlabAction', {}, err);
    return { success: false, message: t('errors.createFailed') };
  }
}

export async function updateTariffSlabAction(
  id: number,
  data: Partial<TariffSlabData>
): Promise<{ success: boolean; message?: string; data?: TariffSlabData }> {
  const t = await getTranslations('tariffWorkbench');

  const validation = validateTariffSlabInput(data, (key, values) => t(key, values));
  if (!validation.isValid || !validation.data) {
    return { success: false, message: t('validation.validationFailed') || t('errors.validationFailed') };
  }

  try {
    const existing = await getTariffSlabDetailById(id);
    if (!existing.success || !existing.data) {
      return {
        success: false,
        message: existing.error || t('errors.fetchItemFailed') || t('errors.updateFailed'),
      };
    }

    const sortOrderFromInput = Number(validation.data.sortOrder ?? data.sortOrder);
    const sortOrderFromExisting = Number(existing.data.sortOrder);
    const preservedSortOrder = sortOrderFromInput > 0
      ? sortOrderFromInput
      : (sortOrderFromExisting > 0 ? sortOrderFromExisting : null);

    if (!preservedSortOrder) {
      return {
        success: false,
        message: t('errors.fetchItemFailed') || t('errors.updateFailed'),
      };
    }

    const updatePayload = { ...validation.data, sortOrder: preservedSortOrder };

    const response = await updateTariffSlabDetail(id, updatePayload);
    if (response.success && response.data) {
      revalidateModulePaths(SLABS_PATH);
      revalidatePath(PARENT_WORKBENCH_PATH, 'page');
      return { success: true, message: t('messages.updateSuccess'), data: response.data };
    }
    return { success: false, message: response.error || t('errors.updateFailed') };
  } catch (err: unknown) {
    logger.error('Error in updateTariffSlabAction', { id }, err);
    return { success: false, message: t('errors.updateFailed') };
  }
}

export async function deleteTariffSlabAction(
  id: number
): Promise<{ success: boolean; message?: string }> {
  const t = await getTranslations('tariffWorkbench');
  try {
    const response = await deleteTariffSlabDetail(id);
    if (response.success) {
      revalidateModulePaths(SLABS_PATH);
      revalidatePath(PARENT_WORKBENCH_PATH, 'page');
      return { success: true, message: t('messages.deleteSuccess') };
    }
    return { success: false, message: response.error || t('errors.deleteFailed') };
  } catch (err: unknown) {
    logger.error('Error in deleteTariffSlabAction', { id }, err);
    return { success: false, message: t('errors.deleteFailed') };
  }
}
