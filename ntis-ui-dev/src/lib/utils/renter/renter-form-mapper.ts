/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  normalizeCalculationMethod,
  resolveAgreementBaseMonthlyRent,
} from '@/lib/utils/renter/renterUtils';
import { RenterFormData, RenterFormDataDetails } from '@/types/renter/renter.types';

const formatDateToInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const TEMP_ID_THRESHOLD = 1_000_000_000_000;

const pickValidPropertyDetailsId = (...candidates: unknown[]): number | undefined => {
  for (const c of candidates) {
    if (c === undefined || c === null || c === '' || c === 'new') continue;
    const n = Number(c);
    if (!isNaN(n) && n > 0 && n < TEMP_ID_THRESHOLD) return n;
  }
  return undefined;
};

/** Merge cached session payloads so reopening the renter screen is instant. */
export function enrichRenterDetailsFromSession(
  details: Record<string, unknown>,
  floorId: string
): Record<string, unknown> {
  if (typeof window === 'undefined') return details;

  let merged = { ...details };
  try {
    const renterKey = floorId && floorId !== 'new' ? `renter_data_${floorId}` : 'renter_data_new';
    const renterSession =
      sessionStorage.getItem(renterKey) ??
      (floorId !== 'new' ? sessionStorage.getItem('renter_data_new') : null);

    if (renterSession) {
      merged = { ...merged, ...JSON.parse(renterSession) };
    } else if (!merged.floor && !merged.conYr) {
      const editing = sessionStorage.getItem('editingFloorForm');
      if (editing) merged = { ...JSON.parse(editing), ...merged };
    }
  } catch {
    // Ignore corrupt session payloads and fall back to server data.
  }
  return merged;
}

export function mapInitialRenterFormData(
  initialData: Record<string, any> | null | undefined,
  floorId: string,
  propertyId?: string | number
): RenterFormData {
  const details = initialData || {};

  const firstRenterDetail = Array.isArray(details.renterDetails) ? details.renterDetails[0] : null;
  const firstRenterMast =
    Array.isArray(details.renterMast) && details.renterMast.length > 0
      ? details.renterMast[0]
      : Array.isArray(details.renters) && details.renters.length > 0
        ? details.renters[0]
        : null;

  let customDateRanges: any[] = [];
  if (
    details.renterDetails &&
    !Array.isArray(details.renterDetails) &&
    details.renterDetails.customDateRanges
  ) {
    customDateRanges = (details.renterDetails.customDateRanges as any[]).map((r: any) => ({
      ...r,
      calculationMethod: normalizeCalculationMethod(r.calculationMethod),
      incrementValue: r.incrementValue ? Math.round(Number(r.incrementValue) * 100) / 100 : 0,
    }));
  } else if (details.customDateRanges && details.customDateRanges.length > 0) {
    customDateRanges = details.customDateRanges.map((r: any) => ({
      ...r,
      calculationMethod: normalizeCalculationMethod(r.calculationMethod),
      incrementValue: r.incrementValue ? Math.round(Number(r.incrementValue) * 100) / 100 : 0,
    }));
  } else if (
    firstRenterDetail?.incrementFrequency === 'Custom Date' &&
    Array.isArray(details.renterDetails)
  ) {
    const rows = details.renterDetails as any[];
    const markedRows = rows.filter(
      (item: any) => item && item.customFromDate !== null && item.customFromDate !== undefined
    );
    const sourceRows =
      markedRows.length > 0
        ? markedRows
        : rows.filter((item: any) => item && item.durationFrom && Number(item.incrementValue) > 0);

    customDateRanges = sourceRows.map((item: any) => {
      const rawIncrementValue = item.customIncrementValue ?? item.incrementValue;
      return {
        fromDate: formatDateToInput(item.customFromDate ?? item.durationFrom),
        toDate: formatDateToInput(item.customToDate ?? item.durationTo),
        incrementType: item.customIncrementType || item.incrementType || 'Percentage',
        incrementValue: rawIncrementValue ? Math.round(Number(rawIncrementValue) * 100) / 100 : 0,
        calculationMethod: normalizeCalculationMethod(item.customMethod ?? item.incrementMethod),
      };
    });
  }

  const isCompoundingVal =
    details.renterDetails &&
    !Array.isArray(details.renterDetails) &&
    details.renterDetails.isCompounding !== undefined
      ? Boolean(details.renterDetails.isCompounding)
      : firstRenterDetail?.incrementMethod === 'compounding';

  const rentMonthlyVal = resolveAgreementBaseMonthlyRent(details as Record<string, unknown>);
  const agreementRentVal =
    firstRenterDetail?.rentAmount ?? firstRenterDetail?.RentAmount ?? rentMonthlyVal;

  const getSelfDecAmount = () => {
    const val =
      details.nonCalculateRentMonthly ??
      details.NonCalculateRentMonthly ??
      firstRenterMast?.nonCalculateRentMonthly ??
      firstRenterMast?.NonCalculateRentMonthly;
    if (val === undefined || val === null) return '';
    const num = Number(val);
    return isNaN(num) || num === 0 ? '' : String(val);
  };
  const selfDeclarationAmountVal = getSelfDecAmount();

  const mappedRenterDetails: RenterFormDataDetails = {
    renterName:
      details.renterName ||
      details.renterNameEnglish ||
      firstRenterMast?.renterName ||
      firstRenterMast?.renterNameEnglish ||
      firstRenterDetail?.renterName ||
      firstRenterDetail?.renterNameEnglish ||
      '',
    agreementId: details.agreementId || firstRenterDetail?.agreementId || '',
    agreementDate: formatDateToInput(
      details.agreementDate || firstRenterMast?.agreementDate || firstRenterDetail?.agreementDate
    ),
    agreementDateFrom: formatDateToInput(
      details.agreementFromDate ||
        firstRenterMast?.agreementFromDate ||
        firstRenterMast?.durationFrom ||
        firstRenterDetail?.durationFrom ||
        firstRenterDetail?.agreementFromDate
    ),
    agreementDateTo: formatDateToInput(
      details.agreementToDate ||
        firstRenterMast?.agreementToDate ||
        firstRenterMast?.durationTo ||
        firstRenterDetail?.durationTo ||
        firstRenterDetail?.agreementToDate
    ),
    rentAmount: agreementRentVal,
    rentAmountAGR: agreementRentVal,
    rentAmountSUR: '',
    incrementFrequency: firstRenterDetail?.incrementFrequency || 'No Increment',
    incrementType: firstRenterDetail?.incrementType || 'Percentage',
    incrementValue: firstRenterDetail?.incrementValue
      ? Math.round(Number(firstRenterDetail.incrementValue) * 100) / 100
      : '',
    isCompounding: isCompoundingVal,
    selfDeclarationAmount: selfDeclarationAmountVal,
    customDateRanges,
    taxLiability: details.taxLiability || firstRenterMast?.taxLiability || firstRenterDetail?.taxLiability || 'Renter',
    documentBindingId:
      (details.documentBindingId ? Number(details.documentBindingId) : undefined) ||
      (details.renterDetails && typeof details.renterDetails === 'object' && !Array.isArray(details.renterDetails) && details.renterDetails.documentBindingId ? Number(details.renterDetails.documentBindingId) : undefined) ||
      (firstRenterMast?.documentBindingId ? Number(firstRenterMast.documentBindingId) : undefined) ||
      (firstRenterDetail?.documentBindingId ? Number(firstRenterDetail.documentBindingId) : undefined),
    documentGuid:
      details.documentGuid ||
      (details.renterDetails && typeof details.renterDetails === 'object' && !Array.isArray(details.renterDetails) && details.renterDetails.documentGuid) ||
      firstRenterMast?.documentGuid ||
      firstRenterDetail?.documentGuid ||
      undefined,
  };

  const dbFloorId = details.floorId !== undefined ? details.floorId : details.floorID;
  const safeFloorId =
    dbFloorId !== undefined && dbFloorId !== null && dbFloorId !== '' && dbFloorId !== 'new'
      ? dbFloorId
      : floorId;

  const resolvedPropertyDetailsId = pickValidPropertyDetailsId(
    floorId,
    details.propertyDetailsId,
    details.id
  );

  return {
    ...details,
    floorId: safeFloorId,
    ...(resolvedPropertyDetailsId !== undefined
      ? { id: resolvedPropertyDetailsId, propertyDetailsId: resolvedPropertyDetailsId }
      : {}),
    propertyId: Number(propertyId || details.ownerID || details.propertyId || 0) || undefined,
    renterDetails: mappedRenterDetails,
    documentBindingId: mappedRenterDetails.documentBindingId,
    documentGuid: mappedRenterDetails.documentGuid,
  };
}

export function floorNeedsLookupLabels(floor: Record<string, unknown> | null): boolean {
  if (!floor) return true;
  return !(
    (floor.floor || floor.floorDescription) &&
    (floor.conTyp || floor.constructionTypeDescription) &&
    (floor.use || floor.typeOfUseDescription) &&
    (floor.subTyp || floor.subTypeOfUseDescription)
  );
}
