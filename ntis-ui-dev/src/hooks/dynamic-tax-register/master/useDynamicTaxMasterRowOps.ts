'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common';
import {
  TaxMasterMappingRow,
  ResultMode,
  ResultBase,
  MasterSource,
  MasterKeyOption,
  YearRangeOption,
  DynamicTaxRegisterRow,
} from '@/types/dynamic-tax-register.types';
import { bulkApplyMasterAction, saveMasterAction } from '@/app/[locale]/property-tax/dynamic-tax-register/action';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';

export interface DynamicTaxMasterRowOpsParams {
  numericId: number;
  taxRow: DynamicTaxRegisterRow | null;
  yearRangeOptions: YearRangeOption[];
  mstYearId: number;
  mstPage: number;
  mstPageSize: number;
  onMstPageChange: (page: number) => void;
  onMstPageSizeChange: (size: number) => void;
  effectiveMstRuleId: string;
  effectiveMasterSource: MasterSource | null;
  mstBulkMode: ResultMode;
  mstBulkBase: ResultBase;
  mstBulk: string;
  setMstBulk: (v: string) => void;
  masterRows: TaxMasterMappingRow[];
  masterRowsTotalCount: number;
  masterKeyOptionsBySource: Record<MasterSource, MasterKeyOption[]>;
  loadFailed: boolean;
  router: DynamicTaxNav['router'];
}

/** Master/Data tab's row data + mutations, re-synced from server-fetched props on every navigation/refresh. */
export function useDynamicTaxMasterRowOps({
  numericId,
  taxRow,
  yearRangeOptions,
  mstYearId,
  mstPage,
  mstPageSize,
  onMstPageChange,
  onMstPageSizeChange,
  effectiveMstRuleId,
  effectiveMasterSource,
  mstBulkMode,
  mstBulkBase,
  mstBulk,
  setMstBulk,
  masterRows,
  masterRowsTotalCount,
  masterKeyOptionsBySource,
  loadFailed,
  router,
}: DynamicTaxMasterRowOpsParams) {
  const t = useTranslations('dynamicTaxRegister');
  const { confirm } = useConfirm();
  const [mstRows, setMstRows] = useState<TaxMasterMappingRow[]>(masterRows);
  const [mstTotalCount, setMstTotalCount] = useState(masterRowsTotalCount);
  const [mstBusy, setMstBusy] = useState(false);
  // True only for the brand-new-tax "seed from master keys" flow, where the full unsaved
  // set lives entirely in local state (nothing to page through server-side yet) and gets
  // paginated client-side instead. False once real (already-saved) data is loaded.
  const [mstSeededLocally, setMstSeededLocally] = useState(false);
  // Local pagination for the seeded-locally case — paging through an in-memory array must
  // NEVER go through router.push: that would (a) trip the shared discard-changes guard on
  // every page click, since seeded-but-unsaved rows read as "dirty", and (b) actually discard
  // them for real once confirmed, because the navigation re-runs the server component and
  // resets mstRows back to the (still-empty) masterRows prop. Reset to page 1 whenever a
  // fresh seed replaces the working set.
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(mstPageSize);
  // Explicit "has an edit happened since the last load/save" flag — set by every mutating
  // action below, cleared by a fresh server payload or a successful save. Deliberately NOT
  // derived by diffing mstRows against the masterRows prop: right after a successful save the
  // prop hasn't caught up yet (router.refresh() is async), which would read as "still dirty"
  // and make the shared discard-changes guard fire immediately after saving.
  const [dirty, setDirty] = useState(false);

  // A navigation/refresh delivers a new `masterRows` prop (fresh server data) — reset
  // the editable local copy to match it. Adjusted during render (React's documented
  // pattern for "resetting state when a prop changes") rather than in a useEffect, to
  // avoid an extra cascading render.
  const [prevMasterRows, setPrevMasterRows] = useState(masterRows);
  if (masterRows !== prevMasterRows) {
    setPrevMasterRows(masterRows);
    setMstRows(masterRows);
    setMstTotalCount(masterRowsTotalCount);
    setMstSeededLocally(false);
    setDirty(false);
  }

  const effectiveMstPage = mstSeededLocally ? localPage : mstPage;
  const effectiveMstPageSize = mstSeededLocally ? localPageSize : mstPageSize;

  const mstPagedRows = useMemo(() => {
    if (!mstSeededLocally) return mstRows;
    const start = (effectiveMstPage - 1) * effectiveMstPageSize;
    return mstRows.slice(start, start + effectiveMstPageSize);
  }, [mstRows, mstSeededLocally, effectiveMstPage, effectiveMstPageSize]);

  const mstFilteredLocalCount = useMemo(() => {
    if (!mstSeededLocally) return mstTotalCount;
    return mstRows.length;
  }, [mstRows, mstSeededLocally, mstTotalCount]);

  const mstTotalPages = Math.max(1, Math.ceil(mstFilteredLocalCount / effectiveMstPageSize));

  /** Paging through the seeded-locally in-memory array stays entirely client-side —
   *  never routed through the shared discard-changes guard. Real server-paged data
   *  (not seeded locally) still goes through the URL-driven nav, since a genuinely
   *  different page there requires a fresh server fetch. */
  const handleMstPageChange = (page: number) => {
    if (mstSeededLocally) {
      setLocalPage(page);
      return;
    }
    onMstPageChange(page);
  };

  const handleMstPageSizeChange = (size: number) => {
    if (mstSeededLocally) {
      setLocalPageSize(size);
      setLocalPage(1);
      return;
    }
    onMstPageSizeChange(size);
  };

  // A save/seed/bulk-apply can move rows to a different year, shrinking this filtered
  // page's total below the currently-viewed page number. Clamp back to the last valid
  // page instead of leaving the grid stuck showing an empty page with no way back.
  // The seeded-locally case clamps entirely in-render (same "adjust state during render"
  // pattern as the prevMasterRows reset above) since it's purely local state and the
  // condition naturally converges once localPage matches mstTotalPages; the server-paged
  // case still goes through the external onMstPageChange callback from an effect.
  if (mstSeededLocally && localPage > mstTotalPages) {
    setLocalPage(mstTotalPages);
  }
  useEffect(() => {
    if (!mstSeededLocally && mstPage > mstTotalPages) {
      onMstPageChange(mstTotalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mstTotalPages]);

  const patchMstRow = (rowId: number, patch: Partial<TaxMasterMappingRow>) => {
    setMstRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  /**
   * Builds default rows entirely in memory (negative synthetic ids, like Value's
   * "Seed All Type Of Use Rows") — nothing is written to the DB here. The rows only
   * persist once Save Configuration/Save Settings actually runs, which is what stops
   * the tab from writing placeholder Fixed/None/0 rows just from being opened.
   */
  const handleSeedMaster = () => {
    // Prefer the explicit MasterSource of whichever rule is currently selected; fall
    // back to a best-effort guess from the register row's source text only when
    // neither is set yet.
    const source: MasterSource =
      effectiveMasterSource ??
      (taxRow?.source?.toLowerCase().includes('owner')
        ? 'OwnerType'
        : taxRow?.source?.toLowerCase().includes('use')
        ? 'TypeOfUse'
        : 'PropertyType');
    const options = masterKeyOptionsBySource[source] ?? [];
    if (options.length === 0) {
      toast.error(t('messages.master.noMasterDataToSeed', { source }));
      return;
    }
    // Seeding always needs a concrete year — fall back to the first available option
    // when the toolbar filter is on "— Select Year —" (no filter).
    const seedYearId = mstYearId || yearRangeOptions[0]?.value;
    if (!seedYearId) {
      toast.error(t('messages.master.noYearRangeToSeed'));
      return;
    }
    const ruleId = effectiveMstRuleId ? Number(effectiveMstRuleId) : taxRow?.ruleDefinitionId ?? null;
    const seeded: TaxMasterMappingRow[] = options.map((o) => ({
      id: -o.id,
      taxId: numericId,
      ruleDefinitionId: ruleId,
      masterKey: o.key,
      displayValue: o.display,
      assessmentYearRangeId: seedYearId,
      resultMode: 'FIXED',
      resultBase: 'NONE',
      resultValue: 0,
    }));
    setMstRows(seeded);
    setMstTotalCount(seeded.length);
    setMstSeededLocally(true);
    setLocalPage(1);
    setLocalPageSize(mstPageSize);
    setDirty(true);
    toast.success(t('messages.master.seededRows', { count: seeded.length }));
  };

  const handleMstBulkApply = async () => {
    if (mstBulk === '') {
      toast.error(t('messages.master.enterValueFirst'));
      return;
    }
    const value = Number(mstBulk);

    // Locally-seeded rows don't exist in the database yet, so bulk-apply is applied
    // across the full local set in memory instead (Save persists it) — mirrors Value's
    // handleValBulkApply. Respects the Assessment Year filter the same way the saved
    // branch below requires it, instead of always touching every row regardless of year.
    if (mstSeededLocally) {
      const affected = mstRows.filter((r) => !mstYearId || r.assessmentYearRangeId === mstYearId).length;
      setMstRows((prev) =>
        prev.map((r) => {
          if (mstYearId && r.assessmentYearRangeId !== mstYearId) return r;
          return { ...r, resultMode: mstBulkMode, resultBase: mstBulkBase, resultValue: value };
        })
      );
      if (affected > 0) {
        setDirty(true);
        toast.success(t('messages.master.appliedToRows', { count: affected }));
      } else {
        toast.warning(t('messages.master.noRowsMatchedBulkApply'));
      }
      setMstBulk('');
      return;
    }

    if (!mstYearId) {
      toast.error(t('messages.master.selectYearForBulkApply'));
      return;
    }

    // This branch writes to the database immediately, across every row/page for this tax + year
    // — unlike the in-memory branch above, there's no follow-up Save to reconsider it, so
    // confirm before doing it.
    const proceed = await new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (v: boolean) => { if (!settled) { settled = true; resolve(v); } };
      confirm({
        variant: 'warning',
        title: t('messages.master.bulkApplyConfirmTitle'),
        description: t('messages.master.bulkApplyConfirmDescription'),
        confirmText: t('messages.master.bulkApplyConfirmButton'),
        onConfirm: () => settle(true),
        onCancel: () => settle(false),
      });
    });
    if (!proceed) return;

    setMstBusy(true);
    try {
      const res = await bulkApplyMasterAction({
        taxId: numericId,
        ruleDefinitionId: effectiveMstRuleId ? Number(effectiveMstRuleId) : undefined,
        assessmentYearRangeId: mstYearId,
        resultMode: mstBulkMode,
        resultBase: mstBulkBase,
        resultValue: value,
        updatedBy: 1,
      });
      if (res.success) {
        toast.success(t('messages.master.bulkApplied'));
        setMstBulk('');
        setDirty(false);
        router.refresh();
      } else {
        toast.error(res.error || t('messages.master.bulkApplyFailed'));
      }
    } catch {
      toast.error(t('messages.master.bulkApplyFailedRetry'));
    } finally {
      setMstBusy(false);
    }
  };

  const handleMstSave = async (): Promise<boolean> => {
    // Every row already carries its own AssessmentYearRangeId (defaulted from the DB,
    // editable per-row via the grid's dropdown) and SaveAsync persists each row under
    // that per-row value, not this request-level one — the toolbar's year filter
    // (mstYearId) is unrelated to what actually gets saved. The request-level field only
    // exists to satisfy the API's ">= 1" validation, so fall back to a row's own year (or
    // the first available option) instead of blocking the save when no filter is picked.
    const requestYearId = mstYearId || mstRows[0]?.assessmentYearRangeId || yearRangeOptions[0]?.value;
    if (!requestYearId) {
      toast.error(t('messages.master.noYearRangeToSave'));
      return false;
    }
    setMstBusy(true);
    try {
      const res = await saveMasterAction({
        taxId: numericId,
        ruleDefinitionId: effectiveMstRuleId ? Number(effectiveMstRuleId) : taxRow?.ruleDefinitionId ?? null,
        assessmentYearRangeId: requestYearId,
        updatedBy: 1,
        rows: mstRows,
      });
      if (res.success) {
        toast.success(t('messages.master.configurationSaved'));
        setDirty(false);
        router.refresh();
        return true;
      }
      toast.error(res.error || t('messages.master.saveFailed'));
      return false;
    } catch {
      toast.error(t('messages.master.saveFailedRetry'));
      return false;
    } finally {
      setMstBusy(false);
    }
  };

  return {
    mstRows,
    mstPagedRows,
    mstFilteredLocalCount,
    mstSeededLocally,
    mstBusy,
    mstPage: effectiveMstPage,
    mstPageSize: effectiveMstPageSize,
    mstTotalPages,
    dirty,
    loadFailed,
    patchMstRow,
    handleSeedMaster,
    handleMstBulkApply,
    handleMstSave,
    onMstPageChange: handleMstPageChange,
    onMstPageSizeChange: handleMstPageSizeChange,
  };
}

export type DynamicTaxMasterRowOps = ReturnType<typeof useDynamicTaxMasterRowOps>;
