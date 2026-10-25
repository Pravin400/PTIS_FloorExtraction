'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common';
import {
  ConditionRuleRow,
  ConditionItem,
  DynamicTaxRegisterRow,
} from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import {
  saveConditionRuleRowsAction,
  deleteConditionRuleRowAction,
} from '@/app/[locale]/property-tax/dynamic-tax-register/action';
import { isRangeOperator, isInvalidRange } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';
import type { DynamicTaxNav } from '../shared/useDynamicTaxNav';

export interface DynamicTaxConditionRowOpsParams {
  numericId: number;
  taxRow: DynamicTaxRegisterRow | null;
  conditionRows: ConditionRuleRow[];
  fields: FieldConfig[];
  generalRuleDefinitionId: string;
  router: DynamicTaxNav['router'];
}

function renumbered(rows: ConditionRuleRow[]): ConditionRuleRow[] {
  return [...rows]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r, i) => ({ ...r, sortOrder: i + 1 }));
}

/**
 * Fans each editor row's multi-selected Assessment Year Ranges out into one persisted row per
 * selected year (each carrying a single `assessmentYearRangeId`) — the DB's "one combination row
 * per year" shape. The first year reuses the row's own id (an update); the rest get fresh insert
 * ids from `mintId`. Empty/absent selection collapses to a single "all years" (null) row. The
 * UI-only `assessmentYearRangeIds` is stripped from every emitted row, then sortOrder is renumbered.
 */
function expandByYearRange(rows: ConditionRuleRow[], mintId: () => number): ConditionRuleRow[] {
  const expanded: ConditionRuleRow[] = [];
  for (const row of rows) {
    const { assessmentYearRangeIds, ...rest } = row;
    // `undefined` = the multi-select was never touched → keep the row's loaded single year.
    // A present-but-empty array = the user cleared it → a single "all years" (null) row.
    const years: (number | null)[] =
      assessmentYearRangeIds !== undefined
        ? assessmentYearRangeIds.length > 0
          ? assessmentYearRangeIds
          : [null]
        : [rest.assessmentYearRangeId ?? null];
    years.forEach((yearId, i) => {
      expanded.push({ ...rest, id: i === 0 ? rest.id : mintId(), assessmentYearRangeId: yearId });
    });
  }
  return renumbered(expanded);
}

/** Signature of a row's "identity" for duplicate detection — conditions (ignoring the client-only
 *  `id`) + assessment year + result. Two rows sharing it are exact duplicates (redundant in a
 *  first-match engine). Kept in sync with the backend guard in TaxConditionRuleService.SaveAsync. */
function conditionSignature(row: ConditionRuleRow): string {
  const conditions = row.conditions.map((c) => ({
    fieldId: c.fieldId,
    operator: c.operator,
    value: c.value,
    logicalOperator: c.logicalOperator,
  }));
  return [
    JSON.stringify(conditions),
    row.conditionEvaluationScope ?? 'FLOOR_WISE',
    row.assessmentYearRangeId ?? 'null',
    row.resultMode,
    row.resultBase,
    row.resultValue,
    row.referenceTaxId ?? 'null',
    row.unitFieldId ?? 'null',
  ].join('|');
}

/** Condition-rows CRUD + save, re-synced from server-fetched props on every navigation/refresh —
 *  same render-time reset pattern as useDynamicTaxMasterRowOps. */
export function useDynamicTaxConditionRowOps({
  numericId,
  taxRow,
  conditionRows,
  fields,
  generalRuleDefinitionId,
  router,
}: DynamicTaxConditionRowOpsParams) {
  const t = useTranslations('dynamicTaxRegister');
  const { confirm } = useConfirm();
  const nextRowIdRef = useRef(0);

  const [rows, setRows] = useState<ConditionRuleRow[]>(conditionRows);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // Explicit "has an edit happened since the last load/save" flag — set by every mutating action
  // below, cleared by a fresh server payload or a successful save. Replaces a prior
  // JSON.stringify(rows) !== JSON.stringify(conditionRows) comparison: that read as dirty right
  // after a successful save too (conditionRows, the prop, only catches up once the async
  // router.refresh() below actually lands), which would trip the discard-changes guard on close
  // immediately after saving — same rationale as the matching flag in the Value/Master hooks.
  const [dirty, setDirty] = useState(false);

  // A navigation/refresh delivers a new `conditionRows` prop (fresh server data) — reset
  // the editable local copy to match it, during render rather than in a useEffect.
  const [prevConditionRows, setPrevConditionRows] = useState(conditionRows);
  if (conditionRows !== prevConditionRows) {
    setPrevConditionRows(conditionRows);
    setRows(conditionRows);
    setExpandedRowId(null);
    setDirty(false);
  }

  const effectiveRuleDefinitionId = generalRuleDefinitionId
    ? Number(generalRuleDefinitionId)
    : taxRow?.ruleDefinitionId ?? null;

  const handleAddRow = () => {
    nextRowIdRef.current -= 1;
    const newId = nextRowIdRef.current;
    setRows((prev) =>
      renumbered([
        ...prev,
        {
          id: newId,
          taxId: numericId,
          ruleDefinitionId: effectiveRuleDefinitionId,
          sortOrder: prev.length + 1,
          conditions: [],
          assessmentYearRangeId: null,
          resultMode: 'FIXED',
          resultBase: 'NONE',
          resultValue: 0,
          referenceTaxId: null,
          unitFieldId: null,
          isActive: true,
          stopFurtherProcessing: false,
          assessmentBasis: 'PROPERTY_BASED',
          conditionEvaluationScope: 'FLOOR_WISE',
        },
      ])
    );
    setExpandedRowId(newId);
    setDirty(true);
  };

  /**
   * Permanently purges an already-saved row from the database the moment the admin
   * confirms — a real DELETE, not deferred to the next "Save Configuration" (rows are
   * otherwise upsert-only; nothing else in this screen ever removes a persisted row). A
   * row that only exists locally (id <= 0 — added this session, never saved) has nothing
   * to delete server-side, so it's just dropped from local state.
   */
  const handleRemoveRow = (rowId: number) => {
    confirm({
      variant: 'delete',
      title: t('condition.deleteRowTitle'),
      description: t('condition.deleteRowDescription'),
      onConfirm: async () => {
        if (rowId > 0) {
          const res = await deleteConditionRuleRowAction(rowId, numericId);
          if (!res.success) {
            toast.error(res.error || t('messages.condition.deleteFailed'));
            return;
          }
          toast.success(t('messages.condition.rowDeleted'));
        }
        setRows((prev) => renumbered(prev.filter((r) => r.id !== rowId)));
        setExpandedRowId((cur) => (cur === rowId ? null : cur));
      },
    });
  };

  const handleMoveRow = (rowId: number, direction: 'up' | 'down') => {
    setRows((prev) => {
      const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex((r) => r.id === rowId);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return prev;
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      return sorted.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    });
    setDirty(true);
  };

  const handleToggleActive = (rowId: number, isActive: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, isActive } : r)));
    setDirty(true);
  };

  const handleToggleStopFurtherProcessing = (rowId: number, stopFurtherProcessing: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, stopFurtherProcessing } : r)));
    setDirty(true);
  };

  const handleSetAssessmentBasis = (rowId: number, assessmentBasis: ConditionRuleRow['assessmentBasis']) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, assessmentBasis } : r)));
    setDirty(true);
  };

  const patchRowEffect = (
    rowId: number,
    patch: Partial<
      Pick<
        ConditionRuleRow,
        | 'resultMode'
        | 'resultBase'
        | 'resultValue'
        | 'referenceTaxId'
        | 'unitFieldId'
        | 'assessmentYearRangeId'
        | 'assessmentYearRangeIds'
        | 'conditionEvaluationScope'
      >
    >
  ) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const toggleExpandRow = (rowId: number) => {
    setExpandedRowId((cur) => (cur === rowId ? null : rowId));
  };

  const handleAddCondition = (rowId: number) => {
    const defaultField = fields[0];
    const newCondition: ConditionItem = {
      id: crypto.randomUUID(),
      fieldId: defaultField?.fieldId ?? '',
      operator: defaultField?.supportedOperators?.[0]?.code ?? '=',
      value: '',
      logicalOperator: 'AND',
    };
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, conditions: [...r.conditions, newCondition] } : r))
    );
    setDirty(true);
  };

  const handleRemoveCondition = (rowId: number, conditionId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, conditions: r.conditions.filter((c) => c.id !== conditionId) } : r
      )
    );
    setDirty(true);
  };

  const patchCondition = (rowId: number, conditionId: string, patch: Partial<ConditionItem>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          conditions: r.conditions.map((c) => {
            if (c.id !== conditionId) return c;
            if (patch.fieldId && patch.fieldId !== c.fieldId) {
              const nextField = fields.find((f) => f.fieldId === patch.fieldId);
              return {
                ...c,
                fieldId: patch.fieldId,
                operator: nextField?.supportedOperators?.[0]?.code ?? '=',
                value: nextField?.inputType === 'MULTISELECT' ? [] : '',
              };
            }
            return { ...c, ...patch };
          }),
        };
      })
    );
    setDirty(true);
  };

  const handleSave = async (): Promise<boolean> => {
    if (!numericId || numericId <= 0) {
      toast.error(t('drawer.saveFirstNotice'));
      return false;
    }

    setBusy(true);
    try {
      // Fan each row's multi-year selection out into one persisted row per year before saving.
      const rowsToSave = expandByYearRange(rows, () => {
        nextRowIdRef.current -= 1;
        return nextRowIdRef.current;
      });

      // Block exact-duplicate rows or invalid range conditions before hitting the server
      const seenSignatures = new Set<string>();
      for (const row of rowsToSave) {
        for (const cond of row.conditions) {
          if (isRangeOperator(cond.operator)) {
            const arr = Array.isArray(cond.value) ? cond.value : [cond.value];
            const from = arr[0] ?? '';
            const to = arr[1] ?? '';
            const field = fields.find((f) => f.fieldId === cond.fieldId);
            if (isInvalidRange(from, to, field?.dataType)) {
              toast.error(t('messages.condition.rangeInvalid'));
              return false;
            }
          }
        }
        const signature = conditionSignature(row);
        if (seenSignatures.has(signature)) {
          toast.error(t('messages.condition.duplicateRows'));
          return false;
        }
        seenSignatures.add(signature);
      }

      const res = await saveConditionRuleRowsAction({
        taxId: numericId,
        ruleDefinitionId: effectiveRuleDefinitionId,
        updatedBy: 1,
        rows: rowsToSave,
      });
      if (res.success) {
        toast.success(t('messages.condition.configurationSaved'));
        setDirty(false);
        router.refresh();
        return true;
      }
      toast.error(res.error || t('messages.condition.saveFailed'));
      return false;
    } catch {
      toast.error(t('messages.condition.saveFailedRetry'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    rows,
    dirty,
    busy,
    expandedRowId,
    toggleExpandRow,
    handleAddRow,
    handleRemoveRow,
    handleMoveRow,
    handleToggleActive,
    handleToggleStopFurtherProcessing,
    handleSetAssessmentBasis,
    patchRowEffect,
    handleAddCondition,
    handleRemoveCondition,
    patchCondition,
    handleSave,
  };
}

export type DynamicTaxConditionRowOps = ReturnType<typeof useDynamicTaxConditionRowOps>;
