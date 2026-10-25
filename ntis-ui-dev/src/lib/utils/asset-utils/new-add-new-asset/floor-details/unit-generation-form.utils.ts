/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UnitGenerationDerived } from '@/types/asset/floor-details.types';

export function computeUnitGenerationDerived(
  dropdownOptions: any | null,
  genType: string,
  genFromFloor: string,
  genToFloor: string,
  genCountPerFloor: number | '',
  genConYear: string,
  genConType: string,
  genUseType: string,
  isGenerating: boolean
): UnitGenerationDerived {
  const floorLevels = dropdownOptions?.floorLevels || [];
  const fromIdx = floorLevels.findIndex((f: any) => String(f.value) === String(genFromFloor));
  const toIdx = floorLevels.findIndex((f: any) => String(f.value) === String(genToFloor));
  const numFloors = fromIdx !== -1 && toIdx !== -1 ? Math.abs(toIdx - fromIdx) + 1 : 0;
  const totalCount = numFloors * (Number(genCountPerFloor) || 0);

  const isGenerateDisabled =
    isGenerating ||
    !genType ||
    !genFromFloor ||
    !genToFloor ||
    !genCountPerFloor ||
    Number(genCountPerFloor) < 1 ||
    !genConYear ||
    genConYear.length !== 4 ||
    !genConType ||
    !genUseType;

  const toFloorOptions = floorLevels
    .filter((_o: any, idx: number) => !genFromFloor || fromIdx === -1 || idx >= fromIdx)
    .map((o: any) => ({ label: o.label, value: String(o.value) }));

  return { totalCount, isGenerateDisabled, toFloorOptions };
}
