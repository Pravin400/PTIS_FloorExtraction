/* eslint-disable @typescript-eslint/no-explicit-any */
import { calcDurationMonths } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-save-payload.utils';

function mapStandaloneSaveRoomDetails(rooms: any[]) {
  return rooms.map((r: any) => {
    const areaSqM = r.areaSqM != null
      ? Number(r.areaSqM)
      : Number(r.area || 0) * 0.092903;
    return {
      roomNo: r.roomNo,
      roomType: r.roomType,
      shape: r.shape || "Rectangle",
      lengthMtr: r.length ? Number(r.length) : null,
      widthMtr: r.width ? Number(r.width) : null,
      heightMtr: r.height ? Number(r.height) : null,
      base1Mtr: r.base1 ? Number(r.base1) : null,
      base2Mtr: r.base2 ? Number(r.base2) : null,
      areaSqMtr: areaSqM,
      noOfRooms: Number(r.count || 1),
      totalAreaSqMtr: Number(r.netAreaSqM ?? areaSqM) * Number(r.count || 1),
      outerYesNo: r.outer === "Yes",
      minusYesNo: r.minus === "Yes" || r.hasOffset === "Yes",
      submissionType: r.submissionType || "Room",
      offsets: Array.isArray(r.offsets)
        ? r.offsets.map((off: any) => ({
          shape: off.shape || "Rectangle",
          length: Number(off.length ?? off.radius ?? 0),
          width: Number(off.width ?? 0),
          height: Number(off.height ?? 0),
          base1: Number(off.base1 ?? 0),
          base2: Number(off.base2 ?? 0),
          radius: Number(off.radius ?? off.length ?? 0),
          areaSqM: Number(off.areaSqM ?? 0),
          op: off.op || "Subtract",
        }))
        : [],
    };
  });
}

/** Builds the createChildAssetAction payload for one standalone sub-unit
 * during the bulk "Save All" flow. */
export function buildStandaloneUnitSavePayload(
  unit: any,
  pId: number,
  resolvedFloorDetailsId: number | undefined,
  formData: any
) {
  const roomDetails = unit.rooms && unit.rooms.length > 0
    ? mapStandaloneSaveRoomDetails(unit.rooms)
    : null;

  const rentInfo = unit.rentType && unit.rentType !== "None" ? {
    leaseRentType: unit.rentType,
    leaseStart: unit.leaseStart ? new Date(unit.leaseStart).toISOString() : null,
    leaseEnd: unit.leaseEnd ? new Date(unit.leaseEnd).toISOString() : null,
    duration: calcDurationMonths(unit.leaseStart || "", unit.leaseEnd || ""),
    rentFrequency: unit.rentFreq || "Monthly",
    rentAmount: Number(unit.rentAmount || 0),
    securityDeposit: Number(unit.securityDeposit || 0),
    depositType: unit.depositType || "Refundable",
    agreementId: unit.agreementId || null,
  } : null;

  return {
    parentAssetId: pId,
    assetId: unit.id || 0,
    floorDetailsId: resolvedFloorDetailsId,
    floorId: unit.floorId,
    subFloorId: unit.subFloorId || null,
    unitNo: unit.unitNumber,
    shopUnitName: unit.unitName || null,
    shopUnitNameLocal: unit.unitNameLocal || null,
    totalAreaSqFt: unit.carpetAreaSqFeet,
    carpetAreaSqFeet: unit.carpetAreaSqFeet,
    carpetAreaSqMeter: Number(((unit.carpetAreaSqFeet || 0) / 10.7639).toFixed(4)),
    builtupAreaSqFeet: Number(((unit.carpetAreaSqFeet || 0) * 1.2).toFixed(4)),
    builtupAreaSqMeter: Number((((unit.carpetAreaSqFeet || 0) * 1.2) / 10.7639).toFixed(4)),
    departmentId: unit.departmentId ? Number(unit.departmentId) : null,
    renterName: unit.renterName || null,
    mobileNo: unit.mobileNo || null,
    emailId: unit.emailId || null,
    gstNo: unit.gstNo || null,
    aadhaarCardNo: unit.aadhaar || null,
    panCardNo: unit.pan || null,
    propertyDescription: unit.propertyDescription || null,
    propertyNo: unit.propertyNo || null,
    surveyNo: unit.surveyNo || null,
    partitionNo: unit.partitionNo || null,
    mpmsNo: unit.mpmsNo || unit.MPMSNo || null,
    pTaxId: unit.pTaxId || unit.PTaxId || null,
    PTaxId: unit.pTaxId || unit.PTaxId || null,
    rentInformation: rentInfo,
    isRoomWiseValuationActive: roomDetails !== null,
    roomDetails,
    rooms: unit.rooms,
    locationAddress: unit.locationAddress || formData.fullAddress || formData.address || null,
    locationLat: unit.locationLat || (formData.latitude ? String(formData.latitude) : null),
    locationLng: unit.locationLng || (formData.longitude ? String(formData.longitude) : null),
    floorConfiguration: {
      unitAreaSqFt: unit.carpetAreaSqFeet,
      calculatedCapitalValue: unit.baseValue || 0,
    }
  };
}
