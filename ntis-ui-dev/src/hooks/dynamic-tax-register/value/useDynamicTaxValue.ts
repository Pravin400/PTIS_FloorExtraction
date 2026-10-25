'use client';

import { YearRangeOption, ValueBasedTaxRow, TypeOfUseOption } from '@/types/dynamic-tax-register.types';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';
import { useDynamicTaxValueFilters } from './useDynamicTaxValueFilters';
import { useDynamicTaxValueRowOps } from './useDynamicTaxValueRowOps';

export interface DynamicTaxValueParams {
  numericId: number;
  yearRangeOptions: YearRangeOption[];
  valueRows: ValueBasedTaxRow[];
  valueRowsTotalCount: number;
  typeOfUseOptions: TypeOfUseOption[];
  loadFailed: boolean;
  nav: DynamicTaxNav;
}

/** Orchestrator for the Value-based config tab — composes filters (URL-driven) + row ops (mutations). */
export function useDynamicTaxValue({
  numericId,
  yearRangeOptions,
  valueRows,
  valueRowsTotalCount,
  typeOfUseOptions,
  loadFailed,
  nav,
}: DynamicTaxValueParams) {
  const filters = useDynamicTaxValueFilters(yearRangeOptions, valueRows, nav);
  const rowOps = useDynamicTaxValueRowOps({
    numericId,
    valYearId: filters.valYearId,
    valUserGroup: filters.valUserGroup,
    valPage: filters.valPage,
    valPageSize: filters.valPageSize,
    valueRows,
    valueRowsTotalCount,
    typeOfUseOptions,
    valBaseType: filters.valBaseType,
    loadFailed,
    router: nav.router,
  });

  // Wraps rowOps' own save so a successful save also advances the Base Type baseline (see
  // useDynamicTaxValueFilters) — otherwise toggling Base Type, saving, then closing immediately
  // would still read as unsaved and trip the discard-changes guard for no reason.
  const handleValSave = async (): Promise<boolean> => {
    const ok = await rowOps.handleValSave();
    if (ok) filters.markBaseTypeSaved();
    return ok;
  };

  return { ...filters, ...rowOps, handleValSave, dirty: filters.baseTypeDirty || rowOps.dirty };
}

export type DynamicTaxValue = ReturnType<typeof useDynamicTaxValue>;
