'use client';

import { User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/common';
import type { GrievanceFormErrors } from '@/lib/utils/grievance/citizen-form-validation';
import { sanitizeCitizenName } from '@/lib/utils/grievance/citizen-form-validation';

interface CitizenContactSectionProps {
  fullName: string;
  mobile: string;
  errors: GrievanceFormErrors;
  onFullNameChange: (val: string) => void;
  onMobileChange: (val: string) => void;
  clearFieldError: (field: keyof GrievanceFormErrors) => void;
}

export function CitizenContactSection({
  fullName,
  mobile,
  errors,
  onFullNameChange,
  onMobileChange,
  clearFieldError,
}: CitizenContactSectionProps) {
  const t = useTranslations('grievance');

  return (
    <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-800">
        <UserIcon className="w-3.5 h-3.5 text-green-600" />
        <span>{t('citizenInfo')}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        <div>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => {
              const sanitized = sanitizeCitizenName(e.target.value);
              onFullNameChange(sanitized);
              if (errors.fullName) clearFieldError('fullName');
            }}
            placeholder={t('fullName')}
            className={`bg-white text-xs h-8 rounded-xl w-full transition-colors ${errors.fullName ? 'border-red-500 ring-1 ring-red-400/30' : ''
              }`}
          />
          {errors.fullName && (
            <p className="text-[9.5px] font-bold text-red-600 mt-0.5">{errors.fullName}</p>
          )}
        </div>
        <div>
          <Input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={mobile}
            onChange={(e) => {
              onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10));
              if (errors.mobile) clearFieldError('mobile');
            }}
            placeholder={t('mobilePlaceholder')}
            className={`bg-white text-xs h-8 rounded-xl w-full transition-colors ${errors.mobile ? 'border-red-500 ring-1 ring-red-400/30' : ''
              }`}
          />
          {errors.mobile && (
            <p className="text-[9.5px] font-bold text-red-600 mt-0.5">{errors.mobile}</p>
          )}
        </div>
      </div>
    </div>
  );
}
