/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RenterCustomIncrementPostRow } from "@/types/floor-details.types";

/**
 * Converts various date string formats to ISO format (YYYY-MM-DD).
 * Supports: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
 */
export const convertToISODate = (dateStr: string): string => {
    if (!dateStr) return "";

    // Try parsing different date formats
    const formats = [
        // DD/MM/YYYY or DD-MM-YYYY
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
        // YYYY-MM-DD
        /^(\d{4})-(\d{2})-(\d{2})$/,
    ];

    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            if (format === formats[0]) {
                // DD/MM/YYYY format
                const [, day, month, year] = match;
                return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            } else {
                // Already in YYYY-MM-DD format
                return dateStr;
            }
        }
    }

    return dateStr; // Return as-is if no match
};

/**
 * Resolves the user-entered agreement base monthly rent from floor/renter payload data.
 * Calculated segment/FY rents (`renterMast.rentMonthly`, `renterDetail.rentMonthly`) are
 * intentionally excluded — those reflect increment-adjusted values, not the agreement base.
 */
export function resolveAgreementBaseMonthlyRent(
    details: Record<string, unknown> | null | undefined
): number | string {
    if (!details || typeof details !== "object") return "";

    const pickPositive = (...candidates: unknown[]): number | undefined => {
        for (const c of candidates) {
            if (c === undefined || c === null || c === "") continue;
            const n = Number(c);
            if (!isNaN(n) && n > 0) return n;
        }
        return undefined;
    };

    const renterDetails = details.renterDetails;
    const renterMast = details.renterMast ?? details.renters;
    const firstDetail = Array.isArray(renterDetails)
        ? (renterDetails[0] as Record<string, unknown>)
        : null;
    const firstMast = Array.isArray(renterMast)
        ? (renterMast[0] as Record<string, unknown>)
        : null;

    const resolved = pickPositive(
        details.nonCalculateRentMonthly,
        details.NonCalculateRentMonthly,
        firstMast?.nonCalculateRentMonthly,
        firstMast?.NonCalculateRentMonthly,
        firstDetail?.rentAmount,
        firstDetail?.RentAmount,
        details.rentMonthly,
        details.RentMonthly
    );

    return resolved ?? "";
}

/**
 * Calculates the next rent amount based on the current rent, increment percentage, and agreement type.
 */
export const calculateNextRent = (
    monthlyRent: number,
    incrementPercent: number,
    agreementType: string
): number => {
    if (!monthlyRent || !incrementPercent) return 0;

    switch (agreementType) {
        case "Quarterly":
            return monthlyRent + (monthlyRent * incrementPercent) / 400;
        case "Yearly":
        case "Custom":
            return monthlyRent + (monthlyRent * incrementPercent) / 100;
        default:
            return monthlyRent;
    }
};

/**
 * Extracts agreement details from OCR text.
 */
export const extractAgreementData = (text: string) => {
    const extractedData: any = {};

    // Clean text
    const cleanText = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();

    // Extract Agreement No (patterns: AGR-XXX, Agreement No: XXX, Agr. ID: XXX)
    const agrIdPatterns = [
        /Agreement\s*(?:No|ID|Number)[:\s]+([A-Z0-9-]+)/i,
        /AGR[:\s-]+([A-Z0-9-]+)/i,
        /Agr\.\s*(?:No|ID)[:\s]+([A-Z0-9-]+)/i,
    ];
    for (const pattern of agrIdPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            extractedData.agreementId = match[1].trim();
            break;
        }
    }

    // Extract Renter Name (patterns: Tenant Name, Renter, Lessee)
    const namePatterns = [
        /(?:Tenant|Renter|Lessee)\s*(?:Name)?[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /Name\s*of\s*(?:Tenant|Renter|Lessee)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    ];
    for (const pattern of namePatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            extractedData.renterName = match[1].trim();
            break;
        }
    }

    // Extract Shop Name (patterns: Shop Name, Establishment, Business Name)
    const shopPatterns = [
        /(?:Shop|Establishment|Business)\s*(?:Name)?[:\s]+([A-Z0-9][a-z0-9\s]+(?:\s+[A-Z0-9][a-z0-9\s]+)*)/i,
        /Name\s*of\s*(?:Shop|Establishment|Business)[:\s]+([A-Z0-9][a-z0-9\s]+(?:\s+[A-Z0-9][a-z0-9\s]+)*)/i,
    ];
    for (const pattern of shopPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            extractedData.shopName = match[1].trim();
            break;
        }
    }

    // Extract Dates (patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
    const datePatterns = [
        /(?:From|Start|Commencement)\s*(?:Date)?[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
        /(\d{4}-\d{2}-\d{2})/,
    ];
    const toDatePatterns = [
        /(?:To|End|Expiry)\s*(?:Date)?[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
        /(?:until|till)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
    ];

    for (const pattern of datePatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            extractedData.agreementDateFrom = convertToISODate(match[1]);
            break;
        }
    }

    for (const pattern of toDatePatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            extractedData.agreementDateTo = convertToISODate(match[1]);
            break;
        }
    }

    // Extract Rent Amount (patterns: Rs. XXX, ₹ XXX, Rent: XXX)
    const rentPatterns = [
        /(?:Monthly\s*)?Rent[:\s]+(?:Rs\.?|₹|INR)?\s*([0-9,]+(?:\.\d{2})?)/i,
        /(?:Rs\.?|₹|INR)\s*([0-9,]+(?:\.\d{2})?)\s*(?:per\s*month)?/i,
        /Amount[:\s]+(?:Rs\.?|₹|INR)?\s*([0-9,]+(?:\.\d{2})?)/i,
    ];
    for (const pattern of rentPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            const rentAmount = match[1].replace(/,/g, "");
            extractedData.rentAmountAGR = rentAmount;
            extractedData.rentAmount = rentAmount;
            extractedData.rentSource = "agreement";
            break;
        }
    }

    return extractedData;
};

// ─── Custom Date Range Helpers ────────────────────────────────────────────────

/** Parse YYYY-MM-DD without UTC timezone shift. */
export const parseDateOnly = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    }
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const formatIsoDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Formats a date string (YYYY-MM-DD or ISO) or Date object to DD-MM-YYYY format.
 */
export const formatDateDDMMYYYY = (dateStrOrObj: string | Date | null | undefined): string => {
    if (!dateStrOrObj) return "";
    const date = typeof dateStrOrObj === "string" ? parseDateOnly(dateStrOrObj) ?? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export const addDays = (dateStr: string, days: number): string => {
    const d = parseDateOnly(dateStr);
    if (!d) return dateStr;
    d.setDate(d.getDate() + days);
    return formatIsoDate(d);
};

export const normalizeCalculationMethod = (
    method: string | undefined | null
): 'Base Value' | 'Incremented Value' => {
    const m = String(method ?? '').toLowerCase().trim();
    if (
        m === 'incremented value' ||
        m === 'compounding' ||
        m === 'compounded' ||
        m === 'incremented'
    ) {
        return 'Incremented Value';
    }
    return 'Base Value';
};

/** Next valid From Date = max(existing To Dates) + 1 day, or agreement start when empty. */
export const getNextCustomRangeFromDate = (
    existingRanges: { fromDate?: string; toDate?: string }[],
    agreementStart: string
): string => {
    if (!existingRanges.length) return agreementStart;
    const latestTo = existingRanges.reduce<string | null>((latest, range) => {
        if (!range.toDate) return latest;
        if (!latest) return range.toDate;
        const latestDate = parseDateOnly(latest);
        const rangeTo = parseDateOnly(range.toDate);
        if (!latestDate || !rangeTo) return latest;
        return rangeTo > latestDate ? range.toDate : latest;
    }, null);
    return latestTo ? addDays(latestTo, 1) : agreementStart;
};

export const CUSTOM_RANGE_MESSAGES = {
    overlap: 'Selected custom date range overlaps with an existing range.',
    boundary: 'Custom date range must be within agreement duration.',
    toAfterFrom: 'To Date must be greater than From Date.',
    sequentialFrom: 'From Date must start after the previous range ends.',
} as const;

interface CustomRangeLike {
    id?: string;
    fromDate?: string;
    toDate?: string;
}

/** Full / partial / nested / duplicate overlap detection. */
export const checkDateOverlap = (
    newFrom: string,
    newTo: string,
    existingRanges: CustomRangeLike[],
    excludeRangeId?: string
) => {
    const newStart = parseDateOnly(newFrom);
    const newEnd = parseDateOnly(newTo);
    if (!newStart || !newEnd) return { overlaps: false as const };

    for (let i = 0; i < existingRanges.length; i++) {
        const range = existingRanges[i];
        if (excludeRangeId && range.id === excludeRangeId) continue;
        if (!range.fromDate || !range.toDate) continue;

        const existingStart = parseDateOnly(range.fromDate);
        const existingEnd = parseDateOnly(range.toDate);
        if (!existingStart || !existingEnd) continue;

        if (newStart <= existingEnd && newEnd >= existingStart) {
            return {
                overlaps: true as const,
                rangeNumber: i + 1,
                fromDate: range.fromDate,
                toDate: range.toDate,
            };
        }
    }
    return { overlaps: false as const };
};

const isWithinAgreementDuration = (
    fromDate: string,
    toDate: string,
    agreementStart: Date,
    agreementEnd: Date
): boolean => {
    const from = parseDateOnly(fromDate);
    const to = parseDateOnly(toDate);
    if (!from || !to) return false;
    return from >= agreementStart && from <= agreementEnd && to >= agreementStart && to <= agreementEnd;
};

// Interface for validation input
export interface DateRangeValidationInput {
    newRangeData: {
        fromDate: string;
        toDate: string;
        incrementValue: string | number;
        incrementType?: string;
        id?: string;
    };
    agreementStart: Date;
    agreementEnd: Date;
    existingRanges: CustomRangeLike[];
    excludeRangeId?: string;
}

export interface ValidationErrors {
    fromDate: string;
    toDate: string;
    incrementValue: string;
    general: string;
}

const validateIncrementValue = (
    incrementValue: string | number,
    incrementType: string | undefined,
    errors: ValidationErrors
): boolean => {
    const parsedIncrement = Number(incrementValue);
    if (incrementValue === undefined || incrementValue === null || String(incrementValue).trim() === "") {
        errors.incrementValue = 'Value is required';
        return false;
    }
    if (incrementType === 'Percentage') {
        const incStr = String(incrementValue).trim();
        if (/[^0-9]/.test(incStr)) {
            errors.incrementValue = 'Only numeric values are allowed.';
            return false;
        }
        if (incStr.length > 3) {
            errors.incrementValue = 'Maximum 3 digits allowed.';
            return false;
        }
        const incVal = Number(incStr);
        if (incVal < 0 || incVal > 100) {
            errors.incrementValue = 'Percentage cannot exceed 100.';
            return false;
        }
        return true;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(String(incrementValue)) || parsedIncrement <= 0) {
        errors.incrementValue = 'Must be a positive number with up to 2 decimal places and no positive/negative signs';
        return false;
    }
    return true;
};

/** Validates a single custom range being added or edited in the form. */
export const validateDateRange = (
    input: DateRangeValidationInput
): { isValid: boolean; errors: ValidationErrors; overlapInfo?: ReturnType<typeof checkDateOverlap> } => {
    const errors: ValidationErrors = {
        fromDate: '',
        toDate: '',
        incrementValue: '',
        general: '',
    };
    let isValid = true;

    const { fromDate, toDate, incrementValue, incrementType } = input.newRangeData;
    const excludeRangeId = input.excludeRangeId ?? input.newRangeData.id;
    const otherRanges = input.existingRanges.filter((r) => !excludeRangeId || r.id !== excludeRangeId);

    const agreementStart = parseDateOnly(formatIsoDate(input.agreementStart)) ?? input.agreementStart;
    const agreementEnd = parseDateOnly(formatIsoDate(input.agreementEnd)) ?? input.agreementEnd;
    const minFromDate = getNextCustomRangeFromDate(otherRanges, formatIsoDate(agreementStart));

    if (!fromDate) {
        errors.fromDate = 'From Date is required';
        isValid = false;
    } else {
        const fromDateObj = parseDateOnly(fromDate);
        if (!fromDateObj) {
            errors.fromDate = 'From Date is required';
            isValid = false;
        } else if (!isWithinAgreementDuration(fromDate, fromDate, agreementStart, agreementEnd)) {
            errors.fromDate = CUSTOM_RANGE_MESSAGES.boundary;
            isValid = false;
        } else {
            const minFromObj = parseDateOnly(minFromDate);
            if (minFromObj && fromDateObj < minFromObj) {
                errors.fromDate = CUSTOM_RANGE_MESSAGES.sequentialFrom;
                isValid = false;
            }
        }
    }

    if (!toDate) {
        errors.toDate = 'To Date is required';
        isValid = false;
    } else {
        const toDateObj = parseDateOnly(toDate);
        if (!toDateObj) {
            errors.toDate = 'To Date is required';
            isValid = false;
        } else if (!isWithinAgreementDuration(toDate, toDate, agreementStart, agreementEnd)) {
            errors.toDate = CUSTOM_RANGE_MESSAGES.boundary;
            isValid = false;
        }

        if (fromDate) {
            const fromDateObj = parseDateOnly(fromDate);
            if (fromDateObj && toDateObj && toDateObj <= fromDateObj) {
                errors.toDate = CUSTOM_RANGE_MESSAGES.toAfterFrom;
                isValid = false;
            }
        }
    }

    if (fromDate && toDate && !isWithinAgreementDuration(fromDate, toDate, agreementStart, agreementEnd)) {
        errors.general = CUSTOM_RANGE_MESSAGES.boundary;
        isValid = false;
    }

    if (!validateIncrementValue(incrementValue, incrementType, errors)) {
        isValid = false;
    }

    if (fromDate && toDate && isValid) {
        const overlapInfo = checkDateOverlap(fromDate, toDate, otherRanges, excludeRangeId);
        if (overlapInfo.overlaps) {
            errors.general = CUSTOM_RANGE_MESSAGES.overlap;
            isValid = false;
            return { isValid, errors, overlapInfo };
        }
    }

    return { isValid, errors };
};

/** Validates the full custom-date-range collection before save. */
export const validateCustomDateRangesCollection = (
    ranges: CustomRangeLike[],
    agreementFrom: string,
    agreementTo: string
): { isValid: boolean; message?: string } => {
    if (!ranges.length) return { isValid: true };

    const agreementStart = parseDateOnly(agreementFrom);
    const agreementEnd = parseDateOnly(agreementTo);
    if (!agreementStart || !agreementEnd) return { isValid: true };

    const sorted = [...ranges].sort((a, b) => {
        const aFrom = parseDateOnly(a.fromDate || '')?.getTime() ?? 0;
        const bFrom = parseDateOnly(b.fromDate || '')?.getTime() ?? 0;
        return aFrom - bFrom;
    });

    for (let idx = 0; idx < sorted.length; idx++) {
        const range = sorted[idx];
        if (!range.fromDate || !range.toDate) {
            return { isValid: false, message: `Custom range #${idx + 1} requires both From and To dates.` };
        }

        const fromObj = parseDateOnly(range.fromDate);
        const toObj = parseDateOnly(range.toDate);
        if (!fromObj || !toObj) {
            return { isValid: false, message: `Custom range #${idx + 1} has invalid dates.` };
        }

        if (toObj <= fromObj) {
            return { isValid: false, message: `Custom range #${idx + 1}: ${CUSTOM_RANGE_MESSAGES.toAfterFrom}` };
        }

        if (!isWithinAgreementDuration(range.fromDate, range.toDate, agreementStart, agreementEnd)) {
            return { isValid: false, message: `Custom range #${idx + 1}: ${CUSTOM_RANGE_MESSAGES.boundary}` };
        }

        if (idx > 0) {
            const prev = sorted[idx - 1];
            const minFrom = parseDateOnly(addDays(prev.toDate!, 1));
            if (minFrom && fromObj < minFrom) {
                return { isValid: false, message: `Custom range #${idx + 1}: ${CUSTOM_RANGE_MESSAGES.sequentialFrom}` };
            }
        }

        for (let j = idx + 1; j < sorted.length; j++) {
            const other = sorted[j];
            if (!other.fromDate || !other.toDate) continue;
            const overlap = checkDateOverlap(range.fromDate, range.toDate, [other]);
            if (overlap.overlaps) {
                return { isValid: false, message: CUSTOM_RANGE_MESSAGES.overlap };
            }
        }
    }

    return { isValid: true };
};

/**
 * Maps UI `customDateRanges` entries to the API contract.
 * UI fields: fromDate, toDate, incrementType, incrementValue, calculationMethod
 */
export function mapCustomDateRangesToPostPayload(
    ranges: any[] | undefined | null
): RenterCustomIncrementPostRow[] {
    if (!ranges?.length) return [];
    return ranges.map((r) => ({
        Customfromdate: String(r.fromDate ?? ""),
        Customtodate: String(r.toDate ?? ""),
        CustomIncrementtype: String(r.incrementType ?? ""),
        CustomIncrementValue: Number(r.incrementValue ?? 0),
        CustomMethod: normalizeCalculationMethod(r.calculationMethod) === "Incremented Value" ? "compounding" : "base",
    }));
}

