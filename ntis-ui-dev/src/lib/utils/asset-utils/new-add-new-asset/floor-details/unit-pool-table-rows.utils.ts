/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PoolUnit } from '@/types/asset/floor-details.types';

export const PAGE_SIZE = 10;

/** Builds the sorted/filtered table-row view of the pool (completed units
 * pushed to the end, grouped by floor order) plus its pagination slice. */
export function buildUnitPoolTableRows(
  pool: PoolUnit[],
  dropdownOptions: any,
  departments: any[],
  currentPage: number
) {
  const floorLevels = dropdownOptions?.floorLevels || [];
  const floorIdxMap = new Map<string, number>();
  floorLevels.forEach((f: any, idx: number) => {
    if (!floorIdxMap.has(String(f.value))) floorIdxMap.set(String(f.value), idx);
  });
  const departmentLabelMap = new Map<string, string>();
  departments.forEach((d: any) => departmentLabelMap.set(String(d.value), d.label));

  const subunitRows = pool.map((unit) => {
    const floorIdx = floorIdxMap.get(String(unit.selectedFloorId));
    return {
      id: unit.tempId,
      name: unit.unitNumber,
      type: unit.unitType,
      rowType: 'subunit' as const,
      floorId: unit.selectedFloorId,
      floorLabel: unit.selectedFloorLabel || '—',
      floorIdx: floorIdx !== undefined ? floorIdx : 9999,
      department:
        (unit.departmentId ? departmentLabelMap.get(String(unit.departmentId)) : '') ||
        (unit.departmentName && isNaN(Number(unit.departmentName)) ? unit.departmentName : '') ||
        '—',
      area: unit.carpetAreaSqFt,
      isSaved: unit.isSaved,
      isModified: unit.isModified,
      original: unit,
    };
  });

  // Sort: push completed (area > 0) to end
  const sorted = [...subunitRows].sort((a, b) => {
    const aFilled = a.area > 0;
    const bFilled = b.area > 0;
    if (aFilled !== bFilled) {
      return aFilled ? 1 : -1;
    }

    if (a.floorIdx !== b.floorIdx) {
      return a.floorIdx - b.floorIdx;
    }

    return (a.name || '').localeCompare(b.name || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  const tableRows = sorted;

  const totalRows = tableRows.length;
  const totalPages = Math.ceil(totalRows / PAGE_SIZE);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedRows = tableRows.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return { tableRows, totalRows, totalPages, activePage, paginatedRows };
}
