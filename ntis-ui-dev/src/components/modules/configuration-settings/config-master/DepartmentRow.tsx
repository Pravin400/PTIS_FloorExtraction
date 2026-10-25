'use client';

import React from 'react';

import { 
  ChevronRight, 
  ChevronUp, 
  CheckCircle2, 
} from 'lucide-react';
import { Button, ToggleSwitch } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { DepartmentApiResponse } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';
import { getStyleForDept, getIconForDept } from './department-row.utils';

interface DepartmentRowProps {
  dept: DepartmentApiResponse;
  isExpanded: boolean;
  onToggleExpansion: (id: number) => void;
  onToggle: (id: number) => void;
  children?: React.ReactNode;
}

export function DepartmentRow({
  dept,
  isExpanded,
  onToggleExpansion,
  onToggle,
  children,
}: DepartmentRowProps) {
  const t = useTranslations('configMaster');
  const style = getStyleForDept(dept.code);
  const submodules = dept.submodules || [];
  const activeSubmodulesCount = submodules.filter((s) => s.isEnabled).length;

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl border shadow-xs transition-all duration-300',
        isExpanded
          ? 'border-violet-300 ring-4 ring-violet-500/5 shadow-lg'
          : 'border-slate-200 hover:shadow-md hover:border-slate-300'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 sm:gap-0">
        <div className="flex items-center gap-4 sm:gap-5">
          <div
            className={cn(
              'p-3 md:p-4 rounded-2xl text-white shadow-sm shrink-0 transition-transform group-hover:scale-105',
              style.bgColor
            )}
          >
            {React.createElement(getIconForDept(dept.name, dept.code), { className: 'w-6 h-6' })}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg tracking-tight">
              {dept.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-bold text-slate-500 lowercase tracking-tight">
                  {dept.submoduleCount} {t('modals.departmentConfig.submodules')}
                </span>
              </div>
              <div
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all',
                  dept.isEnabled
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                )}
              >
                {dept.isEnabled
                  ? t('modals.departmentConfig.enabled')
                  : t('modals.departmentConfig.disabled')}
              </div>
              {isExpanded && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeSubmodulesCount}/{dept.submoduleCount}{' '}
                  {t('modals.departmentConfig.active')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3 sm:gap-4 w-auto">
          <div className="flex items-center gap-4 w-auto justify-end">
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <span
                className={cn(
                  'text-sm font-bold transition-colors hidden sm:inline py-1',
                  dept.isEnabled ? 'text-emerald-600' : 'text-slate-400'
                )}
              >
                {dept.isEnabled
                  ? t('modals.departmentConfig.enabled')
                  : t('modals.departmentConfig.disabled')}
              </span>
              <ToggleSwitch
                checked={dept.isEnabled}
                onChange={() => onToggle(dept.id)}
                showPopup={false}
              />
            </div>
          </div>

          <Button
            variant={isExpanded ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onToggleExpansion(dept.id)}
            icon={isExpanded ? ChevronUp : ChevronRight}
            className={cn(
              'h-10 px-6 text-xs font-bold border-slate-200 transition-all rounded-xl w-full sm:w-auto cursor-pointer',
              isExpanded
                ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700 shadow-md shadow-violet-200'
                : 'bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300'
            )}
          >
            {isExpanded
              ? t('modals.departmentConfig.hide')
              : t('modals.departmentConfig.show')}
          </Button>
        </div>
      </div>

      {isExpanded && children}
    </div>
  );
}
