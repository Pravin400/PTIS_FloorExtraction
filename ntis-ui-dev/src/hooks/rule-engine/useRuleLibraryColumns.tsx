'use client';

import React from 'react';
import { Column, ToggleSwitch, StatusBadge } from '@/components/common';
import { RuleItem } from '@/types/rule-engine';
import { getRuleWiseDescriptions } from './useRuleBuilderHelpers';

export type RuleItemRecord = RuleItem & Record<string, unknown>;

interface UseRuleLibraryColumnsArgs {
  t: (key: string) => string;
  onToggleActive?: (row: RuleItemRecord, newChecked: boolean) => void;
  togglingRuleId?: number | null;
}

export function useRuleLibraryColumns({
  t,
  onToggleActive,
  togglingRuleId,
}: UseRuleLibraryColumnsArgs): Column<RuleItemRecord>[] {
  return React.useMemo<Column<RuleItemRecord>[]>(
    () => [
      { key: 'ruleCode', label: t('library.ruleCode'), width: '150px' },
      { key: 'ruleName', label: t('library.ruleName'), width: '130px' },
      {
        key: 'priority',
        label: t('library.priority'),
        width: '95px',
        render: (val: unknown) => {
          return typeof val === 'number' ? (
            <span className="font-semibold text-gray-800">{val}</span>
          ) : (
            <span className="text-gray-350 text-xs">—</span>
          );
        },
      },
      {
        key: 'description',
        label: t('library.description'),
        render: (_val: unknown, row: RuleItemRecord) => {
          let descs: string[] = [];
          if (row.subRules && Array.isArray(row.subRules)) {
            descs = row.subRules
              .map((sr) => sr.description)
              .filter((desc): desc is string => !!desc);
          }
          if (descs.length === 0 && row.description) {
            descs = [row.description];
          }
          if (descs.length === 0 && row.conditionsJson) {
            descs = getRuleWiseDescriptions(row.conditionsJson);
          }

          if (descs.length === 0) return <span className="text-gray-800 text-sm">—</span>;
          return (
            <div className="flex flex-col gap-0.5 text-gray-900 max-w-[320px]">
              {descs.map((desc, i) => (
                <span key={`desc-${i}`} title={desc} className="line-clamp-1 block font-medium">
                  {descs.length > 1 ? `${i + 1}. ${desc}` : desc}
                </span>
              ))}
            </div>
          );
        },
      },
      { key: 'ruleCategory', label: t('library.category'), width: '120px', align: 'center' },
      {
        key: 'ruleScopeName',
        label: t('library.scope'),
        width: '160px',
        align: 'center',
        render: (val: unknown) => {
          return val ? (
            <span className="font-semibold text-gray-800">
              {String(val)}
            </span>
          ) : (
            <span className="text-gray-350 text-xs">—</span>
          );
        }
      },
      {
        key: 'isActive',
        label: t('library.status'),
        width: '210px',
        align: 'center',
        render: (val: unknown, row: RuleItemRecord) => {
          const checked = !!val;
          const isToggling = togglingRuleId === row.id;
          return (
            <div className="flex items-center gap-3 justify-center">
              <ToggleSwitch
                checked={checked}
                disabled={isToggling || row.id === undefined}
                onChange={(newChecked) => onToggleActive?.(row, newChecked)}
                showPopup={false}
              />
              <StatusBadge
                value={checked}
                activeLabel={t('library.statusActive')}
                inactiveLabel={t('library.statusInactive')}
              />
            </div>
          );
        },
      },
    ],
    [t, onToggleActive, togglingRuleId]
  );
}
