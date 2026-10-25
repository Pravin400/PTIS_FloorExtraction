/* eslint-disable @typescript-eslint/no-explicit-any */
export function calcDurationMonths(s: string, e: string): number {
  if (!s || !e) return 0;
  const start = new Date(s);
  const end = new Date(e);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  let m = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) m -= 1;
  return Math.max(0, m);
}

function mapUnitDetailRoomDetails(updatedRooms: any[], isDuplicateMode?: boolean) {
  return updatedRooms.map((r: any) => {
    const areaSqM = r.areaSqM != null ? Number(r.areaSqM) : Number(r.area || 0) * 0.092903;
    return {
      ...(isDuplicateMode ? {} : (r.id ? { id: r.id } : {})),
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
          ...(isDuplicateMode ? {} : (off.id ? { id: off.id } : {})),
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

/** Builds the createChildAssetAction payload for a pool unit's inline
 * save-from-configurator flow. */
export function buildUnitDetailChildPayload(
  updated: any,
  unit: any,
  formData: any,
  parentAssetId: number,
  resolvedFloorDetailsId: number | undefined,
  newFloorId: number | null,
  isDuplicateMode?: boolean
) {
  const roomDetails =
    Array.isArray(updated.rooms) && updated.rooms.length > 0
      ? mapUnitDetailRoomDetails(updated.rooms, isDuplicateMode)
      : null;

  const rawUnitNo = String(updated.unitNo || unit.unitNo || '').trim();
  const safeUnitNo = rawUnitNo.length > 20
    ? (rawUnitNo.includes('-') ? rawUnitNo.split('-').slice(-2).join('-').slice(0, 20) : rawUnitNo.slice(0, 20))
    : (rawUnitNo || null);

  const isRenter = updated.isRenter !== undefined
    ? !!updated.isRenter
    : !!(updated.isRented || updated.rentType || updated.renterName);

  const rentType = updated.rentType || updated.leaseRentType || (isRenter ? 'Rent' : null);
  const rentInfo = isRenter && rentType
    ? {
      leaseRentType: rentType,
      leaseStart: updated.leaseStart ? new Date(updated.leaseStart).toISOString() : null,
      leaseEnd: updated.leaseEnd ? new Date(updated.leaseEnd).toISOString() : null,
      duration: calcDurationMonths(updated.leaseStart || '', updated.leaseEnd || ''),
      rentFrequency: updated.rentFreq || updated.rentFrequency || 'Monthly',
      rentAmount: Number(updated.rentAmount || 0),
      securityDeposit: Number(updated.securityDeposit || 0),
      depositType: updated.depositType || 'Refundable',
      agreementId: updated.agreementId || updated.agreementNo || null,
      agreementNo: updated.agreementNo || updated.agreementId || null,
      shopNo: safeUnitNo,
      shopName: updated.unitName || null,
      shopRegionalName: updated.unitNameLocal || null,
      tenantName: updated.renterName || null,
      tenantRegionalName: updated.renterNameLocal || null,
      renterNameLocal: updated.renterNameLocal || null,
      tenantAddress: updated.tenantAddress || null,
    }
    : null;

  const currentYear = new Date().getFullYear();
  const conYearVal = updated.conYear
    ? Number(updated.conYear)
    : unit.conYear
      ? Number(unit.conYear)
      : formData.constructionYear
        ? Number(formData.constructionYear)
        : currentYear;

  const asstYearVal = updated.asstYear
    ? Number(updated.asstYear)
    : unit.asstYear || unit.assessmentYear
      ? Number(unit.asstYear || unit.assessmentYear)
      : formData.assessmentYear
        ? Number(formData.assessmentYear)
        : currentYear;

  const childPayload = {
    parentAssetId,
    assetId: unit.dbId || 0,
    floorDetailsId: resolvedFloorDetailsId || undefined,
    floorId: newFloorId || undefined,
    subFloorId:
      updated.subFloorId !== undefined
        ? (updated.subFloorId && Number(updated.subFloorId) > 0 ? Number(updated.subFloorId) : null)
        : (unit.subFloorId && Number(unit.subFloorId) > 0 ? Number(unit.subFloorId) : null),
    unitNo: safeUnitNo,
    shopUnitName: updated.unitName || null,
    shopUnitNameLocal: updated.unitNameLocal || null,
    shopRegionalName: updated.unitNameLocal || null,
    unitNameLocal: updated.unitNameLocal || null,
    departmentId: updated.departmentId ? Number(updated.departmentId) : (unit.departmentId ? Number(unit.departmentId) : null),
    totalAreaSqFt: Number(updated.carpetAreaSqFeet) || unit.carpetAreaSqFt,
    carpetAreaSqFeet: Number(updated.carpetAreaSqFeet) || unit.carpetAreaSqFt,
    carpetAreaSqMeter: Number(
      ((Number(updated.carpetAreaSqFeet) || unit.carpetAreaSqFt) / 10.7639).toFixed(4)
    ),
    builtupAreaSqFeet: Number(
      ((Number(updated.carpetAreaSqFeet) || unit.carpetAreaSqFt) * 1.2).toFixed(4)
    ),
    builtupAreaSqMeter: Number(
      (((Number(updated.carpetAreaSqFeet) || unit.carpetAreaSqFt) * 1.2) / 10.7639).toFixed(4)
    ),
    constructionTypeId: updated.conType ? Number(updated.conType) : (unit.conType ? Number(unit.conType) : null),
    typeOfUseId: updated.useType ? Number(updated.useType) : (unit.useType ? Number(unit.useType) : null),
    subTypeOfUseId:
      updated.subUseType !== undefined
        ? (updated.subUseType && Number(updated.subUseType) > 0 ? Number(updated.subUseType) : null)
        : (unit.subUseType && Number(unit.subUseType) > 0 ? Number(unit.subUseType) : null),
    constructionYear: conYearVal,
    assessmentYear: asstYearVal,
    isRenter,
    isRented: isRenter,
    renterName: updated.renterName || null,
    renterNameLocal: updated.renterNameLocal || null,
    tenantRegionalName: updated.renterNameLocal || null,
    mobileNo: updated.mobileNo || null,
    emailId: updated.emailId || null,
    gstNo: updated.gstNo || null,
    aadhaarCardNo: updated.aadhaar || updated.aadhaarCardNo || unit.aadhaar || unit.aadhaarCardNo || null,
    panCardNo: updated.pan || updated.panCardNo || unit.pan || unit.panCardNo || null,
    propertyDescription: updated.propertyDescription || null,
    propertyNo: updated.propertyNo || unit.propertyNo || formData?.propertyNo || formData?.propertyNumber || null,
    agreementId: updated.agreementId || updated.agreementNo || null,
    agreementNo: updated.agreementNo || updated.agreementId || null,
    surveyNo: updated.surveyNo || null,
    partitionNo: updated.partitionNo || null,
    mpmsNo: updated.mpmsNo || null,
    pTaxId: updated.pTaxId || updated.PTaxId || null,
    PTaxId: updated.pTaxId || updated.PTaxId || null,
    tenantAddress: updated.tenantAddress || null,
    rentInformation: rentInfo,
    // ── ROOM AUTO-DELETE FIX: isRoomWiseValuationActive guard ─────────────────
    // When updated.rooms is explicitly null (floor-submission mode - see
    // useSubUnitSave.ts), we must NOT send isRoomWiseValuationActive: false to
    // the backend. Doing so tells the backend this unit has no room-wise
    // valuation, which causes it to delete all RoomWiseSubmissionsDetails rows.
    //
    // Rule: only compute isRoomWiseValuationActive when the caller deliberately
    // provides a rooms array (including an empty one that means "no rooms").
    // When rooms is null it means "do not touch rooms at all".
    isRoomWiseValuationActive: updated.rooms === null
      ? undefined   // floor-submission mode — leave room activation flag untouched
      : roomDetails !== null,
    roomDetails,
    rooms: updated.rooms === null
      ? undefined   // floor-submission mode — do not send any rooms in payload
      : (Array.isArray(updated.rooms) ? updated.rooms : unit.rooms),
    locationAddress:
      updated.locationAddress || formData.fullAddress || formData.address || null,
    locationLat:
      updated.locationLat || (formData.latitude ? String(formData.latitude) : null),
    locationLng:
      updated.locationLng || (formData.longitude ? String(formData.longitude) : null),
    floorConfiguration: {
      unitAreaSqFt: Number(updated.carpetAreaSqFeet) || unit.carpetAreaSqFt,
      calculatedCapitalValue: updated.capitalValue || 0,
    },
    stagedFiles: updated.stagedFiles || null,
  };

  return { childPayload, rentInfo };
}
