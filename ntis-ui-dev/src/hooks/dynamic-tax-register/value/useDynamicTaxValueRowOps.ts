'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common';
import { ValueBasedTaxRow, TypeOfUseOption } from '@/types/dynamic-tax-register.types';
import { saveValueAction, bulkApplyValueAction } from '@/app/[locale]/property-tax/dynamic-tax-register/action';
import { clampPercentInput } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';

export interface DynamicTaxValueRowOpsParams {
  numericId: number;
  valYearId: number;
  valUserGroup: string;
  valPage: number;
  valPageSize: number;
  valueRows: ValueBasedTaxRow[];
  valueRowsTotalCount: number;
  typeOfUseOptions: TypeOfUseOption[];
  valBaseType: 'RV' | 'ALV';
  /** True when the server-side percentage fetch for this tax failed (network/5xx) rather than
   *  genuinely returning zero rows — must never auto-seed over that (see buildSeededRows). */
  loadFailed: boolean;
  router: DynamicTaxNav['router'];
}

/**
 * A brand-new (or never-configured) tax has zero percentage rows — seeds one row per active
 * TypeOfUse locally (negative id so Save's upsert treats them as inserts) so the admin can fill
 * in percentages before saving. Returns `[]` if there's no TypeOfUse master data to seed from.
 */
function buildSeededRows(
  typeOfUseOptions: TypeOfUseOption[],
  numericId: number,
  valYearId: number,
  valBaseType: 'RV' | 'ALV'
): ValueBasedTaxRow[] {
  return typeOfUseOptions.map((t) => ({
    id: -t.id,
    taxId: numericId,
    typeOfUseId: t.id,
    typeOfUseCode: t.code,
    description: t.description,
    yearRangeRVId: valYearId,
    userGroup: t.type,
    baseType: valBaseType,
    taxPercentage: 0,
  }));
}

/**
 * Value tab's row data + mutations. `valRows` is seeded from the server-fetched
 * prop and re-synced whenever that prop changes (a `router.push`/`refresh()`
 * triggers a fresh server fetch, which flows back down as a new prop). A tax with zero
 * rows gets one row per active TypeOfUse auto-seeded locally (see buildSeededRows) —
 * no manual "seed" action needed.
 */
export function useDynamicTaxValueRowOps({
  numericId,
  valYearId,
  valUserGroup,
  valPage,
  valPageSize,
  valueRows,
  valueRowsTotalCount,
  typeOfUseOptions,
  valBaseType,
  loadFailed,
  router,
}: DynamicTaxValueRowOpsParams) {
  const t = useTranslations('dynamicTaxRegister');
  const { confirm } = useConfirm();
  const [valRows, setValRows] = useState<ValueBasedTaxRow[]>(() =>
    valueRows.length > 0
      ? valueRows
      : loadFailed
      ? []
      : buildSeededRows(typeOfUseOptions, numericId, valYearId, valBaseType)
  );
  const [valTotalCount, setValTotalCount] = useState(() => (valueRows.length > 0 ? valueRowsTotalCount : valRows.length));
  const [valBulk, setValBulk] = useState('');
  const [valBusy, setValBusy] = useState(false);
  // True while the full set lives entirely in local state (auto-seeded, nothing to page
  // through server-side yet) and gets paginated client-side instead. False once real
  // (already-saved) data is loaded.
  const [valSeededLocally, setValSeededLocally] = useState(valueRows.length === 0 && !loadFailed);
  // Explicit "has an edit happened since the last load/save" flag — see the matching comment in
  // useDynamicTaxMasterRowOps for why this isn't derived by diffing valRows against valueRows.
  const [dirty, setDirty] = useState(false);

  // A navigation/refresh delivers a new `valueRows` prop (fresh server data) — reset the
  // editable local copy to match it, auto-seeding again if it's still empty. Adjusted during
  // render (React's documented pattern for "resetting state when a prop changes") rather than
  // in a useEffect, to avoid an extra cascading render. Never auto-seeds over a failed fetch —
  // see loadFailed's own doc-comment.
  const [prevValueRows, setPrevValueRows] = useState(valueRows);
  if (valueRows !== prevValueRows) {
    setPrevValueRows(valueRows);
    setDirty(false);
    if (valueRows.length > 0) {
      setValRows(valueRows);
      setValTotalCount(valueRowsTotalCount);
      setValSeededLocally(false);
    } else if (loadFailed) {
      setValRows([]);
      setValTotalCount(0);
      setValSeededLocally(false);
    } else {
      const seeded = buildSeededRows(typeOfUseOptions, numericId, valYearId, valBaseType);
      setValRows(seeded);
      setValTotalCount(seeded.length);
      setValSeededLocally(true);
    }
  }

  // Value used to seed a full grid of placeholder rows with no feedback at all — unlike Master's
  // equivalent handleSeedMaster, which always toasts. In an effect (not inline above) since a
  // toast is an imperative side effect, not state, and must not fire from a render pass that
  // might be discarded/replayed (React strict-mode double-invoke, concurrent rendering).
  useEffect(() => {
    if (valSeededLocally && valRows.length > 0) {
      toast.success(t('messages.value.seededRows', { count: valRows.length }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valSeededLocally]);

  // Distinct TypeOfUse.Type values actually present in the master data (e.g.
  // "R-Residential", "C-Commercial", "N-..."), for the User Group dropdown — replaces the
  // old hardcoded R/C/I-only list, which silently excluded any other group (e.g. "N").
  const valUserGroupOptions = useMemo(() => {
    const distinctTypes = Array.from(new Set(typeOfUseOptions.map((t) => t.type).filter(Boolean)));
    return distinctTypes.map((type) => ({ label: type, value: type }));
  }, [typeOfUseOptions]);

  const valPagedRows = useMemo(() => {
    if (!valSeededLocally) return valRows;
    // Locally-seeded rows never go through the server's userGroup filter, so the
    // User Group dropdown must filter this in-memory set itself.
    const filtered = valUserGroup === 'all' ? valRows : valRows.filter((r) => r.userGroup === valUserGroup);
    const start = (valPage - 1) * valPageSize;
    return filtered.slice(start, start + valPageSize);
  }, [valRows, valSeededLocally, valUserGroup, valPage, valPageSize]);

  const valFilteredLocalCount = useMemo(() => {
    if (!valSeededLocally) return valTotalCount;
    if (valUserGroup === 'all') return valRows.length;
    return valRows.filter((r) => r.userGroup === valUserGroup).length;
  }, [valRows, valSeededLocally, valUserGroup, valTotalCount]);

  const valTotalPages = Math.max(1, Math.ceil(valFilteredLocalCount / valPageSize));

  const setValPercent = (rowId: number, val: string) => {
    const sanitized = clampPercentInput(val, 999);
    setValRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, taxPercentage: Number(sanitized) || 0 } : r)));
    setDirty(true);
  };

  /**
   * Rows auto-seeded locally (see buildSeededRows) don't exist in the database yet, so
   * bulk-apply is applied across the full local set in memory instead (Save persists
   * it). Once real (already-saved) data is loaded, bulk-apply calls the backend
   * endpoint directly and `router.refresh()` re-fetches the current URL's data.
   */
  const handleValBulkApply = async () => {
    if (valBulk === '') {
      toast.error(t('messages.value.enterTaxPercentFirst'));
      return;
    }
    const pct = Number(valBulk);

    if (valSeededLocally) {
      const affected = valRows.filter(
        (r) => valUserGroup === 'all' || r.userGroup === valUserGroup
      ).length;
      setValRows((prev) =>
        prev.map((r) => {
          if (valUserGroup !== 'all' && r.userGroup !== valUserGroup) {
            return r;
          }
          return { ...r, taxPercentage: pct };
        })
      );
      if (affected > 0) {
        setDirty(true);
        toast.success(t('messages.value.appliedPercentToRows', { pct, count: affected }));
      } else {
        toast.warning(t('messages.value.noRowsMatchedBulkApply'));
      }
      setValBulk('');
      return;
    }

    // This branch writes to the database immediately, across every row of this tax + year (all
    // pages, not just the one on screen) — unlike the in-memory branch above, there's no
    // follow-up Save to reconsider it, so confirm before doing it.
    const proceed = await new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (v: boolean) => { if (!settled) { settled = true; resolve(v); } };
      confirm({
        variant: 'warning',
        title: t('messages.value.bulkApplyConfirmTitle'),
        description: t('messages.value.bulkApplyConfirmDescription', { pct }),
        confirmText: t('messages.value.bulkApplyConfirmButton'),
        onConfirm: () => settle(true),
        onCancel: () => settle(false),
      });
    });
    if (!proceed) return;

    setValBusy(true);
    try {
      const res = await bulkApplyValueAction({
        taxId: numericId,
        yearRangeRVId: valYearId,
        userGroup: valUserGroup !== 'all' ? valUserGroup : undefined,
        taxPercentage: pct,
        updatedBy: 1,
      });
      if (res.success) {
        toast.success(t('messages.value.bulkAppliedPercent', { pct }));
        setValBulk('');
        setDirty(false);
        router.refresh();
      } else {
        toast.error(res.error || t('messages.value.bulkApplyFailed'));
      }
    } catch {
      // A thrown/rejected action (network drop, serialization error, etc.) must not
      // leave valBusy stuck true forever — always resolve it in `finally` below.
      toast.error(t('messages.value.bulkApplyFailedRetry'));
    } finally {
      setValBusy(false);
    }
  };

  const handleValSave = async (): Promise<boolean> => {
    setValBusy(true);
    try {
      // Base Type is a tax+year-wide setting, not independent per row — sent once at the
      // request level so the backend applies it to EVERY row for this tax+year, not just
      // `valRows` (only the currently-loaded page under server-side pagination).
      const res = await saveValueAction({
        taxId: numericId,
        yearRangeRVId: valYearId,
        baseType: valBaseType,
        updatedBy: 1,
        rows: valRows,
      });
      if (res.success) {
        toast.success(t('messages.value.configurationSaved'));
        setDirty(false);
        router.refresh();
        return true;
      }
      toast.error(res.error || t('messages.value.saveFailed'));
      return false;
    } catch {
      toast.error(t('messages.value.saveFailedRetry'));
      return false;
    } finally {
      setValBusy(false);
    }
  };

  return {
    valUserGroupOptions,
    valPagedRows,
    valFilteredLocalCount,
    // Raw, unfiltered row count — valFilteredLocalCount is scoped to the User Group dropdown
    // and would under-report whether there's anything at all to save.
    valRowsCount: valRows.length,
    valTotalPages,
    valSeededLocally,
    dirty,
    loadFailed,
    valBulk,
    setValBulk,
    valBusy,
    setValPercent,
    handleValBulkApply,
    handleValSave,
  };
}

export type DynamicTaxValueRowOps = ReturnType<typeof useDynamicTaxValueRowOps>;
