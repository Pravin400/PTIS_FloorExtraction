import { FloorData } from '@/types/room-details.types';

/**
 * Safely extract typeOfUseId from floor data with multiple property name variations
 * @param floor - Floor data object
 * @returns String representation of typeOfUseId or empty string
 */
export const getTypeOfUseId = (floor: FloorData): string => {
  return String(
    floor.typeOfUseId ||
    floor.TypeOfUseId ||
    floor.useId ||
    ''
  );
};

const safeStr = (...values: (string | number | null | undefined)[]): string => {
  for (const val of values) {
    if (val === undefined || val === null) continue;
    if (val === 0 || val === '0') continue;
    if (val === '') continue;
    return String(val);
  }
  return '';
};

/**
 * Normalize floor field IDs to string format for form inputs
 * @param floor - Raw floor data from API
 * @returns Normalized floor data with string IDs
 */
export const normalizeFloorFormData = (floor: FloorData): Partial<FloorData> => {
  const rawFloorId = safeStr(floor.floorId, floor.floorID, floor.FloorID);
  const resolvedFloorId = (!rawFloorId && floor.floor && !isNaN(Number(floor.floor))) ? String(floor.floor) : rawFloorId;
  return {
    ...floor,
    floorId: resolvedFloorId,
    subFloorId: safeStr(floor.subFloorId, floor.subFloorID, floor.SubFloorID),
  constructionTypeId: safeStr(floor.constructionTypeId, floor.constructionId, floor.ConstructionTypeId),
  typeOfUseId: safeStr(floor.typeOfUseId, floor.TypeOfUseId, floor.useId),
  subTypeOfUseId: safeStr(floor.subTypeOfUseId, floor.subTypId, floor.SubTypeOfUseId),
  floorCode: floor.floorCode !== undefined ? String(floor.floorCode) : undefined,
  subFloorCode: floor.subFloorCode !== undefined ? String(floor.subFloorCode) : undefined,
  constructionCode: floor.constructionCode !== undefined ? String(floor.constructionCode) : undefined,
  typeOfUseCode: floor.typeOfUseCode !== undefined ? String(floor.typeOfUseCode) : undefined,
  // Preserve display fields for table context if needed
  floor: String(floor.floor || ''),
  subFloor: String(floor.subFloor || ''),
  conTyp: String(floor.conTyp || ''),
  use: String(floor.use || ''),
  subTyp: String(floor.subTyp || ''),
  conYr: String(floor.conYr !== undefined && floor.conYr !== null ? floor.conYr : floor.constructionYear || ''),
  asstYr: String(floor.asstYr !== undefined && floor.asstYr !== null ? floor.asstYr : floor.assessmentYear || ''),
  rooms: String(floor.rooms !== undefined && floor.rooms !== null ? floor.rooms : floor.noOfRooms || ''),
  areaSqFt: String(floor.areaSqFt !== undefined && floor.areaSqFt !== null ? floor.areaSqFt : floor.carpetAreaSqFeet || ''),
  areaSqM: String(floor.areaSqM !== undefined && floor.areaSqM !== null ? floor.areaSqM : floor.carpetAreaSqMeter || ''),
  builtupAreaSqFt: String(floor.builtupAreaSqFt !== undefined && floor.builtupAreaSqFt !== null ? floor.builtupAreaSqFt : floor.builtupAreaSqFeet || floor.builtUpAreaSqFeet || '0.00'),
  builtupAreaSqM: String(floor.builtupAreaSqM !== undefined && floor.builtupAreaSqM !== null ? floor.builtupAreaSqM : floor.builtupAreaSqMeter || floor.builtUpAreaSqMeter || '0.00'),
  isTaxable: (floor.isTaxable === 'Yes' || floor.isTaxable === true) ? 'Yes' : 'No',
  };
};
