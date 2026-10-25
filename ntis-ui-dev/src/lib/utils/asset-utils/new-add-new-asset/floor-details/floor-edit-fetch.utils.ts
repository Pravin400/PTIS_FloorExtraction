/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchFloorDetailByIdAction, fetchAssetLeaseRentDetailsAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import { mapSubUnitsToFloors } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';

/**
 * Normalise a raw AssetLeaseRentDetails row into the flat field shape that
 * buildEditFormState / floor-registration-utils expect on the floor object.
 *
 * Column names from the DB (as seen in SQL SSMS screenshot):
 *   TenantName, TenantMobile, TenantEmail, TenantType, TenantAadhaarNo,
 *   TenantPanCardNo, TenantAddress, GSTNo, TotalAmountDiff,
 *   ApplicationTypeId, LeaseType, LeaseStartDate, LeaseEndDate,
 *   Duration, DepositType, RentAmount, SecurityDeposit, AgreementNo …
 */
function normaliseLeaseRow(row: any): Record<string, any> {
  if (!row) return {};
  return {
    // identity
    tenantName:        row.tenantName        || row.TenantName        || row.renterName || '',
    renterName:        row.tenantName        || row.TenantName        || row.renterName || '',
    tenantRegionalName:row.tenantRegionalName|| row.TenantRegionalName|| row.renterNameLocal || row.RenterNameLocal || row.tenantNameLocal || row.TenantNameLocal || '',
    renterNameLocal:   row.renterNameLocal   || row.RenterNameLocal   || row.tenantRegionalName|| row.TenantRegionalName|| row.tenantNameLocal || row.TenantNameLocal || '',
    shopName:          row.shopName          || row.ShopName          || row.shopUnitName || row.ShopUnitName || '',
    shopRegionalName:  row.shopRegionalName  || row.ShopRegionalName  || row.shopUnitNameLocal || row.ShopUnitNameLocal || row.unitNameLocal || '',
    unitNameLocal:     row.shopRegionalName  || row.ShopRegionalName  || row.shopUnitNameLocal || row.ShopUnitNameLocal || row.unitNameLocal || '',
    mobileNo:          row.tenantMobile      || row.TenantMobile      || row.mobileNo   || '',
    emailId:           row.tenantEmail       || row.TenantEmail       || row.emailId    || '',
    tenantAadhaarNo:   row.tenantAadhaarNo   || row.TenantAadhaarNo  || '',
    aadhaar:           row.tenantAadhaarNo   || row.TenantAadhaarNo  || row.aadhaar    || '',
    tenantPanCardNo:   row.tenantPanCardNo   || row.TenantPanCardNo  || '',
    pan:               row.tenantPanCardNo   || row.TenantPanCardNo  || row.pan        || '',
    // agreement
    agreementNo:       row.agreementNo       || row.AgreementNo      || row.agreementId || '',
    agreementId:       row.agreementId       || row.AgreementId      || row.agreementNo || '',
    agreementDate:     row.agreementDate     || row.AgreementDate    || '',
    leaseType:         row.leaseType         || row.LeaseType        || '',
    rentType:          row.leaseType         || row.LeaseType        || row.rentType    || '',
    leaseStartDate:    row.leaseStartDate     || row.LeaseStartDate   || '',
    leaseEndDate:      row.leaseEndDate       || row.LeaseEndDate     || '',
    agreementFromDate: row.leaseStartDate     || row.LeaseStartDate   || row.agreementFromDate || '',
    agreementToDate:   row.leaseEndDate       || row.LeaseEndDate     || row.agreementToDate   || '',
    duration:          row.duration           || row.Duration         || '',
    // financials
    rentAmount:        row.rentAmount         || row.RentAmount       || row.monthlyRent || 0,
    monthlyRent:       row.rentAmount         || row.RentAmount       || row.monthlyRent || 0,
    rentYearly:        row.rentYearly         || row.RentYearly       || '',
    rentFreq:          row.paymentFrequency   || row.PaymentFrequency || row.incrementFrequency || row.IncrementFrequency || 'Monthly',
    securityDeposit:   row.securityDeposit    || row.SecurityDeposit  || 0,
    depositType:       row.depositType        || row.DepositType      || 'Refundable',
    // raw id (useful for update operations)
    id:                row.id                 || row.Id               || null,
    assetId:           row.assetId            || row.AssetId          || null,
    subUnitDetailsId:  row.subUnitDetailsId   || row.SubUnitDetailsId || null,
    tenantAddress:     row.tenantAddress       || row.TenantAddress    || '',
  };
}

/**
 * Fetch the full floor detail record from the database by floorDetailsId,
 * merge its room details in, and update the saved floors layout.
 * Also fetches Renter/Tenant details from AssetLeaseRentDetails by the
 * parentAssetId / subUnitId so all renter fields are pre-populated in the edit form.
 */
export async function fetchFullFloorDetailIfNeeded(
  f: any,
  _initialFloors: any[],
  dropdownOptions: any,
  setSavedFloors: React.Dispatch<React.SetStateAction<any[]>>,
  setIsLoading: (loading: boolean) => void
) {
  const subUnitId = f.subUnitsDetailsId ? Number(f.subUnitsDetailsId) : (f.id ? Number(f.id) : null);
  const parentAssetId = f.parentAssetId ? Number(f.parentAssetId) : (f.assetId && f.assetId !== f.id ? Number(f.assetId) : null);
  const floorDetailsId = f.floorDetailsId ? Number(f.floorDetailsId) : null;

  setIsLoading(true);
  try {
    // 1. Fetch floor details if a valid distinct floorDetailsId exists
    const shouldFetchFloor = floorDetailsId && floorDetailsId > 0 && floorDetailsId !== subUnitId;
    const floorPromise = shouldFetchFloor
      ? fetchFloorDetailByIdAction(floorDetailsId).catch(() => ({ success: false, data: null as any }))
      : Promise.resolve({ success: false, data: null as any });

    // 2. Fetch lease/rent details from DB
    // Query parentAssetId and subUnitId to ensure we never miss lease records
    const leasePromises: Promise<any>[] = [];
    if (parentAssetId && parentAssetId > 0) {
      leasePromises.push(fetchAssetLeaseRentDetailsAction(parentAssetId));
    }
    if (subUnitId && subUnitId > 0 && subUnitId !== parentAssetId) {
      leasePromises.push(fetchAssetLeaseRentDetailsAction(subUnitId));
    }

    const [floorRes, ...leaseResults] = await Promise.all([
      floorPromise,
      ...leasePromises,
    ]);

    // Aggregate lease rows
    const allLeaseRows: any[] = [];
    for (const lRes of leaseResults) {
      if (lRes?.success && Array.isArray(lRes.data)) {
        allLeaseRows.push(...lRes.data);
      }
    }

    // Filter lease rows matching this specific floor / sub-unit
    let matchedLeaseRows = allLeaseRows.filter((l: any) => {
      const lSubUnitId = Number(l.subUnitDetailsId ?? l.SubUnitDetailsId ?? 0);
      const lFloorId = Number(l.floorDetailsId ?? l.FloorDetailsId ?? 0);
      const lAssetId = Number(l.assetId ?? l.AssetId ?? 0);
      if (subUnitId && (lSubUnitId === subUnitId || lFloorId === subUnitId || lAssetId === subUnitId)) {
        return true;
      }
      return false;
    });

    // Fallback: if only 1 lease row exists for this asset, associate it
    if (matchedLeaseRows.length === 0 && allLeaseRows.length === 1) {
      matchedLeaseRows = allLeaseRows;
    }

    // Fallback: if no rows from DB fetch, use renterDetails already present on f
    const existingRenterDetails =
      Array.isArray(f.renterDetails) && f.renterDetails.length > 0
        ? f.renterDetails
        : Array.isArray((f as any).renterDetailsList) && (f as any).renterDetailsList.length > 0
        ? (f as any).renterDetailsList
        : [];

    const finalLeaseRows = matchedLeaseRows.length > 0 ? matchedLeaseRows : existingRenterDetails;
    const normalisedLease = finalLeaseRows.length > 0 ? normaliseLeaseRow(finalLeaseRows[0]) : null;

    let baseDetailed = { ...f };

    if (floorRes.success && floorRes.data) {
      const roomDetailsList = floorRes.data.roomDetails || [];
      const mappedArray = mapSubUnitsToFloors(roomDetailsList, [floorRes.data], dropdownOptions);
      if (mappedArray && mappedArray.length > 0) {
        baseDetailed = {
          ...f,
          ...mappedArray[0],
          typeOfUseId: f.typeOfUseId ?? floorRes.data.typeOfUseId ?? mappedArray[0]?.typeOfUseId ?? null,
          subTypeOfUseId: f.subTypeOfUseId ?? floorRes.data.subTypeOfUseId ?? mappedArray[0]?.subTypeOfUseId ?? null,
          constructionTypeId: f.constructionTypeId ?? floorRes.data.constructionTypeId ?? mappedArray[0]?.constructionTypeId ?? null,
          constructionYear: f.constructionYear || floorRes.data.constructionYear || mappedArray[0]?.constructionYear || '',
          assessmentYear: f.assessmentYear || floorRes.data.assessmentYear || mappedArray[0]?.assessmentYear || '',
          floorId: f.floorId ?? floorRes.data.floorId ?? mappedArray[0]?.floorId ?? null,
          subFloorId: f.subFloorId ?? floorRes.data.subFloorId ?? mappedArray[0]?.subFloorId ?? null,
        };
      }
    }

    // Merge Renter / Tenant Details
    const hasRenter = !!(
      baseDetailed.isRented ||
      baseDetailed.isRenter ||
      finalLeaseRows.length > 0 ||
      normalisedLease?.tenantName ||
      baseDetailed.renterNameEnglish ||
      baseDetailed.renterName
    );

    const detailedF = {
      ...baseDetailed,
      isRented: hasRenter,
      renterDetails: finalLeaseRows.length > 0 ? finalLeaseRows : baseDetailed.renterDetails || [],
      renterNameEnglish:
        baseDetailed.renterNameEnglish ||
        normalisedLease?.tenantName ||
        normalisedLease?.renterName ||
        baseDetailed.renterName ||
        '',
      renterNameLocal:
        baseDetailed.renterNameLocal ||
        normalisedLease?.renterNameLocal ||
        normalisedLease?.tenantRegionalName ||
        '',
      agreementId:
        baseDetailed.agreementId ||
        normalisedLease?.agreementId ||
        normalisedLease?.agreementNo ||
        '',
      agreementNo:
        baseDetailed.agreementNo ||
        normalisedLease?.agreementNo ||
        normalisedLease?.agreementId ||
        '',
      agreementDate:
        baseDetailed.agreementDate ||
        normalisedLease?.agreementDate ||
        '',
      agreementFromDate:
        baseDetailed.agreementFromDate ||
        normalisedLease?.agreementFromDate ||
        normalisedLease?.leaseStartDate ||
        '',
      agreementToDate:
        baseDetailed.agreementToDate ||
        normalisedLease?.agreementToDate ||
        normalisedLease?.leaseEndDate ||
        '',
      rentMonthly:
        baseDetailed.rentMonthly !== undefined && baseDetailed.rentMonthly !== null && baseDetailed.rentMonthly !== ''
          ? baseDetailed.rentMonthly
          : normalisedLease?.rentAmount !== undefined && normalisedLease?.rentAmount !== null
            ? normalisedLease.rentAmount
            : '',
      rentYearly:
        baseDetailed.rentYearly !== undefined && baseDetailed.rentYearly !== null && baseDetailed.rentYearly !== ''
          ? baseDetailed.rentYearly
          : normalisedLease?.rentYearly !== undefined && normalisedLease?.rentYearly !== null
            ? normalisedLease.rentYearly
            : '',
      rentType:
        baseDetailed.rentType ||
        normalisedLease?.rentType ||
        normalisedLease?.leaseType ||
        '',
      duration:
        baseDetailed.duration ||
        normalisedLease?.duration ||
        '',
      rentFreq:
        baseDetailed.rentFreq ||
        normalisedLease?.rentFreq ||
        'Monthly',
      securityDeposit:
        baseDetailed.securityDeposit !== undefined && baseDetailed.securityDeposit !== null && baseDetailed.securityDeposit !== ''
          ? baseDetailed.securityDeposit
          : normalisedLease?.securityDeposit !== undefined && normalisedLease?.securityDeposit !== null
            ? normalisedLease.securityDeposit
            : '',
      depositType:
        baseDetailed.depositType ||
        normalisedLease?.depositType ||
        'Refundable',
      mobileNo:
        baseDetailed.mobileNo ||
        normalisedLease?.mobileNo ||
        '',
      emailId:
        baseDetailed.emailId ||
        normalisedLease?.emailId ||
        '',
      aadhaar:
        baseDetailed.aadhaar ||
        normalisedLease?.aadhaar ||
        '',
      pan:
        baseDetailed.pan ||
        normalisedLease?.pan ||
        '',
      tenantAddress:
        baseDetailed.tenantAddress ||
        normalisedLease?.tenantAddress ||
        '',
    };

    setSavedFloors((prev: any[]) => prev.map((row) => (row.id === f.id ? detailedF : row)));
    return detailedF;
  } catch (err: any) {
    console.error('Failed to load floor details:', err);
    return f;
  } finally {
    setIsLoading(false);
  }
}
