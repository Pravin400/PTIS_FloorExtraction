'use client';

import { useTranslations } from 'next-intl';
import { ConditionGroupState, ConditionState, FieldConfig } from '@/types/rule-engine';
import { getFieldLabel, getFriendlyOperatorLabel } from '@/hooks/rule-engine/useRuleBuilderHelpers';

interface RenderConditionGroupProps {
  group: ConditionGroupState;
  fields: FieldConfig[];
}

export default function RenderConditionGroup({ group, fields }: RenderConditionGroupProps) {
  const t = useTranslations('ruleEngine');
  const hasMultiple = (group.conditions?.length || 0) + (group.groups?.length || 0) > 1;

  return (
    <div className="flex flex-col gap-1 pl-3 border-l-2 border-indigo-100 relative">
      {hasMultiple && (
        <span className="absolute -left-[9px] top-0.5 px-1 py-0 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider select-none leading-4">
          {group.logicalOperator}
        </span>
      )}

      {/* Conditions */}
      {group.conditions?.map((cond: ConditionState, idx: number) => {
        const valLabel = cond.valueLabel
          ? (Array.isArray(cond.valueLabel) ? cond.valueLabel.join(', ') : String(cond.valueLabel))
          : (Array.isArray(cond.value) ? cond.value.join(', ') : String(cond.value));

        const fieldObj = fields.find(
          (f) => f.fieldId === cond.fieldId || f.fieldName === cond.fieldId || f.databaseColumnName === cond.fieldId
        );
        const rawLabel = fieldObj?.fieldName || cond.fieldId;
        const displayLabel = getFieldLabel(cond.fieldId, rawLabel, t);

        return (
          <div key={cond.id} className="flex items-center gap-1.5 text-sm text-slate-800 py-0.5 hover:bg-slate-50 rounded px-1 transition-all">
            <span className="text-slate-400 font-medium text-xs">{idx + 1}.</span>
            <span className="font-bold text-slate-900">{displayLabel}</span>
            <span className="text-blue-600 font-semibold text-xs bg-blue-50/50 px-1.5 py-0 rounded border border-blue-100/50 leading-5">
              {getFriendlyOperatorLabel(cond.operator)}
            </span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0 rounded border border-slate-200/80 text-xs leading-5">
              {valLabel || t('simulation.emptyValue')}
            </span>
          </div>
        );
      })}

      {/* Subgroups */}
      {group.groups?.map((subGroup: ConditionGroupState) => (
        <RenderConditionGroup key={subGroup.id} group={subGroup} fields={fields} />
      ))}
    </div>
  );
}
