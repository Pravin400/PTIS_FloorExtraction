import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { ApiError, updateFinancialYear } from "@/lib/api/financial-year.service";
import { FinancialYear } from "@/types/financialYear.types";

export const REVALIDATE_PATH = "/[locale]/configuration-settings/financial-year-master";

export function revalidateFinancialYearPaths() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/configuration-settings/financial-year-master`, "page");
  }
}

export function extractActionError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.responseText || err.contextMessage || err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export function mapSchemaErrors(flat: Record<string, string[] | undefined>): Record<string, string[]> {
  const keyMap: Record<string, string> = {
    "form.validation.codeRequired": "YearCode_Required",
    "form.validation.codeMaxLength": "YearCode_MaxLen_15",
    "form.validation.codeFormat": "YearCode_InvalidFormat",
    "form.validation.codeAllZeros": "YearCode_AllZeros",
    "form.validation.yearRequired": "Year_Required",
    "form.validation.yearInvalid": "Year_Range",
    "form.validation.yearMinValue": "Year_Range",
    "form.validation.yearMaxValue": "Year_Range",
    "form.validation.yearMustBePositive": "Year_MustBePositive",
    "form.validation.startDateRequired": "StartDate_Required",
    "form.validation.endDateRequired": "EndDate_Required",
    "form.validation.endDateMustBeAfterStartDate": "EndDate_MustBeAfter_StartDate",
    "form.validation.startDateRange": "StartDate_InvalidRange",
    "form.validation.endDateRange": "EndDate_InvalidRange",
    "form.validation.statusInvalid": "YearStatus_MaxLen_50",
    "form.validation.descriptionMaxLength": "YearDescription_MaxLen_250",
  };
  const validationErrors: Record<string, string[]> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (!msgs || msgs.length === 0) continue;
    validationErrors[key] = [keyMap[msgs[0]] || msgs[0]];
  }
  return validationErrors;
}

export function mapApiErrorsToFormFields(parsedErrors: Record<string, unknown>): Record<string, string[]> {
  const validationErrors: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(parsedErrors)) {
    let formKey = key;
    if (key === "YearCode") formKey = "yearCode";
    else if (key === "Year") formKey = "year";
    else if (key === "StartDate") formKey = "startDate";
    else if (key === "EndDate") formKey = "endDate";
    else if (key === "Description") formKey = "description";
    else if (key === "Status") formKey = "status";
    else if (key === "IsActive") formKey = "isActive";
    validationErrors[formKey] = Array.isArray(val) ? (val as string[]) : [String(val)];
  }
  return validationErrors;
}

export function buildYearPayload(year: FinancialYear, isActive: boolean, status: string, updatedBy?: number) {
  return {
    isActive,
    status,
    year: year.year,
    description: year.description,
    yearCode: year.yearCode || `${year.year}-${(year.year + 1).toString().slice(-2)}`,
    startDate: year.startDate || `${year.year}-04-01`,
    endDate: year.endDate || `${year.year + 1}-03-31`,
    updatedBy: updatedBy ?? 1,
  };
}

export async function unsetActiveYears(existingYears: FinancialYear[], id?: number, updatedBy?: number) {
  const activeYearsToUnset = existingYears.filter((y) => y.isActive && y.id !== id);
  for (const otherYear of activeYearsToUnset) {
    await updateFinancialYear(otherYear.id, buildYearPayload(otherYear, false, otherYear.status || "Active", updatedBy));
  }
}
