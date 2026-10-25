import type {
  BillingPeriodInput,
  BillingPeriodMaster,
  DropdownOption,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import {
  MAX_GRACE_DAYS,
  addDays,
  diffDays,
  getFrequencyPeriodsPerYear,
  getFinancialYearDates,
  calculatePeriodToDate,
  calculateBillingPeriodSequenceNo,
} from "../../../../lib/utils/water-bill/billing-configuration/billingPeriodCalculation.utils";
import { useBillingPeriodPenaltyHandlers } from "./useBillingPeriodPenaltyHandlers";
import { useBillingPeriodSelectionHandlers } from "./useBillingPeriodSelectionHandlers";
import {
  useBillingPeriodDateChangeHandlers,
  handleDateInputClick,
  handleDateInputKeyDown,
  handleDateInputPaste,
} from "./useBillingPeriodDateChangeHandlers";

export {
  MAX_GRACE_DAYS,
  addDays,
  diffDays,
  getFrequencyPeriodsPerYear,
  getFinancialYearDates,
  calculatePeriodToDate,
  calculateBillingPeriodSequenceNo,
  handleDateInputClick,
  handleDateInputKeyDown,
  handleDateInputPaste,
};

interface UseBillingPeriodFormFieldsParams {
  formData: BillingPeriodInput;
  financialYearOptions?: DropdownOption[];
  billingFrequencyOptions?: DropdownOption[];
  existingPeriods?: BillingPeriodMaster[];
  isEdit?: boolean;
  handleChange: (field: keyof BillingPeriodInput, value: string | number | boolean) => void;
  handleUpdate: (updates: Partial<BillingPeriodInput>) => void;
}

export function useBillingPeriodFormFields({
  formData,
  financialYearOptions = [],
  billingFrequencyOptions = [],
  existingPeriods = [],
  isEdit = false,
  handleChange,
  handleUpdate,
}: UseBillingPeriodFormFieldsParams) {
  const penaltyHandlers = useBillingPeriodPenaltyHandlers({
    formData,
    handleChange,
    handleUpdate,
  });

  const selectionHandlers = useBillingPeriodSelectionHandlers({
    formData,
    financialYearOptions,
    billingFrequencyOptions,
    existingPeriods,
    isEdit,
    currentId: formData.id,
    handleUpdate,
  });

  const dateHandlers = useBillingPeriodDateChangeHandlers({
    formData,
    billingFrequencyOptions,
    existingPeriods,
    isEdit,
    currentId: formData.id,
    handleUpdate,
    getYearDates: selectionHandlers.getYearDates,
  });

  // Slot calculation
  const freqOption = billingFrequencyOptions.find(
    (o) => o.value === String(formData.billingFrequencyId)
  );
  const periodsPerYear = getFrequencyPeriodsPerYear(freqOption);
  const matchingPeriods = existingPeriods.filter(
    (p) =>
      String(p.financialYearId) === String(formData.financialYearId) &&
      String(p.billingFrequencyId) === String(formData.billingFrequencyId) &&
      (!isEdit || p.id !== formData.id)
  );
  const existingCount = matchingPeriods.length;
  const isMaxLimitReached = !isEdit && periodsPerYear > 0 && existingCount >= periodsPerYear;

  return {
    ...selectionHandlers,
    ...dateHandlers,
    ...penaltyHandlers,
    existingCount,
    periodsPerYear,
    isMaxLimitReached,
  };
}
