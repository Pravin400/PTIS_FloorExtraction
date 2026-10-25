import type {
  BillingPeriodInput,
  BillingPeriodMaster,
  DropdownOption,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import {
  addDays,
  diffDays,
  getFrequencyPeriodsPerYear,
  calculatePeriodToDate,
  calculateBillingPeriodSequenceNo,
} from "../../../../lib/utils/water-bill/billing-configuration/billingPeriodCalculation.utils";

interface UseBillingPeriodDateChangeHandlersParams {
  formData: BillingPeriodInput;
  billingFrequencyOptions?: DropdownOption[];
  existingPeriods?: BillingPeriodMaster[];
  isEdit?: boolean;
  currentId?: number | string | null;
  handleUpdate: (updates: Partial<BillingPeriodInput>) => void;
  getYearDates: (fyId?: string | number) => { startDate: string; endDate: string };
}

export function useBillingPeriodDateChangeHandlers({
  formData,
  billingFrequencyOptions = [],
  existingPeriods = [],
  isEdit = false,
  currentId,
  handleUpdate,
  getYearDates,
}: UseBillingPeriodDateChangeHandlersParams) {
  const handlePeriodFromChange = (val: string) => {
    if (!val) {
      handleUpdate({
        periodFromDate: "",
        currentPenaltyStartDate: "",
      });
      return;
    }
    if (val === "INVALID" || isNaN(new Date(val).getTime())) {
      handleUpdate({
        periodFromDate: "INVALID",
      });
      return;
    }
    const cleanDate = val.split("T")[0];
    const freqOption = billingFrequencyOptions.find(
      (o) => o.value === String(formData.billingFrequencyId)
    );
    const periodsPerYear = getFrequencyPeriodsPerYear(freqOption);

    const updates: Partial<BillingPeriodInput> = {
      periodFromDate: cleanDate,
      currentPenaltyStartDate: cleanDate,
    };

    if (periodsPerYear > 0) {
      const { startDate: yearStart, endDate: yearEnd } = getYearDates(formData.financialYearId);
      const effectiveId = currentId ?? formData.id;
      const seq = isEdit && formData.sequenceNo
        ? Number(formData.sequenceNo)
        : calculateBillingPeriodSequenceNo(
            cleanDate,
            periodsPerYear,
            yearStart,
            formData.sequenceNo,
            existingPeriods,
            formData.financialYearId,
            formData.billingFrequencyId,
            effectiveId
          );
      const isLast = periodsPerYear > 0 && seq === periodsPerYear;
      const toDate = calculatePeriodToDate(cleanDate, periodsPerYear, isLast, yearEnd);
      updates.periodToDate = toDate;
      updates.dueDate = toDate;
      updates.graceDays = 0;
      updates.currentPenaltyEndDate = toDate;
      updates.pendingPenaltyStartDate = toDate ? addDays(toDate, 1) : "";
    }

    handleUpdate(updates);
  };

  const handlePeriodToChange = (val: string) => {
    if (!val) {
      handleUpdate({
        periodToDate: "",
        currentPenaltyEndDate: "",
      });
      return;
    }
    if (val === "INVALID" || isNaN(new Date(val).getTime())) {
      handleUpdate({
        periodToDate: "INVALID",
      });
      return;
    }
    const cleanDate = val.split("T")[0];
    const pendingStart = addDays(cleanDate, 1);

    handleUpdate({
      periodToDate: cleanDate,
      dueDate: cleanDate,
      graceDays: 0,
      currentPenaltyEndDate: cleanDate,
      pendingPenaltyStartDate: pendingStart,
    });
  };

  const handleDueDateChange = (val: string) => {
    if (!val) {
      handleUpdate({ dueDate: "" });
      return;
    }
    if (val === "INVALID" || isNaN(new Date(val).getTime())) {
      handleUpdate({ dueDate: "INVALID" });
      return;
    }
    const cleanDate = val.split("T")[0];
    const grace =
      formData.periodToDate && formData.periodToDate !== "INVALID"
        ? diffDays(formData.periodToDate, cleanDate)
        : 0;
    handleUpdate({
      dueDate: cleanDate,
      graceDays: grace,
    });
  };

  const handleGraceDaysChange = (val: string | number) => {
    const cleanDigits = String(val).replace(/\D/g, "");
    if (cleanDigits === "") {
      handleUpdate({
        graceDays: "",
      });
      return;
    }
    const num = parseInt(cleanDigits, 10);
    if (isNaN(num) || num < 0) return;
    const due =
      formData.periodToDate
        ? num === 0
          ? formData.periodToDate
          : addDays(formData.periodToDate, num)
        : formData.dueDate ?? "";
    handleUpdate({
      graceDays: num,
      dueDate: due,
    });
  };

  return {
    handlePeriodFromChange,
    handlePeriodToChange,
    handleDueDateChange,
    handleGraceDaysChange,
    handleDateInputClick,
    handleDateInputKeyDown,
    handleDateInputPaste,
  };
}

export const handleDateInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
  try {
    e.currentTarget.showPicker?.();
  } catch {
    // Ignore if browser restricts or already active
  }
};

export const handleDateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Tab" || e.key === "Escape") return;
  e.preventDefault();
  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // Ignore
    }
  }
};

export const handleDateInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  e.preventDefault();
};

