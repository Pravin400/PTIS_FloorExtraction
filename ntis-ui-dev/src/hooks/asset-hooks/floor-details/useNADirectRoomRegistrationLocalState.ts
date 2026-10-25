/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { mapSubUnitsToFloors } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/floor-registration-utils';
import { useNAAssetForm } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext';

function filterFloorSubmissionSubUnits(units: any[]) {
  return (units || []).filter((u: any) => {
    if (u.isDirectFloorSubmission === true || u.IsDirectFloorSubmission === true) {
      return true;
    }
    const rawType = String(u.unitType || u.type || u.subUnitType || '').trim().toUpperCase();
    if (
      rawType.includes('SHOP') ||
      rawType.includes('FLAT') ||
      rawType.includes('OFFICE') ||
      rawType.includes('DEPARTMENT') ||
      rawType.includes('DEPT')
    ) {
      return false;
    }
    const values = [u.unitType, u.unitNo, u.shopUnitName, u.name, u.assetNo, u.assetCode, u.unitNumber, u.assetName]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    if (values.includes('SHOP') || values.includes('FLAT') || values.includes('OFFICE')) {
      return false;
    }
    return true;
  });
}

// NA = NewAddNewAsset copy of useDirectRoomRegistrationLocalState
export function useNADirectRoomRegistrationLocalState(
  initialFloors: any[],
  initialSubUnits: any[],
  dropdownOptions: any,
  assetFormId: number | undefined
) {
  const initializedRef = useRef<string | null>(null);

  const [dbFloors, setDbFloors] = useState<any[]>(initialFloors || []);

  useEffect(() => {
    if (initialFloors) {
      setTimeout(() => { setDbFloors(initialFloors); }, 0);
    }
  }, [initialFloors]);

  const [savedFloors, setSavedFloors] = useState<any[]>(() =>
    mapSubUnitsToFloors(filterFloorSubmissionSubUnits(initialSubUnits), initialFloors || [], dropdownOptions)
  );

  const { setFormData } = useNAAssetForm() as any;
  const isFirstRender = useRef(true);

  // Sync floors list back to parent form context while preserving pool units (e.g. Shop, Flat, Office)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (savedFloors.length === 0) return;
    }
    if (setFormData) {
      setFormData((prev: any) => {
        const currentFloors = prev?.floors || [];
        // Extract existing pool units (units created via Unit Management)
        const poolUnits = currentFloors.filter((f: any) => {
          if (f.isDirectFloorSubmission) return false;
          const rawType = String(f.unitType || f.type || f.subUnitType || '').trim().toUpperCase();
          if (
            rawType.includes('SHOP') ||
            rawType.includes('FLAT') ||
            rawType.includes('OFFICE') ||
            rawType.includes('DEPARTMENT') ||
            rawType.includes('DEPT')
          ) {
            return true;
          }
          const values = [f.unitType, f.unitNo, f.shopUnitName, f.name, f.assetNo, f.assetCode, f.unitNumber, f.assetName]
            .filter(Boolean)
            .join(' ')
            .toUpperCase();
          return values.includes('SHOP') || values.includes('FLAT') || values.includes('OFFICE');
        });

        const poolUnitIds = new Set(poolUnits.map((p: any) => String(p.id ?? p.assetId ?? p.subUnitsDetailsId)));
        const nonDuplicateSavedFloors = savedFloors.filter((s: any) => {
          const sId = String(s.id ?? s.assetId ?? s.subUnitsDetailsId);
          return !poolUnitIds.has(sId);
        });

        return {
          ...prev,
          floors: [...nonDuplicateSavedFloors, ...poolUnits],
        };
      });
    }
  }, [savedFloors, setFormData]);

  useEffect(() => {
    const signature = `${initialSubUnits?.length ?? 0}|${(initialSubUnits?.[0] as any)?.assetId ?? (initialSubUnits?.[0] as any)?.id ?? ''}`;
    if (initializedRef.current === signature) return;
    initializedRef.current = signature;

    if (initialSubUnits) {
      setTimeout(() => { setSavedFloors(mapSubUnitsToFloors(filterFloorSubmissionSubUnits(initialSubUnits), dbFloors, dropdownOptions)); }, 0);
    }
  }, [initialSubUnits, dbFloors, dropdownOptions]);

  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedFloorForView, setSelectedFloorForView] = useState<any>(null);
  const [isRenterDrawerOpen, setIsRenterDrawerOpen] = useState(false);

  useEffect(() => {
    if (assetFormId) {
      // No-op: floors are kept in sync via context
    }
  }, [assetFormId]);

  return {
    dbFloors, setDbFloors,
    savedFloors, setSavedFloors,
    isViewDrawerOpen, setIsViewDrawerOpen,
    selectedFloorForView, setSelectedFloorForView,
    isRenterDrawerOpen, setIsRenterDrawerOpen,
  };
}
