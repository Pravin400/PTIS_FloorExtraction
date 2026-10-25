import { ApiFloorMasterItem } from '@/types/asset/municipal-Asset/asset-detail-api.types';
import { FloorSubmission, ShopUnit } from '@/types/asset/municipal-Asset/asset-detail.types';
import { formatIndianNumber, formatNumericDate } from '@/lib/utils/format';

/**
 * Truncates a number to strictly 2 decimal places without rounding up.
 * For example: 120.9998 becomes 120.99
 */
function truncateArea(value: number | string | null | undefined): number {
  const num = Number(value);
  if (isNaN(num) || num === 0) return 0;
  return Math.floor(num * 100) / 100;
}

/**
 * Maps raw API floor items to the FloorSubmission model used by the UI.
 */
export const mapFloorDetailsToUI = (apiFloors: ApiFloorMasterItem[]): FloorSubmission[] => {
  if (!apiFloors || !Array.isArray(apiFloors)) return [];

  return apiFloors.map((floor, index) => {
    const names = floor.names as Record<string, unknown> | undefined;

    // Identifiers
    const floorNameStr = String(
      names?.floorName || names?.FloorName || floor.floorName || floor.FloorName || '-'
    );
    const subFloorNameStr = String(names?.subFloorName || names?.SubFloorName || floor.subFloorName || floor.SubFloorName || '-');
    const areaTypeStr = String(floor.areaType || floor.AreaType || '-');

    // Usage & Construction
    const conTypeName =
      names?.constructionTypeName ||
      names?.ConstructionTypeName ||
      floor.constructionTypeName ||
      floor.ConstructionTypeName ||
      '-';

    const touName =
      names?.typeOfUseName ||
      names?.TypeOfUseName ||
      floor.typeOfUseName ||
      floor.TypeOfUseName ||
      '-';

    const stouName =
      names?.subTypeOfUseName ||
      names?.SubTypeOfUseName ||
      floor.subTypeOfUseName ||
      floor.SubTypeOfUseName ||
      '-';

    const isRented =
      floor.isRented === true ||
      floor.IsRented === true ||
      String(floor.isRented ?? floor.IsRented).toLowerCase() === 'true';

    const conYrStr = String(floor.constructionYear || floor.ConstructionYear || '-');
    const asstYrStr = String(floor.assessmentYear || floor.AssessmentYear || '-');
    const noOfRooms = Number(floor.noOfRooms || floor.NoOfRooms) || 0;

    // Area calculations
    const carpetSqM = Number(floor.carpetAreaSqMeter || floor.CarpetAreaSqMeter || floor.carpetArea) || 0;
    const builtUpSqM = Number(floor.builtUpAreaSqMeter || floor.BuiltUpAreaSqMeter || floor.builtUpArea) || 0;

    const carpetAreaStr = carpetSqM > 0 ? `${formatIndianNumber(truncateArea(carpetSqM), 2, 2)}` : '-';
    const builtUpAreaStr = builtUpSqM > 0 ? `${formatIndianNumber(truncateArea(builtUpSqM), 2, 2)}` : '-';

    // Valuation Data
    const sdrrVal = Number.isFinite(Number(floor.cvBaseRate ?? floor.CVBaseRate)) ? formatIndianNumber(Number(floor.cvBaseRate ?? floor.CVBaseRate)) : '-';
    const baseVal = formatIndianNumber(Number(floor.baseValue || floor.BaseValue) || 0);
    const floorFactorStr = String(floor.cvFloorFactor || floor.CVFloorFactor || '-');
    const ageFactorStr = String(floor.cvAgeFactor || floor.CVAgeFactor || '-');
    const ntbFactorStr = String(floor.cvNatureFactor || floor.CVNatureFactor || '-');
    const useFactorStr = String(floor.cvUseFactor || floor.CVUseFactor || '-');
    const capitalVal = formatIndianNumber(Number(floor.capitalValue || floor.CapitalValue) || 0);

    return {
      srNo: index + 1,
      areaType: areaTypeStr,
      floor: floorNameStr,
      subFloor: subFloorNameStr,
      conYr: conYrStr,
      asstYr: asstYrStr,
      conType: String(conTypeName || '-'),
      typeOfUse: String(touName || '-'),
      subTypeOfUse: String(stouName || '-'),
      renter: isRented ? 'YES' : 'NO',
      rooms: noOfRooms,
      carpetArea: carpetAreaStr,
      builtupArea: builtUpAreaStr,
      sdrr: sdrrVal,
      baseValue: baseVal,
      floorFactor: floorFactorStr,
      ageFactor: ageFactorStr,
      ntbFactor: ntbFactorStr,
      useFactor: useFactorStr,
      capitalValue: capitalVal,
    };
  });
};

/**
 * Maps raw API sub-unit items to the ShopUnit model used by the UI.
 */
export const mapUnitDetailsToUI = (apiUnits: Record<string, unknown>[]): ShopUnit[] => {
  if (!apiUnits || !Array.isArray(apiUnits)) return [];

  return apiUnits.map((unit, index) => {
    // Type extraction
    const floorDetails = Array.isArray(unit.floorDetails)
      ? unit.floorDetails[0]
      : Array.isArray(unit.FloorDetails)
        ? unit.FloorDetails[0]
        : null;

    const leaseRentList =
      Array.isArray(unit.leaseRentDetails) && unit.leaseRentDetails.length > 0
        ? unit.leaseRentDetails
        : Array.isArray(unit.LeaseRentDetails) && unit.LeaseRentDetails.length > 0
          ? unit.LeaseRentDetails
          : [];

    const leaseData = leaseRentList.length > 0 ? leaseRentList[0] : null;

    // Area Details
    const floorAreaSqM = Number(unit.carpetAreaSqMeter || unit.CarpetAreaSqMeter || floorDetails?.carpetAreaSqMeter) || 0;

    // Tenant & Financials
    const tenantNameRaw = leaseData?.tenantName || leaseData?.TenantName;
    const monthlyRentRaw = Number(leaseData?.monthlyRent || leaseData?.MonthlyRent) || 0;
    const arrearsRaw = Number(unit.totalArrears || unit.TotalArrears || leaseData?.arrears || leaseData?.Arrears) || 0;
    const hasTenant = Boolean(tenantNameRaw && tenantNameRaw.trim() !== '' && tenantNameRaw !== '—') || monthlyRentRaw > 0;
    const isRented = unit.isRented === true || unit.IsRented === true || hasTenant;

    // Status & Usage
    const occupancyStatus = (unit.occupancyStatus || unit.OccupancyStatus || (isRented ? 'Occupied' : 'Vacant')) as 'Occupied' | 'Vacant';
    const usageName = unit.typeOfUseName || floorDetails?.typeOfUseName;

    // Expiry Logic
    const agreementEndRaw = leaseData?.toDate || leaseData?.ToDate || leaseData?.leaseEndDate || leaseData?.LeaseEndDate;
    let isAgreementExpired = false;

    if (agreementEndRaw) {
      const endDate = new Date(agreementEndRaw);
      if (!isNaN(endDate.getTime()) && endDate < new Date()) {
        isAgreementExpired = true;
      }
    }

    const formattedAgreementEnd = formatNumericDate(
      typeof agreementEndRaw === 'number'
        ? new Date(agreementEndRaw).toISOString()
        : typeof agreementEndRaw === 'string'
          ? agreementEndRaw
          : undefined
    );

    // UI strings
    const subAssetIdStr = (unit.id ?? unit.Id)?.toString() || '';
    const shopNoStr = String(unit.unitNo ?? unit.UnitNo ?? '-');
    const floorStr = String(floorDetails?.floorName || 'Ground');
    const usageStr = String(usageName || '-');
    const tenantNameStr = String(tenantNameRaw || '-');
    const contactNoStr = String(leaseData?.tenantMobile ?? leaseData?.TenantMobile ?? '-');
    const assetPhotoGuidStr = (leaseData?.assetPhotoGuid ?? leaseData?.AssetPhotoGuid) as string | undefined;

    return {
      subAssetId: subAssetIdStr,
      sNo: index + 1,
      shopNo: shopNoStr,
      floor: floorStr,
      floorArea: floorAreaSqM,
      usage: usageStr,
      tenantName: tenantNameStr,
      contactNo: contactNoStr,
      monthlyRent: monthlyRentRaw,
      arrears: arrearsRaw,
      occupancyStatus: occupancyStatus,
      agreementEnd: formattedAgreementEnd,
      isAgreementExpired: isAgreementExpired,
      assetPhotoGuid: assetPhotoGuidStr,
    };
  });
};
