import { FC } from 'react';
import { FinancialYearFormValues } from '@/types/financialYear.types';
import { Input, Label } from '@/components/common';
import { Calendar, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PeriodDetailsFieldsProps {
  startDate: string;
  endDate: string;
  errors: Partial<Record<keyof FinancialYearFormValues, string>>;
  onChange: (name: keyof FinancialYearFormValues, value: string | number | boolean) => void;
  duration: string | null;
  year?: number | string;
}

export const PeriodDetailsFields: FC<PeriodDetailsFieldsProps> = ({
  startDate,
  endDate,
  errors,
  onChange,
  duration,
  year,
}) => {
  const t = useTranslations('financialYear');

  const parsedYear = typeof year === 'number' ? year : parseInt(String(year || ''), 10);
  const isYearValid = Number.isFinite(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100;
  const minDate = isYearValid ? `${parsedYear}-04-01` : undefined;
  const maxDate = isYearValid ? `${parsedYear + 1}-03-31` : undefined;

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-1.5 bg-violet-100 rounded-lg text-violet-600">
          <Calendar className="w-4 h-4" />
        </div>
        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">
          {t('form.fields.periodDetails')}
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="startDate"
            className="text-xs font-bold text-slate-500 uppercase tracking-tight cursor-pointer"
          >
            {t('form.fields.startDate')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            min={minDate}
            max={maxDate}
            error={errors.startDate}
            aria-invalid={!!errors.startDate}
            className="bg-white cursor-text"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="endDate"
            className="text-xs font-bold text-slate-500 uppercase tracking-tight cursor-pointer"
          >
            {t('form.fields.endDate')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            min={minDate}
            max={maxDate}
            error={errors.endDate}
            aria-invalid={!!errors.endDate}
            className="bg-white cursor-text"
          />
        </div>
      </div>
      {startDate && endDate && (
        <div className="flex items-center gap-2 text-xs font-bold text-violet-600 mt-2 bg-violet-50 w-fit px-3 py-1 rounded-full border border-violet-100">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {t('form.fields.duration')}: {duration}
          </span>
        </div>
      )}
    </div>
  );
};
