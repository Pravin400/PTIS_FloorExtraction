import type { BillingPeriodMaster } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

/**
 * Filter billing periods to ensure they have valid financial year and billing frequency relationships,
 * matching the SQL INNER JOIN logic:
 *   INNER JOIN core.YearMaster y ON y.Id = b.FinancialYearId
 *   INNER JOIN WTIS.BillingFrequencyMaster bf On bf.Id = b.BillingFrequencyId
 */
export const filterBillingPeriodsForTable = (
  items: BillingPeriodMaster[]
): BillingPeriodMaster[] => {
  return items.filter((item) => {
    const hasValidYear =
      Boolean(item.financialYearId && Number(item.financialYearId) > 0) ||
      Boolean(item.financialYear && String(item.financialYear).trim() !== "") ||
      Boolean(item.financialYearCode && String(item.financialYearCode).trim() !== "");

    const hasValidFrequency =
      Boolean(item.billingFrequencyId && Number(item.billingFrequencyId) > 0) ||
      Boolean(item.billingFrequency && String(item.billingFrequency).trim() !== "") ||
      Boolean(item.billingFrequencyCode && String(item.billingFrequencyCode).trim() !== "");

    return hasValidYear && hasValidFrequency;
  });
};

/**
 * Extract 4-digit financial year number from BillingPeriodMaster record
 */
export const extractFinancialYearNumber = (item: BillingPeriodMaster): number => {
  if (item.financialYear) {
    const match = String(item.financialYear).match(/\d{4}/);
    if (match) return parseInt(match[0], 10);
  }
  if (item.financialYearCode) {
    const match = String(item.financialYearCode).match(/\d{4}/);
    if (match) return parseInt(match[0], 10);
  }
  if (item.periodFromDate) {
    const match = String(item.periodFromDate).match(/^\d{4}/);
    if (match) return parseInt(match[0], 10);
  }
  if (item.financialYearId && !isNaN(Number(item.financialYearId))) {
    const num = Number(item.financialYearId);
    if (num > 1900 && num < 2100) return num;
  }
  return 0;
};

/**
 * Get normalized Billing Frequency string for sorting
 */
export const getBillingFrequencyName = (item: BillingPeriodMaster): string => {
  return String(item.billingFrequency ?? item.billingFrequencyCode ?? "").trim();
};

/**
 * Get numeric Sequence Number for sorting
 */
export const getSequenceNumber = (item: BillingPeriodMaster): number => {
  if (item.sequenceNo !== undefined && item.sequenceNo !== null) {
    const num = Number(item.sequenceNo);
    if (!isNaN(num)) return num;
  }
  return 0;
};

/**
 * Default comparator matching SQL:
 * ORDER BY y.Year DESC, bf.BillingFrequency ASC, b.SequenceNo ASC
 */
export const compareBillingPeriodsDefault = (
  a: BillingPeriodMaster,
  b: BillingPeriodMaster
): number => {
  // 1. y.Year DESC
  const yearA = extractFinancialYearNumber(a);
  const yearB = extractFinancialYearNumber(b);
  if (yearA !== yearB) {
    return yearB - yearA;
  }

  const fyA = String(a.financialYear ?? a.financialYearCode ?? "").trim();
  const fyB = String(b.financialYear ?? b.financialYearCode ?? "").trim();
  const fyDiff = fyB.localeCompare(fyA, undefined, { numeric: true });
  if (fyDiff !== 0) {
    return fyDiff;
  }

  // 2. bf.BillingFrequency ASC
  const freqA = getBillingFrequencyName(a);
  const freqB = getBillingFrequencyName(b);
  const freqDiff = freqA.localeCompare(freqB, undefined, { sensitivity: "base" });
  if (freqDiff !== 0) {
    return freqDiff;
  }

  // 3. b.SequenceNo ASC
  const seqA = getSequenceNumber(a);
  const seqB = getSequenceNumber(b);
  if (seqA !== seqB) {
    return seqA - seqB;
  }

  // 4. PeriodFromDate ASC (fallback tie-breaker)
  const dateA = a.periodFromDate ? new Date(a.periodFromDate).getTime() : 0;
  const dateB = b.periodFromDate ? new Date(b.periodFromDate).getTime() : 0;
  return dateA - dateB;
};

/**
 * Sort billing periods for table display by column or default SQL order:
 * ORDER BY y.Year DESC, bf.BillingFrequency ASC, b.SequenceNo ASC
 */
export const sortBillingPeriodsTable = (
  items: BillingPeriodMaster[],
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
): BillingPeriodMaster[] => {
  const sorted = [...items];

  if (!sortBy) {
    return sorted.sort(compareBillingPeriodsDefault);
  }

  return sorted.sort((a, b) => {
    if (sortBy === "financialYear" || sortBy === "Year") {
      const yearA = extractFinancialYearNumber(a);
      const yearB = extractFinancialYearNumber(b);
      const diff = sortOrder === "desc" ? yearB - yearA : yearA - yearB;
      if (diff !== 0) return diff;

      // Secondary: BillingFrequency ASC, SequenceNo ASC
      const freqDiff = getBillingFrequencyName(a).localeCompare(
        getBillingFrequencyName(b),
        undefined,
        { sensitivity: "base" }
      );
      if (freqDiff !== 0) return freqDiff;

      const seqDiff = getSequenceNumber(a) - getSequenceNumber(b);
      if (seqDiff !== 0) return seqDiff;

      const dateA = a.periodFromDate ? new Date(a.periodFromDate).getTime() : 0;
      const dateB = b.periodFromDate ? new Date(b.periodFromDate).getTime() : 0;
      return dateA - dateB;
    }

    if (sortBy === "billingFrequency" || sortBy === "BillingFrequency") {
      const freqA = getBillingFrequencyName(a);
      const freqB = getBillingFrequencyName(b);
      const diff =
        sortOrder === "desc"
          ? freqB.localeCompare(freqA, undefined, { sensitivity: "base" })
          : freqA.localeCompare(freqB, undefined, { sensitivity: "base" });
      if (diff !== 0) return diff;

      // Secondary: Year DESC, SequenceNo ASC
      const yearDiff = extractFinancialYearNumber(b) - extractFinancialYearNumber(a);
      if (yearDiff !== 0) return yearDiff;

      const seqDiff = getSequenceNumber(a) - getSequenceNumber(b);
      if (seqDiff !== 0) return seqDiff;

      const dateA = a.periodFromDate ? new Date(a.periodFromDate).getTime() : 0;
      const dateB = b.periodFromDate ? new Date(b.periodFromDate).getTime() : 0;
      return dateA - dateB;
    }

    if (sortBy === "sequenceNo" || sortBy === "SequenceNo") {
      const seqA = getSequenceNumber(a);
      const seqB = getSequenceNumber(b);
      const diff = sortOrder === "desc" ? seqB - seqA : seqA - seqB;
      if (diff !== 0) return diff;
      return compareBillingPeriodsDefault(a, b);
    }

    const valA = a[sortBy as keyof BillingPeriodMaster];
    const valB = b[sortBy as keyof BillingPeriodMaster];

    if (typeof valA === "number" && typeof valB === "number") {
      const diff = sortOrder === "desc" ? valB - valA : valA - valB;
      if (diff !== 0) return diff;
    } else {
      const strA = valA !== undefined && valA !== null ? String(valA) : "";
      const strB = valB !== undefined && valB !== null ? String(valB) : "";
      const diff =
        sortOrder === "desc"
          ? strB.localeCompare(strA, undefined, { numeric: true })
          : strA.localeCompare(strB, undefined, { numeric: true });
      if (diff !== 0) return diff;
    }

    return compareBillingPeriodsDefault(a, b);
  });
};
