'use client';

import { Layers, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/common';
import { SubmoduleRow } from './SubmoduleRow';
import { DepartmentApiResponse } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';

interface SubmoduleConfigListProps {
  dept: DepartmentApiResponse;
  configKeyId: number;
  controlType?: string;
  dataType?: string;
  options?: string[];
  onToggleAll: (deptId: number, enabled: boolean) => void;
  onToggleSubmodule: (deptId: number, subId: number) => void;
  onValueChange: (deptId: number, subId: number, value: string) => void;
}

export function SubmoduleConfigList({
  dept,
  controlType,
  dataType,
  options,
  onToggleAll,
  onToggleSubmodule,
  onValueChange,
}: SubmoduleConfigListProps) {
  const t = useTranslations('configMaster');

  return (
    <div className="bg-slate-50/80 p-4 sm:p-6 border-t border-slate-100 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Layers className="w-4 h-4 text-violet-600" />
          </div>
          <span className="text-sm font-bold text-slate-700 tracking-tight">
            {t('modals.departmentConfig.submoduleTitle') || 'Submodules Configuration'}
          </span>

          {!dept.isEnabled && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-wider">
              {t('modals.departmentConfig.deptDisabled')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="xs"
            icon={CheckCircle2}
            className={`h-8 font-bold text-[10px] uppercase tracking-wider px-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white ${!dept.isEnabled ? 'opacity-50 cursor-not-allowed' : ''} shadow-xs rounded-lg transition-all`}
            onClick={() => onToggleAll(dept.id, true)}
            disabled={!dept.isEnabled}
          >
            {t('modals.departmentConfig.enableAll')}
          </Button>
          <Button
            variant="secondary"
            size="xs"
            icon={XCircle}
            className={`h-8 font-bold text-[10px] uppercase tracking-wider px-4 text-rose-600 border-rose-200 hover:bg-rose-50 bg-white ${!dept.isEnabled ? 'opacity-50 cursor-not-allowed' : ''} shadow-xs rounded-lg transition-all`}
            onClick={() => onToggleAll(dept.id, false)}
            disabled={!dept.isEnabled}
          >
            {t('modals.departmentConfig.disableAll')}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {dept.submodules.length === 0 ? (
          <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-full">
              <Layers className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-400 italic">
              {t('modals.departmentConfig.noSubmodules')}
            </span>
          </div>
        ) : (
          dept.submodules.map((sub, index) => (
            <SubmoduleRow
              key={`${dept.id}-${sub.id}-${index}`}
              sub={sub}
              index={index}
              deptId={dept.id}
              deptEnabled={dept.isEnabled}
              controlType={controlType}
              dataType={dataType}
              options={options}
              onToggle={onToggleSubmodule}
              onValueChange={onValueChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
