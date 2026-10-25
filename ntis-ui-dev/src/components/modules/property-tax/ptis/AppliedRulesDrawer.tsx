'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { GitMerge } from 'lucide-react';
import { Drawer, MasterTable } from '@/components/common';
import type { PropertyRuleLogItem } from '@/types/rule-engine';
import { useAppliedRulesColumns } from '@/hooks/ptis/rule-engine/useAppliedRulesColumns';

interface AppliedRulesDrawerProps {
  open: boolean;
  onClose: () => void;
  propertyId?: number;
  propertyNo?: string;
  locale: string;
  appliedRules?: PropertyRuleLogItem[];
}

export function AppliedRulesDrawer({
  open,
  onClose,
  propertyId,
  propertyNo,
  locale,
  appliedRules = []
}: AppliedRulesDrawerProps) {
  const t = useTranslations('ptis');
  const columns = useAppliedRulesColumns(locale);

  const sortedRules = useMemo(() => {
    return [...appliedRules].sort((a, b) => a.applyOrder - b.applyOrder);
  }, [appliedRules]);

  const drawerTitle = (
    <div className="flex flex-col gap-1.5" id="drawer-title-container">
      <div className="flex items-center gap-2">
        <GitMerge className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-indigo-900" id="drawer-title">
          {t('appliedRules.drawerTitle')}
        </h3>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {propertyId && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 border border-indigo-100 text-indigo-700">
            {t('appliedRules.propertyId')}: {propertyId}
          </span>
        )}
        {propertyNo && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 border border-blue-100 text-blue-700">
            {t('appliedRules.propertyNo')}: {propertyNo}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={drawerTitle}
      width="xl"
    >
      {sortedRules.length === 0 ? (
        <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
          <p className="text-lg font-medium">{t('appliedRules.noAppliedRules')}</p>
        </div>
      ) : (
        <div className="p-4">
          <MasterTable
            columns={columns}
            data={sortedRules as unknown as Record<string, unknown>[]}
            paginationConfig={{ enabled: false }}
            containerClassName="border border-indigo-100 rounded-lg overflow-hidden shadow-sm"
            emptyText={t('appliedRules.noAppliedRules')}
            getRowKey={(row, i) => `${String(row.ruleCode || row.id || i)}-${i}`}
          />
        </div>
      )}
    </Drawer>
  );
}
