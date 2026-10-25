import React from 'react';
import { Input, ValidationMessage } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { parseDateString, toLocalIsoDate, sanitizeCertificateNumber } from '@/lib/validation/building/validation-rules';
import type { FieldErrors } from './building-permission.types';

interface BuildingCertificateInputsProps {
  activeCertificateDisplayName: string;
  isFormDisabled: boolean;
  certificateNumber: string;
  setCertificateNumber: (val: string) => void;
  lengthRule: { min: number; max: number };
  isNumericOnly: boolean;
  fieldErrors: FieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  certificateDate: string;
  setCertificateDate: (val: string) => void;
  effectiveConstructionYear: number | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function BuildingCertificateInputs({
  activeCertificateDisplayName,
  isFormDisabled,
  certificateNumber,
  setCertificateNumber,
  lengthRule,
  isNumericOnly,
  fieldErrors,
  setFieldErrors,
  certificateDate,
  setCertificateDate,
  effectiveConstructionYear,
  t,
}: BuildingCertificateInputsProps): React.ReactElement {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <Input
            label={t('building.certificateNumber', { name: activeCertificateDisplayName })}
            required
            disabled={isFormDisabled}
            placeholder={t('building.certificateNumberPlaceholder', { name: activeCertificateDisplayName })}
            value={certificateNumber}
            maxLength={lengthRule.max}
            onKeyDown={(e) => {
              if (e.key === ' ') e.preventDefault();
            }}
            onChange={(e) => {
              const val = sanitizeCertificateNumber(e.target.value, isNumericOnly);
              setCertificateNumber(val);
              if (fieldErrors.certificateNumber) setFieldErrors((prev) => ({ ...prev, certificateNumber: undefined }));
            }}
            className={cn('text-xs text-slate-800 bg-slate-50/30', fieldErrors.certificateNumber && 'border-red-500 focus:ring-red-500')}
          />
          <ValidationMessage message={fieldErrors.certificateNumber} />
        </div>

        <div>
          <Input
            type="date"
            label={t('building.certificateDate', { name: activeCertificateDisplayName })}
            required
            disabled={isFormDisabled}
            value={certificateDate}
            min={effectiveConstructionYear ? `${effectiveConstructionYear}-01-01` : undefined}
            max={toLocalIsoDate()}
            onChange={(e) => {
              setCertificateDate(e.target.value);
              if (fieldErrors.certificateDate) setFieldErrors((prev) => ({ ...prev, certificateDate: undefined }));
            }}
            onBlur={() => {
              if (certificateDate && effectiveConstructionYear) {
                const certDate = parseDateString(certificateDate);
                if (certDate && certDate.getFullYear() < effectiveConstructionYear) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    certificateDate: t('validation.dateBeforeConstructionYear', { year: effectiveConstructionYear }),
                  }));
                }
              }
            }}
            className={cn('text-xs text-slate-800 bg-slate-50/30', fieldErrors.certificateDate && 'border-red-500 focus:ring-red-500')}
          />
          <ValidationMessage message={fieldErrors.certificateDate} />
        </div>
      </div>

      <div className="pt-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span>{t('building.verifyDetailsNote')}</span>
      </div>
    </>
  );
}
