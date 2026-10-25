'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Info } from 'lucide-react';
import { AddButton, ExecuteTestButton, SaveButton } from '@/components/common';
import type { DynamicTaxCondition } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxCondition';
import { ConditionRuleRowCard } from './ConditionRuleRowCard';
import { ConditionTestPanel } from './ConditionTestPanel';

export interface ConditionSectionProps {
  condition: DynamicTaxCondition;
}

/** Embedded, self-contained condition/effect rule builder for CONDITION_BASED (and
 *  HYBRID's nested Condition section) — replaces the old read-only "linked rule" display
 *  that deep-linked into the standalone Rule Engine. */
export function ConditionSection({ condition }: ConditionSectionProps) {
  const t = useTranslations('dynamicTaxRegister');
  const {
    rows,
    fields,
    scopeMissing,
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
    handleOpen,
    testDisabledReason,
    resolveApiValueLabel,
    yearRangeOptions,
    taxOptions,
  } = condition;

  return (
    <div className="p-4 flex flex-col gap-3 bg-slate-50 min-h-full">
      {scopeMissing && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium">{t('condition.scopeNotConfigured')}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <AddButton label={t('condition.addRuleRow')} size="sm" onClick={handleAddRow} disabled={scopeMissing} />
        <ExecuteTestButton
          onClick={handleOpen}
          disabled={!!testDisabledReason}
          title={testDisabledReason ?? undefined}
          aria-label={t('condition.testThisRule')}
        >
          {t('condition.testThisRule')}
        </ExecuteTestButton>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm text-slate-500 font-medium">{t('condition.noRowsYet')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Only worth explaining once ordering can actually matter — with a single row there's
              nothing to place "first". */}
          {rows.length > 1 && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-800">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium">{t('condition.orderMattersHint')}</p>
            </div>
          )}
          {[...rows]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((row, index) => (
              <ConditionRuleRowCard
                key={row.id}
                row={row}
                index={index}
                total={rows.length}
                fields={fields}
                resolveApiValueLabel={resolveApiValueLabel}
                yearRangeOptions={yearRangeOptions}
                taxOptions={taxOptions}
                expanded={expandedRowId === row.id}
                onToggleExpand={() => toggleExpandRow(row.id)}
                onMoveUp={() => handleMoveRow(row.id, 'up')}
                onMoveDown={() => handleMoveRow(row.id, 'down')}
                onToggleActive={(isActive) => handleToggleActive(row.id, isActive)}
                onToggleStopFurtherProcessing={(stop) => handleToggleStopFurtherProcessing(row.id, stop)}
                onSetAssessmentBasis={(basis) => handleSetAssessmentBasis(row.id, basis)}
                onRemove={() => handleRemoveRow(row.id)}
                onAddCondition={() => handleAddCondition(row.id)}
                onRemoveCondition={(conditionId) => handleRemoveCondition(row.id, conditionId)}
                onPatchCondition={(conditionId, patch) => patchCondition(row.id, conditionId, patch)}
                onPatchEffect={(patch) => patchRowEffect(row.id, patch)}
              />
            ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {dirty && <span className="text-[11px] text-amber-600 font-medium">{t('condition.unsavedChanges')}</span>}
        <SaveButton
          label={t('condition.saveConfiguration')}
          size="sm"
          disabled={busy || rows.length === 0}
          onClick={handleSave}
        />
      </div>

      <ConditionTestPanel condition={condition} />
    </div>
  );
}
