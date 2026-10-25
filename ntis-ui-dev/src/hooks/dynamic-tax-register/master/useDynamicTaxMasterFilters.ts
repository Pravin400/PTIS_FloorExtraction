'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { YearRangeOption, ResultMode, ResultBase } from '@/types/dynamic-tax-register.types';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';

/**
 * Master/Data tab's filter/pagination state — read from the URL (`mstYear`,
 * `mstPage`, `mstPageSize`), written via `router.push`. `mstYear` of 0/absent
 * means "no year filter" (show every row, each with its own Assessment Year) —
 * that semantic is preserved exactly. Bulk-input fields stay local/ephemeral.
 */
export function useDynamicTaxMasterFilters(yearRangeOptions: YearRangeOption[], nav: DynamicTaxNav) {
  const t = useTranslations('dynamicTaxRegister');
  const { searchParams, router, buildConfigUrl } = nav;

  const mstYearId = Number(searchParams.get('mstYear') ?? 0);
  const mstPage = Number(searchParams.get('mstPage') ?? 1);
  const mstPageSize = Number(searchParams.get('mstPageSize') ?? 10);

  const [mstBulkMode, setMstBulkMode] = useState<ResultMode>('FIXED');
  const [mstBulkBase, setMstBulkBase] = useState<ResultBase>('NONE');
  const [mstBulk, setMstBulk] = useState('');

  const yearSelectOptions = yearRangeOptions.length
    ? yearRangeOptions.map((o) => ({ label: o.label, value: String(o.value) }))
    : [{ label: '—', value: '0' }];
  // Includes a real placeholder so "show everything, no year filter" is an
  // explicit, selectable state rather than always defaulting to some year.
  const mstYearSelectOptions = [{ label: t('master.selectYear'), value: '' }, ...yearSelectOptions];

  const onMstYearChange = (v: string) => router.push(buildConfigUrl({ mstYear: Number(v), mstPage: 1 }));
  const onMstPageChange = (page: number) => router.push(buildConfigUrl({ mstPage: page }));
  const onMstPageSizeChange = (size: number) => router.push(buildConfigUrl({ mstPageSize: size, mstPage: 1 }));

  return {
    mstYearId,
    mstPage,
    mstPageSize,
    mstBulkMode,
    setMstBulkMode,
    mstBulkBase,
    setMstBulkBase,
    mstBulk,
    setMstBulk,
    mstYearSelectOptions,
    onMstYearChange,
    onMstPageChange,
    onMstPageSizeChange,
  };
}

export type DynamicTaxMasterFilters = ReturnType<typeof useDynamicTaxMasterFilters>;
