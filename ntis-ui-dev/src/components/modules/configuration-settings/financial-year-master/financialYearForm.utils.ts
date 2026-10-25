import { FinancialYear, FinancialYearFormValues } from '@/types/financialYear.types';

export type FieldErrors = Partial<Record<keyof FinancialYearFormValues, string>>;

export const CLOSED_CURRENT_ERROR = 'A closed financial year cannot be designated as the current year.';

export const BACKEND_ERROR_MAP: Record<string, string> = {
  YearCode_Required: 'form.validation.codeRequired',
  YearCode_MaxLen_15: 'form.validation.codeMaxLength',
  YearCode_MaxLen_20: 'form.validation.codeMaxLength',
  YearCode_MaxLen_50: 'form.validation.codeMaxLength',
  YearCode_InvalidFormat: 'form.validation.codeFormat',
  YearCode_AllZeros: 'form.validation.codeAllZeros',
  Year_Range: 'form.validation.yearInvalid',
  Year_Required: 'form.validation.yearRequired',
  Year_MustBePositive: 'form.validation.yearMustBePositive',
  StartDate_Required: 'form.validation.startDateRequired',
  EndDate_Required: 'form.validation.endDateRequired',
  EndDate_MustBeAfter_StartDate: 'form.validation.endDateMustBeAfterStartDate',
  StartDate_InvalidRange: 'form.validation.startDateRange',
  EndDate_InvalidRange: 'form.validation.endDateRange',
  YearCode_Duplicate: 'form.validation.codeDuplicate',
  Year_Duplicate: 'form.validation.yearDuplicate',
  YearDescription_MaxLen_250: 'form.validation.descriptionMaxLength',
  YearStatus_MaxLen_50: 'form.validation.statusInvalid',
};

export function getInitialFinancialYearFormData(
  financialYearData?: FinancialYear | null
): FinancialYearFormValues {
  const initialYear = (financialYearData?.year as number) ?? new Date().getFullYear();
  return {
    yearCode: financialYearData?.yearCode || '',
    year: initialYear,
    startDate: financialYearData?.startDate?.split('T')[0] || (initialYear ? `${initialYear}-04-01` : ''),
    endDate: financialYearData?.endDate?.split('T')[0] || (initialYear ? `${initialYear + 1}-03-31` : ''),
    description: financialYearData?.description || '',
    isActive: Boolean(financialYearData?.isActive ?? false),
    isCurrent: Boolean(financialYearData?.isActive ?? false) && financialYearData?.status !== 'Closed',
  };
}

export function mapActionValidationErrors(
  validationErrors: Record<string, string | string[]>,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const [field, rawErrors] of Object.entries(validationErrors)) {
    const errList = Array.isArray(rawErrors) ? rawErrors : [rawErrors];
    if (errList.length === 0) continue;
    const code = errList[0];
    const translationKey = BACKEND_ERROR_MAP[code];
    if (translationKey) {
      const count = code.includes('250') ? 250 : code.includes('20') ? 20 : code.includes('15') ? 15 : code.includes('50') ? 50 : undefined;
      fieldErrors[field as keyof FinancialYearFormValues] = t(
        translationKey,
        count !== undefined ? { count } : undefined
      );
    } else {
      fieldErrors[field as keyof FinancialYearFormValues] = code;
    }
  }
  return fieldErrors;
}

export function mapZodFieldErrors(flatErrors: Record<string, string[] | undefined>): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const [key, msgs] of Object.entries(flatErrors)) {
    if (msgs && msgs.length > 0) {
      fieldErrors[key as keyof FinancialYearFormValues] = msgs[0];
    }
  }
  return fieldErrors;
}
