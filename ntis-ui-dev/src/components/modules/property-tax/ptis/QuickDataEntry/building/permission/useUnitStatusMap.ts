import { useMemo } from 'react';
import type { UnitSelectionItem } from '@/types/building-permission.types';
import {
  resolveUnitCertificateStatus,
  type UnitStatusResolution,
  type CertificateGridItems,
} from '@/lib/utils/certificate-grid-mapper';

interface UseUnitStatusMapParams {
  units: UnitSelectionItem[];
  filteredUnits: UnitSelectionItem[];
  selectedWingDetailId: number | null;
  gridItems: CertificateGridItems | null;
  selectedTypeId: number;
  societyId?: number | null;
}

export function useUnitStatusMap({
  units,
  filteredUnits,
  selectedWingDetailId,
  gridItems,
  selectedTypeId,
  societyId,
}: UseUnitStatusMapParams) {
  const allUnitsList = useMemo(() => {
    const map = new Map<number, (typeof filteredUnits)[0]>();
    (units || []).forEach((u) => {
      const id = Number(u.propertyDetailsId || u.propertyId || 0);
      if (id > 0) map.set(id, u);
    });
    (filteredUnits || []).forEach((u) => {
      const id = Number(u.propertyDetailsId || u.propertyId || 0);
      if (id > 0) map.set(id, u);
    });
    return Array.from(map.values());
  }, [units, filteredUnits]);

  const unitStatusMap = useMemo(() => {
    const map = new Map<number | string, UnitStatusResolution>();
    allUnitsList.forEach((u) => {
      const unitWithWing = {
        ...u,
        wingDetailId: (u.wingDetailId != null && Number(u.wingDetailId) > 0)
          ? Number(u.wingDetailId)
          : (selectedWingDetailId != null ? Number(selectedWingDetailId) : u.wingDetailId),
        wingName: u.wingName || undefined,
      };
      const stat = resolveUnitCertificateStatus(gridItems, selectedTypeId, unitWithWing, societyId ? Number(societyId) : undefined);
      if (u.propertyDetailsId != null) {
        map.set(u.propertyDetailsId, stat);
        map.set(Number(u.propertyDetailsId), stat);
        map.set(String(u.propertyDetailsId), stat);
      }
      if (u.propertyId != null) {
        map.set(u.propertyId, stat);
        map.set(Number(u.propertyId), stat);
        map.set(String(u.propertyId), stat);
      }
    });
    return map;
  }, [allUnitsList, gridItems, selectedTypeId, selectedWingDetailId, societyId]);

  return { allUnitsList, unitStatusMap };
}
