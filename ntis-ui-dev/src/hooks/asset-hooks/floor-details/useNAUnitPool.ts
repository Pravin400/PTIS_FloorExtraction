/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PoolUnit } from '@/types/asset/floor-details.types';
import {
  parseOpenSpacesFromFloors,
  parseAmenitiesFromFloors,
} from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-utils';
import { mapInitialSubUnitsToPool } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-initial-mapping.utils';
import { buildUnitPoolTableRows, PAGE_SIZE } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-pool-table-rows.utils';
import { useNAUnitPoolConfigureUnit } from './useNAUnitPoolConfigureUnit';
import { useNAUnitPoolRemove } from './useNAUnitPoolRemove';
import { useNAUnitPoolSaveUnitDetail } from './useNAUnitPoolSaveUnitDetail';

interface UseNAUnitPoolProps {
  dropdownOptions: any | null;
  initialSubUnits?: any[];
  initialFloors?: any[];
  formData: any;
  t: (key: string, values?: any) => string;
  onSuccess?: (savedFloorItem?: any, options?: { keepDrawerOpen?: boolean }) => void;
}

// NA = NewAddNewAsset copy of useUnitPool
export function useNAUnitPool({
  dropdownOptions,
  initialSubUnits = [],
  initialFloors = [],
  formData,
  t,
  onSuccess,
}: UseNAUnitPoolProps) {
  const [pool, setPool] = useState<PoolUnit[]>([]);
  const [activeUnit, setActiveUnit] = useState<PoolUnit | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parentFloors, setParentFloors] = useState<any[]>(initialFloors);
  const [currentPage, setCurrentPage] = useState(1);
  const [floorConfigDirty, setFloorConfigDirty] = useState(false);
  // Tracks the last set of server-side dbIds to detect when the server returns new units
  const lastServerIdsRef = useRef<string>('');

  const { handleConfigureUnit } = useNAUnitPoolConfigureUnit(setPool, setActiveUnit, setIsLoadingDetails);

  const [floorOpenSpaces, setFloorOpenSpaces] = useState<Record<string, any[]>>(() =>
    parseOpenSpacesFromFloors(initialFloors)
  );
  const [openSpaceFloorId, setOpenSpaceFloorId] = useState<string>('');
  const [isOpenSpaceDrawerOpen, setIsOpenSpaceDrawerOpen] = useState(false);

  const [floorAmenities, setFloorAmenities] = useState<Record<string, any[]>>(() =>
    parseAmenitiesFromFloors(initialFloors)
  );
  const [amenityFloorId, setAmenityFloorId] = useState<string>('');
  const [isAmenityDrawerOpen, setIsAmenityDrawerOpen] = useState(false);

  const departments = useMemo(() => dropdownOptions?.departments || [], [dropdownOptions]);

  const enhancedDropdownOptions = dropdownOptions
    ? {
      ...dropdownOptions,
      departments,
    }
    : { departments };

  useEffect(() => {
    if (initialFloors && initialFloors.length > 0) {
      setTimeout(() => {
      setParentFloors(initialFloors);
      setFloorOpenSpaces(parseOpenSpacesFromFloors(initialFloors));
      setFloorAmenities(parseAmenitiesFromFloors(initialFloors));
    }, 0);
    }
  }, [initialFloors]);

  useEffect(() => {
    if (!initialSubUnits || initialSubUnits.length === 0) {
      // Only clear the pool if we have never initialised it (first mount with 0 units)
      if (lastServerIdsRef.current === '') {
        setPool([]);
        lastServerIdsRef.current = 'empty';
      }
      return;
    }

    // Build a stable key from every server-side id — ordered to be deterministic
    const incomingIds = initialSubUnits
      .map((u: any) => String(u.assetId ?? u.id ?? ''))
      .sort()
      .join(',');

    // Nothing changed server-side — do not reset the pool (preserves in-memory generated units)
    if (lastServerIdsRef.current === incomingIds) return;
    lastServerIdsRef.current = incomingIds;

    // Map the full incoming server list
    const serverMapped = mapInitialSubUnitsToPool(initialSubUnits, parentFloors, dropdownOptions, departments);

    // Merge: keep pool units that the server now knows about (by dbId),
    // but also preserve any in-memory units not yet persisted (no dbId).
    setPool((prev) => {
      const serverById = new Map<number, PoolUnit>(
        serverMapped
          .filter((u) => u.dbId != null)
          .map((u) => [u.dbId as number, u])
      );

      // Replace pool entries that the server returned with the fresher server copy,
      // UNLESS the local entry is already a fully-fetched detail (isSaved=true) —
      // in that case the local copy has richer data (shopName, unitName, renterDetails array)
      // that the thin list endpoint doesn't return. Only merge stagedFiles from server.
      const merged = prev.map((p) => {
        if (p.dbId != null && serverById.has(p.dbId)) {
          if (p.isSaved) {
            // Already detail-fetched — keep rich local data, just sync stagedFiles
            return { ...p, stagedFiles: p.stagedFiles ?? serverById.get(p.dbId)!.stagedFiles };
          }
          // Not yet detail-fetched — use server copy but preserve any staged files
          return { ...serverById.get(p.dbId)!, stagedFiles: p.stagedFiles };
        }
        return p; // unsaved local unit — keep as-is
      });

      // Add any server units not already represented in the pool (new units added elsewhere)
      const existingDbIds = new Set(prev.filter((p) => p.dbId != null).map((p) => p.dbId as number));
      for (const su of serverMapped) {
        if (su.dbId != null && !existingDbIds.has(su.dbId)) {
          merged.push(su);
        }
      }

      return merged;
    });
  }, [initialSubUnits, parentFloors, dropdownOptions, departments]);

  const { handleRemove } = useNAUnitPoolRemove(pool, setPool, setParentFloors, formData, t);

  const { handleSaveUnitDetail } = useNAUnitPoolSaveUnitDetail(
    activeUnit,
    setActiveUnit,
    parentFloors,
    setParentFloors,
    setPool,
    formData,
    t,
    enhancedDropdownOptions,
    departments,
    onSuccess
  );

  const savedCount = pool.filter((u) => u.isSaved).length;
  const unsavedCount = pool.filter((u) => !u.isSaved || u.isModified).length;

  const { tableRows, totalRows, totalPages, activePage, paginatedRows } = useMemo(
    () => buildUnitPoolTableRows(pool, dropdownOptions, departments, currentPage),
    [pool, dropdownOptions, departments, currentPage]
  );

  return {
    pool,
    setPool,
    activeUnit,
    setActiveUnit,
    isLoadingDetails,
    isSaving,
    setIsSaving,
    parentFloors,
    setParentFloors,
    currentPage,
    setCurrentPage,
    floorConfigDirty,
    setFloorConfigDirty,
    handleConfigureUnit,
    handleRemove,
    handleSaveUnitDetail,
    floorOpenSpaces,
    setFloorOpenSpaces,
    openSpaceFloorId,
    setOpenSpaceFloorId,
    isOpenSpaceDrawerOpen,
    setIsOpenSpaceDrawerOpen,
    floorAmenities,
    setFloorAmenities,
    amenityFloorId,
    setAmenityFloorId,
    isAmenityDrawerOpen,
    setIsAmenityDrawerOpen,
    departments,
    enhancedDropdownOptions,
    savedCount,
    unsavedCount,
    tableRows,
    PAGE_SIZE,
    totalRows,
    totalPages,
    activePage,
    paginatedRows,
  };
}
