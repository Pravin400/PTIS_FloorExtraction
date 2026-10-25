import type { BillingPeriodMaster } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import { addDays, parseDateComponents } from "./billingPeriodDate.utils";

// Re-export date, formatting, and frequency helper utilities (<200 LOC)
export {
  MAX_GRACE_DAYS,
  parseDateComponents,
  addDays,
  diffDays,
  formatDateToDDMMYYYY,
  getFrequencyPeriodsPerYear,
  getFinancialYearDates,
} from "./billingPeriodDate.utils";

/**
 * Calculate Period To Date based on Period From Date, Billing Frequency PeriodsPerYear,
 * and whether this is the final period of the financial year.
 */
export const calculatePeriodToDate = (
  periodFromStr: string,
  periodsPerYear: number,
  isLastPeriod: boolean = false,
  yearEndDate?: string | null
): string => {
  if (!periodFromStr || !periodsPerYear || periodsPerYear <= 0) return "";
  if (isLastPeriod && yearEndDate) {
    return yearEndDate;
  }
  const comp = parseDateComponents(periodFromStr);
  if (!comp) return "";
  const { y, m, d } = comp;

  const months = Math.max(1, Math.round(12 / periodsPerYear));

  let result = "";
  if (d === 1) {
    const targetDate = new Date(Date.UTC(y, m - 1 + months, 0));
    result = targetDate.toISOString().split("T")[0];
  } else {
    const nextTarget = new Date(Date.UTC(y, m - 1 + months, d));
    nextTarget.setUTCDate(nextTarget.getUTCDate() - 1);
    result = nextTarget.toISOString().split("T")[0];
  }

  if (yearEndDate && result > yearEndDate) {
    return yearEndDate;
  }
  return result;
};

/**
 * Calculate Next Period From Date from Year Start Date or Previous Existing Period To Date
 */
export const calculateNextPeriodFromDate = (
  yearStartDate: string,
  existingPeriods: BillingPeriodMaster[],
  financialYearId?: number | string,
  billingFrequencyId?: number | string,
  currentId?: number | string | null
): string => {
  if (!financialYearId || !billingFrequencyId) return yearStartDate || "";

  const matching = existingPeriods.filter(
    (p) =>
      (!currentId || String(p.id) !== String(currentId)) &&
      String(p.financialYearId) === String(financialYearId) &&
      String(p.billingFrequencyId) === String(billingFrequencyId) &&
      p.periodToDate
  );

  if (matching.length === 0) {
    return yearStartDate || "";
  }

  const sorted = [...matching].sort(
    (a, b) => new Date(b.periodToDate).getTime() - new Date(a.periodToDate).getTime()
  );

  const latestTo = sorted[0].periodToDate.split("T")[0];
  return addDays(latestTo, 1);
};

/**
 * Calculate Billing Period Sequence Number (always between 1 and periodsPerYear)
 */
export const calculateBillingPeriodSequenceNo = (
  periodFromDate?: string | null,
  periodsPerYear: number = 1,
  yearStartDate?: string | null,
  existingSequenceNo?: number | string | null,
  existingPeriods?: BillingPeriodMaster[],
  financialYearId?: number | string,
  billingFrequencyId?: number | string,
  currentId?: number | string | null
): number => {
  const total = Number(periodsPerYear) || 1;
  if (total <= 1) return 1;

  // In create mode or edit mode, if existingSequenceNo is already taken by another period, do not preserve it
  if (existingSequenceNo !== undefined && existingSequenceNo !== null && existingSequenceNo !== "") {
    const num = Number(existingSequenceNo);
    const isTakenByOther =
      existingPeriods &&
      financialYearId &&
      billingFrequencyId &&
      existingPeriods.some(
        (p) =>
          (!currentId || String(p.id) !== String(currentId)) &&
          String(p.financialYearId) === String(financialYearId) &&
          String(p.billingFrequencyId) === String(billingFrequencyId) &&
          Number(p.sequenceNo) === num
      );

    if (!isNaN(num) && num >= 1 && num <= total && !isTakenByOther) {
      return num;
    }
  }

  // If existingPeriods are available for this FY and frequency, determine next unused sequence
  if (existingPeriods && financialYearId && billingFrequencyId) {
    const matching = existingPeriods.filter(
      (p) =>
        (!currentId || String(p.id) !== String(currentId)) &&
        String(p.financialYearId) === String(financialYearId) &&
        String(p.billingFrequencyId) === String(billingFrequencyId)
    );
    if (matching.length > 0) {
      const usedSeqNos = new Set<number>();
      matching.forEach((p, idx) => {
        const num = Number(p.sequenceNo);
        if (!isNaN(num) && num > 0) {
          usedSeqNos.add(num);
        } else {
          usedSeqNos.add(idx + 1);
        }
      });
      for (let s = 1; s <= total; s++) {
        if (!usedSeqNos.has(s)) {
          return s;
        }
      }
      return Math.min(total, matching.length + 1);
    }
  }

  const monthsPerPeriod = Math.max(1, Math.round(12 / total));

  if (periodFromDate) {
    if (yearStartDate) {
      const fromComp = parseDateComponents(periodFromDate);
      const startComp = parseDateComponents(yearStartDate);
      if (fromComp && startComp) {
        const monthDiff = (fromComp.y - startComp.y) * 12 + (fromComp.m - startComp.m);
        if (monthDiff >= 0) {
          const seq = Math.floor(monthDiff / monthsPerPeriod) + 1;
          return Math.max(1, Math.min(total, seq));
        }
      }
    }

    const fromComp = parseDateComponents(periodFromDate);
    if (fromComp) {
      const fyMonthIdx = ((fromComp.m - 4 + 12) % 12) + 1;
      const seq = Math.floor((fyMonthIdx - 1) / monthsPerPeriod) + 1;
      return Math.max(1, Math.min(total, seq));
    }
  }

  return 1;
};
