import type {
  BillingPeriodInput,
  BillingPeriodTranslator,
} from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import {
  parseDateComponents,
  formatDateToDDMMYYYY,
  diffDays,
} from "@/lib/utils/water-bill/billing-configuration/billingPeriodCalculation.utils";

export interface BillingPeriodValidationContext {
  yearStartDate?: string | null;
  yearEndDate?: string | null;
  isFirstPeriod?: boolean;
  isLastPeriod?: boolean;
}

const toUtcTime = (dateStr?: string | null): number | null => {
  if (!dateStr || dateStr === "INVALID") return null;
  const comp = parseDateComponents(dateStr);
  if (!comp) return null;
  return Date.UTC(comp.y, comp.m - 1, comp.d);
};

export function validateBillingPeriodFormData(
  data: BillingPeriodInput,
  t: BillingPeriodTranslator,
  lastModifiedField?: keyof BillingPeriodInput | null,
  context?: BillingPeriodValidationContext
): Partial<Record<keyof BillingPeriodInput, string>> {
  const errs: Partial<Record<keyof BillingPeriodInput, string>> = {};

  const fyId = Number(data.financialYearId);
  if (!fyId || isNaN(fyId) || fyId <= 0) {
    errs.financialYearId = t("validation.financialYearRequired");
  }

  const bfId = Number(data.billingFrequencyId);
  if (!bfId || isNaN(bfId) || bfId <= 0) {
    errs.billingFrequencyId = t("validation.billingFrequencyRequired");
  }

  const fromTime = toUtcTime(data.periodFromDate);
  if (!data.periodFromDate) {
    errs.periodFromDate = t("validation.periodFromDateRequired");
  } else if (fromTime === null) {
    errs.periodFromDate = t("validation.periodFromDateInvalid");
  } else if (context?.yearStartDate) {
    const fyStartTime = toUtcTime(context.yearStartDate);
    const fyStartFormatted = formatDateToDDMMYYYY(context.yearStartDate);
    if (fyStartTime !== null) {
      if (context.isFirstPeriod) {
        if (fromTime !== fyStartTime) {
          errs.periodFromDate = t("validation.periodFromDateMustMatchYearStart", { date: fyStartFormatted });
        }
      } else if (fromTime < fyStartTime) {
        errs.periodFromDate = t("validation.periodFromNotBeforeYearStart", { date: fyStartFormatted });
      }
    }
  }

  const toTime = toUtcTime(data.periodToDate);
  if (!data.periodToDate) {
    errs.periodToDate = t("validation.periodToDateRequired");
  } else if (toTime === null) {
    errs.periodToDate = t("validation.periodToDateInvalid");
  } else if (fromTime !== null && toTime <= fromTime) {
    errs.periodToDate = t("validation.periodToDateAfterFromDate");
  } else if (context?.yearEndDate) {
    const fyEndTime = toUtcTime(context.yearEndDate);
    const fyEndFormatted = formatDateToDDMMYYYY(context.yearEndDate);
    if (fyEndTime !== null) {
      if (context.isLastPeriod) {
        if (toTime !== fyEndTime) {
          errs.periodToDate = t("validation.periodToDateMustMatchYearEnd", { date: fyEndFormatted });
        }
      } else if (toTime > fyEndTime) {
        errs.periodToDate = t("validation.periodToNotAfterYearEnd", { date: fyEndFormatted });
      }
    }
  }

  const dueTime = toUtcTime(data.dueDate);
  if (!data.dueDate) {
    errs.dueDate = t("validation.dueDateRequired");
  } else if (dueTime === null) {
    errs.dueDate = t("validation.dueDateInvalid");
  } else if (toTime !== null && dueTime < toTime) {
    errs.dueDate = t("validation.dueDateAfterPeriodTo");
  } else if (data.periodToDate && data.dueDate) {
    const diff = diffDays(data.periodToDate, data.dueDate);
    if (diff > 31) {
      errs.dueDate = t("validation.dueDateMaxDays", { count: 31 });
    }
  }

  if (data.graceDays === undefined || data.graceDays === null || data.graceDays === "") {
    errs.graceDays = t("validation.graceDaysRequired");
  } else {
    const graceDays =
      typeof data.graceDays === "number"
        ? data.graceDays
        : parseInt(String(data.graceDays), 10);
    if (isNaN(graceDays) || graceDays < 0) {
      errs.graceDays = t("validation.graceDaysPositive");
    } else if (graceDays > 31) {
      errs.graceDays = t("validation.graceDaysMax", { count: 31 });
    }
  }

  if (data.billGenerationDate) {
    const genTime = toUtcTime(data.billGenerationDate);
    if (genTime === null) {
      errs.billGenerationDate = t("validation.billGenerationDateInvalid");
    } else {
      if (fromTime !== null && genTime < fromTime) {
        errs.billGenerationDate = t("validation.billGenerationNotBeforePeriodFrom", {
          date: formatDateToDDMMYYYY(data.periodFromDate),
        });
      } else if (dueTime !== null && genTime > dueTime) {
        errs.billGenerationDate = t("validation.billGenerationNotAfterDueDate", {
          date: formatDateToDDMMYYYY(data.dueDate),
        });
      }
    }
  }

  const currentStartTime = toUtcTime(data.currentPenaltyStartDate);
  const currentEndTime = toUtcTime(data.currentPenaltyEndDate);

  if (currentStartTime !== null && fromTime !== null && currentStartTime !== fromTime) {
    errs.currentPenaltyStartDate = t("validation.currentPenaltyStartMustMatchPeriodFrom", {
      date: formatDateToDDMMYYYY(data.periodFromDate),
    });
  }

  if (currentEndTime !== null && toTime !== null && currentEndTime !== toTime) {
    errs.currentPenaltyEndDate = t("validation.currentPenaltyEndMustMatchPeriodTo", {
      date: formatDateToDDMMYYYY(data.periodToDate),
    });
  }

  if (currentStartTime !== null && currentEndTime !== null && currentEndTime < currentStartTime) {
    if (lastModifiedField === "currentPenaltyStartDate") {
      if (!errs.currentPenaltyStartDate) {
        errs.currentPenaltyStartDate = t("validation.currentPenaltyStartNotAfterEnd");
      }
    } else if (lastModifiedField === "currentPenaltyEndDate") {
      errs.currentPenaltyEndDate = t("validation.currentPenaltyEndAfterStart");
    } else {
      if (!errs.currentPenaltyStartDate) {
        errs.currentPenaltyStartDate = t("validation.currentPenaltyStartNotAfterEnd");
      }
      errs.currentPenaltyEndDate = t("validation.currentPenaltyEndAfterStart");
    }
  }

  const pendingStartTime = toUtcTime(data.pendingPenaltyStartDate);
  const pendingEndTime = toUtcTime(data.pendingPenaltyEndDate);

  if (pendingStartTime !== null && currentEndTime !== null && pendingStartTime <= currentEndTime) {
    errs.pendingPenaltyStartDate = t("validation.pendingPenaltyStartNotBeforeCurrentPenaltyEnd", {
      date: formatDateToDDMMYYYY(data.currentPenaltyEndDate),
    });
  }

  if (pendingStartTime !== null && pendingEndTime !== null && pendingEndTime < pendingStartTime) {
    if (lastModifiedField === "pendingPenaltyStartDate") {
      if (!errs.pendingPenaltyStartDate) {
        errs.pendingPenaltyStartDate = t("validation.pendingPenaltyStartNotAfterEnd");
      }
    } else if (lastModifiedField === "pendingPenaltyEndDate") {
      errs.pendingPenaltyEndDate = t("validation.pendingPenaltyEndAfterStart");
    } else {
      if (!errs.pendingPenaltyStartDate) {
        errs.pendingPenaltyStartDate = t("validation.pendingPenaltyStartNotAfterEnd");
      }
      errs.pendingPenaltyEndDate = t("validation.pendingPenaltyEndAfterStart");
    }
  }

  return errs;
}
