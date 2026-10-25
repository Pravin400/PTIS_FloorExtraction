import { FC, useCallback } from 'react';
import { FinancialYearFormValues } from '@/types/financialYear.types';
import { Input, Label, TextArea, Checkbox } from '@/components/common';
import { useTranslations } from 'next-intl';
import { PeriodDetailsFields } from './PeriodDetailsFields';

interface FinancialYearFormFieldsProps {
  formData: FinancialYearFormValues;
  errors: Partial<Record<keyof FinancialYearFormValues, string>>;
  onChange: (name: keyof FinancialYearFormValues, value: string | number | boolean) => void;
  duration: string | null;
  handleCurrentChange: (checked: boolean) => void;
  disableCurrentToggle: boolean;
  onCurrentToggleBlocked: () => void;
}

export const FinancialYearFormFields: FC<FinancialYearFormFieldsProps> = ({
  formData,
  errors,
  onChange,
  duration,
  handleCurrentChange,
  disableCurrentToggle,
  onCurrentToggleBlocked,
}) => {
  const t = useTranslations('financialYear');

  const handleMarkCurrentContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, label, input')) return;
      if (disableCurrentToggle) {
        onCurrentToggleBlocked();
        return;
      }
      handleCurrentChange(!formData.isCurrent);
    },
    [disableCurrentToggle, formData.isCurrent, handleCurrentChange, onCurrentToggleBlocked]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="yearCode"
          className="text-sm font-semibold text-slate-700 cursor-pointer"
        >
          {t('form.fields.yearCode')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="yearCode"
          value={formData.yearCode}
          onChange={(e) => {
            const val = e.target.value;
            const hasConsecutiveSpecial = /[-_]{2,}/.test(val);
            const isLeadingSpecial = /^[-_]/.test(val);
            const hasInvalidChars = /[^\p{L}\p{M}\p{N}\-_]/u.test(val);
            if (!hasConsecutiveSpecial && !isLeadingSpecial && !hasInvalidChars && val.length <= 15) {
              onChange('yearCode', val.toUpperCase());
            }
          }}
          maxLength={15}
          placeholder={t('form.fields.yearCodePlaceholder')}
          error={errors.yearCode}
          aria-invalid={!!errors.yearCode}
          aria-describedby={errors.yearCode ? 'yearCode-error' : undefined}
          className="bg-slate-50 border-slate-200 focus:bg-white transition-all cursor-text uppercase"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="year"
          className="text-sm font-semibold text-slate-700 cursor-pointer"
        >
          {t('form.fields.year')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="year"
          type="number"
          min={1900}
          max={2100}
          value={formData.year || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d{0,4}$/.test(val)) {
              onChange('year', val === '' ? '' : parseInt(val) || 0);
            }
          }}
          onKeyDown={(e) => {
            if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          placeholder={t('form.fields.yearPlaceholder')}
          error={errors.year}
          aria-invalid={!!errors.year}
          aria-describedby={errors.year ? 'year-error' : undefined}
          className="bg-slate-50 border-slate-200 focus:bg-white transition-all cursor-text"
        />
      </div>

      <PeriodDetailsFields
        startDate={formData.startDate}
        endDate={formData.endDate}
        errors={errors}
        onChange={onChange}
        duration={duration}
        year={formData.year}
      />

      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-sm font-semibold text-slate-700 cursor-pointer"
        >
          {t('form.fields.description')}
        </Label>
        <TextArea
          id="description"
          value={formData.description}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length <= 250) {
              onChange('description', val);
            }
          }}
          rows={3}
          placeholder={t('form.fields.descriptionPlaceholder')}
          error={!!errors.description}
          errorMessage={errors.description}
          maxLength={250}
          showCharCount={true}
          className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none cursor-text"
        />
      </div>

      <div
        data-testid="mark-as-current-container"
        className="flex items-center space-x-3 p-4 border rounded-2xl bg-emerald-50/20 border-emerald-100 transition-all hover:bg-emerald-50/40 hover:shadow-sm cursor-pointer group select-none"
        onClick={handleMarkCurrentContainerClick}
      >
        <Checkbox
          id="isCurrent"
          checked={formData.isCurrent}
          disabled={disableCurrentToggle}
          onCheckedChange={handleCurrentChange}
          onClick={(e) => e.stopPropagation()}
          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer h-5 w-5 rounded-md transition-transform group-active:scale-90"
        />
        <Label
          htmlFor="isCurrent"
          className="text-sm cursor-pointer font-bold text-emerald-800 flex items-center gap-2"
        >
          {t('form.fields.markAsCurrent')}
        </Label>
      </div>
    </div>
  );
};
