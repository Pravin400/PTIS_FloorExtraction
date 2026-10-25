'use client';

import { useRef, useEffect } from 'react';

import { ToggleSwitch } from '@/components/common';
import { Submodule } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { ConfigValueInput } from './ConfigValueInput';

interface SubmoduleRowProps {
  sub: Submodule;
  index: number;
  deptId: number;
  deptEnabled: boolean;
  controlType?: string;
  dataType?: string;
  options?: string[];
  onToggle: (deptId: number, subId: number) => void;
  onValueChange: (deptId: number, subId: number, value: string) => void;
}

export function SubmoduleRow({
  sub,
  index,
  deptId,
  deptEnabled,
  controlType,
  dataType,
  options,
  onToggle,
  onValueChange,
}: SubmoduleRowProps) {
  const t = useTranslations('configMaster');

  const isSubActive = sub.isEnabled && deptEnabled;

  const inputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (sub.isEnabled && deptEnabled) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [sub.isEnabled, deptEnabled]);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border transition-all duration-300 gap-4 sm:gap-0 overflow-visible',
        isSubActive ? 'border-violet-200 shadow-sm' : 'border-slate-100 shadow-xs opacity-80',
        'hover:border-violet-300 hover:shadow-md'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold shrink-0 shadow-xs transition-colors',
            isSubActive ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'
          )}
        >
          {index + 1}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                'font-bold text-sm tracking-tight',
                isSubActive ? 'text-slate-800' : 'text-slate-500'
              )}
            >
              {sub.title}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400 bg-slate-50/50 uppercase">
              {sub.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-sm">
            {sub.desc}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between w-full md:w-auto pl-12 sm:pl-14 md:pl-0 overflow-visible">
        <div className="w-full sm:min-w-40 md:w-50 shrink-0 overflow-visible">
          <ConfigValueInput
            value={sub.value || ''}
            onChange={(val) => onValueChange(deptId, sub.id, val)}
            controlType={controlType}
            dataType={dataType}
            options={options}
            disabled={!sub.isEnabled || !deptEnabled}
            className="h-10 text-xs px-4"
            inputRef={inputRef}
          />
        </div>
        <div className="flex items-center gap-4 shrink-0 px-2 justify-end sm:justify-start">
          <span
            className={cn(
              'text-[11px] font-bold transition-colors hidden sm:inline uppercase tracking-wider',
              isSubActive ? 'text-emerald-600' : 'text-slate-400'
            )}
          >
            {isSubActive
              ? t('modals.departmentConfig.enabled')
              : t('modals.departmentConfig.disabled')}
          </span>
          <ToggleSwitch
            checked={isSubActive}
            onChange={() => onToggle(deptId, sub.id)}
            disabled={!deptEnabled}
            showPopup={false}
          />
        </div>
      </div>
    </div>
  );
}
