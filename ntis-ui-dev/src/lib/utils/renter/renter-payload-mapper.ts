import { FloorData } from '@/types/room-details.types';
import { RenterDetailItem, RenterMastItem } from '@/types/renter/renter-details.types';

export interface RenterPayloadFields {
  renterYesNo: boolean;
  isRenter: boolean;
  renterDetails: RenterDetailItem[];
  renterMast: RenterMastItem[];
  renters: RenterMastItem[];
  renterName: string;
  renterNameEnglish: string;
  rentMonthly: number;
  rentYearly: number;
  agreementFromDate?: string;
  agreementToDate?: string;
  agreementDate?: string;
  nonCalculateRentMonthly: number;
  documentBindingId?: number;
  documentGuid?: string;
}

/**
 * Maps renter-specific fields from floor form data to submission payload format.
 */
export function mapRenterPayloadFields(formData: FloorData): RenterPayloadFields {
  const isRenter = formData.renter === 'Yes' || formData.renter === true;
  const docBindingId =
    formData.documentBindingId !== undefined && formData.documentBindingId !== null
      ? Number(formData.documentBindingId)
      : (formData.renterMast && formData.renterMast[0]?.documentBindingId !== undefined && formData.renterMast[0]?.documentBindingId !== null
        ? Number(formData.renterMast[0].documentBindingId)
        : undefined);
  const docGuid =
    formData.documentGuid ||
    (formData.renterMast && formData.renterMast[0]?.documentGuid ? String(formData.renterMast[0].documentGuid) : undefined);

  const mappedRenterMast: RenterMastItem[] =
    formData.renter === 'Yes' && Array.isArray(formData.renterMast)
      ? formData.renterMast.map((m) => ({
          ...m,
          ...(docBindingId !== undefined ? { documentBindingId: docBindingId } : {}),
          ...(docGuid !== undefined ? { documentGuid: docGuid } : {}),
        }))
      : [];

  return {
    renterYesNo: isRenter,
    isRenter: isRenter,
    renterDetails:
      formData.renter === 'Yes' && Array.isArray(formData.renterDetails)
        ? formData.renterDetails
        : [],
    renterMast: mappedRenterMast,
    renters: mappedRenterMast,
    renterName: isRenter ? String(formData.renterName || '') : '',
    renterNameEnglish: isRenter
      ? String(formData.renterNameEnglish || formData.renterName || '')
      : '',
    rentMonthly: isRenter
      ? Number(formData.rentMonthly || formData.renterMonthly || 0)
      : 0,
    rentYearly: isRenter
      ? Number(formData.rentMonthly || formData.renterMonthly || 0) * 12
      : 0,
    agreementFromDate:
      isRenter && formData.agreementFromDate
        ? String(formData.agreementFromDate)
        : undefined,
    agreementToDate:
      isRenter && formData.agreementToDate
        ? String(formData.agreementToDate)
        : undefined,
    agreementDate:
      isRenter && formData.agreementDate
        ? String(formData.agreementDate)
        : undefined,
    nonCalculateRentMonthly: isRenter
      ? Number(formData.nonCalculateRentMonthly || 0)
      : 0,
    documentBindingId: isRenter ? docBindingId : undefined,
    documentGuid: isRenter ? docGuid : undefined,
  };
}
