'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FieldConfig, ConditionGroupState, ConditionState } from '@/types/rule-engine';
import ConditionRow from './ConditionRow';
import { safeUUID } from '@/hooks/rule-engine/useRuleBuilderHelpers';
import { useToast } from '@/components/common';

interface ConditionGroupProps {
  group: ConditionGroupState;
  fields: FieldConfig[];
  onChange: (updated: ConditionGroupState) => void;
  onRemove?: () => void;
  depth?: number;
}

export default function ConditionGroup({
  group,
  fields,
  onChange,
  onRemove,
  depth = 0,
}: ConditionGroupProps) {
  const t = useTranslations('ruleEngine');
  const toast = useToast();

  const handleOperatorChange = (op: 'AND' | 'OR') => {
    onChange({ ...group, logicalOperator: op });
  };

  const addCondition = () => {
    if (fields.length === 0) {
      toast.error('Please select a Rule Scope first to load available fields!');
      return;
    }
    const newCondition: ConditionState = {
      id: safeUUID(),
      fieldId: '',
      operator: '',
      value: '',
    };
    onChange({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const handleConditionChange = (index: number, updated: ConditionState) => {
    const list = [...group.conditions];
    list[index] = updated;
    onChange({ ...group, conditions: list });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...group,
      conditions: group.conditions.filter((_, i) => i !== index),
    });
  };

  const addSubGroup = () => {
    onChange({
      ...group,
      groups: [
        ...(group.groups || []),
        {
          id: safeUUID(),
          logicalOperator: 'AND',
          conditions: [],
          groups: [],
        },
      ],
    });
  };

  const handleSubGroupChange = (subIdx: number, updatedSubGroup: ConditionGroupState) => {
    const nextGroups = [...(group.groups || [])];
    nextGroups[subIdx] = updatedSubGroup;
    onChange({ ...group, groups: nextGroups });
  };

  const removeSubGroup = (subIdx: number) => {
    onChange({
      ...group,
      groups: (group.groups || []).filter((_, idx) => idx !== subIdx),
    });
  };

  return (
    <div
      className={`
        relative rounded-xl border border-dashed border-zinc-300 bg-white p-3.5
        ${depth > 0 ? 'ml-4 border-l-2 border-l-blue-400 bg-zinc-50/30' : ''}
      `}
    >
      {/* 1. Header controls: "If [All/Any] of the following conditions are met" */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 mb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="text-gray-500 font-medium">{t('conditionGroup.if')}</span>
          <select
            value={group.logicalOperator}
            onChange={(e) => handleOperatorChange(e.target.value as 'AND' | 'OR')}
            className="bg-zinc-50 border border-zinc-300 rounded px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
          >
            <option value="AND">{t('conditionGroup.all')}</option>
            <option value="OR">{t('conditionGroup.any')}</option>
          </select>
          <span className="text-gray-500 font-medium">{t('conditionGroup.conditionsMet')}</span>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="px-2 py-1 text-xs font-bold text-red-500 hover:text-red-700 transition-all border border-transparent hover:bg-red-50 rounded"
          >
            {t('conditionGroup.removeGroup')}
          </button>
        )}
      </div>

      {/* 2. List of simple conditions */}
      <div className="flex flex-col gap-3.5">
        {group.conditions.map((cond, idx) => (
          <ConditionRow
            key={cond.id}
            index={idx + 1}
            condition={cond}
            fields={fields}
            onChange={(updated) => handleConditionChange(idx, updated)}
            onRemove={() => removeCondition(idx)}
          />
        ))}

        {/* 3. List of nested groups */}
        {(group.groups || []).map((subGroup, subIdx) => (
          <div key={subGroup.id} className="mt-1">
            <ConditionGroup
              group={subGroup}
              fields={fields}
              depth={depth + 1}
              onChange={(updated) => handleSubGroupChange(subIdx, updated)}
              onRemove={() => removeSubGroup(subIdx)}
            />
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1.5 flex-wrap">
          <button
            type="button"
            onClick={addCondition}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-300 hover:border-blue-500 rounded-lg hover:bg-blue-50/50 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> {t('conditionGroup.addCondition')}
          </button>
          <button
            type="button"
            onClick={addSubGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:border-zinc-500 rounded-lg hover:bg-zinc-50 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-600" /> {t('conditionGroup.addSubGroup')}
          </button>
        </div>
      </div>
    </div>
  );
}
