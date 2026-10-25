'use client';

import { useState } from 'react';
import { YearRangeOption, ValueBasedTaxRow } from '@/types/dynamic-tax-register.types';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';

/**
 * Value tab's filter/pagination state — read directly from the URL (client and
 * server always share the same URL, so no round trip is needed) and written
 * via `router.push`, which re-runs the Server Component and re-fetches. `valBaseType`
 * is local/ephemeral (never sent to any fetch), but its default is seeded from the
 * already-saved data's own BaseType — not hardcoded to "RV" — so reopening an
 * already-configured ALV tax and clicking Save without touching the toggle doesn't
 * silently flip its stored BaseType back to RV.
 */
export function useDynamicTaxValueFilters(
  yearRangeOptions: YearRangeOption[],
  valueRows: ValueBasedTaxRow[],
  nav: DynamicTaxNav
) {
  const { searchParams, router, buildConfigUrl } = nav;

  const valYearId = Number(searchParams.get('valYear') ?? yearRangeOptions[0]?.value ?? 0);
  const valUserGroup = searchParams.get('valGroup') ?? 'all';
  const valPage = Number(searchParams.get('valPage') ?? 1);
  const valPageSize = Number(searchParams.get('valPageSize') ?? 10);

  const resolveBaseType = (rows: ValueBasedTaxRow[]): 'RV' | 'ALV' => (rows[0]?.baseType === 'ALV' ? 'ALV' : 'RV');

  const [valBaseType, setValBaseType] = useState<'RV' | 'ALV'>(() => resolveBaseType(valueRows));
  // Snapshot of the last known-saved Base Type, for the dirty check below — resynced whenever a
  // fresh (non-empty) `valueRows` prop arrives, and again right after a successful save.
  const [baselineBaseType, setBaselineBaseType] = useState(valBaseType);

  // A navigation/refresh can deliver a new `valueRows` prop reflecting a DIFFERENT Base Type than
  // whatever was resolved at mount (e.g. switching the Assessment Year filter to a year the tax
  // is stored under with 'ALV'). Without resyncing here, `valBaseType` would keep showing the
  // year-1 value, and Save Configuration sends it at the request level for every row of the
  // tax+year — silently flipping the newly-viewed year's real Base Type back to the stale one.
  const [prevValueRowsForBaseType, setPrevValueRowsForBaseType] = useState(valueRows);
  if (valueRows !== prevValueRowsForBaseType) {
    setPrevValueRowsForBaseType(valueRows);
    if (valueRows.length > 0) {
      const resolved = resolveBaseType(valueRows);
      setValBaseType(resolved);
      setBaselineBaseType(resolved);
    }
  }

  const baseTypeDirty = valBaseType !== baselineBaseType;
  /** Called by useDynamicTaxValue right after a successful Value save — moves the "known good"
   *  baseline up to what was just persisted, so re-closing the drawer immediately afterward
   *  doesn't spuriously trip the discard-changes guard on the value that's now actually saved. */
  const markBaseTypeSaved = () => setBaselineBaseType(valBaseType);

  const yearSelectOptions = yearRangeOptions.length
    ? yearRangeOptions.map((o) => ({ label: o.label, value: String(o.value) }))
    : [{ label: '—', value: String(valYearId) }];

  /** Resolves a row's own AssessmentYearRangeId/YearRangeRVId to its display label (e.g. "2026-2027"). */
  const yearLabelById = (id: number | null | undefined): string =>
    yearRangeOptions.find((o) => o.value === id)?.label ?? '—';

  const onValYearChange = (v: string) => router.push(buildConfigUrl({ valYear: Number(v), valPage: 1 }));
  const onValGroupChange = (group: string) => router.push(buildConfigUrl({ valGroup: group, valPage: 1 }));
  const onValPageChange = (page: number) => router.push(buildConfigUrl({ valPage: page }));
  const onValPageSizeChange = (size: number) => router.push(buildConfigUrl({ valPageSize: size, valPage: 1 }));

  return {
    valYearId,
    valUserGroup,
    valPage,
    valPageSize,
    valBaseType,
    setValBaseType,
    baseTypeDirty,
    markBaseTypeSaved,
    yearSelectOptions,
    yearLabelById,
    onValYearChange,
    onValGroupChange,
    onValPageChange,
    onValPageSizeChange,
  };
}

export type DynamicTaxValueFilters = ReturnType<typeof useDynamicTaxValueFilters>;
