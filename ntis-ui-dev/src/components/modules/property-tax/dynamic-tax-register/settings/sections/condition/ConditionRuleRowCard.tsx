'use client';

import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { AddButton, DeleteButton, ToggleSwitch, Label, Select, IconOnlyActionButton } from '@/components/common';
import { ConditionRuleRow, ConditionItem, YearRangeOption, ConditionEvaluationScope } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import { formatConditionSummary, formatConditionEffect } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';
import { ConditionItemRow } from './ConditionItemRow';
import { ConditionEffectInputs } from './ConditionEffectInputs';
import { PortalMultiSelectDropdown } from './PortalMultiSelectDropdown';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export interface ConditionRuleRowCardProps {
  row: ConditionRuleRow;
  index: number;
  total: number;
  fields: FieldConfig[];
  resolveApiValueLabel?: (fieldId: string, rawValue: string) => string | undefined;
  yearRangeOptions: YearRangeOption[];
  /** Active taxes (excluding this row's own tax) for the "Other Tax" reference picker. */
  taxOptions: { value: number; label: string }[];
  expanded: boolean;
  onToggleExpand: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleActive: (isActive: boolean) => void;
  onToggleStopFurtherProcessing: (stopFurtherProcessing: boolean) => void;
  onSetAssessmentBasis: (assessmentBasis: ConditionRuleRow['assessmentBasis']) => void;
  onRemove: () => void;
  onAddCondition: () => void;
  onRemoveCondition: (conditionId: string) => void;
  onPatchCondition: (conditionId: string, patch: Partial<ConditionItem>) => void;
  onPatchEffect: (
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
  ) => void;
}

/** Collapsed-summary / expanded-inline-editor card for one condition rule row — this
 *  collapse/expand pattern mirrors ConditionRow.tsx (standalone Rule Engine) and
 *  HybridSection's section-level toggles, without reusing those components directly. */
export function ConditionRuleRowCard({
  row,
  index,
  total,
  fields,
  resolveApiValueLabel,
  yearRangeOptions,
  taxOptions,
  expanded,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  onToggleStopFurtherProcessing,
  onSetAssessmentBasis,
  onRemove,
  onAddCondition,
  onRemoveCondition,
  onPatchCondition,
  onPatchEffect,
}: ConditionRuleRowCardProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentLabel = useAliasLabel('Assessment', t('aliasFallback.assessment'));

  return (
    <div
      // relative + a raised z-index while expanded ensures THIS row's Field/Operator dropdowns
      // (which overflow past the row's own height) always paint above every other row's card,
      // regardless of DOM order — without this, an earlier row's open dropdown gets visually
      // covered by later sibling rows since neither has an explicit stacking priority.
      className={`relative rounded-lg border ${expanded ? 'z-20' : 'z-0'} ${
        row.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold shrink-0">
          {row.sortOrder}
        </span>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          <span className="text-xs font-semibold text-slate-700 truncate">
            {formatConditionSummary(row.conditions, fields, t('condition.alwaysMatches'), resolveApiValueLabel)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {formatConditionEffect(
              row.resultMode,
              row.resultBase,
              row.resultValue,
              taxOptions.find((o) => o.value === row.referenceTaxId)?.label,
              fields.find((f) => f.fieldId === row.unitFieldId)?.fieldName ?? row.unitFieldId ?? undefined
            )}
          </span>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <IconOnlyActionButton
            icon={ArrowUp}
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            aria-label={t('condition.moveUp')}
          />
          <IconOnlyActionButton
            icon={ArrowDown}
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            aria-label={t('condition.moveDown')}
          />
          <ToggleSwitch checked={row.isActive} onChange={onToggleActive} showPopup={false} />
          <DeleteButton onClick={onRemove} aria-label={t('condition.deleteRowAria')} />
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 flex flex-col gap-3 bg-slate-50/50">
          <div className="flex flex-col gap-2">
            {row.conditions.length === 0 && (
              <p className="text-[11px] text-slate-400 italic">{t('condition.noConditionsYet')}</p>
            )}
            {row.conditions.map((c, i) => (
              <ConditionItemRow
                key={c.id}
                condition={c}
                fields={fields}
                isFirst={i === 0}
                onPatch={(patch) => onPatchCondition(c.id, patch)}
                onRemove={() => onRemoveCondition(c.id)}
              />
            ))}
            <div>
              <AddButton label={t('condition.addCondition')} size="sm" onClick={onAddCondition} />
            </div>
          </div>
          {/* One shared grid for every field in this row's effect — Assessment Year Range and
              Assessment Basis (this row's scope) sit alongside Result Mode/Base/Value (and the
              conditional Reference Tax, full-width) so labels, input heights, and column edges
              all stay consistent instead of each field group defining its own, mismatched layout. */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {`${assessmentLabel} ${t('aliasFallback.yearRangeSuffix')}`}
              </Label>
              {/* Multi-select: pick several year ranges (or "Select all") and each becomes its own
                  saved row. Empty = applies to all years (a single null-year catch-all row).
                  Uses the portal-based variant (not the shared MultiSelectDropdown) because this
                  trigger sits inside the Configuration tab's scrollable body and is only 1 of 4
                  equal grid columns — the shared component's inline, trigger-width panel would
                  get clipped by that scroll container and cramped into the column's width. */}
              <PortalMultiSelectDropdown
                options={yearRangeOptions.map((o) => ({ label: o.label, value: String(o.value) }))}
                value={(row.assessmentYearRangeIds ?? (row.assessmentYearRangeId != null ? [row.assessmentYearRangeId] : [])).map(String)}
                onChange={(vals) => onPatchEffect({ assessmentYearRangeIds: vals.map(Number) })}
                placeholder={t('condition.anyYear')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {`${assessmentLabel} ${t('aliasFallback.basisSuffix')}`}
              </Label>
              <Select
                value={row.assessmentBasis}
                onChange={(_, v) => onSetAssessmentBasis(v as ConditionRuleRow['assessmentBasis'])}
                options={[
                  {
                    label: t('condition.propertyBasedOption'),
                    value: 'PROPERTY_BASED'
                  },
                  {
                    label: t('condition.buildingBasedOption'),
                    value: 'BUILDING_BASED'
                  },
                ]}
                selectSize="sm"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[150px]">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {t('condition.conditionEvaluationScope')}
              </Label>
              <Select
                ariaLabel={t('condition.conditionEvaluationScope')}
                value={row.conditionEvaluationScope ?? 'FLOOR_WISE'}
                onChange={(_, v) => onPatchEffect({ conditionEvaluationScope: v as ConditionEvaluationScope })}
                options={[
                  {
                    label: t('condition.floorWiseOption'),
                    value: 'FLOOR_WISE'
                  },
                  {
                    label: t('condition.allFloorsAggregatedOption'),
                    value: 'ALL_FLOORS_AGGREGATED',
                  },
                ]}
                selectSize="sm"
              />
            </div>
            <ConditionEffectInputs
              resultMode={row.resultMode}
              resultBase={row.resultBase}
              resultValue={row.resultValue}
              referenceTaxId={row.referenceTaxId}
              unitFieldId={row.unitFieldId}
              taxOptions={taxOptions}
              fields={fields}
              onChange={onPatchEffect}
            />
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
            <ToggleSwitch checked={row.stopFurtherProcessing} onChange={onToggleStopFurtherProcessing} showPopup={false} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-slate-700">{t('condition.stopFurtherProcessing')}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{t('condition.stopFurtherProcessingHint')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
