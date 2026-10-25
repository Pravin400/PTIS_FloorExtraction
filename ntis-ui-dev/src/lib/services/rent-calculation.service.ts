/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RenterDetailItem,
  RenterMastItem,
  type RenterTableEntryPostRow,
} from '@/types/floor-details.types';

export const RENT_CONSTANTS = {
  MAX_PERIOD_LIMIT: 600,
  TEMP_ID_THRESHOLD: 1_000_000_000_000,
};

export const FREQUENCY_MONTHS: Record<string, number> = {
  Monthly: 1,
  Quarterly: 3,
  'Half-Yearly': 6,
  '11-Month': 11,
  Yearly: 12,
};

export interface RentCalculationResult {
  grandTotal: number;
  fyBreakdown: RenterMastItem[];
  totalYears: number;
  renterDetails: RenterDetailItem[];
  progression: RentPeriod[];
  /** One row per timeline segment (base vs custom); only set for Custom Date frequency */
  segmentProgression?: RentPeriod[];
  /** POST: mirrors Custom Date progression table rows */
  renterTableEntries?: RenterTableEntryPostRow[];
}

export interface RentPeriod {
  month: number;
  date: Date;
  duration: string;
  rent: number;
  previousRent: number;
  incrementApplied: number;
  isIncrementMonth: boolean;
  /** End date of segment (inclusive), for FY filtering */
  segmentTo?: Date;
  /** Short label for status column in Custom Date view */
  segmentLabel?: string;
}

type CustomSegment =
  | { kind: 'base'; from: Date; to: Date }
  | { kind: 'custom'; from: Date; to: Date; range: Record<string, unknown> };

const toDateInputString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number): Date => {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
};

const applyRangeIncrement = (monthlyRent: number, range: Record<string, unknown>): number => {
  const val = parseFloat(String(range.incrementValue ?? '0'));
  if ((range.incrementType as string) === 'Percentage') {
    return monthlyRent + (monthlyRent * val) / 100;
  }
  return monthlyRent + val;
};

/** Monthly rent for agreement months *outside* user custom ranges (uses top-level Type / Value on Rent Management). */
const getOutsideCustomMonthlyRent = (details: any, baseRent: number): number => {
  const val = parseFloat(String(details?.incrementValue ?? '0'));
  if (!val || isNaN(val)) return baseRent;
  const type = String(details?.incrementType ?? 'Percentage');
  return applyRangeIncrement(baseRent, { incrementType: type, incrementValue: val });
};

const formatDefaultOutsideCustomLabel = (details: any): string => {
  const val = parseFloat(String(details?.incrementValue ?? '0'));
  if (!val || isNaN(val)) return 'Agreement base rate';
  const type = String(details?.incrementType ?? 'Percentage');
  if (type === 'Percentage') {
    return `Default +${val}% (on base rent)`;
  }
  return `Default +₹${val} (on base rent)`;
};

/**
 * Split [agreementFrom, agreementTo] into ordered non-overlapping segments:
 * default "base" rent everywhere, with user custom ranges replacing those slices.
 */
const buildCustomSegments = (
  agreementFrom: Date,
  agreementTo: Date,
  customRanges: unknown[]
): CustomSegment[] => {
  const sorted = [...customRanges].sort(
    (a: any, b: any) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
  );
  const segments: CustomSegment[] = [];
  let cursor = new Date(agreementFrom.getTime());
  const end = new Date(agreementTo.getTime());

  for (const range of sorted as any[]) {
    let rFrom = new Date(range.fromDate);
    let rTo = new Date(range.toDate);
    if (rTo < agreementFrom || rFrom > end) continue;

    if (rFrom < agreementFrom) rFrom = new Date(agreementFrom.getTime());
    if (rTo > end) rTo = new Date(end.getTime());

    if (cursor.getTime() < rFrom.getTime()) {
      segments.push({ kind: 'base', from: new Date(cursor.getTime()), to: addDays(rFrom, -1) });
    }

    const effFrom =
      cursor.getTime() > rFrom.getTime() ? new Date(cursor.getTime()) : new Date(rFrom.getTime());
    if (effFrom.getTime() <= rTo.getTime()) {
      segments.push({ kind: 'custom', from: effFrom, to: new Date(rTo.getTime()), range });
      cursor = addDays(rTo, 1);
    }
  }

  if (cursor.getTime() <= end.getTime()) {
    segments.push({ kind: 'base', from: new Date(cursor.getTime()), to: new Date(end.getTime()) });
  }

  return segments;
};

const computeSegmentMonthlyRents = (
  segments: CustomSegment[],
  baseRent: number,
  details: any
): number[] => {
  const rents: number[] = [];
  const outsideRent = getOutsideCustomMonthlyRent(details, baseRent);
  /** Rent at end of previous segment (starts at raw base so a leading “custom” Base Value still uses agreement base). */
  let lastRent = baseRent;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.kind === 'base') {
      rents.push(outsideRent);
      lastRent = outsideRent;
    } else {
      const r = seg.range;
      const baseForIncrement =
        (r.calculationMethod as string) === 'Incremented Value' ? lastRent : baseRent;
      const m = applyRangeIncrement(baseForIncrement, r);
      rents.push(m);
      lastRent = m;
    }
  }
  return rents;
};

const findSegmentIndexForDate = (d: Date, segments: CustomSegment[]): number => {
  const t = d.getTime();
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (t >= s.from.getTime() && t <= s.to.getTime()) return i;
  }
  return Math.max(0, segments.length - 1);
};

const formatCustomSegmentLabel = (range: Record<string, unknown>): string => {
  const type = range.incrementType as string;
  const val = range.incrementValue;
  const method = range.calculationMethod as string;
  const mode = method === 'Incremented Value' ? 'compounded' : 'on base rent';
  if (type === 'Percentage') {
    return `Custom +${val}% (${mode})`;
  }
  return `Custom +₹${val} (${mode})`;
};

export const calculateMonths = (from: string, to: string): number => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return (
    (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
    (toDate.getMonth() - fromDate.getMonth()) +
    1
  );
};

export const calculateRangeTotal = (
  range: any,
  index: number,
  allRanges: any[],
  originalBaseRent: number
): {
  monthlyRent: number;
  incrementAmount: number;
  durationTotal: number;
  durationMonths: number;
} => {
  const durationMonths = calculateMonths(range.fromDate, range.toDate);
  let monthlyRent = originalBaseRent;
  let incrementAmount = 0;
  let durationTotal = 0;

  if (range.calculationMethod === 'Base Value') {
    monthlyRent = originalBaseRent;
    if (range.incrementType === 'Percentage') {
      incrementAmount = (originalBaseRent * range.incrementValue) / 100;
    } else {
      incrementAmount = range.incrementValue;
    }
    const effectiveMonthlyRent = monthlyRent + incrementAmount;
    durationTotal = effectiveMonthlyRent * durationMonths;
  } else {
    for (let i = 0; i < index; i++) {
      const prevRange = allRanges[i];
      if (prevRange.incrementType === 'Percentage') {
        monthlyRent = monthlyRent + (monthlyRent * prevRange.incrementValue) / 100;
      } else {
        monthlyRent = monthlyRent + prevRange.incrementValue;
      }
    }
    if (range.incrementType === 'Percentage') {
      incrementAmount = (monthlyRent * range.incrementValue) / 100;
    } else {
      incrementAmount = range.incrementValue;
    }
    const effectiveMonthlyRent = monthlyRent + incrementAmount;
    durationTotal = effectiveMonthlyRent * durationMonths;
  }

  return { monthlyRent, incrementAmount, durationTotal, durationMonths };
};

export const calculateRentProgression = (details: any): RentCalculationResult | null => {
  if (!details?.rentAmount || !details?.agreementDateFrom || !details?.agreementDateTo) {
    return null;
  }

  const isIncValInvalid = (valStr: any) => {
    if (valStr === undefined || valStr === null || String(valStr).trim() === '') return true;
    const s = String(valStr).trim();
    if (!/^[0-9]{1,3}$/.test(s)) return true;
    const num = Number(s);
    if (num < 0 || num > 100) return true;
    return false;
  };

  const incrementFrequency = details.incrementFrequency || 'Yearly';
  const incrementType = details.incrementType || 'Percentage';

  if (incrementFrequency === 'Custom Date') {
    const customRanges = details?.customDateRanges || [];
    const hasInvalidCustomRange = customRanges.some((r: any) => {
      if (r.incrementType === 'Percentage') {
        return isIncValInvalid(r.incrementValue);
      }
      return false;
    });
    if (hasInvalidCustomRange) return null;
  } else if (incrementFrequency !== 'No Increment') {
    if (incrementType === 'Percentage' && isIncValInvalid(details.incrementValue)) {
      return null;
    }
  }

  const baseRent = parseFloat(details.rentAmount || '0');
  const incrementValue = parseFloat(details.incrementValue || '0');
  const isCompounding = details.isCompounding || false;
  const startDate = new Date(details.agreementDateFrom);
  const endDate = new Date(details.agreementDateTo);

  if (baseRent <= 0 || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

  const getFY = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 3) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  };

  const getIncrementAmount = (currentRentValue: number) => {
    return incrementType === 'Percentage'
      ? isCompounding
        ? (currentRentValue * incrementValue) / 100
        : (baseRent * incrementValue) / 100
      : incrementValue;
  };

  const monthsToIncrement = FREQUENCY_MONTHS[incrementFrequency] || FREQUENCY_MONTHS['Yearly'];

  const customRanges = details?.customDateRanges || [];

  if (incrementFrequency === 'Custom Date') {
    const segments = buildCustomSegments(startDate, endDate, customRanges);
    const segmentRents = computeSegmentMonthlyRents(segments, baseRent, details);

    const progression: RentPeriod[] = [];
    const fyTotals: { [key: string]: number } = {};
    const fyDateRanges: { [key: string]: { start: Date; end: Date } } = {};
    const fyMonthlyRents: { [key: string]: number } = {};

    const currentDate = new Date(startDate.getTime());
    let periodCounter = 0;

    while (currentDate <= endDate) {
      const si = findSegmentIndexForDate(currentDate, segments);
      const seg = segments[si];
      const currentRent = segmentRents[si];
      const isIncrementPeriod =
        seg.kind === 'custom' || (seg.kind === 'base' && Math.abs(currentRent - baseRent) > 0.001);

      let previousRent = baseRent;
      let incrementApplied = 0;
      if (seg.kind === 'base') {
        incrementApplied = currentRent - baseRent;
        previousRent = baseRent;
      } else {
        const r = seg.range;
        previousRent =
          (r.calculationMethod as string) === 'Incremented Value'
            ? si > 0
              ? segmentRents[si - 1]
              : baseRent
            : baseRent;
        incrementApplied = currentRent - previousRent;
      }

      const periodEndDate = new Date(currentDate.getTime());
      periodEndDate.setMonth(periodEndDate.getMonth() + 1);
      periodEndDate.setDate(periodEndDate.getDate() - 1);
      const actualEnd = periodEndDate > endDate ? endDate : periodEndDate;

      const durationStr = `${currentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} to ${actualEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;

      progression.push({
        month: periodCounter + 1,
        date: new Date(currentDate.getTime()),
        duration: durationStr,
        rent: currentRent,
        previousRent,
        incrementApplied,
        isIncrementMonth: isIncrementPeriod,
      });

      const tempDate = new Date(currentDate.getTime());
      while (tempDate <= actualEnd && tempDate <= endDate) {
        const fy = getFY(tempDate);
        fyTotals[fy] = (fyTotals[fy] || 0) + currentRent;
        if (!fyMonthlyRents[fy]) fyMonthlyRents[fy] = currentRent;
        if (!fyDateRanges[fy])
          fyDateRanges[fy] = { start: new Date(tempDate), end: new Date(tempDate) };
        fyDateRanges[fy].end = new Date(tempDate);
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
      periodCounter++;
      if (periodCounter > RENT_CONSTANTS.MAX_PERIOD_LIMIT) break;
    }

    const segmentProgression: RentPeriod[] = segments.map((seg, idx) => {
      const rent = segmentRents[idx];
      let previousRent = baseRent;
      let incrementApplied = 0;
      let segmentLabel = formatDefaultOutsideCustomLabel(details);
      if (seg.kind === 'custom') {
        const r = seg.range;
        previousRent =
          (r.calculationMethod as string) === 'Incremented Value'
            ? idx > 0
              ? segmentRents[idx - 1]
              : baseRent
            : baseRent;
        incrementApplied = rent - previousRent;
        segmentLabel = formatCustomSegmentLabel(r);
      } else {
        incrementApplied = rent - baseRent;
        previousRent = baseRent;
      }
      const durationStr = `${seg.from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${seg.to.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      return {
        month: idx + 1,
        date: new Date(seg.from.getTime()),
        segmentTo: new Date(seg.to.getTime()),
        duration: durationStr,
        rent,
        previousRent,
        incrementApplied,
        isIncrementMonth:
          seg.kind === 'custom' || (seg.kind === 'base' && Math.abs(incrementApplied) > 0.001),
        segmentLabel,
      };
    });

    const fyBreakdown: RenterMastItem[] = Object.entries(fyTotals).map(([fy, total]) => ({
      financialYear: fy,
      finalRent: total,
      rentMonthly: fyMonthlyRents[fy] || 0,
      durationFrom: fyDateRanges[fy].start.toISOString(),
      durationTo: fyDateRanges[fy].end.toISOString(),
      nonCalculateRentMonthly: parseFloat(
        String(details.selfDeclarationAmount || 0)
      ),
      isActive: true,
    }));

    const defaultIncVal = parseFloat(String(details.incrementValue ?? '0'));
    const renterDetailsArr: RenterDetailItem[] = segments.map((seg, idx) => {
      if (seg.kind === 'base') {
        const gapRent = segmentRents[idx];
        return {
          agreementId: details.agreementId || '',
          incrementFrequency: 'Custom Date',
          incrementType: String(details.incrementType || 'Percentage'),
          incrementValue: defaultIncVal,
          incrementMethod: isCompounding ? 'compounding' : 'base',
          durationFrom: toDateInputString(seg.from),
          durationTo: toDateInputString(seg.to),
          rentAmount: baseRent,
          rentMonthly: gapRent,
          incrementStatus: defaultIncVal > 0,
          isActive: true,
        };
      }
      const r = seg.range as Record<string, unknown>;
      const customMethodVal = r.calculationMethod === 'Incremented Value' ? 'compounding' : 'base';
      const customIncrementValueVal = parseFloat(String(r.incrementValue ?? '0'));
      const customIncrementTypeVal = String(r.incrementType ?? 'Percentage');
      return {
        agreementId: details.agreementId || '',
        incrementFrequency: 'Custom Date',
        incrementType: customIncrementTypeVal,
        incrementValue: customIncrementValueVal,
        incrementMethod: customMethodVal,
        durationFrom: toDateInputString(seg.from),
        durationTo: toDateInputString(seg.to),
        // Stamp the original custom range bounds on the row so the
        // backend can echo them back on `GET /DataEntry/{id}` and the
        // UI can reconstruct `customDateRanges` from these fields when
        // reopening the renter screen.
        customFromDate: toDateInputString(seg.from),
        customToDate: toDateInputString(seg.to),
        customIncrementType: customIncrementTypeVal,
        customIncrementValue: customIncrementValueVal,
        customMethod: customMethodVal,
        rentAmount: baseRent,
        rentMonthly: segmentRents[idx],
        incrementStatus: true,
        isActive: true,
      };
    });

    const renterTableEntries: RenterTableEntryPostRow[] = segments.map((seg, idx) => {
      const rent = segmentRents[idx];
      let tableIncrementApplied = 0;
      let tableStatusLabel = formatDefaultOutsideCustomLabel(details);
      if (seg.kind === 'custom') {
        const r = seg.range;
        const previousRent =
          (r.calculationMethod as string) === 'Incremented Value'
            ? idx > 0
              ? segmentRents[idx - 1]
              : baseRent
            : baseRent;
        tableIncrementApplied = rent - previousRent;
        tableStatusLabel = formatCustomSegmentLabel(r);
      } else {
        tableIncrementApplied = rent - baseRent;
      }
      return {
        TablePeriod: idx + 1,
        TableDurationFrom: toDateInputString(seg.from),
        TableDurationTo: toDateInputString(seg.to),
        TableRentMonthly: rent,
        TableIncrementApplied: tableIncrementApplied,
        TableSegmentType: seg.kind === 'base' ? 'Base' : 'Custom',
        TableStatusLabel: tableStatusLabel,
      };
    });

    return {
      grandTotal: Object.values(fyTotals).reduce((s, v) => s + v, 0),
      fyBreakdown,
      totalYears: Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      ),
      renterDetails: renterDetailsArr,
      progression,
      segmentProgression,
      renterTableEntries,
    };
  }

  const progression: RentPeriod[] = [];
  let currentRent = baseRent;
  const currentDate = new Date(startDate.getTime());

  let periodCounter = 0;
  const fyTotals: { [key: string]: number } = {};
  const fyDateRanges: { [key: string]: { start: Date; end: Date } } = {};
  const fyMonthlyRents: { [key: string]: number } = {};

  while (currentDate <= endDate) {
    let incrementApplied = 0;
    const previousRent = currentRent;
    let isIncrementPeriod = false;

    isIncrementPeriod = periodCounter > 0 && incrementFrequency !== 'No Increment';
    if (isIncrementPeriod) {
      incrementApplied = getIncrementAmount(currentRent);
      currentRent += incrementApplied;
    }

    const periodEndDate = new Date(currentDate.getTime());
    const jumpMonths = incrementFrequency === 'No Increment' ? 1 : monthsToIncrement;

    periodEndDate.setMonth(periodEndDate.getMonth() + jumpMonths);
    periodEndDate.setDate(periodEndDate.getDate() - 1);
    const actualEnd = periodEndDate > endDate ? endDate : periodEndDate;

    const durationStr = `${currentDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} to ${actualEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;

    progression.push({
      month: periodCounter + 1,
      date: new Date(currentDate.getTime()),
      duration: durationStr,
      rent: currentRent,
      previousRent,
      incrementApplied,
      isIncrementMonth: isIncrementPeriod,
    });

    const tempDate = new Date(currentDate.getTime());
    while (tempDate <= actualEnd && tempDate <= endDate) {
      const fy = getFY(tempDate);
      fyTotals[fy] = (fyTotals[fy] || 0) + currentRent;
      if (!fyMonthlyRents[fy]) fyMonthlyRents[fy] = currentRent;
      if (!fyDateRanges[fy])
        fyDateRanges[fy] = { start: new Date(tempDate), end: new Date(tempDate) };
      fyDateRanges[fy].end = new Date(tempDate);
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    currentDate.setMonth(currentDate.getMonth() + jumpMonths);
    periodCounter++;
    if (periodCounter > RENT_CONSTANTS.MAX_PERIOD_LIMIT) break;
  }

  const fyBreakdown: RenterMastItem[] = Object.entries(fyTotals).map(([fy, total]) => ({
    financialYear: fy,
    finalRent: total,
    rentMonthly: fyMonthlyRents[fy] || 0,
    durationFrom: fyDateRanges[fy].start.toISOString(),
    durationTo: fyDateRanges[fy].end.toISOString(),
    nonCalculateRentMonthly: parseFloat(
      String(details.selfDeclarationAmount || 0)
    ),
    isActive: true,
  }));

  const renterDetailsArr: RenterDetailItem[] = [
    {
      agreementId: details.agreementId || '',
      incrementFrequency,
      incrementType,
      incrementValue,
      incrementMethod: isCompounding ? 'compounding' : 'base',
      durationFrom: details.agreementDateFrom,
      durationTo: details.agreementDateTo,
      rentAmount: baseRent,
      rentMonthly: baseRent,
      incrementStatus: true,
      isActive: true,
    },
  ];

  return {
    grandTotal: Object.values(fyTotals).reduce((s, v) => s + v, 0),
    fyBreakdown,
    totalYears: Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    ),
    renterDetails: renterDetailsArr,
    progression,
  };
};
