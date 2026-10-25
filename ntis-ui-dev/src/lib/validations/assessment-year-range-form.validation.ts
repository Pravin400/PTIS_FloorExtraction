import type { AssessmentYearRangeFormModel } from "@/types/asset-masters/assessment-year-range.types";

const MIN_YEAR = 1700;
const MAX_YEAR = 2100;

export function validateAssessmentYearRangeForm(
  data: AssessmentYearRangeFormModel,
  isEdit: boolean,
  t: (key: string, values?: Record<string, string | number>) => string
): Partial<Record<keyof AssessmentYearRangeFormModel, string>> {
  const newErrors: Partial<Record<keyof AssessmentYearRangeFormModel, string>> = {};
  const fromYear = Number(data.fromYear);
  const toYear = Number(data.toYear);

  // From Year validation
  if (!data.fromYear && data.fromYear !== 0) {
    newErrors.fromYear = t("form.validation.fromYearRequired");
  } else if (!Number.isFinite(fromYear) || !/^\d{4}$/.test(String(data.fromYear))) {
    newErrors.fromYear = t("form.validation.yearFormat");
  } else if (fromYear < MIN_YEAR || fromYear > MAX_YEAR) {
    newErrors.fromYear = t("form.validation.yearRange", { min: MIN_YEAR, max: MAX_YEAR });
  }

  // To Year validation
  if (!data.toYear && data.toYear !== 0) {
    newErrors.toYear = t("form.validation.toYearRequired");
  } else if (!Number.isFinite(toYear) || !/^\d{4}$/.test(String(data.toYear))) {
    newErrors.toYear = t("form.validation.yearFormat");
  } else if (toYear < MIN_YEAR || toYear > MAX_YEAR) {
    newErrors.toYear = t("form.validation.yearRange", { min: MIN_YEAR, max: MAX_YEAR });
  }

  // Cross-field validation: fromYear <= toYear
  if (!newErrors.fromYear && !newErrors.toYear && fromYear > toYear) {
    newErrors.fromYear = t("form.validation.fromYearGreaterThanToYear");
  }

  // Active status validation for new records
  if (!isEdit && !data.isActive) {
    newErrors.isActive = t("form.validation.mustBeActive");
  }

  return newErrors;
}
