'use client';

import { useTranslations } from 'next-intl';
import { DeleteButton } from '@/components/common';
import { ConditionItem } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import { ConditionValueInput } from './ConditionValueInput';
import { PortalSearchSelect } from './PortalSearchSelect';

export interface ConditionItemRowProps {
  condition: ConditionItem;
  fields: FieldConfig[];
  /** True for the first condition in a row — it has no previous condition to join, so its
   *  own logicalOperator is meaningless and the AND/OR toggle is hidden. */
  isFirst: boolean;
  onPatch: (patch: Partial<ConditionItem>) => void;
  onRemove: () => void;
}

/** One condition line: [AND/OR toggle] → field select → operator select → dynamic value
 *  input → remove. Conditions after the first join the running result via their own
 *  AND/OR, evaluated strictly left-to-right (no parentheses/precedence). Mirrors the
 *  standalone Rule Engine's ConditionRow editing-mode layout, minus its own collapse
 *  toggle (the parent row card is the single collapse point here). */
export function ConditionItemRow({ condition, fields, isFirst, onPatch, onRemove }: ConditionItemRowProps) {
  const t = useTranslations('dynamicTaxRegister');
  const fieldOptions = fields.map((f) => ({ label: f.fieldName || f.fieldId, value: f.fieldId }));
  const currentField = fields.find((f) => f.fieldId === condition.fieldId);
  const operatorOptions = (currentField?.supportedOperators ?? []).map((o) => ({ label: o.label, value: o.code }));

  return (
    <div className="flex items-center gap-2">
      <div className="w-14 shrink-0 flex items-center justify-center">
        {isFirst ? (
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">IF</span>
        ) : (
          <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-[10px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => onPatch({ logicalOperator: 'AND' })}
              className={`px-2 py-1 ${
                condition.logicalOperator === 'AND' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              AND
            </button>
            <button
              type="button"
              onClick={() => onPatch({ logicalOperator: 'OR' })}
              className={`px-2 py-1 border-l border-slate-300 ${
                condition.logicalOperator === 'OR' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              OR
            </button>
          </div>
        )}
      </div>
      {/* Portal-based variant rather than the shared SearchSelect: these sit inside the
          Configuration drawer's scrollable body, where an inline (absolute) option list gets
          clipped — see PortalSearchSelect for the full reasoning. */}
      <div className="w-40 shrink-0">
        <PortalSearchSelect
          options={fieldOptions}
          value={condition.fieldId}
          onChange={(v) => onPatch({ fieldId: v })}
          placeholder={t('condition.fieldPlaceholder')}
        />
      </div>
      <div className="w-40 shrink-0">
        <PortalSearchSelect
          options={operatorOptions}
          value={condition.operator}
          onChange={(v) => onPatch({ operator: v })}
          placeholder={t('condition.operatorPlaceholder')}
        />
      </div>
      <div className="flex-1 min-w-40">
        <ConditionValueInput
          config={currentField}
          operator={condition.operator}
          value={condition.value}
          onChange={(v) => onPatch({ value: v })}
        />
      </div>
      <DeleteButton onClick={onRemove} aria-label={t('condition.removeConditionAria')} />
    </div>
  );
}
