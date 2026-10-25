'use client';

import { CheckCircle2, X } from 'lucide-react';
import { ToggleSwitch, ValidationMessage } from '@/components/common';
import { cn } from '@/lib/utils/cn';

interface StatusToggleSectionProps {
  isEdit: boolean;
  isActive: boolean;
  handleToggleStatus: () => void;
  error?: string;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export const StatusToggleSection = ({
  isEdit,
  isActive,
  handleToggleStatus,
  error,
  t,
  tCommon,
}: StatusToggleSectionProps) => {
  if (!isEdit) return null;

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
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
            <div className="font-medium text-gray-900">{t('form.status.label')}</div>
            <div className="text-sm text-gray-500">
              {t('form.status.description')}
              {isActive ? ` ${tCommon('status.active')}` : ` ${tCommon('status.inactive')}`}
            </div>
          </div>
        </div>

        <ToggleSwitch checked={isActive} onChange={handleToggleStatus} showPopup={false} />
      </div>

      <ValidationMessage message={error} visible={!!error} />
    </div>
  );
};
