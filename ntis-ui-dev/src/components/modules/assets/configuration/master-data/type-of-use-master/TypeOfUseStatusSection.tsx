'use client';

import type { RefObject } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { ToggleSwitch, ValidationMessage } from '@/components/common';
import { cn } from '@/lib/utils/cn';

type Translation = (key: string, values?: Record<string, string | number>) => string;

interface TypeOfUseStatusSectionProps {
  isActive: boolean;
  error?: string;
  statusToggleRef: RefObject<HTMLButtonElement | null>;
  onToggle: (checked: boolean) => void;
  t: Translation;
}

export default function TypeOfUseStatusSection({
  isActive,
  error,
  statusToggleRef,
  onToggle,
  t,
}: TypeOfUseStatusSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div
        className={cn(
          'rounded-xl p-3 flex items-center justify-between',
          isActive ? 'border border-blue-200 bg-[#F0F6FF]' : 'border border-gray-200 bg-gray-50'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-full',
              isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-900'
            )}
          >
            {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {t('group.fields.status', { default: 'Status' })}
            </div>
            <div className="text-sm text-slate-500">
              {t('status.toggleDescription', { default: 'Toggle status' })}
              {isActive ? ` ${t('status.active')}` : ` ${t('status.inactive')}`}
            </div>
          </div>
        </div>
        <ToggleSwitch
          ref={statusToggleRef}
          checked={isActive}
          onChange={onToggle}
          showPopup={false}
          activeLabel={t('status.active')}
          inactiveLabel={t('status.inactive')}
        />
      </div>
      {error && <ValidationMessage message={error} className="mt-2" />}
    </div>
  );
}
