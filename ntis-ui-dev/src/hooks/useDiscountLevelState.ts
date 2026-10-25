'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  ApplicationLevel,
  WingOption,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import type { PropertySocialDetailsDto } from '@/types/property-social-details.types';

export interface UseDiscountLevelStateProps {
  propertyId?: string;
  initialLevel?: ApplicationLevel;
  initialWingDetailId?: number | null;
  initialUnitPropertyId?: number | null;
  isSociety?: boolean;
  wings?: WingOption[];
  units?: UnitSelectionItem[];
  savedPropertyDetails?: PropertySocialDetailsDto[];
}

export function useDiscountLevelState({
  initialLevel = 'Apartment',
  initialWingDetailId = null,
  initialUnitPropertyId = null,
  wings = [],
  units = [],
}: UseDiscountLevelStateProps) {
  const [level, setLevel] = useState<ApplicationLevel>(initialLevel);
  const dynamicWings = useMemo(() => {
    if (!Array.isArray(wings)) return [];
    const seen = new Set<string>();
    const unique: WingOption[] = [];
    wings.forEach((w) => {
      if (!w) return;
      const key = `${w.wingDetailId ?? ''}-${(w.wingName || '').trim().toLowerCase()}`;
      if (!seen.has(key) && (w.wingName || '').trim()) {
        seen.add(key);
        unique.push({
          ...w,
          wingName: (w.wingName || '').trim(),
          wingNo: w.wingNo || (w.wingName || '').trim(),
        });
      }
    });
    return unique;
  }, [wings]);
  const dynamicUnits = useMemo(() => (Array.isArray(units) ? units : []), [units]);

  const [explicitSelectedWingDetailId, setExplicitSelectedWingDetailId] = useState<number | null>(() => {
    const num = Number(initialWingDetailId);
    return !isNaN(num) && num > 0 ? num : null;
  });

  const selectedWingDetailId = (explicitSelectedWingDetailId && !isNaN(explicitSelectedWingDetailId) && explicitSelectedWingDetailId > 0)
    ? explicitSelectedWingDetailId
    : (dynamicWings.length > 0 ? dynamicWings[0].wingDetailId : null);
  const setSelectedWingDetailId = setExplicitSelectedWingDetailId;

  const totalUnitsCount = 0;
  const hasMoreUnits = true;
  const [isLoadingMoreUnits, setIsLoadingMoreUnits] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [wingFilter, setWingFilterRaw] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [useFilter, setUseFilter] = useState<string>('all');

  const loadNextUnitsPage = useCallback(async () => { setIsLoadingMoreUnits(false); }, []);
  const setWingFilter = useCallback((value: string) => { setWingFilterRaw(value); }, []);

  // Selected unit IDs (for Unit level)
  const [prevInitialId, setPrevInitialId] = useState(initialUnitPropertyId);
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<number>>(() => {
    if (initialUnitPropertyId && initialUnitPropertyId > 0) {
      return new Set<number>([initialUnitPropertyId]);
    }
    return new Set<number>();
  });

  if (initialUnitPropertyId !== prevInitialId) {
    setPrevInitialId(initialUnitPropertyId);
    if (initialUnitPropertyId && initialUnitPropertyId > 0) {
      setSelectedUnitIds(new Set<number>([initialUnitPropertyId]));
    }
  }

  // Unique floors and uses for filter dropdowns — derived from ALL loaded units, not filtered
  const availableFloors = useMemo(() => {
    const set = new Set<string>();
    dynamicUnits.forEach((u) => {
      if (u.floorName) set.add(u.floorName);
    });
    return Array.from(set);
  }, [dynamicUnits]);

  const availableUses = useMemo(() => {
    const set = new Set<string>();
    dynamicUnits.forEach((u) => {
      if (u.useName) set.add(u.useName);
    });
    return Array.from(set);
  }, [dynamicUnits]);

  // Filtered unit list — wing filtering is server-side, floor/use/search are client-side
  const filteredUnits = useMemo(() => {
    return dynamicUnits.filter((unit) => {
      if (floorFilter !== 'all' && unit.floorName.toLowerCase() !== floorFilter.toLowerCase()) {
        return false;
      }
      if (useFilter !== 'all' && unit.useName.toLowerCase() !== useFilter.toLowerCase()) {
        return false;
      }
      if (unitSearchQuery.trim()) {
        const query = unitSearchQuery.trim().toLowerCase();
        const matchesUnit = unit.unitNo.toLowerCase().includes(query);
        const matchesWing = unit.wingName.toLowerCase().includes(query);
        const matchesFloor = unit.floorName.toLowerCase().includes(query);
        return matchesUnit || matchesWing || matchesFloor;
      }
      return true;
    });
  }, [dynamicUnits, floorFilter, useFilter, unitSearchQuery]);

  const isAllUnitsSelected = useMemo(() => {
    if (filteredUnits.length === 0) return false;
    return filteredUnits.every((u) => selectedUnitIds.has((u.propertyId ?? u.propertyDetailsId) as number));
  }, [filteredUnits, selectedUnitIds]);

  const toggleUnitSelection = useCallback((unitPropertyId: number) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitPropertyId)) {
        next.delete(unitPropertyId);
      } else {
        next.add(unitPropertyId);
      }
      return next;
    });
  }, []);

  const toggleAllUnits = useCallback(() => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (isAllUnitsSelected) {
        filteredUnits.forEach((u) => next.delete((u.propertyId ?? u.propertyDetailsId) as number));
      } else {
        filteredUnits.forEach((u) => next.add((u.propertyId ?? u.propertyDetailsId) as number));
      }
      return next;
    });
  }, [filteredUnits, isAllUnitsSelected]);

  // Selected unit count limited to units currently present in the active list
  const selectedUnitsCount = useMemo(() => {
    const validIds = new Set(dynamicUnits.map((u) => (u.propertyId ?? u.propertyDetailsId) as number));
    let count = 0;
    selectedUnitIds.forEach((id) => {
      if (validIds.has(id)) count++;
    });
    return count;
  }, [dynamicUnits, selectedUnitIds]);

  return {
    level,
    setLevel,
    selectedWingDetailId,
    setSelectedWingDetailId,
    unitSearchQuery,
    setUnitSearchQuery,
    wingFilter,
    setWingFilter,
    floorFilter,
    setFloorFilter,
    useFilter,
    setUseFilter,
    selectedUnitIds,
    setSelectedUnitIds,
    selectedUnitsCount,
    wings: dynamicWings,
    availableFloors,
    availableUses,
    filteredUnits,
    isAllUnitsSelected,
    toggleUnitSelection,
    toggleAllUnits,
    totalUnitsCount,
    hasMoreUnits,
    isLoadingMoreUnits,
    loadNextUnitsPage,
  };
}
