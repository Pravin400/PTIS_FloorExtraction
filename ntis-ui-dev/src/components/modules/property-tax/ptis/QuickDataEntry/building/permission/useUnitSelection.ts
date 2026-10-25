import type { UnitSelectionItem } from '@/types/building-permission.types';
import type { UnitStatusResolution } from '@/lib/utils/certificate-grid-mapper';
import type { FieldErrors, UnitRow } from './building-permission.types';

interface UseUnitSelectionParams {
  selectedUnitIds: Set<number>;
  setSelectedUnitIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  filteredUnits: UnitSelectionItem[];
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  unitStatusMap?: Map<number | string, UnitStatusResolution>;
  directEditingUnitId?: number | null;
  setDirectEditingUnitId?: React.Dispatch<React.SetStateAction<number | null>>;
}

export function useUnitSelection({
  selectedUnitIds,
  setSelectedUnitIds,
  filteredUnits,
  setFieldErrors,
  unitStatusMap,
  directEditingUnitId,
  setDirectEditingUnitId,
}: UseUnitSelectionParams) {
  const safeSelectedIds = selectedUnitIds || new Set<number>();

  const selectableUnits = filteredUnits.filter((u) => {
    const stat = unitStatusMap?.get(u.propertyDetailsId) || (u.propertyId != null ? unitStatusMap?.get(u.propertyId) : undefined);
    return stat?.status !== 'direct';
  });

  const hasSelectableUnits = selectableUnits.length > 0;

  const isAllUnitsSelected =
    hasSelectableUnits &&
    selectableUnits.every((u) => safeSelectedIds.has(u.propertyDetailsId) || (u.propertyId != null && safeSelectedIds.has(u.propertyId)));

  const handleToggleAllUnits = (forceSelect?: boolean) => {
    const shouldSelect = typeof forceSelect === 'boolean' ? forceSelect : !isAllUnitsSelected;
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      // Direct units can never be part of multi-select
      if (directEditingUnitId) {
        next.delete(directEditingUnitId);
        setDirectEditingUnitId?.(null);
      }
      if (unitStatusMap) {
        for (const id of next) {
          const stat = unitStatusMap.get(id);
          if (stat?.status === 'direct') {
            next.delete(id);
          }
        }
      }

      if (!shouldSelect) {
        selectableUnits.forEach((u) => {
          next.delete(u.propertyDetailsId);
          if (u.propertyId != null) next.delete(u.propertyId);
        });
      } else {
        selectableUnits.forEach((u) => next.add(u.propertyDetailsId));
      }
      return next;
    });
  };

  const handleToggleUnitSelection = (row: UnitRow) => {
    // If the unit has a direct certificate applied, user cannot toggle it via checkbox or row click
    if (row.certStatus === 'direct') return;

    const targetId = row.propertyDetailsId as number;
    const isSelected = safeSelectedIds.has(targetId) || (row.propertyId != null && safeSelectedIds.has(row.propertyId as number));

    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      // When user checks/unchecks a non-direct unit, remove any direct unit currently being edited
      if (directEditingUnitId) {
        next.delete(directEditingUnitId);
        setDirectEditingUnitId?.(null);
      }
      if (unitStatusMap) {
        for (const id of next) {
          const stat = unitStatusMap.get(id);
          if (stat?.status === 'direct') {
            next.delete(id);
          }
        }
      }

      if (isSelected) {
        next.delete(targetId);
        if (row.propertyId != null) next.delete(row.propertyId as number);
      } else {
        next.add(targetId);
      }
      return next;
    });

    setFieldErrors((prev) => {
      if (!prev.unit) return prev;
      const next = { ...prev };
      delete next.unit;
      return next;
    });
  };

  const handleEditUnit = (row: UnitRow) => {
    const targetId = row.propertyDetailsId as number;
    const isSelected = safeSelectedIds.has(targetId) || (row.propertyId != null && safeSelectedIds.has(row.propertyId as number));
    const isDirectApplied = row.certStatus === 'direct';

    if (isSelected) {
      // Cancel edit / unselect this unit
      setSelectedUnitIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        if (row.propertyId != null) next.delete(row.propertyId as number);
        return next;
      });
      if (isDirectApplied) {
        setDirectEditingUnitId?.(null);
      }
    } else {
      // Explicitly edit this single unit
      setSelectedUnitIds(new Set([targetId]));
      if (isDirectApplied) {
        setDirectEditingUnitId?.(targetId);
      } else {
        setDirectEditingUnitId?.(null);
      }
    }

    setFieldErrors((prev) => {
      if (!prev.unit) return prev;
      const next = { ...prev };
      delete next.unit;
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedUnitIds(new Set());
    setDirectEditingUnitId?.(null);
  };

  return {
    isAllUnitsSelected,
    hasSelectableUnits,
    handleToggleAllUnits,
    handleToggleUnitSelection,
    handleEditUnit,
    handleClearSelection,
  };
}
