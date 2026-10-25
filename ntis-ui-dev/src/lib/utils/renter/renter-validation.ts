import { RenterFormDataDetails } from '@/types/renter/renter.types';
import { validateCustomDateRangesCollection } from '@/lib/utils/renter/renterUtils';

/**
 * Enterprise Validation Logic for Renter Module
 */

export interface ValidationError {
  field: keyof RenterFormDataDetails;
  message: string;
}

export interface ExistingFloorRenterDetails {
  agreementId?: string;
  agreementFromDate?: string;
  agreementToDate?: string;
  durationFrom?: string;
  durationTo?: string;
  [key: string]: unknown;
}

export interface ExistingFloorData {
  id?: string | number;
  propertyDetailsId?: string | number;
  floorId?: string | number;
  subFloorId?: string | number;
  agreementFromDate?: string;
  agreementToDate?: string;
  agreementDateFrom?: string;
  agreementDateTo?: string;
  renter?: string;
  renterDetails?: ExistingFloorRenterDetails[];
  renterMast?: ExistingFloorRenterDetails[];
  renters?: ExistingFloorRenterDetails[];
  [key: string]: unknown;
}

/**
 * Identity of the floor currently being edited. Used to exclude its own renter
 * records (and any stray DB duplicates of the same logical floor) from
 * agreement-id-duplicate and duration-overlap checks.
 *
 * `id`          -> propertyDetailsId of the row being edited (deep-link source).
 * `floorId`     -> floor master id (e.g. 1 = Ground, 2 = First).
 * `subFloorId`  -> sub-floor master id.
 */
export interface CurrentFloorContext {
  id?: string | number;
  floorId?: string | number;
  subFloorId?: string | number;
  agreementId?: string;
}

/** Validate calendar date */
const isValidCalendarDate = (isoDate: string): boolean => {
  if (!isoDate) return false;
  
  const datePart = isoDate.split('T')[0];
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(datePart)) return false;

  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return false;

  const [y, m, day] = datePart.split('-');
  if (
    d.getUTCFullYear() !== parseInt(y, 10) ||
    d.getUTCMonth() + 1 !== parseInt(m, 10) ||
    d.getUTCDate() !== parseInt(day, 10)
  ) {
    return false;
  }

  const year = d.getFullYear();
  return year >= 1900 && year <= 2100;
};

/** Calendar-accurate overlap check */
export const areDatesOverlapping = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  if (isNaN(s1.getTime()) || isNaN(e1.getTime()) || isNaN(s2.getTime()) || isNaN(e2.getTime())) {
    return false;
  }
  return s1 <= e2 && e1 >= s2;
};

/**
 * Returns true if the given existing floor record is the same logical floor
 * as the one currently being edited. We treat two floors as the same logical
 * floor when either:
 *   1. their propertyDetailsId (`id`) matches, or
 *   2. they share the same (floor master id, sub-floor master id) pair.
 *
 * Case 2 protects against legacy DB duplicates where the same physical floor
 * was inserted multiple times — those rows must not trigger a "self-overlap"
 * or "self-duplicate-agreementId" error against the user.
 */
const isSameLogicalFloor = (
  existing: ExistingFloorData,
  ctx: CurrentFloorContext | string | number | undefined
): boolean => {
  if (ctx === undefined || ctx === null) return false;

  const existingRecordId = existing.id ?? (existing as Record<string, unknown>).propertyDetailsId;

  // Backward-compat path: caller passed just an id.
  if (typeof ctx === 'string' || typeof ctx === 'number') {
    return String(existingRecordId ?? '') === String(ctx);
  }

  if (
    ctx.id !== undefined &&
    ctx.id !== null &&
    ctx.id !== '' &&
    ctx.id !== 'new' &&
    String(existingRecordId ?? '') === String(ctx.id)
  ) {
    return true;
  }

  const ctxFloor =
    ctx.floorId !== undefined && ctx.floorId !== null ? String(ctx.floorId).trim() : '';
  const ctxSubFloor =
    ctx.subFloorId !== undefined && ctx.subFloorId !== null ? String(ctx.subFloorId).trim() : '';
  const existingFloor =
    existing.floorId !== undefined && existing.floorId !== null
      ? String(existing.floorId).trim()
      : '';
  const existingSubFloor =
    existing.subFloorId !== undefined && existing.subFloorId !== null
      ? String(existing.subFloorId).trim()
      : '';

  if (ctxFloor && existingFloor && ctxFloor === existingFloor) {
    // Both sides have no sub-floor (common for ground / single sub-floor rows).
    if (!ctxSubFloor && !existingSubFloor) return true;
    if (ctxSubFloor && existingSubFloor && ctxSubFloor === existingSubFloor) return true;
  }

  return false;
};

export const validateRenterForm = (
  details: RenterFormDataDetails,
  currentFloor?: CurrentFloorContext | string | number,
  existingFloors?: ExistingFloorData[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // ─── Tax Liability ────────────────────────────────────────────────────────
  if (!details.taxLiability || !details.taxLiability.trim()) {
    errors.push({
      field: 'taxLiability',
      message: 'Tax Liability is required.',
    });
  }

  // ─── Agreement No ─────────────────────────────────────────────────────────
  if (details.agreementId && details.agreementId.trim()) {
    const agreementIdVal = details.agreementId.trim();

    if (!/^[A-Za-z0-9_-]+$/.test(agreementIdVal)) {
      errors.push({
        field: 'agreementId',
        message: 'Agreement No must be alphanumeric and can contain hyphens and underscores.',
      });
    } else if (agreementIdVal.length > 8) {
      errors.push({
        field: 'agreementId',
        message: 'Agreement No must be at most 8 characters.',
      });
    } else if (existingFloors) {
      const hasDuplicate = existingFloors.some((f) => {
        if (isSameLogicalFloor(f, currentFloor)) return false;
        if (f.renter !== 'Yes') return false;
        return (
          Array.isArray(f.renterDetails) &&
          f.renterDetails.some(
            (rd) => rd.agreementId && String(rd.agreementId).trim() === agreementIdVal
          )
        );
      });
      if (hasDuplicate) {
        errors.push({
          field: 'agreementId',
          message: 'Agreement No already exists for this property.',
        });
      }
    }
  }

  // ─── Agreement Date ───────────────────────────────────────────────────────
  if (!details.agreementDate) {
    errors.push({ field: 'agreementDate', message: 'Agreement Date is required.' });
  } else if (!isValidCalendarDate(details.agreementDate)) {
    errors.push({ field: 'agreementDate', message: 'Enter a valid Agreement Date (DD-MM-YYYY).' });
  }

  // ─── Renter Name ──────────────────────────────────────────────────────────
  if (!details.renterName || !details.renterName.trim()) {
    errors.push({ field: 'renterName', message: 'Renter Name is required.' });
  } else {
    const nameVal = details.renterName;
    const trimmedName = nameVal.trim();
    const primaryRegex = /^[A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)*$/;

    if (trimmedName.length < 3) {
      errors.push({ field: 'renterName', message: 'Renter Name must be at least 3 characters.' });
    } else if (nameVal.length > 100) {
      errors.push({ field: 'renterName', message: 'Renter Name cannot exceed 100 characters.' });
    } else if (!primaryRegex.test(trimmedName)) {
      errors.push({
        field: 'renterName',
        message: 'Renter Name should contain only alphabets and spaces.',
      });
    } else {
      // Repeated characters check: Reject same character repeated continuously > 3 times
      const hasRepeatedChar = /(.)\1{3,}/i.test(nameVal);

      // Repeated sequence patterns:
      // 1. Any 2-character sequence repeated continuously 3 or more times (e.g. hahaha)
      // 2. Any 3+ character sequence repeated continuously 2 or more times (e.g. qweqwe, abcabcabc)
      const hasRepeatedSeq =
        /([A-Za-z\u0900-\u097F]{2})\1{2,}/i.test(nameVal) ||
        /([A-Za-z\u0900-\u097F]{3,})\1+/i.test(nameVal);

      if (hasRepeatedChar || hasRepeatedSeq) {
        errors.push({
          field: 'renterName',
          message: 'Repeated or random characters are not allowed.',
        });
      } else {
        // Keyboard patterns check
        const nameLower = nameVal.toLowerCase();
        const keyboardPatterns = ['asdfgh', 'qwerty', 'zxcvbn'];
        const hasKeyboardPattern = keyboardPatterns.some((pat) => nameLower.includes(pat));

        // Consonant-only / Vowel check: Reject words of length >= 3 with no vowels (skipping Devanagari words)
        const words = nameVal.split(/\s+/);
        const hasSpamWord = words.some(
          (word) => word.length >= 3 && !/[\u0900-\u097F]/.test(word) && !/[aeiouy]/i.test(word)
        );

        if (hasKeyboardPattern || hasSpamWord) {
          errors.push({ field: 'renterName', message: 'Please enter a meaningful renter name.' });
        }
      }
    }
  }

  // ─── Duration Dates ───────────────────────────────────────────────────────
  if (!details.agreementDateFrom) {
    errors.push({ field: 'agreementDateFrom', message: 'From Date is required.' });
  } else if (!isValidCalendarDate(details.agreementDateFrom)) {
    errors.push({ field: 'agreementDateFrom', message: 'Enter a valid From Date (DD-MM-YYYY).' });
  } else if (details.agreementDate && isValidCalendarDate(details.agreementDate)) {
    const fromDateObj = new Date(details.agreementDateFrom);
    const agreementDateObj = new Date(details.agreementDate);
    if (fromDateObj < agreementDateObj) {
      errors.push({
        field: 'agreementDateFrom',
        message: 'From Date should not be before Agreement Date.',
      });
    }
  }

  if (!details.agreementDateTo) {
    errors.push({ field: 'agreementDateTo', message: 'To Date is required.' });
  } else if (!isValidCalendarDate(details.agreementDateTo)) {
    errors.push({ field: 'agreementDateTo', message: 'Enter a valid To Date (DD-MM-YYYY).' });
  }

  if (
    details.agreementDateFrom &&
    details.agreementDateTo &&
    isValidCalendarDate(details.agreementDateFrom) &&
    isValidCalendarDate(details.agreementDateTo)
  ) {
    const fromDateObj = new Date(details.agreementDateFrom);
    const toDateObj = new Date(details.agreementDateTo);

    if (toDateObj <= fromDateObj) {
      errors.push({ field: 'agreementDateTo', message: 'To Date must be greater than From Date.' });
    }
  }

  // ─── Monthly Rent ─────────────────────────────────────────────────────────
  if (
    details.rentAmount === undefined ||
    details.rentAmount === null ||
    String(details.rentAmount).trim() === ''
  ) {
    errors.push({ field: 'rentAmount', message: 'Monthly Rent is required.' });
  } else {
    const rentStr = String(details.rentAmount).trim();
    const rentRegex = /^\d+(\.\d{1,2})?$/;
    if (!rentRegex.test(rentStr)) {
      errors.push({ field: 'rentAmount', message: 'Enter valid rent amount.' });
    } else {
      const rentVal = Number(rentStr);
      if (rentVal <= 0) {
        errors.push({ field: 'rentAmount', message: 'Rent amount must be greater than 0.' });
      } else {
        const integerPart = rentStr.split('.')[0];
        if (integerPart.length > 10) {
          errors.push({ field: 'rentAmount', message: 'Monthly Rent cannot exceed 10 digits.' });
        }
      }
    }
  }

  // ─── Self Declaration (Monthly) ───────────────────────────────────────────
  if (
    details.selfDeclarationAmount !== undefined &&
    details.selfDeclarationAmount !== null &&
    String(details.selfDeclarationAmount).trim() !== ''
  ) {
    const sdStr = String(details.selfDeclarationAmount).trim();
    const sdRegex = /^\d+(\.\d{1,2})?$/;
    if (!sdRegex.test(sdStr)) {
      errors.push({
        field: 'selfDeclarationAmount',
        message: 'Enter valid self declaration amount.',
      });
    } else {
      const sdVal = Number(sdStr);
      if (sdVal <= 0) {
        errors.push({
          field: 'selfDeclarationAmount',
          message: 'Self declaration amount must be greater than 0.',
        });
      } else {
        const integerPart = sdStr.split('.')[0];
        if (integerPart.length > 10) {
          errors.push({
            field: 'selfDeclarationAmount',
            message: 'Self Declaration cannot exceed 10 digits.',
          });
        }
      }
    }
  }

  // ─── Increment Logic ──────────────────────────────────────────────────────
  const isIncrementValueEntered =
    details.incrementValue !== undefined &&
    details.incrementValue !== null &&
    String(details.incrementValue).trim() !== '';
  const hasFrequencySelected =
    details.incrementFrequency &&
    details.incrementFrequency !== 'No Increment' &&
    details.incrementFrequency !== 'Custom Date';

  if (isIncrementValueEntered) {
    if (!details.incrementFrequency || details.incrementFrequency === 'No Increment') {
      errors.push({ field: 'incrementFrequency', message: 'Please select Increment Frequency.' });
    }
    if (!details.incrementType) {
      errors.push({ field: 'incrementType', message: 'Please select Increment Type.' });
    }

    const incStr = String(details.incrementValue).trim();
    if (details.incrementType === 'Percentage') {
      if (/[^0-9]/.test(incStr)) {
        errors.push({ field: 'incrementValue', message: 'Only numeric values are allowed.' });
      } else if (incStr.length > 3) {
        errors.push({ field: 'incrementValue', message: 'Maximum 3 digits allowed.' });
      } else {
        const incVal = Number(incStr);
        if (incVal < 0 || incVal > 100) {
          errors.push({ field: 'incrementValue', message: 'Percentage cannot exceed 100.' });
        }
      }
    } else if (details.incrementType === 'Fixed') {
      const incRegex = /^\d+(\.\d{1,2})?$/;
      if (!incRegex.test(incStr)) {
        errors.push({
          field: 'incrementValue',
          message: 'Increment Value must be greater than 0.',
        });
      } else {
        const incVal = Number(incStr);
        const integerPart = incStr.split('.')[0];
        if (integerPart.length > 5) {
          errors.push({
            field: 'incrementValue',
            message: 'Increment Value cannot exceed allowed limit.',
          });
        } else if (incVal <= 0) {
          errors.push({
            field: 'incrementValue',
            message: 'Increment Value must be greater than 0.',
          });
        }
      }
    }
  } else if (hasFrequencySelected) {
    errors.push({ field: 'incrementValue', message: 'Increment Value is required.' });
  }

  // ─── Custom Date Ranges ──────────────────────────────────────────────────
  if (details.incrementFrequency === 'Custom Date' && Array.isArray(details.customDateRanges)) {
    const collectionResult = validateCustomDateRangesCollection(
      details.customDateRanges,
      details.agreementDateFrom,
      details.agreementDateTo
    );
    if (!collectionResult.isValid && collectionResult.message) {
      errors.push({ field: 'customDateRanges', message: collectionResult.message });
    }

    details.customDateRanges.forEach((range, idx) => {
      const incStr = String(range.incrementValue).trim();
      if (range.incrementType === 'Percentage') {
        if (/[^0-9]/.test(incStr)) {
          errors.push({
            field: 'customDateRanges',
            message: `Custom range #${idx + 1} Only numeric values are allowed.`,
          });
        } else if (incStr.length > 3) {
          errors.push({
            field: 'customDateRanges',
            message: `Custom range #${idx + 1} Maximum 3 digits allowed.`,
          });
        } else {
          const incVal = Number(incStr);
          if (incVal < 0 || incVal > 100) {
            errors.push({
              field: 'customDateRanges',
              message: `Custom range #${idx + 1} Percentage cannot exceed 100.`,
            });
          }
        }
      } else {
        const incRegex = /^\d+(\.\d{1,2})?$/;
        if (!incRegex.test(incStr)) {
          errors.push({
            field: 'customDateRanges',
            message: `Custom range #${idx + 1} Increment Value must be greater than 0.`,
          });
        } else {
          const incVal = Number(incStr);
          const integerPart = incStr.split('.')[0];
          if (integerPart.length > 5) {
            errors.push({
              field: 'customDateRanges',
              message: `Custom range #${idx + 1} Increment Value cannot exceed allowed limit.`,
            });
          } else if (incVal <= 0) {
            errors.push({
              field: 'customDateRanges',
              message: `Custom range #${idx + 1} Increment Value must be greater than 0.`,
            });
          }
        }
      }
    });
  }

  return errors;
};
