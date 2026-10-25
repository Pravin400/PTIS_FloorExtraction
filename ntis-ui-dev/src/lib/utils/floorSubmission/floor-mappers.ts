/**
 * Floor Data Mapping Utilities
 *
 * Provides utilities for mapping floor/lookup data to display formats
 * Handles property name variations from different API responses
 *
 * @module floor-mappers
 */

import { LookupData } from '@/types/common-details.types';
export type { LookupData };
import { FloorSubmissionPayload } from '@/types/floor-details.types';
import { FloorData } from '@/types/room-details.types';
import {
  getFloorDescription,
  getSubFloorDescription,
  getConstructionDescription,
  getUseDescription,
  getSubTypeDescription,
} from './floor-descriptions';
import {
  resolveIdFromDescription,
  findOpenPlotFloorItem,
  findOpenPlotConstructionTypeItem,
  findOpenPlotTypeOfUseItem,
} from './floor-resolvers';
import { mapRoomDataToApi } from './room-mappers';
import { mapRenterPayloadFields } from '@/lib/utils/renter/renter-payload-mapper';
import { checkIsUtilityCategory } from './floor-utility-checks';

// Re-export children utilities for consistent access
export * from './floor-descriptions';
export * from './floor-resolvers';
export * from './room-mappers';
export * from './floor-normalization';
export * from './floorTableHelpers';

/**
 * Maps FloorData form to FloorSubmissionPayload for API submission
 * Centralizes all the structural mapping logic for floor submissions
 */
export const mapFormToPayload = (params: {
  formData: FloorData;
  floorLookup: LookupData[];
  subFloorLookup: LookupData[];
  constructionLookup: LookupData[];
  useLookup: LookupData[];
  subTypeLookup: LookupData[];
  propertyId: number | string;
  isAddingNew: boolean;
  existingFloorId?: number | string;
  selectedFloorType?: 'Construction' | 'OpenPlot';
  isPlotCategory?: boolean;
}): FloorSubmissionPayload => {
  const {
    formData,
    floorLookup,
    subFloorLookup,
    constructionLookup,
    useLookup,
    subTypeLookup,
    propertyId,
    isAddingNew,
    existingFloorId,
    selectedFloorType,
  } = params;

  const isOpenSpace =
    selectedFloorType === 'Construction'
      ? false
      : selectedFloorType === 'OpenPlot' ||
        formData.selectedFloorType === 'OpenPlot' ||
        Number(formData.typeOfUseId) === 10 ||
        Number(formData.use) === 10 ||
        Number(formData.typeOfUseCategoryId) === 2 ||
        Number(formData.typeOfUseCategoryId) === 3;
  const isUtility = checkIsUtilityCategory(formData.typeOfUseCategoryId);

  // Resolve IDs primarily from explicit ID fields, fallback to resolving from descriptions or codes
  let floorId =
    Number(formData.floorId) ||
    resolveIdFromDescription(formData.floor, floorLookup, 'floorId', 'floorCode');

  if (!floorId && (isOpenSpace || selectedFloorType === 'OpenPlot' || formData.isOpenPlot)) {
    const opFloor = findOpenPlotFloorItem(floorLookup);
    if (opFloor) {
      floorId = Number(opFloor.floorId ?? (opFloor as Record<string, unknown>).id ?? 0);
    }
  }

  const subFloorId =
    Number(formData.subFloorId) ||
    resolveIdFromDescription(formData.subFloor, subFloorLookup, 'subFloorId', 'subFloorCode');

  let conTypId =
    Number(formData.constructionTypeId) ||
    resolveIdFromDescription(
      formData.conTyp,
      constructionLookup,
      'constructionTypeId',
      'constructionCode'
    );

  if (!conTypId && (isOpenSpace || selectedFloorType === 'OpenPlot' || formData.isOpenPlot)) {
    const opCon = findOpenPlotConstructionTypeItem(constructionLookup);
    if (opCon) {
      conTypId = Number(opCon.constructionTypeId ?? opCon.id ?? 0);
    }
  }

  let useId =
    Number(formData.typeOfUseId) ||
    resolveIdFromDescription(formData.use, useLookup, 'typeOfUseId', 'typeOfUseCode');

  if (!useId && (isOpenSpace || selectedFloorType === 'OpenPlot' || formData.isOpenPlot)) {
    const opUse = findOpenPlotTypeOfUseItem(useLookup);
    if (opUse) {
      useId = Number(opUse.typeOfUseId ?? opUse.id ?? 0);
    }
  }

  const subTypId =
    Number(formData.subTypeOfUseId) ||
    resolveIdFromDescription(formData.subTyp, subTypeLookup, 'subTypeOfUseId', 'searchKey');

  // Get descriptions for the resolved IDs
  const floorDescription =
    getFloorDescription(floorId, floorLookup) || String(formData.floor || '');
  const subFloorDescription =
    getSubFloorDescription(subFloorId, subFloorLookup) || String(formData.subFloor || '');
  const constructionTypeDescription =
    getConstructionDescription(conTypId, constructionLookup) || String(formData.conTyp || '');
  const typeOfUseDescription = getUseDescription(useId, useLookup) || String(formData.use || '');
  const subTypeOfUseDescription = String(
    getSubTypeDescription(subTypId, subTypeLookup) || formData.subTypeOfUseDescription || ''
  );

  // Build the payload
  const propDetailsId = isAddingNew ? 0 : Number(existingFloorId || 0);

  return {
    isActive: true,
    createdBy: 0,
    propertyId: Number(propertyId || 0),
    propertyDetailsId: propDetailsId,
    ...(floorId ? { floorId } : {}),
    floorDescription,
    subFloorId,
    subFloorDescription,
    constructionYear: isOpenSpace ? String(formData.asstYr || '') : String(formData.conYr || ''),
    assessmentYear: String(formData.asstYr || ''),
    ...(conTypId ? { constructionTypeId: conTypId } : {}),
    constructionTypeDescription,
    typeOfUseId: useId,
    typeOfUseDescription,
    subTypeOfUseId: subTypId,
    subTypeOfUseDescription,
    carpetAreaSqMeter: parseFloat(String(formData.areaSqM || 0)),
    carpetAreaSqFeet: parseFloat(String(formData.areaSqFt || 0)),
    builtupAreaSqMeter:
      selectedFloorType === 'OpenPlot' ||
      formData.selectedFloorType === 'OpenPlot' ||
      Boolean(params.isPlotCategory && isOpenSpace)
        ? parseFloat(String(formData.areaSqM || 0))
        : parseFloat(String(formData.builtupAreaSqM || 0)),
    builtupAreaSqFeet:
      selectedFloorType === 'OpenPlot' ||
      formData.selectedFloorType === 'OpenPlot' ||
      Boolean(params.isPlotCategory && isOpenSpace)
        ? parseFloat(String(formData.areaSqFt || 0))
        : parseFloat(String(formData.builtupAreaSqFt || 0)),
    noOfRooms: (isOpenSpace || selectedFloorType === 'OpenPlot' || formData.selectedFloorType === 'OpenPlot' || isUtility) ? 0 : (parseInt(String(formData.rooms)) || 0),
    isTaxable: formData.isTaxable === 'Yes' || formData.isTaxable === true,
    taxLiability: String(formData.taxLiability || ''),
    occupancyDate: formData.occupancyDate || null,
    occupancyApplyOrNot:
      formData.occupancyApplyOrNot === 'Yes' || formData.occupancyApplyOrNot === true,
    occupancyNumber: String(formData.occupancyNumber || ''),
    ...mapRenterPayloadFields(formData),
    roomWiseSubmissionDetails: (
      [
        ...((formData.roomWiseSubmissionDetails as unknown[]) || []),
        ...((formData.roomData as unknown[]) || []),
      ] as import('@/types/room-details.types').RoomData[]
    )
      .filter((r, index, self) => {
        // Calculate effective area from any possible field
        const area =
          Number(r.area || 0) ||
          Number(r.areaSqMtr || 0) ||
          Number(r.totalAreaSqMtr || 0) ||
          Number(r.total || 0);
        if (area <= 0) return false;

        // Deduplicate: if ID exists, match by ID; otherwise match by roomNo if it exists
        const matchIndex = self.findIndex(
          (t) => (t.id && t.id === r.id) || (t.roomNo && t.roomNo === r.roomNo)
        );
        return matchIndex === index;
      })
      .map((r) =>
        mapRoomDataToApi(
          r as import('@/types/room-details.types').RoomData,
          Number(propertyId),
          propDetailsId,
          isUtility
        )
      ),
    roomWiseMinusData: isOpenSpace ? [] : undefined,
    typeOfUseCategoryId: formData.typeOfUseCategoryId,
    selectedFloorType: (selectedFloorType || formData.selectedFloorType) as
      | 'Construction'
      | 'OpenPlot'
      | undefined,
    isOpenPlot: formData.isOpenPlot !== undefined ? Boolean(formData.isOpenPlot) : false,
    length: isOpenSpace ? (formData.length ? Number(formData.length) : null) : null,
    width: isOpenSpace ? (formData.width ? Number(formData.width) : null) : null,
    lengthMtr: isOpenSpace ? (formData.length ? Number(formData.length) : null) : null,
    widthMtr: isOpenSpace ? (formData.width ? Number(formData.width) : null) : null,
  };
};
