/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveAmsTypeOfUseId } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';

const formatDateForInput = (dateStr: any) => {
  if (!dateStr) return '';
  try {
    // If it's already YYYY-MM-DD, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
};

export function buildEditFormState(
  f: any,
  isOS: boolean,
  roomsFromDb: any[],
  spacesFromDb: any[],
  _amenitiesFromDb: any[],
  dropdownOptions: any
) {
  const rent = Array.isArray(f.renterDetails) && f.renterDetails.length > 0
    ? f.renterDetails[0]
    : f.renterDetails || null;

  console.log("[buildEditFormState] detailedF/f object passed:", f);
  console.log("[buildEditFormState] extracted rent object:", rent);

  const rawTypeOfUseId = f.typeOfUseId ?? f.useType ?? f.TypeOfUseId ?? null;
  const rawSubTypeOfUseId = f.subTypeOfUseId ?? f.subUseType ?? f.SubTypeOfUseId ?? null;
  const rawConTypeId = f.constructionTypeId ?? f.conType ?? f.ConstructionTypeId ?? null;

  return {
    isTaxable: true,
    submissionType: isOS ? 'Open Space' : 'Construction',
    floor: String(f.floorId || f.FloorId || ''),
    subFloor: String(f.subFloorId || f.SubFloorId || ''),
    conYear: String(f.constructionYear || f.conYear || f.ConstructionYear || ''),
    asstYear: String(f.assessmentYear || f.asstYear || f.AssessmentYear || ''),
    conType: String(rawConTypeId || ''),
    useType: String(
      resolveAmsTypeOfUseId(rawTypeOfUseId, dropdownOptions?.useTypes || []) || rawTypeOfUseId || ''
    ),
    subUseType: String(rawSubTypeOfUseId || ''),
    isRenter: !!(f.isRented || f.IsRented || rent || f.renterNameEnglish || f.renterName || rent?.tenantName || rent?.TenantName),
    rooms: Number(
      roomsFromDb.reduce((acc: number, r: any) => acc + (r.noOfRooms || r.count || 1), 0)
    ),
    openSpaces: Number(
      spacesFromDb.reduce((acc: number, os: any) => acc + (os.noOfRooms || os.count || 1), 0)
    ),
    carpetAreaSqFt: Number(f.carpetAreaSqFeet || f.carpetAreaSqFt || f.CarpetAreaSqFeet || f.totalAreaSqFt || 0),
    builtUpAreaSqFt: isOS
      ? 0
      : Number(
          f.builtupAreaSqFeet ??
          f.builtUpAreaSqFeet ??
          f.builtUpAreaSqFt ??
          f.BuiltupAreaSqFeet ??
          f.BuiltUpAreaSqFeet ??
          ((Number(f.carpetAreaSqFeet || f.carpetAreaSqFt || f.CarpetAreaSqFeet || f.totalAreaSqFt || 0)) * 1.2).toFixed(2)
        ),
    builtUpAreaSqM: isOS
      ? 0
      : Number(
          (
            Number(
              f.builtupAreaSqFeet ??
              f.builtUpAreaSqFeet ??
              f.builtUpAreaSqFt ??
              f.BuiltupAreaSqFeet ??
              f.BuiltUpAreaSqFeet ??
              ((Number(f.carpetAreaSqFeet || f.carpetAreaSqFt || f.CarpetAreaSqFeet || f.totalAreaSqFt || 0)) * 1.2).toFixed(2)
            ) / 10.7639
          ).toFixed(2)
        ),
    renterNameEnglish: f.renterNameEnglish || rent?.tenantName || rent?.TenantName || rent?.renterName || '',
    renterNameLocal: f.renterNameLocal || rent?.renterNameLocal || rent?.tenantRegionalName || rent?.tenantNameLocal || rent?.TenantRegionalName || '',
    agreementId: f.agreementId || rent?.agreementId || rent?.AgreementId || rent?.agreementNo || rent?.AgreementNo || '',
    agreementNo: f.agreementNo || rent?.agreementNo || rent?.AgreementNo || rent?.agreementId || rent?.AgreementId || '',
    agreementDate: formatDateForInput(f.agreementDate || rent?.agreementDate || rent?.AgreementDate || ''),
    agreementFromDate: formatDateForInput(f.agreementFromDate || rent?.leaseStartDate || rent?.LeaseStartDate || rent?.fromDate || ''),
    agreementToDate: formatDateForInput(f.agreementToDate || rent?.leaseEndDate || rent?.LeaseEndDate || rent?.toDate || ''),
    rentMonthly:
      f.rentMonthly !== undefined && f.rentMonthly !== null && f.rentMonthly !== ''
        ? String(f.rentMonthly)
        : rent?.rentAmount !== undefined && rent?.rentAmount !== null
          ? String(rent.rentAmount)
          : rent?.RentAmount !== undefined && rent?.RentAmount !== null
            ? String(rent.RentAmount)
            : rent?.monthlyRent !== undefined && rent?.monthlyRent !== null
              ? String(rent.monthlyRent)
              : '',
    rentYearly:
      f.rentYearly !== undefined && f.rentYearly !== null && f.rentYearly !== ''
        ? String(f.rentYearly)
        : rent?.rentYearly !== undefined && rent?.rentYearly !== null
          ? String(rent.rentYearly)
          : '',
    taxLiability: f.taxLiability || rent?.taxLiability || '',
    rentType: f.rentType || rent?.leaseType || rent?.LeaseType || rent?.rentType || rent?.incrementType || rent?.IncrementType || '',
    duration: f.duration || rent?.duration || rent?.Duration || '',
    rentFreq: f.rentFreq || rent?.paymentFrequency || rent?.PaymentFrequency || rent?.incrementFrequency || rent?.IncrementFrequency || 'Monthly',
    securityDeposit:
      f.securityDeposit !== undefined && f.securityDeposit !== null && f.securityDeposit !== ''
        ? String(f.securityDeposit)
        : rent?.securityDeposit !== undefined && rent?.securityDeposit !== null
          ? String(rent.securityDeposit)
          : rent?.SecurityDeposit !== undefined && rent?.SecurityDeposit !== null
            ? String(rent.SecurityDeposit)
            : '',
    depositType: f.depositType || rent?.depositType || rent?.DepositType || 'Refundable',
    mobileNo: f.mobileNo || rent?.tenantMobile || rent?.TenantMobile || rent?.mobileNo || '',
    emailId: f.emailId || rent?.tenantEmail || rent?.TenantEmail || rent?.emailId || '',
    aadhaar: f.aadhaar || rent?.tenantAadhaarNo || rent?.TenantAadhaarNo || rent?.aadhaar || '',
    pan: f.pan || rent?.tenantPanCardNo || rent?.TenantPanCardNo || rent?.pan || '',
    tenantAddress: f.tenantAddress || rent?.tenantAddress || rent?.TenantAddress || '',
  };
}
