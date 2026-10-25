import type {
  BillingPeriodInput,
  BillingPeriodMaster,
  DropdownOption,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import {
  addDays,
  getFrequencyPeriodsPerYear,
  getFinancialYearDates,
  calculatePeriodToDate,
  calculateNextPeriodFromDate,
  calculateBillingPeriodSequenceNo,
} from "../../../../lib/utils/water-bill/billing-configuration/billingPeriodCalculation.utils";

interface UseBillingPeriodSelectionHandlersParams {
  formData: BillingPeriodInput;
  financialYearOptions?: DropdownOption[];
  billingFrequencyOptions?: DropdownOption[];
  existingPeriods?: BillingPeriodMaster[];
  isEdit?: boolean;
  currentId?: number | string | null;
  handleUpdate: (updates: Partial<BillingPeriodInput>) => void;
}

export function useBillingPeriodSelectionHandlers({
  formData,
  financialYearOptions = [],
  billingFrequencyOptions = [],
  existingPeriods = [],
  isEdit: _isEdit = false,
  currentId,
  handleUpdate,
}: UseBillingPeriodSelectionHandlersParams) {
  const getYearDates = (fyId?: string | number): { startDate: string; endDate: string } => {
    if (!fyId) return { startDate: "", endDate: "" };
    const selected = financialYearOptions.find((o) => o.value === String(fyId));
    return getFinancialYearDates(selected);
  };

  const handleYearChange = (val: string) => {
    const id = val ? Number(val) : "";
    if (!id) {
      handleUpdate({
        financialYearId: "",
        periodFromDate: "",
        periodToDate: "",
        dueDate: "",
        currentPenaltyStartDate: "",
        currentPenaltyEndDate: "",
        pendingPenaltyStartDate: "",
      });
      return;
    }

    const { startDate: yearStart, endDate: yearEnd } = getYearDates(id);

    if (!formData.billingFrequencyId) {
      handleUpdate({
        financialYearId: id,
        periodFromDate: yearStart,
        periodToDate: "",
        dueDate: "",
        currentPenaltyStartDate: yearStart,
        currentPenaltyEndDate: "",
      });
      return;
    }

    const effectiveId = currentId ?? formData.id;
    const fromDate = calculateNextPeriodFromDate(
      yearStart,
      existingPeriods,
      id,
      formData.billingFrequencyId,
      effectiveId
    );
    const freqOption = billingFrequencyOptions.find(
      (o) => o.value === String(formData.billingFrequencyId)
    );
    const periodsPerYear = getFrequencyPeriodsPerYear(freqOption);

    if (fromDate && periodsPerYear > 0) {
      const seq = calculateBillingPeriodSequenceNo(
        fromDate,
        periodsPerYear,
        yearStart,
        formData.sequenceNo,
        existingPeriods,
        id,
        formData.billingFrequencyId,
        effectiveId
      );
      const isLast = periodsPerYear > 0 && seq === periodsPerYear;
      const toDate = calculatePeriodToDate(fromDate, periodsPerYear, isLast, yearEnd);
      handleUpdate({
        financialYearId: id,
        periodFromDate: fromDate,
        periodToDate: toDate,
        sequenceNo: seq,
        dueDate: toDate,
        graceDays: 0,
        currentPenaltyStartDate: fromDate,
        currentPenaltyEndDate: toDate,
        pendingPenaltyStartDate: toDate ? addDays(toDate, 1) : "",
      });
      return;
    }

    handleUpdate({
      financialYearId: id,
      periodFromDate: fromDate,
      currentPenaltyStartDate: fromDate,
    });
  };

  const handleFrequencyChange = (val: string) => {
    const id = val ? Number(val) : "";
    if (!id) {
      handleUpdate({
        billingFrequencyId: "",
        periodToDate: "",
        dueDate: "",
        currentPenaltyStartDate: formData.periodFromDate || "",
        currentPenaltyEndDate: "",
        pendingPenaltyStartDate: "",
      });
      return;
    }

    const freqOption = billingFrequencyOptions.find((o) => o.value === String(val));
    const periodsPerYear = getFrequencyPeriodsPerYear(freqOption);
    const effectiveId = currentId ?? formData.id;

    if (formData.financialYearId) {
      const { startDate: yearStart, endDate: yearEnd } = getYearDates(formData.financialYearId);
      const fromDate = calculateNextPeriodFromDate(
        yearStart,
        existingPeriods,
        formData.financialYearId,
        id,
        effectiveId
      );
      const seq = calculateBillingPeriodSequenceNo(
        fromDate,
        periodsPerYear,
        yearStart,
        formData.sequenceNo,
        existingPeriods,
        formData.financialYearId,
        id,
        effectiveId
      );
      const isLast = periodsPerYear > 0 && seq === periodsPerYear;
      const toDate = calculatePeriodToDate(fromDate, periodsPerYear, isLast, yearEnd);

      handleUpdate({
        billingFrequencyId: id,
        periodFromDate: fromDate,
        periodToDate: toDate,
        sequenceNo: seq,
        dueDate: toDate,
        graceDays: 0,
        currentPenaltyStartDate: fromDate,
        currentPenaltyEndDate: toDate,
        pendingPenaltyStartDate: toDate ? addDays(toDate, 1) : "",
      });
      return;
    }

    if (formData.periodFromDate && periodsPerYear > 0) {
      const { startDate: yearStart, endDate: yearEnd } = getYearDates(formData.financialYearId);
      const seq = calculateBillingPeriodSequenceNo(
        formData.periodFromDate,
        periodsPerYear,
        yearStart,
        formData.sequenceNo,
        existingPeriods,
        formData.financialYearId,
        id,
        effectiveId
      );
      const isLast = periodsPerYear > 0 && seq === periodsPerYear;
      const toDate = calculatePeriodToDate(formData.periodFromDate, periodsPerYear, isLast, yearEnd);
      handleUpdate({
        billingFrequencyId: id,
        periodToDate: toDate,
        sequenceNo: seq,
        dueDate: toDate,
        graceDays: 0,
        currentPenaltyStartDate: formData.periodFromDate,
        currentPenaltyEndDate: toDate,
        pendingPenaltyStartDate: toDate ? addDays(toDate, 1) : "",
      });
      return;
    }

    handleUpdate({ billingFrequencyId: id });
  };

  return {
    handleYearChange,
    handleFrequencyChange,
    getYearDates,
  };
}
