/* eslint-disable @typescript-eslint/no-explicit-any */
import { FloorData, RoomData } from "@/types/room-details.types";
import { RenterDetailItem, RenterMastItem } from "@/types/renter/renter-details.types";
import { LookupData } from "@/types/common-details.types";
import { OffsetData } from "@/types/offset-details.types";
import { resolveAgreementBaseMonthlyRent } from "@/lib/utils/renter/renterUtils";
import {
  getFloorDescription,
  getSubFloorDescription,
  getConstructionDescription,
  getUseDescription,
  getSubTypeDescription,
  formatCodeAndDescription,
} from "./floor-descriptions";
import { INITIAL_SHAPE_PARAMETERS } from "@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/constants/room-submission.constants";
import { isOpenPlotCodeTaxable } from "./openplot-category";

/**
 * Normalizes offset/minus room data from API response back to UI-friendly structure.
 */
export function normalizeOffsetData(raw: Record<string, unknown>): OffsetData {
  if (!raw) return {} as OffsetData;

  const getProp = (obj: Record<string, unknown>, key: string) => {
    if (!obj) return undefined;
    const lowerKey = key.toLowerCase();
    const actualKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return actualKey ? obj[actualKey] : undefined;
  };

  const shape = String(raw.shape || "Rectangle");
  const area = parseFloat(String(raw.areaSqMtr || raw.areaSqMeter || raw.area || 0));

  // Extract dimensions as strings for form binding
  const l = getProp(raw, 'lengthMtr') || getProp(raw, 'length');
  const w = getProp(raw, 'widthMtr') || getProp(raw, 'width');
  const h = getProp(raw, 'heightMtr') || getProp(raw, 'height');
  const b1 = getProp(raw, 'base1Mtr') || getProp(raw, 'base1');
  const b2 = getProp(raw, 'base2Mtr') || getProp(raw, 'base2');
  const s = getProp(raw, 'side') || (shape === "Square" ? l : undefined);
  const base = getProp(raw, 'base') || (shape === "Triangle" ? b1 : undefined);
  const radius = getProp(raw, 'radius') || (["Circle", "Semi Circle", "Quarter Circle"].includes(shape) ? b1 : undefined);

  // Map operation (add/subtract)
  const isOffset = raw.isOffset === true || raw.isOffset === 'true';
  const operation = raw.operation || (isOffset ? "add" : "subtract");

  return {
    ...raw,
    shape,
    area,
    length: l !== undefined && l !== null ? String(l) : "",
    width: w !== undefined && w !== null ? String(w) : "",
    height: h !== undefined && h !== null ? String(h) : "",
    base1: b1 !== undefined && b1 !== null ? String(b1) : "",
    base2: b2 !== undefined && b2 !== null ? String(b2) : "",
    side: s !== undefined && s !== null ? String(s) : "",
    base: base !== undefined && base !== null ? String(base) : "",
    radius: radius !== undefined && radius !== null ? String(radius) : "",
    operation,
    roomWiseMinusId: raw.id || raw.roomWiseMinusId || "",
  } as OffsetData;
}

/**
 * Efficiently extracts CC and OC issue dates from root fields or propertyCertificates array in a single loop.
 */
export function extractCertificateDates(raw: Record<string, unknown>): { ccDate: string | null; ocDate: string | null } {
  let ccDate = (raw.ccDate as string) || (raw.ccIssueDate as string) || null;
  let ocDate = (raw.ocDate as string) || (raw.ocIssueDate as string) || null;

  if (ccDate && ocDate) {
    return { ccDate: String(ccDate), ocDate: String(ocDate) };
  }

  const certs = raw.propertyCertificates;
  if (Array.isArray(certs)) {
    for (let i = 0; i < certs.length; i++) {
      const c = certs[i] as Record<string, unknown>;
      if (!c || !c.issueDate) continue;

      const typeCode = String(c.certificateTypeCode || '').toUpperCase();
      const typeId = Number(c.certificateTypeId);

      if (!ccDate && (typeCode === 'CC' || typeId === 1)) {
        ccDate = String(c.issueDate);
      } else if (!ocDate && (typeCode === 'OC' || typeId === 2)) {
        ocDate = String(c.issueDate);
      }

      if (ccDate && ocDate) break;
    }
  }

  return {
    ccDate: ccDate ? String(ccDate) : null,
    ocDate: ocDate ? String(ocDate) : null,
  };
}

/**
 * Normalizes a polymorphic room object from API responses.
 */
export function normalizeRoomData(raw: Record<string, unknown>): RoomData {
  if (!raw) return {} as RoomData;

  const shape = raw.shape || "Rectangle";

  // Helper to safely get property regardless of case
  const getProp = (obj: Record<string, unknown>, key: string) => {
    if (!obj) return undefined;
    const lowerKey = key.toLowerCase();
    const actualKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return actualKey ? obj[actualKey] : undefined;
  };

  // Extract parameters with fallbacks
  const params: Record<string, unknown> = {
    ...INITIAL_SHAPE_PARAMETERS,
    ...(raw.shapeParameters || raw.shapeParams || {}),
  };

  // Explicitly map API fields if they exist at root but not in params (Case-Insensitive)
  const b1 = getProp(raw, 'base1Mtr') || getProp(raw, 'baseMtr') || getProp(raw, 'base1') || getProp(raw, 'base');
  if (b1 !== undefined && b1 !== null && !params.base1 && !params.base && !params.radius) {
    params.base1 = String(b1);
    params.base = String(b1);
    params.radius = String(b1);
  }

  const b2 = getProp(raw, 'base2Mtr') || getProp(raw, 'base2');
  if (b2 !== undefined && b2 !== null && !params.base2) params.base2 = String(b2);

  const h = getProp(raw, 'heightMtr') || getProp(raw, 'height');
  if (h !== undefined && h !== null && !params.height) params.height = String(h);

  const l = getProp(raw, 'lengthMtr') || getProp(raw, 'length');
  if (l !== undefined && l !== null && !params.length) params.length = String(l);

  const w = getProp(raw, 'widthMtr') || getProp(raw, 'width');
  if (w !== undefined && w !== null && !params.width) params.width = String(w);

  const s = getProp(raw, 'side') || (String(shape).toLowerCase() === 'square' ? (l || w || b1) : undefined);
  if (s !== undefined && s !== null && !params.side) params.side = String(s);

  const rawOffsets = (raw.roomWiseMinusData || raw.offsets || []) as Record<string, unknown>[];
  const normalizedOffsets = Array.isArray(rawOffsets) ? rawOffsets.map(normalizeOffsetData) : [];

  return {
    ...raw,
    shape: String(shape || "Rectangle"),
    shapeParameters: params,
    shapeParams: params, // Maintain both for compatibility
    roomCount: String(getProp(raw, 'noOfRooms') || getProp(raw, 'roomCount') || "1"),
    roomType: String(getProp(raw, 'roomType') || getProp(raw, 'utilities') || "Residential"),
    carpetArea: parseFloat(String(getProp(raw, 'areaSqMtr') || getProp(raw, 'carpetArea') || getProp(raw, 'area') || 0)),
    builtUpArea: parseFloat(String(getProp(raw, 'builtUpArea') || 0)),
    roomNo: String(getProp(raw, 'roomNo') || ""),
    offsets: normalizedOffsets,
    roomWiseMinusData: normalizedOffsets,
  };
}

/**
 * Normalizes a polymorphic floor object from various API responses into a 
 * consistent, camelCased FloorData structure.
 * 
 * Handles property name variances like 'floorId' vs 'floorID' vs 'FloorID'.
 */
export function normalizeFloorData(
  raw: Record<string, unknown>,
  lookups: {
    floor?: LookupData[];
    subFloor?: LookupData[];
    construction?: LookupData[];
    use?: LookupData[];
    subType?: LookupData[];
  }
): FloorData {
  if (!raw) return {} as FloorData;

  // Helper to safely extract string from unknown value
  const getString = (val: unknown): string => (val !== null && val !== undefined) ? String(val) : '';
  const getNumber = (val: unknown): number => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // 1. Extract IDs using property guards for all known variations
  const floorId = getString(raw.floorId) || getString(raw.floorID) || getString(raw.FloorID) || '';
  const subFloorId = getString(raw.subFloorId) || getString(raw.subFloorID) || getString(raw.SubFloorID) || '';
  const constructionTypeId = getString(raw.constructionTypeId) || getString(raw.constructionId) || getString(raw.ConstructionTypeId) || '';
  const typeOfUseId = getString(raw.typeOfUseId) || getString(raw.TypeOfUseId) || getString(raw.useId) || '';
  const subTypeOfUseId = getString(raw.subTypeOfUseId) || getString(raw.subTypId) || getString(raw.SubTypeOfUseId) || '';

  // 1b. Resolve Codes from raw data or lookups
  const foundFloor = (lookups.floor || []).find((f) => String(f.floorId || f.id || f.ID) === String(floorId));
  const floorCode = getString(raw.floorCode) || (foundFloor ? (getString(foundFloor.floorCode) || getString((foundFloor as Record<string, unknown>).code) || '') : '');

  const foundSubFloor = (lookups.subFloor || []).find((s) => String(s.subFloorId || s.id || s.ID) === String(subFloorId));
  const subFloorCode = getString(raw.subFloorCode) || (foundSubFloor ? (getString((foundSubFloor as Record<string, unknown>).subFloorCode) || getString((foundSubFloor as Record<string, unknown>).code) || getString(foundSubFloor.floorCode) || '') : '');

  const foundConstruction = (lookups.construction || []).find((c) => String(c.constructionTypeId || c.id || c.ID) === String(constructionTypeId));
  const constructionCode = getString(raw.constructionCode) || (foundConstruction ? (getString((foundConstruction as Record<string, unknown>).constructionCode) || getString((foundConstruction as Record<string, unknown>).code) || '') : '');

  const foundUse = (lookups.use || []).find((u) => String(u.typeOfUseId || u.id || u.ID) === String(typeOfUseId));
  const typeOfUseCode = getString(raw.typeOfUseCode) || (foundUse ? (getString((foundUse as Record<string, unknown>).typeOfUseCode) || getString((foundUse as Record<string, unknown>).code) || '') : '');

  // 2. Resolve Descriptions (Marathi Labels) with Codes
  const rawFloorDesc = getString(raw.floorDescription) || (raw.floor && isNaN(Number(raw.floor)) ? getString(raw.floor) : '');
  const floorDesc = formatCodeAndDescription(floorCode, rawFloorDesc) || getFloorDescription(floorId, lookups.floor || []);

  const rawSubFloorDesc = getString(raw.subFloorDescription) || (raw.subFloor && isNaN(Number(raw.subFloor)) ? getString(raw.subFloor) : '');
  const subFloorDesc = formatCodeAndDescription(subFloorCode, rawSubFloorDesc) || getSubFloorDescription(subFloorId, lookups.subFloor || []);

  const rawConTypDesc = getString(raw.constructionTypeDescription) || (raw.conTyp && isNaN(Number(raw.conTyp)) ? getString(raw.conTyp) : '');
  const conTypDesc = formatCodeAndDescription(constructionCode, rawConTypDesc) || getConstructionDescription(constructionTypeId, lookups.construction || []);

  const rawUseDesc = getString(raw.typeOfUseDescription) || (raw.use && isNaN(Number(raw.use)) ? getString(raw.use) : '');
  const useDesc = formatCodeAndDescription(typeOfUseCode, rawUseDesc) || getUseDescription(typeOfUseId, lookups.use || []);

  const subTypeDesc = getString(raw.subTypeOfUseDescription) || getSubTypeDescription(Number(subTypeOfUseId), lookups.subType || []) || (raw.subTyp && isNaN(Number(raw.subTyp)) ? getString(raw.subTyp) : '');

  const rentersList = (raw.renterMast || raw.renters || raw.renterMasts || []) as RenterMastItem[];
  const firstRenter = Array.isArray(rentersList) && rentersList.length > 0 ? rentersList[0] : null;

  const getProp = (obj: Record<string, unknown>, key: string) => {
    if (!obj) return undefined;
    const lowerKey = key.toLowerCase();
    const actualKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return actualKey ? obj[actualKey] : undefined;
  };
  let l = getProp(raw, 'lengthMtr') || getProp(raw, 'length');
  let w = getProp(raw, 'widthMtr') || getProp(raw, 'width');

  const rawIsOpenPlot = raw.isOpenPlot !== undefined ? raw.isOpenPlot : (raw as any).IsOpenPlot;
  const isActualOpenPlot = rawIsOpenPlot === true || String(rawIsOpenPlot).toLowerCase() === 'true' || rawIsOpenPlot === 1 || String(rawIsOpenPlot) === '1';

  const isOpenPlotVal = isActualOpenPlot || String(raw.selectedFloorType).toLowerCase() === 'openplot' || String(floorDesc || '').toLowerCase().includes('open plot') || String(conTypDesc || '').toLowerCase().includes('open plot');
  if (isOpenPlotVal) {
    const rooms = (raw.roomWiseSubmissionDetails || raw.roomData || raw.propertyRooms || []) as Record<string, unknown>[];
    if (rooms && rooms.length > 0) {
      const firstRoom = rooms[0];
      const rL = getProp(firstRoom, 'lengthMtr') || getProp(firstRoom, 'length');
      const rW = getProp(firstRoom, 'widthMtr') || getProp(firstRoom, 'width');
      if (rL !== undefined && rL !== null) l = rL;
      if (rW !== undefined && rW !== null) w = rW;
    }
  }

  // 3. Return a clean, normalized object
  return {
    ...raw, // Preserve original fields for safety
    isOpenPlot: isActualOpenPlot,
    id: getNumber(raw.id) || getNumber(raw.propertyDetailsId) || 0,
    floor: floorDesc || floorId,
    subFloor: subFloorDesc || subFloorId,
    conYr: getString(raw.conYr) || getString(raw.constructionYear) || '',
    asstYr: getString(raw.asstYr) || getString(raw.assessmentYear) || '',
    conTyp: conTypDesc || constructionTypeId,
    use: useDesc || typeOfUseId,
    subTyp: subTypeDesc || subTypeOfUseId,
    renter: (raw.renter === 'Yes' || raw.renter === true || raw.isRenter === true || raw.renterYesNo === true || raw.renterYesNO === true) ? 'Yes' : 'No',
    rooms: isActualOpenPlot ? '0' : (getString(raw.rooms) || getString(raw.noOfRooms) || ''),
    areaSqFt: getString(raw.areaSqFt) || getString(raw.carpetAreaSqFeet) || '',
    areaSqM: getString(raw.areaSqM) || getString(raw.carpetAreaSqMeter) || '',
    length: l !== undefined && l !== null ? String(l) : '',
    width: w !== undefined && w !== null ? String(w) : '',
    builtupAreaSqFt: getString(raw.builtupAreaSqFt) || getString(raw.builtupAreaSqFeet) || '0.00',
    builtupAreaSqM: getString(raw.builtupAreaSqM) || getString(raw.builtupAreaSqMeter) || '0.00',
    isTaxable: (() => {
      if (raw.isTaxable !== undefined && raw.isTaxable !== null && raw.isTaxable !== '') {
        return (raw.isTaxable === 'Yes' || raw.isTaxable === true || raw.isTaxable === 1 || raw.isTaxable === '1') ? 'Yes' : 'No';
      }
      if (isOpenPlotVal) {
        const rawPlotCode = String(
          raw.typeOfUseCode ||
          (raw.selectedOpenPlotCategory as any)?.typeOfUseCode ||
          (raw.openPlotCategory as any)?.typeOfUseCode ||
          ''
        ).toUpperCase().trim();
        if (rawPlotCode) {
          return isOpenPlotCodeTaxable(rawPlotCode) ? 'Yes' : 'No';
        }
        if (useDesc.includes('शेती') || useDesc.includes('करमुक्त')) {
          return 'No';
        }
      }
      return 'Yes';
    })(),
    updateBuildingPermission: raw.updateBuildingPermission ? String(raw.updateBuildingPermission) : ((raw.propertyCertificates && Array.isArray(raw.propertyCertificates) && raw.propertyCertificates.length > 0) ? 'Yes' : 'No'),

    // Extract CC Date and OC Date from root or propertyCertificates in a single pass
    ...extractCertificateDates(raw),

    // Renter details root level mappings for forms/UI state
    renterName: getString(raw.renterName) || getString(raw.renterNameEnglish) || getString(firstRenter?.renterName) || getString(firstRenter?.renterNameEnglish) || '',
    agreementFromDate: getString(raw.agreementFromDate) || getString(firstRenter?.agreementFromDate) || getString(firstRenter?.durationFrom) || null,
    agreementToDate: getString(raw.agreementToDate) || getString(firstRenter?.agreementToDate) || getString(firstRenter?.durationTo) || null,
    agreementDate: getString(raw.agreementDate) || getString(firstRenter?.agreementDate) || null,
    rentMonthly: Number(resolveAgreementBaseMonthlyRent(raw as Record<string, unknown>) || 0),
    rentYearly: getNumber(raw.rentYearly) || getNumber(firstRenter?.finalYearlyRent) || (Number(resolveAgreementBaseMonthlyRent(raw as Record<string, unknown>) || 0) * 12),

    // Consistent Internal IDs and Codes for Form/Table Mapping
    floorId,
    subFloorId,
    constructionTypeId,
    typeOfUseId,
    subTypeOfUseId,
    floorCode,
    subFloorCode,
    constructionCode,
    typeOfUseCode,
    typeOfUseCategoryId: raw.typeOfUseCategoryId !== undefined ? (raw.typeOfUseCategoryId as number | string | null) : (() => {
      if (typeOfUseId && lookups.use) {
        const found = lookups.use.find(u => String(u.typeOfUseId || u.id || '') === String(typeOfUseId));
        return found ? (found.typeOfUseCategoryId !== undefined && found.typeOfUseCategoryId !== null ? (found.typeOfUseCategoryId as number | string | null) : null) : null;
      }
      return null;
    })(),

    // Preserved Descriptions for initialLabel fallbacks
    floorDescription: floorDesc,
    subFloorDescription: subFloorDesc,
    constructionTypeDescription: conTypDesc,
    typeOfUseDescription: useDesc,
    subTypeOfUseDescription: subTypeDesc,

    // Nested Data - Normalize rooms to ensure shapeParameters are present
    roomWiseSubmissionDetails: ((raw.roomWiseSubmissionDetails || raw.roomData || raw.propertyRooms || []) as unknown[]).map(r => normalizeRoomData(r as Record<string, unknown>)),
    renterDetails: (raw.renterDetails || []) as RenterDetailItem[],
    renterMast: rentersList,
    documentBindingId: getNumber(raw.documentBindingId) || getNumber(firstRenter?.documentBindingId) || undefined,
    documentGuid: getString(raw.documentGuid) || getString(firstRenter?.documentGuid) || undefined,
  };
}
