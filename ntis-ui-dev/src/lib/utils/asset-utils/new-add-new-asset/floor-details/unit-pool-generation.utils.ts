/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PoolUnit } from '@/types/asset/floor-details.types';

export interface GenerationFormValues {
  genType: string;
  genFromFloor: string;
  genToFloor: string;
  genCountPerFloor: number | '';
  genConYear: string;
  genConType: string;
  genUseType: string;
}

/** Validates the bulk-generator form, returning an error message (localized
 * where possible) or null if valid. */
export function validateGenerationForm(
  form: GenerationFormValues,
  t: (key: string, values?: any) => string
): string | null {
  if (!form.genType) {
    return t('floorDetails.selectUnitTypeMsg') || 'Select a unit type first.';
  }
  if (!form.genFromFloor || !form.genToFloor) {
    return t('floorDetails.invalidFloorRangeMsg') || 'Please select both From and To floors.';
  }
  const unitsPerFloor = Number(form.genCountPerFloor);
  if (isNaN(unitsPerFloor) || unitsPerFloor < 1) {
    return t('floorDetails.countMinMsg') || 'Count must be at least 1.';
  }
  if (!form.genConYear) {
    return 'Please enter a construction year first.';
  }
  if (form.genConYear.length !== 4) {
    return 'Construction year must be a 4-digit year.';
  }
  if (!form.genConType) {
    return 'Please select a construction type first.';
  }
  if (!form.genUseType) {
    return 'Please select a type of use first.';
  }
  return null;
}

/** Resolves the [fromIdx, toIdx] floor-level slice for the generator's
 * From/To floor selection, normalizing so the range is always ascending. */
export function resolveFloorRange(dropdownOptions: any, genFromFloor: string, genToFloor: string) {
  const floorLevels = dropdownOptions?.floorLevels || [];
  const fromIdx = floorLevels.findIndex((f: any) => String(f.value) === String(genFromFloor));
  const toIdx = floorLevels.findIndex((f: any) => String(f.value) === String(genToFloor));

  if (fromIdx === -1 || toIdx === -1) {
    return { floorsInRange: [] as any[], valid: false };
  }

  const startIdx = Math.min(fromIdx, toIdx);
  const endIdx = Math.max(fromIdx, toIdx);
  return { floorsInRange: floorLevels.slice(startIdx, endIdx + 1), valid: true };
}

/** Maps the bulkGenerateAcrossFloorsAction response's generatedAssets into
 * PoolUnit rows, assigning each generated asset to its floor based on
 * position (unitsPerFloor consecutive assets per floor, in range order). */
export function buildGeneratedPoolUnits(
  generatedAssets: any[],
  floorsInRange: any[],
  unitsPerFloor: number,
  genType: string,
  genConYear: string,
  genConType: string,
  genUseType: string,
  fallbackSubUseTypeId: number,
  fallbackSubUseTypeName: string | null = null
): PoolUnit[] {
  return generatedAssets.map((ga: any, idx: number) => {
    const floorIndex = Math.floor(idx / unitsPerFloor);
    const assignedFloor = floorsInRange[floorIndex] || floorsInRange[floorsInRange.length - 1];
    const floorLevelId = Number(assignedFloor.value);

    return {
      tempId: `db_${ga.assetId}`,
      dbId: ga.assetId,
      unitNumber: ga.assetNo,
      unitType: genType,
      selectedFloorId: floorLevelId,
      selectedFloorLabel: assignedFloor.label,
      carpetAreaSqFt: 0,
      rooms: [],
      renterDetails: null,
      isSaved: true,
      isModified: false,
      conYear: genConYear,
      conType: genConType,
      useType: genUseType,
      subUseType: fallbackSubUseTypeId ? String(fallbackSubUseTypeId) : '',
      subTypeOfUseName: fallbackSubUseTypeName,
    } as PoolUnit;
  });
}
