/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FloorSubmissionPayload } from '@/types/floor-details.types';

const TEMP_ID_THRESHOLD = 1_000_000_000_000;

type AuditField = { createdBy: number } | { updatedBy: number };

const toIsoOrNull = (value: any): string | null => {
  if (value === undefined || value === null || value === '') return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
};

const sanitizeRenterDetailRow = (
  rd: Record<string, unknown>,
  parentPropertyDetailsId: number,
  auditField: AuditField
) => {
  const realId = Number(rd.id) > 0 && Number(rd.id) < TEMP_ID_THRESHOLD ? Number(rd.id) : 0;
  const customFromDate = toIsoOrNull(rd.customFromDate);
  const customToDate = toIsoOrNull(rd.customToDate);
  const hasCustomIncrementValue =
    rd.customIncrementValue !== undefined &&
    rd.customIncrementValue !== null &&
    rd.customIncrementValue !== '';
  return {
    isActive: rd.isActive !== false,
    ...auditField,
    propertyDetailsId: parentPropertyDetailsId,
    ...(realId > 0 ? { id: realId, renterDetailsId: realId } : {}),
    agreementId: String(rd.agreementId || ''),
    incrementFrequency: String(rd.incrementFrequency || 'Yearly'),
    incrementType: String(rd.incrementType || 'Percentage'),
    incrementValue: Number(rd.incrementValue) || 0,
    incrementMethod: String(rd.incrementMethod || 'base'),
    durationFrom: toIsoOrNull(rd.durationFrom),
    durationTo: toIsoOrNull(rd.durationTo),
    rentAmount: Number(rd.rentAmount) || 0,
    rentMonthly: Number(rd.rentMonthly) || 0,
    increment: Number(rd.increament ?? rd.increment) || 0,
    incrementStatus: Boolean(rd.incrementStatus ?? true),
    // Pass through custom-range markers so the backend stores them and
    // the UI can reconstruct `customDateRanges` on reload. Only emit
    // the keys when actually populated to avoid clobbering existing
    // rows that aren't custom ranges with NULLs.
    ...(customFromDate ? { customFromDate } : {}),
    ...(customToDate ? { customToDate } : {}),
    ...(rd.customIncrementType ? { customIncrementType: String(rd.customIncrementType) } : {}),
    ...(hasCustomIncrementValue
      ? { customIncrementValue: Number(rd.customIncrementValue) || 0 }
      : {}),
    ...(rd.customMethod ? { customMethod: String(rd.customMethod) } : {}),
  };
};

const sanitizeRenterMastRow = (
  rm: Record<string, unknown>,
  payload: FloorSubmissionPayload | Record<string, unknown>,
  parentPropertyDetailsId: number,
  auditField: AuditField
) => {
  const rentMonthlyVal = Number(
    rm.rentMonthly || (rm.finalRent ? Number(rm.finalRent) / 12 : 0) || 0
  );
  const finalYearlyRentVal = Number(rm.finalYearlyRent || rm.finalRent || rentMonthlyVal * 12 || 0);
  const declaredBaseRent = Number(payload.nonCalculateRentMonthly || 0);
  const realId = Number(rm.id) > 0 && Number(rm.id) < TEMP_ID_THRESHOLD ? Number(rm.id) : 0;
  return {
    isActive: rm.isActive !== false,
    ...auditField,
    propertyDetailsId: parentPropertyDetailsId,
    ...(realId > 0 ? { id: realId, renterMastId: realId } : {}),
    rentMonthly: rentMonthlyVal,
    finalRent: Number(rm.finalRent || finalYearlyRentVal || 0),
    finalYearlyRent: finalYearlyRentVal,
    financialYear: String(rm.financialYear || '').substring(0, 4),
    durationFrom: toIsoOrNull(rm.durationFrom) ?? toIsoOrNull(payload.agreementFromDate),
    durationTo: toIsoOrNull(rm.durationTo) ?? toIsoOrNull(payload.agreementToDate),
    taxLiability: String(payload.taxLiability || 'Taxable'),
    nonCalculateRentMonthly: Number(rm.nonCalculateRentMonthly || declaredBaseRent || 0),
    renterNameEnglish: String(payload.renterNameEnglish || payload.renterName || ''),
    renterName: String(payload.renterName || payload.renterNameEnglish || ''),
    agreementDate: toIsoOrNull(payload.agreementDate),
    agreementFromDate: toIsoOrNull(payload.agreementFromDate),
    agreementToDate: toIsoOrNull(payload.agreementToDate),
    documentBindingId: rm.documentBindingId ? Number(rm.documentBindingId) : (payload.documentBindingId ? Number(payload.documentBindingId) : null),
  };
};

export function sanitizeRenterDetailsForCreate(
  payload: FloorSubmissionPayload,
  parentPropertyDetailsId: number
): Record<string, unknown>[] {
  return ((payload.renterDetails as Record<string, unknown>[]) || []).map((rd) =>
    sanitizeRenterDetailRow(rd, parentPropertyDetailsId, { createdBy: payload.createdBy ?? 0 })
  );
}

export function sanitizeRenterDetailsForUpdate(
  payload: FloorSubmissionPayload,
  parentPropertyDetailsId: number
): Record<string, unknown>[] {
  return ((payload.renterDetails as Record<string, unknown>[]) || []).map((rd) =>
    sanitizeRenterDetailRow(rd, parentPropertyDetailsId, { updatedBy: payload.updatedBy ?? 0 })
  );
}

export function sanitizeRenterMastForCreate(
  payload: FloorSubmissionPayload,
  parentPropertyDetailsId: number
): Record<string, unknown>[] {
  return ((payload.renterMast as Record<string, unknown>[]) || []).map((rm) =>
    sanitizeRenterMastRow(rm, payload, parentPropertyDetailsId, { createdBy: payload.createdBy ?? 0 })
  );
}

export function sanitizeRenterMastForUpdate(
  payload: FloorSubmissionPayload,
  parentPropertyDetailsId: number
): Record<string, unknown>[] {
  return ((payload.renterMast as Record<string, unknown>[]) || []).map((rm) =>
    sanitizeRenterMastRow(rm, payload, parentPropertyDetailsId, { updatedBy: payload.updatedBy ?? 0 })
  );
}

/**
 * Sanitize renter detail / mast rows for the standalone renter save path.
 */
export function sanitizeRenterRowsFromData(
  data: Record<string, unknown>,
  parentPropertyDetailsId: number,
  isUpdate: boolean
): {
  renterDetails: Record<string, unknown>[];
  renterMast: Record<string, unknown>[];
  renters: Record<string, unknown>[];
} {
  const auditField: AuditField = isUpdate
    ? { updatedBy: Number(data.updatedBy ?? 0) }
    : { createdBy: Number(data.createdBy ?? 0) };
  const renterDetails = ((data.renterDetails as Record<string, unknown>[]) || []).map((rd) =>
    sanitizeRenterDetailRow(rd, parentPropertyDetailsId, auditField)
  );
  const renterMast = ((data.renterMast as Record<string, unknown>[]) || []).map((rm) =>
    sanitizeRenterMastRow(rm, data, parentPropertyDetailsId, auditField)
  );
  return {
    renterDetails,
    renterMast,
    renters: renterMast,
  };
}
