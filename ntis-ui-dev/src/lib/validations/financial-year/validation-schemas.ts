import { z } from 'zod';
import { isAllZeros } from '@/lib/utils/validation-rules';

/**
 * Creates an i18n-aware Zod schema for financial year form validation.
 * @param t - Translation function scoped to 'financialYear' namespace
 */
export function createFinancialYearSchema(
  t: (key: string, values?: Record<string, string | number | Date>) => string
) {
  return z
    .object({
      yearCode: z
        .string()
        .min(1, t('form.validation.codeRequired'))
        .max(15, t('form.validation.codeMaxLength', { count: 15 }))
        .refine((val) => /^[\p{L}\p{M}\p{N}]+([-_][\p{L}\p{M}\p{N}]+)*$/u.test(val), {
          message: t('form.validation.codeFormat'),
        })
        .refine((val) => !isAllZeros(val), {
          message: t('form.validation.codeAllZeros'),
        }),

      year: z.coerce
        .number({
          error: t('form.validation.yearRequired'),
        })
        .int(t('form.validation.yearMustBePositive'))
        .min(1900, t('form.validation.yearMinValue'))
        .max(2100, t('form.validation.yearMaxValue')),

      startDate: z.string().min(1, t('form.validation.startDateRequired')),

      endDate: z.string().min(1, t('form.validation.endDateRequired')),

      description: z
        .string()
        .max(250, t('form.validation.descriptionMaxLength', { count: 250 }))
        .refine(
          (val) => {
            if (!val) return true;
            return !/<\s*\/?\s*[a-zA-Z][\s\S]*?>/i.test(val);
          },
          { message: t('form.validation.descriptionFormat') }
        )
        .optional()
        .or(z.literal('')),

      isActive: z.boolean(),
      isCurrent: z.boolean(),
    })
    .refine(
      (data) => {
        if (!data.startDate || !data.endDate) return true;
        return new Date(data.endDate) > new Date(data.startDate);
      },
      {
        message: t('form.validation.endDateMustBeAfterStartDate'),
        path: ['endDate'],
      }
    )
    .refine(
      (data) => {
        if (!data.startDate || !data.year) return true;
        const parsedYear = Number(data.year);
        if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) return true;
        const minDate = new Date(`${parsedYear}-04-01`);
        const maxDate = new Date(`${parsedYear + 1}-03-31`);
        const start = new Date(data.startDate);
        return start >= minDate && start <= maxDate;
      },
      {
        message: t('form.validation.startDateRange'),
        path: ['startDate'],
      }
    )
    .refine(
      (data) => {
        if (!data.endDate || !data.year) return true;
        const parsedYear = Number(data.year);
        if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) return true;
        const minDate = new Date(`${parsedYear}-04-01`);
        const maxDate = new Date(`${parsedYear + 1}-03-31`);
        const end = new Date(data.endDate);
        return end >= minDate && end <= maxDate;
      },
      {
        message: t('form.validation.endDateRange'),
        path: ['endDate'],
      }
    );
}

/** Type inferred from the schema for use in form components */
export type FinancialYearSchemaInput = z.input<
  ReturnType<typeof createFinancialYearSchema>
>;
