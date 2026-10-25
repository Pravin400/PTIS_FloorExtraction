/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PoolUnit } from '@/types/asset/floor-details.types';
import { resolvePoolUnitFloorContext } from './unit-pool-floor-context.utils';
import { resolvePoolUnitType } from './unit-pool-unit-type.utils';
import { mapPoolUnitRooms } from './unit-pool-room-mapper.utils';

function resolvePoolUnitDept(u: any, departments: any[]) {
  const deptId = u.departmentId ? Number(u.departmentId) : null;
  const deptName = deptId
    ? departments.find((d: any) => String(d.value) === String(deptId))?.label ||
    (u.departmentName && isNaN(Number(u.departmentName)) ? u.departmentName : '') ||
    ''
    : (u.departmentName && isNaN(Number(u.departmentName)) ? u.departmentName : '') || '';
  return { deptId, deptName };
}

function resolvePoolUnitRenter(u: any) {
  const rent = Array.isArray(u.renterDetails)
    ? u.renterDetails[0]
    : (u.renterDetailsList && u.renterDetailsList[0]) ||
      u.renterDetails ||
      (Array.isArray(u.leaseRentDetails) ? u.leaseRentDetails[0] : u.leaseRentDetails) ||
      (Array.isArray(u.LeaseRentDetails) ? u.LeaseRentDetails[0] : u.LeaseRentDetails);

  const rentType = rent?.leaseRentType || rent?.leaseType || '';
  const leaseStart = rent?.fromDate
    ? String(rent.fromDate).split('T')[0]
    : rent?.leaseStartDate
      ? String(rent.leaseStartDate).split('T')[0]
      : rent?.leaseStart
        ? String(rent.leaseStart).split('T')[0]
        : '';
  const leaseEnd = rent?.toDate
    ? String(rent.toDate).split('T')[0]
    : rent?.leaseEndDate
      ? String(rent.leaseEndDate).split('T')[0]
      : rent?.leaseEnd
        ? String(rent.leaseEnd).split('T')[0]
        : '';

  const renterData = rent
    ? {
      renterName: rent.renterName || rent.tenantName || rent.TenantName || '',
      renterNameLocal: rent.renterNameLocal || rent.RenterNameLocal || rent.tenantRegionalName || rent.TenantRegionalName || rent.tenantNameLocal || rent.TenantNameLocal || '',
      shopName: rent.shopName || rent.ShopName || rent.shopUnitName || '',
      shopRegionalName: rent.shopRegionalName || rent.ShopRegionalName || rent.shopUnitNameLocal || rent.ShopUnitNameLocal || rent.unitNameLocal || '',
      gstNo: rent.gstNo || '',
      aadhaar: rent.aadhaarCardNo || rent.tenantAadhaarNo || rent.aadhaar || '',
      pan: rent.panCardNo || rent.tenantPanCardNo || rent.pan || '',
      mobileNo: rent.mobileNo || rent.tenantMobile || '',
      emailId: rent.emailId || rent.tenantEmail || '',
      tenantAddress: rent.tenantAddress || rent.TenantAddress || rent.address || rent.Address || u.tenantAddress || u.TenantAddress || '',
      rentType,
      leaseStart,
      leaseEnd,
      duration: rent.duration || '',
      rentFreq: rent.rentFrequency || rent.paymentFrequency || rent.rentFreq || 'Monthly',
      rentAmount: rent.rentAmount !== undefined ? rent.rentAmount : (rent.monthlyRent !== undefined ? rent.monthlyRent : ''),
      securityDeposit: rent.securityDeposit !== undefined ? rent.securityDeposit : '',
      depositType: rent.depositType || 'Refundable',
      agreementId: rent.agreementId || rent.AgreementId || rent.agreementNo || rent.AgreementNo || '',
      agreementNo: rent.agreementNo || rent.AgreementNo || rent.agreementId || rent.AgreementId || '',
    }
    : null;

  return { rent, renterData };
}

export function mapInitialSubUnitsToPool(
  initialSubUnits: any[],
  parentFloors: any[],
  dropdownOptions: any,
  departments: any[]
): PoolUnit[] {
  return initialSubUnits.map((u: any) => {
    const { floorDetailsId, resolvedFloorLevelId, subFloorId, subFloorName, conYear, conType, useType, subUseType: _subUseType, subTypeOfUseName, floorLabel } =
      resolvePoolUnitFloorContext(u, parentFloors, dropdownOptions);
    const { deptId, deptName } = resolvePoolUnitDept(u, departments);
    const unitType = resolvePoolUnitType(u);
    const mappedRooms = mapPoolUnitRooms(u);
    const { rent, renterData } = resolvePoolUnitRenter(u);

    const isRenterUnit = !!(
      u.isRenter ||
      u.isRented ||
      u.occupancyStatus === 'Rented' ||
      u.OccupancyStatus === 'Rented' ||
      renterData?.rentType ||
      rent?.leaseType ||
      rent?.leaseRentType ||
      rent?.tenantName ||
      u.renterName
    );

    const aadhaar = u.aadhaarCardNo ||
      u.tenantAadhaarNo ||
      u.aadhaar ||
      rent?.aadhaarCardNo ||
      rent?.tenantAadhaarNo ||
      rent?.aadhaar ||
      renterData?.aadhaar ||
      null;

    const pan = u.panCardNo ||
      u.tenantPanCardNo ||
      u.pan ||
      rent?.panCardNo ||
      rent?.tenantPanCardNo ||
      rent?.pan ||
      renterData?.pan ||
      null;

    const rentTypeVal = renterData?.rentType || (isRenterUnit ? 'Rent' : null);
    const leaseStartVal = renterData?.leaseStart || null;
    const leaseEndVal = renterData?.leaseEnd || null;
    const rentFreqVal = renterData?.rentFreq || 'Monthly';
    const rentAmountVal = renterData?.rentAmount !== '' && renterData?.rentAmount !== undefined ? Number(renterData.rentAmount) : '';
    const secDepVal = renterData?.securityDeposit !== '' && renterData?.securityDeposit !== undefined ? Number(renterData.securityDeposit) : '';
    const depTypeVal = renterData?.depositType || 'Refundable';

    return {
      tempId: `db_${u.assetId || u.id}`,
      id: (u.assetId || u.id) as number,
      assetId: (u.assetId || u.id) as number,
      dbId: (u.assetId || u.id) as number,
      unitNumber: (u.assetNo ||
        u.assetCode ||
        u.shopUnitName ||
        `Unit-${u.id}`) as string,
      unitType,
      selectedFloorId: resolvedFloorLevelId || floorDetailsId,
      selectedFloorLabel: floorLabel,
      floorDetailsId: floorDetailsId,
      subFloorId: subFloorId,
      subFloorName: subFloorName,
      carpetAreaSqFt: Number(u.totalAreaSqFt || u.carpetAreaSqFt || u.carpetAreaSqFeet || 0),
      rooms: mappedRooms,
      renterDetails: u.renterDetails ?? (rent ? [rent] : (renterData ? [renterData] : null)),
      isRenter: isRenterUnit,
      isRented: isRenterUnit,
      isSaved: true,
      isModified: false,
      departmentId: deptId,
      departmentName: deptName,
      assessmentYear: u.assessmentYear || u.asstYear || u.AssessmentYear || null,
      conYear: u.constructionYear || u.conYear || conYear,
      conType: u.constructionTypeId ? String(u.constructionTypeId) : (u.conType || conType),
      useType: u.typeOfUseId ? String(u.typeOfUseId) : (u.useType || useType),
      subUseType: (u.subTypeOfUseId && Number(u.subTypeOfUseId) > 0)
        ? String(u.subTypeOfUseId)
        : ((u.subUseType && Number(u.subUseType) > 0) ? String(u.subUseType) : ''),
      subTypeOfUseName: ((u.subTypeOfUseId && Number(u.subTypeOfUseId) > 0) || (u.subUseType && Number(u.subUseType) > 0)) ? subTypeOfUseName : '',
      // ── Top-level renter identity fields (for display and re-save) ──
      renterName: (u.renterName ||
        u.tenantName ||
        rent?.renterName ||
        rent?.tenantName ||
        null) as string | null,
      renterNameLocal: (u.renterNameLocal ||
        u.RenterNameLocal ||
        u.tenantRegionalName ||
        u.TenantRegionalName ||
        rent?.renterNameLocal ||
        rent?.RenterNameLocal ||
        rent?.tenantRegionalName ||
        rent?.TenantRegionalName ||
        rent?.tenantNameLocal ||
        rent?.TenantNameLocal ||
        null) as string | null,
      mobileNo: (u.mobileNo || u.tenantMobile || rent?.mobileNo || rent?.tenantMobile || null) as
        | string
        | null,
      emailId: (u.emailId || u.tenantEmail || rent?.emailId || rent?.tenantEmail || null) as
        | string
        | null,
      gstNo: (u.gstNo || rent?.gstNo || null) as string | null,
      aadhaarCardNo: aadhaar,
      panCardNo: pan,
      aadhaar,
      pan,
      // ── Property registration numbers ──
      propertyNo: (u.propertyNo || u.PropertyNo || u.details?.propertyNo || u.details?.PropertyNo || null) as string | null,
      unitNo: (u.unitNo || u.UnitNo || u.details?.unitNo || u.details?.UnitNo || null) as string | null,
      surveyNo: (u.surveyNo || u.SurveyNo || null) as string | null,
      partitionNo: (u.partitionNo || u.PartitionNo || u.details?.partitionNo || u.details?.PartitionNo || null) as string | null,
      mpmsNo: (u.mpmsNo || u.MpmsNo || u.MPMSNo || u.details?.mpmsNo || u.details?.MpmsNo || u.details?.MPMSNo || null) as string | null,
      pTaxId: (u.pTaxId || u.PTaxId || u.details?.pTaxId || u.details?.PTaxId || null) as string | null,
      PTaxId: (u.pTaxId || u.PTaxId || u.details?.pTaxId || u.details?.PTaxId || null) as string | null,
      propertyDescription: (u.propertyDescription || u.PropertyDescription || null) as
        | string
        | null,
      unitName: (u.shopUnitName || u.unitName || rent?.shopName || null) as string | null,
      unitNameLocal: (u.shopUnitNameLocal ||
        u.ShopUnitNameLocal ||
        u.unitNameLocal ||
        u.UnitNameLocal ||
        u.shopRegionalName ||
        u.ShopRegionalName ||
        rent?.shopRegionalName ||
        rent?.ShopRegionalName ||
        rent?.shopUnitNameLocal ||
        rent?.ShopUnitNameLocal ||
        null) as string | null,
      shopName: (renterData?.shopName || u.shopUnitName || u.shopName || rent?.shopName || rent?.ShopName || null) as string | null,
      shopRegionalName: (renterData?.shopRegionalName || u.shopUnitNameLocal || u.shopRegionalName || rent?.shopRegionalName || rent?.ShopRegionalName || null) as string | null,
      tenantAddress: (u.tenantAddress || u.TenantAddress || renterData?.tenantAddress || rent?.tenantAddress || rent?.TenantAddress || null) as string | null,

      // ── Flat rent properties for form binding ──
      rentType: rentTypeVal,
      leaseStart: leaseStartVal,
      leaseEnd: leaseEndVal,
      duration: renterData?.duration || null,
      rentFreq: rentFreqVal,
      rentAmount: rentAmountVal,
      securityDeposit: secDepVal,
      depositType: depTypeVal,
      agreementId:
        rent?.agreementId ||
        rent?.AgreementId ||
        rent?.agreementNo ||
        rent?.AgreementNo ||
        renterData?.agreementId ||
        renterData?.agreementNo ||
        u.agreementId ||
        u.agreementNo ||
        null,
      agreementNo:
        rent?.agreementNo ||
        rent?.AgreementNo ||
        rent?.agreementId ||
        rent?.AgreementId ||
        renterData?.agreementNo ||
        renterData?.agreementId ||
        u.agreementNo ||
        u.agreementId ||
        null,

      // ── Rent information (for re-save) ──
      rentInformation: isRenterUnit && rentTypeVal
        ? {
          leaseRentType: rentTypeVal,
          leaseStart: leaseStartVal,
          leaseEnd: leaseEndVal,
          duration: renterData?.duration || null,
          rentFrequency: rentFreqVal,
          rentAmount: Number(rentAmountVal || 0),
          securityDeposit: Number(secDepVal || 0),
          depositType: depTypeVal,
          shopName: renterData?.shopName || u.shopUnitName || u.shopName || rent?.shopName || rent?.ShopName || null,
          shopRegionalName: renterData?.shopRegionalName || u.shopUnitNameLocal || u.shopRegionalName || rent?.shopRegionalName || rent?.ShopRegionalName || null,
          tenantAddress: u.tenantAddress || u.TenantAddress || renterData?.tenantAddress || rent?.tenantAddress || rent?.TenantAddress || null,
          agreementId:
            rent?.agreementId ||
            rent?.AgreementId ||
            rent?.agreementNo ||
            rent?.AgreementNo ||
            renterData?.agreementId ||
            renterData?.agreementNo ||
            u.agreementId ||
            u.agreementNo ||
            null,
          agreementNo:
            rent?.agreementNo ||
            rent?.AgreementNo ||
            rent?.agreementId ||
            rent?.AgreementId ||
            renterData?.agreementNo ||
            renterData?.agreementId ||
            u.agreementNo ||
            u.agreementId ||
            null,
        }
        : null,
      cvBaseRate: u.cvBaseRate ?? u.CVBaseRate ?? null,
      baseValue: u.baseValue ?? u.BaseValue ?? null,
      cvFloorFactor: u.cvFloorFactor ?? u.CVFloorFactor ?? null,
      cvAgeFactor: u.cvAgeFactor ?? u.CVAgeFactor ?? null,
      cvNatureFactor: u.cvNatureFactor ?? u.CVNatureFactor ?? null,
      cvUseFactor: u.cvUseFactor ?? u.CVUseFactor ?? null,
      capitalValue: u.capitalValue ?? u.CapitalValue ?? null,
    } as PoolUnit;
  });
}
