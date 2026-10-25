'use client';


import { useRef, useEffect } from "react";
import { } from "lucide-react";
import { useNAAssetForm } from "../../NAAssetFormContext";
import { UnitPoolPanel } from "./UnitPoolPanel";
import { DirectRoomRegistrationPanel } from "./DirectRoomRegistrationPanel";
import { useNAFloorAssetFlow } from "@/hooks/asset-hooks/floor-details/useNAFloorAssetFlow";

export default function FloorDetailsPage({
  dropdownOptions: initialDropdownOptions,
  initialSubUnits = [],
  initialFloors = [],
  initialSubUseTypeMap = {},
  initialDirectSubFloorOptions = [],
  initialDirectSubUseTypeOptions = [],
  mode = 'floorSubmission',
  editFloorId,
  onSuccess,
}: {
  dropdownOptions?: unknown;
  initialSubUnits?: unknown[];
  initialFloors?: unknown[];
  initialSubUseTypeMap?: Record<string, unknown>;
  initialDirectSubFloorOptions?: unknown[];
  initialDirectSubUseTypeOptions?: unknown[];
  mode?: 'floorSubmission' | 'generateUnits';
  editFloorId?: number | null;
  onSuccess?: (savedFloorItem?: unknown, options?: { keepDrawerOpen?: boolean }) => void;
}) {
  const { dropdownOptions } = useNAFloorAssetFlow(initialDropdownOptions);

  const { setIsDataLoading } = useNAAssetForm();
  const editEventRegistry = useRef<{ triggerEdit?: (childAssetId: number) => void }>({});

  // Trigger edit if editFloorId is passed down
  useEffect(() => {
    if (editFloorId && editEventRegistry.current.triggerEdit) {
      const runTrigger = () => {
        if (editEventRegistry.current.triggerEdit) {
          editEventRegistry.current.triggerEdit(editFloorId);
        }
      };
      const timer = setTimeout(runTrigger, 150);
      return () => clearTimeout(timer);
    }
  }, [editFloorId]);

  // Lock navigation buttons until hydration is complete
  useEffect(() => {
    setIsDataLoading?.(true);
    // Wait for two animation frames to ensure the browser has painted the content
    let rafId2: number;
    const rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        setIsDataLoading?.(false);
      });
    });
    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
    };
  }, [setIsDataLoading]);

  const isPoolUnit = (u: Record<string, unknown>) => {
    if (u.isDirectFloorSubmission === true || u.IsDirectFloorSubmission === true) {
      return false;
    }

    const rawType = String(u.unitType || u.type || u.subUnitType || '').trim().toUpperCase();
    if (
      rawType.includes('SHOP') ||
      rawType.includes('FLAT') ||
      rawType.includes('OFFICE') ||
      rawType.includes('DEPARTMENT') ||
      rawType.includes('DEPT')
    ) {
      return true;
    }
    const values = [u.unitType, u.unitNo, u.shopUnitName, u.name, u.assetNo, u.assetCode, u.unitNumber, u.assetName]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    if (values.includes('SHOP') || values.includes('FLAT') || values.includes('OFFICE')) {
      return true;
    }
    const isDirectRoom =
      values.includes('FLOOR') ||
      values.includes('ROOM') ||
      values.includes('AMENITY') ||
      values.includes('OPEN SPACE') ||
      values.includes('OPENSPACE') ||
      u.isRoomWiseValuationActive === true ||
      u.IsRoomWiseValuationActive === true;
    return !isDirectRoom;
  };

  const poolSubUnits = initialSubUnits.filter((u: unknown) => isPoolUnit(u as Record<string, unknown>));
  const directRoomSubUnits = initialSubUnits.filter((u: unknown) => !isPoolUnit(u as Record<string, unknown>));

  const isEditingPoolUnit = editFloorId ? poolSubUnits.some((u: unknown) => Number((u as Record<string, unknown>).assetId || (u as Record<string, unknown>).id || (u as Record<string, unknown>).dbId || (u as Record<string, unknown>).subUnitsDetailsId) === editFloorId) : false;
  const effectiveMode = isEditingPoolUnit ? 'generateUnits' : mode;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {effectiveMode === 'generateUnits' ? (
        <UnitPoolPanel
          dropdownOptions={dropdownOptions}
          initialSubUnits={poolSubUnits}
          initialFloors={initialFloors}
          editEventRegistry={editEventRegistry}
          mode={effectiveMode}
          editFloorId={editFloorId}
          onSuccess={onSuccess}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible p-2 md:p-3">
          <DirectRoomRegistrationPanel
            dropdownOptions={dropdownOptions}
            initialFloors={initialFloors}
            initialSubUnits={directRoomSubUnits}
            editEventRegistry={editEventRegistry}
            initialSubUseTypeMap={initialSubUseTypeMap}
            initialSubFloorOptions={initialDirectSubFloorOptions}
            initialSubUseTypeOptions={initialDirectSubUseTypeOptions}
            editFloorId={editFloorId}
            onSuccess={onSuccess}
          />
        </div>
      )}


    </div>
  );
}

