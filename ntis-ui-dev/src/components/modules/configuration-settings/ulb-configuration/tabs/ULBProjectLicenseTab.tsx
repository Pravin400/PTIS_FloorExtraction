'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, SaveButton } from '@/components/common';
import type { ULBProjectLicenseTabProps } from '@/types/ulbconfig-master.types';
import { ULBProjectInfoSection } from '../parts/ULBProjectInfoSection';
import { ULBLicenseSection } from '../parts/ULBLicenseSection';

export function ULBProjectLicenseTab({
  formData,
  t,
  onFieldChange,
  onFieldBlur,
  getFieldError,
  onLicenseFieldChange,
  onGenerateLicenseKey,
  onSave,
  onPrevious,
  onNext,
  isSaving,
  footerClassName,
}: ULBProjectLicenseTabProps) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ULBProjectInfoSection
          formData={formData}
          t={t}
          onFieldChange={onFieldChange}
          onFieldBlur={onFieldBlur}
          getFieldError={getFieldError}
        />
        <ULBLicenseSection
          formData={formData}
          t={t}
          onFieldChange={onFieldChange}
          onLicenseFieldChange={onLicenseFieldChange}
          onGenerateLicenseKey={onGenerateLicenseKey}
          onFieldBlur={onFieldBlur}
          getFieldError={getFieldError}
        />
      </div>

      <div className={`${footerClassName} justify-between`}>
        <Button
          onClick={onPrevious}
          icon={ChevronLeft}
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-700 bg-blue-700 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
        >
          {t('buttons.previous')}
        </Button>
        <div className="flex items-center gap-3">
          <SaveButton
            label={t('buttons.save')}
            onClick={onSave}
            disabled={isSaving}
            className="h-11 rounded-xl px-6"
          />
          <Button
            onClick={onNext}
            disabled={isSaving}
            icon={ChevronRight}
            iconPosition="right"
            className="inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-blue-700 px-8 font-black text-white hover:bg-blue-800"
          >
            {t('buttons.continueToDepartments')}
          </Button>
        </div>
      </div>
    </>
  );
}
