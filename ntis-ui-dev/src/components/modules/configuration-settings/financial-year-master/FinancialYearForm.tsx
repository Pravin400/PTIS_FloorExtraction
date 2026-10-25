'use client';

import { useMemo, useCallback, useState } from 'react';
import { FinancialYearFormValues, FinancialYear } from '@/types/financialYear.types';
import { Button, useToast } from '@/components/common';
import { saveFinancialYearAction } from '@/app/[locale]/configuration-settings/financial-year-master/actions';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { createFinancialYearSchema } from '@/lib/validations/financial-year/validation-schemas';
import { FinancialYearFormFields } from './FinancialYearFormFields';
import { translateBackendMessage } from '@/lib/utils/backend-error-detection';
import {
  CLOSED_CURRENT_ERROR,
  FieldErrors,
  getInitialFinancialYearFormData,
  mapActionValidationErrors,
  mapZodFieldErrors,
} from './financialYearForm.utils';

interface FinancialYearFormProps {
  initialData?: FinancialYear | null;
  onSuccess?: (savedData?: FinancialYearFormValues, id?: number) => void;
  onCancel?: () => void;
}

export const FinancialYearForm = ({ initialData: financialYearData, onSuccess, onCancel }: FinancialYearFormProps) => {
  const t = useTranslations('financialYear');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const router = useRouter();
  const locale = useLocale();
  const basePath = `/${locale}/configuration-settings/financial-year-master`;

  const [formData, setFormData] = useState<FinancialYearFormValues>(getInitialFinancialYearFormData(financialYearData));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duration = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return t('days', { count: days });
  }, [formData.startDate, formData.endDate, t]);

  const handleChange = useCallback((name: keyof FinancialYearFormValues, value: string | number | boolean) => {
    setFormData((prev) => {
      if (name === 'year') {
        const nextYear = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(nextYear) || String(nextYear).length !== 4) {
          return { ...prev, [name]: value as unknown as number };
        }

        // Indian FY: 01-Apr-{year} to 31-Mar-{year+1}
        return {
          ...prev,
          year: nextYear,
          startDate: `${nextYear}-04-01`,
          endDate: `${nextYear + 1}-03-31`,
        };
      }

      if (name === 'yearCode' && typeof value === 'string') {
        return { ...prev, [name]: value.toUpperCase() };
      }

      return { ...prev, [name]: value };
    });
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleCurrentChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, isCurrent: checked }));
    setErrors((prev) => ({ ...prev, isCurrent: undefined }));
  }, []);

  const handleBlockedCurrentToggle = useCallback(() => {
    setErrors((prev) => ({ ...prev, isCurrent: CLOSED_CURRENT_ERROR }));
    toast.error(CLOSED_CURRENT_ERROR);
  }, [toast]);

  const runSave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const actionResult = await saveFinancialYearAction(formData, financialYearData?.id);
      if (actionResult.success) {
        toast.success(financialYearData ? t('form.messages.updateSuccess') : t('form.messages.createSuccess'));
        if (onSuccess) onSuccess(formData, financialYearData?.id); else router.push(basePath);
        return;
      }
      if (actionResult.validationErrors) {
        setErrors(mapActionValidationErrors(actionResult.validationErrors, t));
        toast.error(tCommon('errors.validationError'));
      } else {
        const errorMsg = actionResult.error 
          ? translateBackendMessage(actionResult.error, tCommon) 
          : (financialYearData ? tCommon('errors.updateError') : tCommon('errors.createError'));
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      console.error('runSave error:', err);
      const rawMessage = err instanceof Error ? err.message : tCommon('errors.generic');
      toast.error(translateBackendMessage(rawMessage, tCommon));
    } finally {
      setIsSubmitting(false);
    }
  }, [basePath, financialYearData, formData, onSuccess, router, t, tCommon, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = createFinancialYearSchema(t).safeParse(formData);
    if (!result.success) {
      setErrors(mapZodFieldErrors(result.error.flatten().fieldErrors));
      toast.error(tCommon('errors.validationError'));
      return;
    }

    await runSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <FinancialYearFormFields
        formData={formData}
        errors={errors}
        onChange={handleChange}
        duration={duration}
        handleCurrentChange={handleCurrentChange}
        disableCurrentToggle={financialYearData?.status === 'Closed'}
        onCurrentToggleBlocked={handleBlockedCurrentToggle}
      />
      <div className="flex gap-4 pt-6 border-t mt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => (onCancel ? onCancel() : router.push(basePath))}
          disabled={isSubmitting}
          className="flex-1 h-12 border border-slate-200 hover:bg-slate-50 font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          {t('form.buttons.cancel')}
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/20 font-bold transition-all active:scale-95 cursor-pointer border border-violet-500/50"
        >
          {financialYearData ? t('form.buttons.update') : t('form.buttons.create')}
        </Button>
      </div>
    </form>
  );
};
