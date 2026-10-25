/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { toast } from 'sonner';
import { buildFloorPayload } from './floor-payload-builder.utils';
import { saveFloorEntry } from './floor-save-orchestrator.utils';
import { reconcileFloorSave } from './floor-save-finalize.utils';

/**
 * Rebuilds a formState object from a saved floor entry (enrichedChild) so it
 * can be fed back through the same save pipeline as a brand-new floor.
 */
function floorEntryToFormState(floor: any) {
  const firstRenter = Array.isArray(floor.renterDetails) ? floor.renterDetails[0] : floor.renterDetails;
  const firstLease = Array.isArray(floor.leaseRentDetails) ? floor.leaseRentDetails[0] : floor.leaseRentDetails;
  const rentInfo = floor.rentInformation || {};

  const renterLocal =
    floor.renterNameLocal ||
    floor.tenantRegionalName ||
    floor.TenantRegionalName ||
    floor.RenterNameLocal ||
    firstRenter?.tenantRegionalName ||
    firstRenter?.TenantRegionalName ||
    firstRenter?.renterNameLocal ||
    firstRenter?.RenterNameLocal ||
    firstLease?.tenantRegionalName ||
    firstLease?.TenantRegionalName ||
    firstLease?.renterNameLocal ||
    firstLease?.RenterNameLocal ||
    rentInfo?.tenantRegionalName ||
    rentInfo?.renterNameLocal ||
    '';
  const tenantAddr =
    floor.tenantAddress ||
    floor.TenantAddress ||
    firstRenter?.tenantAddress ||
    firstRenter?.TenantAddress ||
    firstLease?.tenantAddress ||
    firstLease?.TenantAddress ||
    rentInfo?.tenantAddress ||
    '';
  const agmtId =
    floor.agreementId ||
    floor.agreementNo ||
    floor.AgreementId ||
    floor.AgreementNo ||
    firstRenter?.agreementId ||
    firstRenter?.AgreementId ||
    firstRenter?.agreementNo ||
    firstRenter?.AgreementNo ||
    firstLease?.agreementId ||
    firstLease?.AgreementId ||
    firstLease?.agreementNo ||
    firstLease?.AgreementNo ||
    rentInfo?.agreementId ||
    rentInfo?.agreementNo ||
    '';
  const gst = floor.gstNo || floor.GSTNo || firstRenter?.gstNo || firstLease?.gstNo || firstLease?.GSTNo || '';

  return {
    submissionType: floor.unitType === 'Open Space' ? 'Open Space' : 'Construction',
    unitType: floor.unitType === 'Open Space' ? 'Open Space' : 'Floor',
    floor: floor.floorId ? String(floor.floorId) : '',
    subFloor: floor.subFloorId && Number(floor.subFloorId) > 0 ? String(floor.subFloorId) : '',
    conYear: floor.constructionYear ? String(floor.constructionYear) : '',
    asstYear: floor.assessmentYear ? String(floor.assessmentYear) : '',
    conType: floor.constructionTypeId ? String(floor.constructionTypeId) : '',
    useType: floor.typeOfUseId ? String(floor.typeOfUseId) : '',
    subUseType: floor.subTypeOfUseId && Number(floor.subTypeOfUseId) > 0 ? String(floor.subTypeOfUseId) : (floor.subUseType && Number(floor.subUseType) > 0 ? String(floor.subUseType) : ''),
    isRenter: Boolean(floor.isRented || floor.isRenter || floor.renterNameEnglish || floor.renterName || floor.tenantName),
    renterNameEnglish: floor.renterNameEnglish || floor.renterName || floor.tenantName || floor.TenantName || '',
    renterNameLocal: renterLocal,
    tenantRegionalName: renterLocal,
    tenantAddress: tenantAddr,
    agreementId: agmtId,
    agreementNo: agmtId,
    gstNo: gst,
    noOfRooms: floor.noOfRooms || 0,
    carpetAreaSqFt: floor.carpetAreaSqFeet || floor.carpetAreaSqFt || 0,
    builtUpAreaSqFt: floor.builtUpAreaSqFeet || floor.builtUpAreaSqFt || 0,
    agreementDate: floor.agreementDate || '',
    agreementFromDate: floor.agreementFromDate || floor.leaseStartDate || '',
    agreementToDate: floor.agreementToDate || floor.leaseEndDate || '',
    rentMonthly: floor.rentMonthly !== undefined && floor.rentMonthly !== '' ? floor.rentMonthly : (floor.monthlyRent || floor.rentAmount || ''),
    rentYearly: floor.rentYearly || '',
    taxLiability: floor.taxLiability || '',
    rentType: floor.rentType || floor.leaseType || floor.leaseRentType || '',
    duration: floor.duration ? String(floor.duration) : '',
    rentFreq: floor.rentFreq || floor.paymentFrequency || floor.rentFrequency || 'Monthly',
    securityDeposit: floor.securityDeposit !== undefined && floor.securityDeposit !== '' ? floor.securityDeposit : '',
    depositType: floor.depositType || 'Refundable',
    mobileNo: floor.mobileNo || floor.tenantMobile || floor.TenantMobile || '',
    emailId: floor.emailId || floor.tenantEmail || floor.TenantEmail || '',
    aadhaar: floor.aadhaar || floor.tenantAadhaarNo || floor.TenantAadhaarNo || '',
    pan: floor.pan || floor.tenantPanCardNo || floor.TenantPanCardNo || '',
    unitNo: '',
    unitNameLocal: '',
  };
}

/**
 * Duplicate a saved floor N times.
 * All data is copied from the source floor, but the asset ID/unit number
 * are freshly generated (each duplicate calls bulkGenerateSubUnitsAction with count:1).
 *
 * @param sourcFloor  The enrichedChild row from savedFloors
 * @param count       How many duplicates to create (1..50)
 * @param ctx         Same context object used in useNAFloorRegistrationSave
 */
export async function duplicateFloorEntries(
  sourceFloor: any,
  count: number,
  ctx: {
    formData: any;
    dropdownOptions: any;
    dbFloors: any[];
    setDbFloors: React.Dispatch<React.SetStateAction<any[]>>;
    savedFloors: any[];
    setSavedFloors: React.Dispatch<React.SetStateAction<any[]>>;
    subFloorOptions: any[];
    subUseTypeOptions: any[];
    t: any;
  }
): Promise<number> {
  const { formData, dropdownOptions, dbFloors, setDbFloors, savedFloors, setSavedFloors, subFloorOptions, subUseTypeOptions, t } = ctx;

  // Extract rooms from the source floor's roomDetails
  const sourceRooms: any[] = Array.isArray(sourceFloor.roomDetails) ? sourceFloor.roomDetails : (Array.isArray(sourceFloor.rooms) ? sourceFloor.rooms : []);

  // Map room details to the format expected by buildFloorPayload
  const mappedRooms = sourceRooms
    .filter((r: any) => r.submissionType !== 'Open Space' && r.submissionType !== 'Amenity')
    .map((r: any) => ({
      id: undefined, // strip DB id so each duplicate gets new room records
      roomType: r.roomType || r.RoomType || '',
      shape: r.shape || 'Rectangle',
      length: r.lengthMtr || r.length || '',
      width: r.widthMtr || r.width || '',
      height: r.heightMtr || r.height || '',
      base1: r.base1Mtr || r.base1 || '',
      base2: r.base2Mtr || r.base2 || '',
      areaSqM: r.areaSqMtr || r.areaSqM || 0,
      count: r.noOfRooms || r.count || 1,
      submissionType: 'Room',
      offsets: [],
    }));

  const mappedSpaces = sourceRooms
    .filter((r: any) => r.submissionType === 'Open Space')
    .map((r: any) => ({
      id: undefined,
      roomType: 'Open Space',
      shape: r.shape || 'Rectangle',
      length: r.lengthMtr || r.length || '',
      width: r.widthMtr || r.width || '',
      height: r.heightMtr || r.height || '',
      base1: r.base1Mtr || r.base1 || '',
      base2: r.base2Mtr || r.base2 || '',
      areaSqM: r.areaSqMtr || r.areaSqM || 0,
      count: r.noOfRooms || r.count || 1,
      submissionType: 'Open Space',
      offsets: [],
    }));

  const mappedAmenities = sourceRooms
    .filter((r: any) => r.submissionType === 'Amenity')
    .map((r: any) => ({
      id: undefined,
      roomType: 'Amenity',
      shape: r.shape || 'Rectangle',
      length: r.lengthMtr || r.length || '',
      width: r.widthMtr || r.width || '',
      height: r.heightMtr || r.height || '',
      base1: r.base1Mtr || r.base1 || '',
      base2: r.base2Mtr || r.base2 || '',
      areaSqM: r.areaSqMtr || r.areaSqM || 0,
      count: r.noOfRooms || r.count || 1,
      submissionType: 'Amenity',
      offsets: [],
    }));

  const formState = floorEntryToFormState(sourceFloor);

  // If there are no rooms at all (area-only floor), we still need to be able to save.
  // We synthesise a minimal room so buildFloorPayload won't bail out.
  const roomData = mappedRooms.length > 0 ? mappedRooms : (formState.carpetAreaSqFt > 0 ? [
    {
      id: undefined,
      roomType: 'Room',
      shape: 'Rectangle',
      count: sourceFloor.noOfRooms || 1,
      areaSqM: Number(((formState.carpetAreaSqFt) / 10.7639).toFixed(4)),
      submissionType: 'Room',
      offsets: [],
    }
  ] : []);

  const openSpaceData = mappedSpaces;
  const amenityData = mappedAmenities;

  let successCount = 0;

  for (let i = 0; i < count; i++) {
    try {
      const built = buildFloorPayload(formState, roomData, openSpaceData, amenityData, dropdownOptions, t);
      if (!built) {
        toast.error(`Duplicate ${i + 1} skipped — payload build failed.`);
        continue;
      }

      // We need a fresh snapshot of savedFloors for each iteration (after previous saves)
      // We read from the react state by capturing it at save time inside reconcileFloorSave.
      // We must pass editingId = null (new floor, not an update).
      const currentSavedFloors = savedFloors; // snapshot at call time

      const saveResult = await saveFloorEntry(built, {
        formState,
        editingId: null,
        dbFloors,
        setDbFloors,
        savedFloors: currentSavedFloors,
        formData,
        subFloorOptions,
        subUseTypeOptions,
        dropdownOptions,
      });

      reconcileFloorSave(saveResult, {
        formState,
        roomData,
        openSpaceData,
        editingId: null,
        setSavedFloors,
        setEditingId: () => {},
        t,
      });

      successCount++;
    } catch (err: any) {
      toast.error(`Duplicate ${i + 1} failed: ${err.message || err}`);
    }
  }

  return successCount;
}
