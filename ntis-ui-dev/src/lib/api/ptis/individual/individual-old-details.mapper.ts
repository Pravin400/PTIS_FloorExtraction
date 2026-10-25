import type {
  OldDetailsData,
  OldFloorDetailsData,
} from '@/types/ptis.types';
import { defaultOldDetails } from '@/types/ptis-defaults.types';

/**
 * Maps raw API response to OldDetailsData for the individual screen.
 * Handles single objects, array responses ([{...}]), nested { items: [...] }, { data: [...] },
 * as well as both camelCase and PascalCase backend keys.
 */
export function mapIndividualOldDetails(raw: unknown): OldDetailsData {
  if (!raw) return { ...defaultOldDetails };

  let item: Record<string, unknown> = raw as Record<string, unknown>;

  // 1. Unwrap arrays or wrapper objects
  if (Array.isArray(item)) {
    item = (item[0] as Record<string, unknown>) || {};
  } else if (item && typeof item === 'object') {
    if (Array.isArray(item.items)) {
      item = (item.items[0] as Record<string, unknown>) || {};
    } else if (item.items && typeof item.items === 'object') {
      item = item.items as Record<string, unknown>;
    } else if (Array.isArray(item.data)) {
      item = (item.data[0] as Record<string, unknown>) || {};
    } else if (item.data && typeof item.data === 'object') {
      item = item.data as Record<string, unknown>;
    }
  }

  // Safe getter for case-insensitive / alternate keys
  const get = (...keys: string[]): string => {
    for (const key of keys) {
      const val = item[key];
      if (val !== undefined && val !== null && val !== '') {
        return String(val).trim();
      }
    }
    return '';
  };

  const oldZoneName = get('oldZoneName', 'OldZoneName', 'oldZoneNo', 'OldZoneNo');
  const oldWardNo = get('oldWardNo', 'OldWardNo');
  const oldPropertyNo = get('oldPropertyNo', 'OldPropertyNo');
  const oldPartitionNo = get('oldPartitionNo', 'OldPartitionNo');
  const oldEGovernanceNo = get('oldEgovNo', 'OldEgovNo', 'oldEGovernanceNo', 'OldEGovernanceNo', 'oldEgovernanceNo');
  const oldPlotArea = get('oldPlotArea', 'OldPlotArea');
  const oldPlotNo = get('oldPlotNo', 'OldPlotNo');
  const oldRV = get('oldRV', 'OldRV', 'oldRv', 'OldRv');
  const oldALV = get('oldALV', 'OldALV', 'oldAlv', 'OldAlv');
  const oldPropertyTax = get('oldGeneralTax', 'OldGeneralTax', 'oldPropertyTax', 'OldPropertyTax');
  const oldTotalTax = get('oldTotalTax', 'OldTotalTax');
  const oldConstructionArea = get('oldConstructionArea', 'OldConstructionArea');
  const oldConstructionYear = get('oldConstructionYear', 'OldConstructionYear', 'constructionYear', 'ConstructionYear');
  const oldCarpetAreaSqMeter = get('oldCarpetAreaSqMeter', 'OldCarpetAreaSqMeter');
  const oldCarpetAreaSqFeet = get('oldCarpetAreaSqFeet', 'OldCarpetAreaSqFeet');
  const oldBuiltupAreaSqMeter = get('oldBuiltupAreaSqMeter', 'OldBuiltupAreaSqMeter');
  const oldBuiltupAreaSqFeet = get('oldBuiltupAreaSqFeet', 'OldBuiltupAreaSqFeet');
  const oldConstructionTypeId = get('oldConstructionTypeId', 'OldConstructionTypeId', 'constructionTypeId', 'ConstructionTypeId');
  const oldTypeOfUseId = get('oldTypeOfUseId', 'OldTypeOfUseId', 'typeOfUseId', 'TypeOfUseId');

  return {
    ...defaultOldDetails,
    oldZoneName,
    oldWardNo,
    oldPropertyNo,
    oldPartitionNo,
    oldEGovernanceNo,
    oldPlotArea,
    oldPlotNo,
    oldRV,
    oldALV,
    oldPropertyTax,
    oldTotalTax,
    oldConstructionArea,
    oldConstructionYear,
    oldCarpetAreaSqMeter,
    oldCarpetAreaSqFeet,
    oldBuiltupAreaSqMeter,
    oldBuiltupAreaSqFeet,
    oldConstructionTypeId,
    oldTypeOfUseId,
    oldGeneralTax: oldPropertyTax,
  };
}

/**
 * Maps raw floor API items to OldFloorDetailsData for the individual screen.
 * Handles arrays, nested { floorDetails: [...] }, { items: [...] }, { data: [...] },
 * as well as both camelCase and PascalCase backend keys.
 */
export function mapIndividualOldFloorDetails(raw: unknown): OldFloorDetailsData[] {
  if (!raw) return [];
  let items: unknown[] = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.floorDetails)) items = obj.floorDetails;
    else if (Array.isArray(obj.items)) items = obj.items;
    else if (Array.isArray(obj.data)) items = obj.data;
  }

  return items.map((rawItem) => {
    const item = (rawItem || {}) as Record<string, unknown>;
    const get = (...keys: string[]): string => {
      for (const k of keys) {
        const val = item[k];
        if (val !== undefined && val !== null && val !== '') return String(val).trim();
      }
      return '';
    };

    const ward = get('oldWardNo', 'OldWardNo');
    const prop = get('oldPropertyNo', 'OldPropertyNo');
    const part = get('oldPartitionNo', 'OldPartitionNo');
    const wardPropPartNo = [ward, prop, part].filter(Boolean).join(' - ');

    const carpetSqFt = get('oldCarpetAreaSqFeet', 'OldCarpetAreaSqFeet', 'carpetAreaSqFeet') || '0';
    const carpetSqMtr = get('oldCarpetAreaSqMeter', 'OldCarpetAreaSqMeter', 'carpetAreaSqMeter') || '0';
    const builtupSqFt = get('oldBuiltupAreaSqFeet', 'OldBuiltupAreaSqFeet', 'builtupAreaSqFeet') || '0';
    const builtupSqMtr = get('oldBuiltupAreaSqMeter', 'OldBuiltupAreaSqMeter', 'builtupAreaSqMeter') || '0';

    return {
      wardPropPartNo,
      floor: get('floorDescription', 'FloorDescription', 'floor', 'Floor'),
      subFloor: get('subFloorDescription', 'SubFloorDescription', 'subFloor', 'SubFloor'),
      assessmentYear: get('oldAssessmentYear', 'OldAssessmentYear', 'assessmentYear'),
      year: get('constructionYear', 'ConstructionYear', 'oldConstructionYear', 'OldConstructionYear'),
      constructionType: get('constructionTypeDescription', 'ConstructionTypeDescription', 'constructionType'),
      typeOfUse: get('typeOfUseDescription', 'TypeOfUseDescription', 'typeOfUse'),
      subType: get('subTypeOfUseDescription', 'SubTypeOfUseDescription', 'subType'),
      carpetArea: `${carpetSqFt} / ${carpetSqMtr}`,
      builtupArea: `${builtupSqFt} / ${builtupSqMtr}`,
    };
  });
}

