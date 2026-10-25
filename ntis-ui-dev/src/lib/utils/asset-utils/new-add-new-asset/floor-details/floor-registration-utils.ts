/* eslint-disable @typescript-eslint/no-explicit-any */
export { calculateArea } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-area.utils';
export {
  typeBadge,
  resolveAmsTypeOfUseId,
  resolveOpenSpaceFloorId,
  getTypeOfUseLabel,
  getLocalizedFloorError,
} from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-labels.utils';
export { blankFloorFormState, blankFloorFormStateAfterSave } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-form-state.utils';

import { extractRawRoomDetails, mapRoomWiseDetails } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-room-mapper.utils';
import { resolveUnitType } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-unit-type.utils';

function resolveFloorDetailMatch(u: any, floors: any[]) {
  const rawFloorDetailsId = u.floorDetailsId ?? u.FloorDetailsId ?? null;
  let floorDetail = floors.find((f: any) => Number(f.id) === Number(rawFloorDetailsId));

  const resolvedFloorId =
    u.floorId ?? u.FloorId ?? floorDetail?.floorId ?? floorDetail?.FloorId ?? null;
  const resolvedSubFloorId =
    u.subFloorId ?? u.SubFloorId ?? floorDetail?.subFloorId ?? floorDetail?.SubFloorId ?? null;

  if (!floorDetail && resolvedFloorId !== null) {
    floorDetail = floors.find(
      (f: any) =>
        Number(f.floorId) === Number(resolvedFloorId) &&
        (f.subFloorId ? Number(f.subFloorId) : null) ===
        (resolvedSubFloorId ? Number(resolvedSubFloorId) : null)
    );
  }

  const floorDetailsId = rawFloorDetailsId ?? (floorDetail?.id ? Number(floorDetail.id) : null);

  return { floorDetailsId, floorDetail, resolvedFloorId, resolvedSubFloorId };
}

function computeCarpetAndBuiltUpArea(u: any, mappedRooms: any[], floorDetail?: any) {
  let carpetSqFt = 0;
  if (mappedRooms && mappedRooms.length > 0) {
    const calculated = mappedRooms.reduce((acc: number, r: any) => {
      const netAreaSqFt =
        r.netAreaSqFt !== undefined
          ? Number(r.netAreaSqFt)
          : r.netAreaSqM !== undefined
            ? Number(r.netAreaSqM) * 10.7639
            : Number(r.areaSqFt || r.area || 0);
      const roomSqFt = netAreaSqFt * Number(r.count || 1);
      if (
        r.submissionType?.includes('Open Space') ||
        r.roomType === 'Open Space' ||
        r.submissionType?.includes('Amenity') ||
        r.roomType === 'Amenity'
      ) {
        return acc + roomSqFt;
      }
      if (r.minus === 'Yes' || r.offset === 'Yes') return acc - roomSqFt;
      if (r.outer === 'Yes') return acc + roomSqFt * 0.8;
      return acc + roomSqFt;
    }, 0);
    carpetSqFt = Math.round(calculated * 100) / 100;
  } else if (u.totalAreaSqFt || u.carpetAreaSqFeet || u.carpetAreaSqFt) {
    carpetSqFt = Number(u.totalAreaSqFt || u.carpetAreaSqFeet || u.carpetAreaSqFt || 0);
  } else if (!u.unitType && !u.subUnitType && !u.shopUnitName && !u.unitNo && (u.id === floorDetail?.id || !u.id)) {
    carpetSqFt = Number(floorDetail?.carpetAreaSqFeet || floorDetail?.carpetAreaSqFt || floorDetail?.totalAreaSqFt || 0);
  }

  const builtUpSqFt = carpetSqFt > 0
    ? (Number(u.builtUpAreaSqFeet || u.builtupAreaSqFeet) || (carpetSqFt * 1.2))
    : 0;

  return { carpetSqFt, builtUpSqFt };
}

export function mapSubUnitsToFloors(subUnits: any[], floors: any[], dropdownOptions: any) {
  if (subUnits && subUnits.length > 0) {
    console.log('=== RAW SUBUNITS DATA FROM DATABASE ===', subUnits);
  }
  return (subUnits || []).map((u: any) => {
    const { floorDetailsId, floorDetail, resolvedFloorId, resolvedSubFloorId } =
      resolveFloorDetailMatch(u, floors);

    const constructionYear =
      u.constructionYear || u.conYear || floorDetail?.constructionYear || '';
    const assessmentYear = u.assessmentYear || u.asstYear || floorDetail?.assessmentYear || '';
    const constructionTypeId =
      u.constructionTypeId || Number(u.conType) || floorDetail?.constructionTypeId || null;
    const typeOfUseId = u.typeOfUseId || Number(u.useType) || floorDetail?.typeOfUseId || null;
    const subTypeOfUseId =
      u.subTypeOfUseId || Number(u.subUseType) || floorDetail?.subTypeOfUseId || null;

    const mappedRooms = mapRoomWiseDetails(extractRawRoomDetails(u));

    const roomsCount = mappedRooms.length > 0
      ? mappedRooms
          .filter(
            (r: any) =>
              !(
                r.submissionType?.includes('Open Space') ||
                r.roomType === 'Open Space' ||
                r.submissionType?.includes('Amenity') ||
                r.roomType === 'Amenity'
              )
          )
          .reduce((acc: number, r: any) => acc + (r.count || 1), 0)
      : Number(u.noOfRooms ?? u.NoOfRooms ?? 0);

    const { carpetSqFt, builtUpSqFt } = computeCarpetAndBuiltUpArea(u, mappedRooms, floorDetail);

    const rent = Array.isArray(u.renterDetails)
      ? u.renterDetails[0]
      : (u.renterDetailsList && u.renterDetailsList[0]) || u.renterDetails;

    const isRented =
      u.isRented !== undefined ? !!u.isRented : u.isRenter !== undefined ? !!u.isRenter : !!rent;
    const renterName =
      u.renterName || rent?.renterName || rent?.tenantName || u.renterNameEnglish || '';

    const resolvedSubUseName =
      u.subTypeOfUseName ||
      floorDetail?.subTypeOfUseName ||
      dropdownOptions?.subUseTypes?.find((o: any) => String(o.value) === String(subTypeOfUseId))
        ?.label ||
      '';

    const deptId = u.departmentId || u.DepartmentId || null;
    const deptName = deptId
      ? dropdownOptions?.departments?.find((d: any) => String(d.value) === String(deptId))
        ?.label ||
      u.departmentName ||
      u.DepartmentName ||
      ''
      : u.departmentName || u.DepartmentName || '';

    const unitType = resolveUnitType(u, mappedRooms);

    const isDirectFloor = u.isDirectFloorSubmission === true || u.IsDirectFloorSubmission === true;

    return {
      id: u.assetId || u.id,
      subUnitsDetailsId: u.subUnitsDetailsId ?? u.SubUnitsDetailsId ?? (u.isDirectFloorSubmission ? u.id : undefined),
      parentAssetId: u.parentAssetId || u.ParentAssetId || null,
      isDirectFloorSubmission: u.isDirectFloorSubmission || false,
      floorDetailsId,
      floorId: resolvedFloorId,
      subFloorId: resolvedSubFloorId,
      subFloorName: u.subFloorName || floorDetail?.subFloorName || '',
      unitNo: u.unitNo || '',
      propertyNo: u.propertyNo || u.PropertyNo || u.details?.propertyNo || '',
      partitionNo: u.partitionNo || u.PartitionNo || u.details?.partitionNo || '',
      mpmsNo: u.mpmsNo || u.MpmsNo || u.MPMSNo || u.details?.mpmsNo || u.details?.MpmsNo || u.details?.MPMSNo || '',
      shopUnitName: u.shopUnitName || u.assetName || u.name || '',
      shopUnitNameLocal:
        u.shopUnitNameLocal ||
        u.shopNameLocal ||
        u.assetLocalName ||
        u.assetNameLocal ||
        u.localName ||
        '',
      unitType,
      departmentId: deptId,
      departmentName: deptName,
      constructionYear,
      assessmentYear,
      constructionTypeId,
      typeOfUseId,
      useTypeName: u.typeOfUseName || floorDetail?.typeOfUseName || '',
      subTypeOfUseId,
      subTypeOfUseName:
        resolvedSubUseName || null,
      isRented,
      renterNameEnglish: renterName,
      renterNameLocal: u.renterNameLocal || rent?.renterNameLocal || rent?.tenantRegionalName || rent?.tenantNameLocal || rent?.TenantRegionalName || '',
      agreementId: rent?.agreementId || rent?.AgreementId || rent?.agreementNo || rent?.AgreementNo || u.agreementId || u.agreementNo || '',
      agreementNo: rent?.agreementNo || rent?.AgreementNo || rent?.agreementId || rent?.AgreementId || u.agreementNo || u.agreementId || '',
      agreementDate: rent?.agreementDate || u.agreementDate || '',
      agreementFromDate: rent?.agreementFromDate || rent?.fromDate || u.agreementFromDate || '',
      agreementToDate: rent?.agreementToDate || rent?.toDate || u.agreementToDate || '',
      rentMonthly: rent?.rentAmount || rent?.RentAmount || rent?.monthlyRent || u.rentMonthly || '',
      rentYearly: rent?.rentYearly || u.rentYearly || '',
      taxLiability: rent?.taxLiability || u.taxLiability || '',
      rentType: rent?.rentType || rent?.leaseType || rent?.LeaseType || rent?.incrementType || rent?.IncrementType || u.rentType || "",
      duration: rent?.duration || rent?.Duration || u.duration || "",
      rentFreq: rent?.rentFreq || rent?.paymentFrequency || rent?.PaymentFrequency || u.rentFreq || "Monthly",
      securityDeposit: rent?.securityDeposit || rent?.SecurityDeposit || u.securityDeposit || "",
      depositType: rent?.depositType || rent?.DepositType || u.depositType || "Refundable",
      mobileNo: rent?.mobileNo || rent?.tenantMobile || rent?.TenantMobile || u.mobileNo || "",
      emailId: rent?.emailId || rent?.tenantEmail || rent?.TenantEmail || u.emailId || "",
      aadhaar: rent?.aadhaar || rent?.tenantAadhaarNo || rent?.TenantAadhaarNo || u.aadhaar || "",
      pan: rent?.pan || rent?.tenantPanCardNo || rent?.TenantPanCardNo || u.pan || "",
      noOfRooms: roomsCount,
      carpetAreaSqFeet: carpetSqFt,
      builtUpAreaSqFeet: builtUpSqFt,
      // NOTE: ASP.NET Core camelCases first char only, so CVFloorFactor → cVFloorFactor in JSON.
      cvBaseRate: u.cVBaseRate ?? u.cvBaseRate ?? u.CVBaseRate ?? (isDirectFloor ? (floorDetail?.cVBaseRate ?? floorDetail?.cvBaseRate ?? floorDetail?.CVBaseRate ?? null) : null),
      baseValue: u.baseValue ?? u.BaseValue ?? (isDirectFloor ? (floorDetail?.baseValue ?? floorDetail?.BaseValue ?? null) : null),
      cvFloorFactor: u.cVFloorFactor ?? u.cvFloorFactor ?? u.CVFloorFactor ?? (isDirectFloor ? (floorDetail?.cVFloorFactor ?? floorDetail?.cvFloorFactor ?? floorDetail?.CVFloorFactor ?? null) : null),
      cvAgeFactor: u.cVAgeFactor ?? u.cvAgeFactor ?? u.CVAgeFactor ?? (isDirectFloor ? (floorDetail?.cVAgeFactor ?? floorDetail?.cvAgeFactor ?? floorDetail?.CVAgeFactor ?? null) : null),
      cvNatureFactor: u.cVNatureFactor ?? u.cvNatureFactor ?? u.CVNatureFactor ?? (isDirectFloor ? (floorDetail?.cVNatureFactor ?? floorDetail?.cvNatureFactor ?? floorDetail?.CVNatureFactor ?? null) : null),
      cvUseFactor: u.cVUseFactor ?? u.cvUseFactor ?? u.CVUseFactor ?? (isDirectFloor ? (floorDetail?.cVUseFactor ?? floorDetail?.cvUseFactor ?? floorDetail?.CVUseFactor ?? null) : null),
      capitalValue: u.capitalValue ?? u.CapitalValue ?? u.floorConfiguration?.calculatedCapitalValue ?? (isDirectFloor ? (floorDetail?.capitalValue ?? floorDetail?.CapitalValue ?? null) : null),
      cvCalculated: u.cvCalculated !== undefined ? u.cvCalculated : (u.isCalculated !== undefined ? u.isCalculated : true),
      cvCalculationMessage: u.cvCalculationMessage || u.calculationMessage || "",
      roomDetails: mappedRooms,
      rooms: mappedRooms,
      renterDetails:
        Array.isArray(u.renterDetails) && u.renterDetails.length > 0
          ? u.renterDetails
          : Array.isArray(u.renterDetailsList) && u.renterDetailsList.length > 0
          ? u.renterDetailsList
          : (rent ? [rent] : []),
    };
  });
}
