/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PoolUnit } from '@/types/asset/floor-details.types';
import { calcDurationMonths } from './unit-pool-save-payload.utils';

function mapBulkSaveRoomDetails(rooms: any[]) {
  return rooms.map((r: any) => {
    // r.areaSqM is already in sq.m from new shape-based Room
    // r.area (old) is in SqFt — handle both for backward compat
    const areaSqM = r.areaSqM != null ? Number(r.areaSqM) : Number(r.area || 0) * 0.092903;
    return {
      roomNo: r.roomNo,
      roomType: r.roomType,
      shape: r.shape || 'Rectangle',
      lengthMtr: r.length ? Number(r.length) : null,
      widthMtr: r.width ? Number(r.width) : null,
      heightMtr: r.height ? Number(r.height) : null,
      base1Mtr: r.base1 ? Number(r.base1) : null,
      base2Mtr: r.base2 ? Number(r.base2) : null,
      areaSqMtr: areaSqM,
      noOfRooms: Number(r.count || 1),
      totalAreaSqMtr:
        (r.roomType === 'Open Space' ? Number(r.netAreaSqM || 0) : Number(areaSqM)) *
        Number(r.count || 1),
      outerYesNo: r.outer === 'Yes',
      minusYesNo: r.minus === 'Yes' || r.hasOffset === 'Yes',
      submissionType: r.submissionType || 'Room',
      offsets: Array.isArray(r.offsets)
        ? r.offsets.map((off: any) => ({
          shape: off.shape || 'Rectangle',
          length: Number(off.length ?? off.radius ?? 0),
          width: Number(off.width ?? 0),
          height: Number(off.height ?? 0),
          base1: Number(off.base1 ?? 0),
          base2: Number(off.base2 ?? 0),
          radius: Number(off.radius ?? off.length ?? 0),
          areaSqM: Number(off.areaSqM ?? 0),
          op: off.op || 'Subtract',
        }))
        : [],
    };
  });
}

/** Builds the createChildAssetAction payload for one pool unit during the
 * bulk "Save All" flow. */
export function buildBulkSaveChildPayload(
  unit: PoolUnit,
  parentAssetId: number,
  resolvedFloorDetailsId: number | undefined,
  formData: any
) {
  const roomDetails = unit.rooms.length > 0 ? mapBulkSaveRoomDetails(unit.rooms) : null;

  const rDetails: any = unit.renterDetails;
  const rInfo: any = (unit as any).rentInformation;
  const rentType = rDetails?.rentType || rInfo?.leaseRentType;

  const rentInfo = rentType
    ? {
      leaseRentType: rentType,
      leaseStart:
        rDetails?.leaseStart || rInfo?.leaseStart
          ? new Date(rDetails?.leaseStart || rInfo?.leaseStart).toISOString()
          : null,
      leaseEnd:
        rDetails?.leaseEnd || rInfo?.leaseEnd
          ? new Date(rDetails?.leaseEnd || rInfo?.leaseEnd).toISOString()
          : null,
      duration: calcDurationMonths(
        rDetails?.leaseStart || rInfo?.leaseStart || '',
        rDetails?.leaseEnd || rInfo?.leaseEnd || ''
      ),
      rentFrequency: rDetails?.rentFreq || rInfo?.rentFrequency || 'Monthly',
      rentAmount: Number(rDetails?.rentAmount || rInfo?.rentAmount || 0),
      securityDeposit: Number(rDetails?.securityDeposit || rInfo?.securityDeposit || 0),
      depositType: rDetails?.depositType || rInfo?.depositType || 'Refundable',
      agreementId: rDetails?.agreementId || rInfo?.agreementId || null,
      tenantAddress: (unit as any).tenantAddress || rDetails?.tenantAddress || rInfo?.tenantAddress || null,
      tenantRegionalName: (unit as any).renterNameLocal || (unit as any).tenantRegionalName || rDetails?.renterNameLocal || rDetails?.tenantRegionalName || null,
      renterNameLocal: (unit as any).renterNameLocal || (unit as any).tenantRegionalName || rDetails?.renterNameLocal || rDetails?.tenantRegionalName || null,
    }
    : null;

  return {
    parentAssetId,
    assetId: unit.dbId || 0,
    floorDetailsId: resolvedFloorDetailsId,
    floorId: unit.selectedFloorId,
    subFloorId: unit.subFloorId || null,
    unitNo: undefined,
    // shopUnitName / unit name — try top-level unitName first, then renterDetails
    shopUnitName: (unit as any).unitName || rDetails?.unitName || null,
    shopUnitNameLocal: (unit as any).unitNameLocal || (unit as any).shopUnitNameLocal || (unit as any).shopRegionalName || rDetails?.unitNameLocal || rDetails?.shopRegionalName || null,
    shopRegionalName: (unit as any).unitNameLocal || (unit as any).shopUnitNameLocal || (unit as any).shopRegionalName || rDetails?.unitNameLocal || rDetails?.shopRegionalName || null,
    unitNameLocal: (unit as any).unitNameLocal || (unit as any).shopUnitNameLocal || (unit as any).shopRegionalName || rDetails?.unitNameLocal || rDetails?.shopRegionalName || null,
    totalAreaSqFt: unit.carpetAreaSqFt,
    departmentId: unit.departmentId ? Number(unit.departmentId) : null,
    isRenter: !!(unit.isRenter || rentType),
    // Renter identity — now stored at top level by handleSaveUnitDetail
    renterName: unit.renterName || rDetails?.renterName || null,
    renterNameLocal: (unit as any).renterNameLocal || (unit as any).tenantRegionalName || rDetails?.renterNameLocal || rDetails?.tenantRegionalName || null,
    tenantRegionalName: (unit as any).renterNameLocal || (unit as any).tenantRegionalName || rDetails?.renterNameLocal || rDetails?.tenantRegionalName || null,
    mobileNo: unit.mobileNo || rDetails?.mobileNo || null,
    emailId: unit.emailId || rDetails?.emailId || null,
    gstNo: unit.gstNo || rDetails?.gstNo || null,
    aadhaarCardNo: unit.aadhaarCardNo || rDetails?.aadhaar || null,
    panCardNo: unit.panCardNo || rDetails?.pan || null,
    propertyDescription: unit.propertyDescription || rDetails?.propertyDescription || null,
    tenantAddress: (unit as any).tenantAddress || rDetails?.tenantAddress || rInfo?.tenantAddress || null,
    // Property registration numbers — now properly stored at top level
    constructionTypeId: unit.conType ? Number(unit.conType) : null,
    typeOfUseId: unit.useType ? Number(unit.useType) : null,
    subTypeOfUseId: unit.subUseType && Number(unit.subUseType) > 0 ? Number(unit.subUseType) : null,
    constructionYear: unit.conYear ? Number(unit.conYear) : (formData.constructionYear ? Number(formData.constructionYear) : new Date().getFullYear()),
    assessmentYear: unit.assessmentYear || unit.asstYear || formData.assessmentYear || formData.asstYear || new Date().getFullYear(),
    propertyNo: (unit as any).propertyNo || rDetails?.propertyNo || null,
    surveyNo: (unit as any).surveyNo || rDetails?.surveyNo || null,
    partitionNo: (unit as any).partitionNo || rDetails?.partitionNo || null,
    mpmsNo: (unit as any).mpmsNo || (unit as any).MPMSNo || rDetails?.mpmsNo || null,
    pTaxId: (unit as any).pTaxId || (unit as any).PTaxId || rDetails?.pTaxId || rDetails?.PTaxId || null,
    PTaxId: (unit as any).pTaxId || (unit as any).PTaxId || rDetails?.pTaxId || rDetails?.PTaxId || null,
    rentInformation: rentInfo,
    isRoomWiseValuationActive: roomDetails !== null,
    roomDetails,
    rooms: unit.rooms,
    locationAddress: unit.locationAddress || formData.fullAddress || formData.address || null,
    locationLat: unit.locationLat || (formData.latitude ? String(formData.latitude) : null),
    locationLng: unit.locationLng || (formData.longitude ? String(formData.longitude) : null),
    floorConfiguration: {
      unitAreaSqFt: unit.carpetAreaSqFt,
      calculatedCapitalValue: unit.capitalValue || rDetails?.capitalValue || 0,
    },
  };
}
