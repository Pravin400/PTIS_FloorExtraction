'use client';

import { useMemo } from 'react';
import { FloorData } from '@/types/room-details.types';
import { isApartmentCategory } from '@/lib/utils/ptis/category-helpers';

interface UseFloorAreaValidationProps {
  localFloors: FloorData[];
  selectedFloor: FloorData | null;
  editingFloorForm: FloorData;
  selectedFloorType: 'Construction' | 'OpenPlot';
  isAddingNewFloor: boolean;
  plotAreaSqM: number;
  floorLookup?: unknown[];
  initialFloors?: FloorData[];
  propertyCategoryName?: string | null;
}

const OPEN_PLOT_KEYWORDS = ['open plot', 'open space', 'खुला', 'भूखंड', 'खुली जागा'] as const;

/**
 * Checks if a floor record is an Open Space / Open Plot record
 * (e.g. conTyp/floorCode === 'op', selectedFloorType === 'OpenPlot', etc.).
 */
export const isRecordOpenPlot = (floor?: FloorData | Record<string, unknown> | null): boolean => {
  if (!floor) return false;
  if (floor.selectedFloorType === 'OpenPlot') return true;
  if (floor.isOpenPlot === true || floor.isOpenPlot === 'true' || floor.isOpenPlot === 1 || String(floor.isOpenPlot) === '1') return true;

  const conCodeOrDesc = String(
    floor.conTyp || floor.constructionTypeDescription || floor.constructionTypeId || ''
  ).toLowerCase().trim();

  if (
    conCodeOrDesc === 'op' ||
    conCodeOrDesc.startsWith('op-') ||
    conCodeOrDesc.startsWith('op -') ||
    OPEN_PLOT_KEYWORDS.some((kw) => conCodeOrDesc.includes(kw))
  ) return true;

  const floorStr = String(floor.floorId || floor.floor || floor.floorDescription || '').toLowerCase().trim();
  if (
    floorStr === 'op' ||
    floorStr.startsWith('op-') ||
    floorStr.startsWith('op -') ||
    OPEN_PLOT_KEYWORDS.some((kw) => floorStr.includes(kw))
  ) return true;

  return false;
};

/**
 * Checks if a floor record is specifically "G - तळमजला" (Ground Floor).
 * Cumulative ground coverage (Ground Floor + Open Space) is ONLY validated for "G - तळमजla".
 */
export const isGroundFloorRecord = (floor: FloorData) => {
  if (!floor) return false;
  if (isRecordOpenPlot(floor)) return false;

  const floorIdStr = String(floor.floorId || '').trim().toLowerCase();
  const floorCodeStr = String(floor.floorCode || floor.code || '').trim().toLowerCase();
  const floorNameStr = String(floor.floorDescription || floor.floorName || floor.floor || '').toLowerCase().trim();

  // "1 - पहिला मजला" / "First Floor" is 1st Floor, NOT Ground Floor!
  if (
    floorNameStr.includes('पहिला') ||
    floorNameStr.includes('first') ||
    floorNameStr.startsWith('1 -') ||
    floorNameStr.startsWith('1-')
  ) {
    return false;
  }

  // "2 - दुसरा मजला", "3 - तिसरा मजला", etc. are Upper Floors
  if (
    floorNameStr.includes('दुसरा') ||
    floorNameStr.includes('तिसरा') ||
    floorNameStr.includes('second') ||
    floorNameStr.includes('third') ||
    floorNameStr.startsWith('2 -') ||
    floorNameStr.startsWith('2-') ||
    floorNameStr.startsWith('3 -') ||
    floorNameStr.startsWith('3-')
  ) {
    return false;
  }

  // Ground Floor is identified by '0', 'g', or Marathi "G - तळमजला" / "ground"
  if (floorIdStr === '0' || floorIdStr === 'g' || floorCodeStr === 'g') return true;

  if (
    floorNameStr === 'g' ||
    floorNameStr.startsWith('g -') ||
    floorNameStr.startsWith('g-') ||
    floorNameStr.includes('ground') ||
    floorNameStr.includes('talamajla') ||
    floorNameStr.includes('तळमजला')
  ) {
    return true;
  }

  return false;
};

/**
 * useFloorAreaValidation Hook
 *
 * Enforces plot area validations:
 * 1. Single Floor Limit (Applies to ALL floors including 1st floor, 2nd floor, etc.):
 *    No individual floor's built-up area can exceed Total Plot Area.
 * 2. Ground Plot Coverage Limit (Applies to "G - तळमजला" + Open Space):
 *    Ground Floor Built-up Area + Open Space Area ≤ Total Plot Area.
 */
export const useFloorAreaValidation = ({
  localFloors,
  selectedFloor,
  editingFloorForm,
  selectedFloorType,
  isAddingNewFloor,
  plotAreaSqM,
  floorLookup: _floorLookup,
  initialFloors,
  propertyCategoryName,
}: UseFloorAreaValidationProps) => {
  const isApartment = useMemo(() => {
    return isApartmentCategory(propertyCategoryName);
  }, [propertyCategoryName]);

  // Use initialFloors if localFloors is not yet populated to avoid flash of incorrect calculations
  const activeFloors = useMemo(() => {
    return localFloors.length > 0 ? localFloors : (initialFloors || []);
  }, [localFloors, initialFloors]);

  // Identify the Master Property Plot Header Record (the non-user record holding total property plot area 1000 Sq M)
  const masterPlotRecordId = useMemo(() => {
    const master = activeFloors.find(
      (f) =>
        isRecordOpenPlot(f) &&
        (Number(f.carpetAreaSqMeter || f.builtupAreaSqMeter || 0) === plotAreaSqM || plotAreaSqM > 0)
    );
    return master?.id;
  }, [activeFloors, plotAreaSqM]);

  // 1. Calculate already utilized Ground Floor Construction Area ("G - तळमजला" only)
  const alreadyUtilizedGroundFloorAreaSqM = useMemo(() => {
    const groundFloors = activeFloors.filter(
      (f) =>
        !isRecordOpenPlot(f) &&
        isGroundFloorRecord(f) &&
        f.id !== masterPlotRecordId &&
        (!selectedFloor || f.id !== selectedFloor.id)
    );
    const sum = groundFloors.reduce((s, f) => {
      const area = parseFloat(String(f.builtupAreaSqM || f.areaSqM || '0')) || 0;
      return s + area;
    }, 0);
    return Math.round(sum * 10000) / 10000;
  }, [activeFloors, selectedFloor, masterPlotRecordId]);

  // Total Construction Area of ALL floors (for display metrics)
  const totalAllFloorsConstructionAreaSqM = useMemo(() => {
    const constructionFloors = activeFloors.filter(
      (f) =>
        !isRecordOpenPlot(f) &&
        f.id !== masterPlotRecordId &&
        (!selectedFloor || f.id !== selectedFloor.id)
    );
    const sum = constructionFloors.reduce((s, f) => {
      const area = parseFloat(String(f.builtupAreaSqM || f.areaSqM || '0')) || 0;
      return s + area;
    }, 0);
    return Math.round(sum * 10000) / 10000;
  }, [activeFloors, selectedFloor, masterPlotRecordId]);

  // 2. Calculate already utilized Open Space Area (excluding master plot record & currently edited floor)
  const alreadyUtilizedOpenSpaceAreaSqM = useMemo(() => {
    const openSpaceFloors = activeFloors.filter(
      (f) =>
        isRecordOpenPlot(f) &&
        f.id !== masterPlotRecordId &&
        (!selectedFloor || f.id !== selectedFloor.id)
    );
    const sum = openSpaceFloors.reduce((s, f) => {
      const area = parseFloat(String(f.areaSqM || f.builtupAreaSqM || '0')) || 0;
      return s + area;
    }, 0);
    return Math.round(sum * 10000) / 10000;
  }, [activeFloors, selectedFloor, masterPlotRecordId]);

  // Is current active form editing/adding "G - तळमजला" (Ground Floor)?
  const isEditingGroundFloor = useMemo(() => {
    return isGroundFloorRecord(editingFloorForm);
  }, [editingFloorForm]);

  // 3. Entered Ground Floor Construction Area from active form (0 if editing an Upper Floor like 1 - पहिला मजला)
  const enteredGroundFloorAreaSqM = useMemo(() => {
    if (!selectedFloor && !isAddingNewFloor) return 0;
    if (selectedFloorType === 'Construction' && isEditingGroundFloor) {
      const area = parseFloat(String(editingFloorForm.builtupAreaSqM || editingFloorForm.areaSqM || '0')) || 0;
      return Math.round(area * 10000) / 10000;
    }
    return 0;
  }, [editingFloorForm, selectedFloorType, selectedFloor, isAddingNewFloor, isEditingGroundFloor]);

  // Entered Construction Area (any floor)
  const enteredConstructionAreaSqM = useMemo(() => {
    if (!selectedFloor && !isAddingNewFloor) return 0;
    if (selectedFloorType === 'Construction') {
      const area = parseFloat(String(editingFloorForm.builtupAreaSqM || editingFloorForm.areaSqM || '0')) || 0;
      return Math.round(area * 10000) / 10000;
    }
    return 0;
  }, [editingFloorForm, selectedFloorType, selectedFloor, isAddingNewFloor]);

  // 4. Entered Open Space Area from active form
  const enteredOpenSpaceAreaSqM = useMemo(() => {
    if (!selectedFloor && !isAddingNewFloor) return 0;
    if (selectedFloorType === 'OpenPlot') {
      const area = parseFloat(String(editingFloorForm.areaSqM || editingFloorForm.builtupAreaSqM || '0')) || 0;
      return Math.round(area * 10000) / 10000;
    }
    return 0;
  }, [editingFloorForm, selectedFloorType, selectedFloor, isAddingNewFloor]);

  // 5. Total Ground Construction Area (saved Ground Floor + current active Ground Floor)
  const totalGroundConstructionAreaSqM = useMemo(() => {
    return Math.round((alreadyUtilizedGroundFloorAreaSqM + enteredGroundFloorAreaSqM) * 10000) / 10000;
  }, [alreadyUtilizedGroundFloorAreaSqM, enteredGroundFloorAreaSqM]);

  // 6. Total Open Space Area (saved Open Space + current active Open Space)
  const totalOpenSpaceAreaSqM = useMemo(() => {
    return Math.round((alreadyUtilizedOpenSpaceAreaSqM + enteredOpenSpaceAreaSqM) * 10000) / 10000;
  }, [alreadyUtilizedOpenSpaceAreaSqM, enteredOpenSpaceAreaSqM]);

  // 7. Grand Total Ground Utilized Area = Ground Floor Construction + Open Space Area
  const grandTotalGroundUtilizedAreaSqM = useMemo(() => {
    return Math.round((totalGroundConstructionAreaSqM + totalOpenSpaceAreaSqM) * 10000) / 10000;
  }, [totalGroundConstructionAreaSqM, totalOpenSpaceAreaSqM]);

  // 8. Remaining Available Plot Area for Ground Coverage
  const remainingAvailablePlotAreaSqM = useMemo(() => {
    const rawRemaining = plotAreaSqM - grandTotalGroundUtilizedAreaSqM;
    return Math.max(0, Math.round(rawRemaining * 10000) / 10000);
  }, [plotAreaSqM, grandTotalGroundUtilizedAreaSqM]);

  // 9. Available Remaining Ground Construction Area
  const availableRemainingConstructionAreaSqM = useMemo(() => {
    const maxAvail = plotAreaSqM - alreadyUtilizedGroundFloorAreaSqM - alreadyUtilizedOpenSpaceAreaSqM;
    return Math.max(0, Math.round(maxAvail * 10000) / 10000);
  }, [plotAreaSqM, alreadyUtilizedGroundFloorAreaSqM, alreadyUtilizedOpenSpaceAreaSqM]);

  // 10. Available Remaining Open Space Area
  const availableRemainingOpenSpaceAreaSqM = useMemo(() => {
    const maxAvail = plotAreaSqM - alreadyUtilizedGroundFloorAreaSqM - alreadyUtilizedOpenSpaceAreaSqM;
    return Math.max(0, Math.round(maxAvail * 10000) / 10000);
  }, [plotAreaSqM, alreadyUtilizedGroundFloorAreaSqM, alreadyUtilizedOpenSpaceAreaSqM]);

  // 11. Construction Validation
  const isFloorAreaExceeded = useMemo(() => {
    if (isApartment) return false;
    if (selectedFloorType !== 'Construction') return false;
    if (!selectedFloor && !isAddingNewFloor) return false;

    const roundedPlotArea = Math.round(plotAreaSqM * 10000) / 10000;
    if (roundedPlotArea <= 0) return true;

    // Rule 1: Individual floor built-up area cannot exceed Total Plot Area (applies to ALL floors including 1st Floor, 2nd Floor, etc.)
    if (enteredConstructionAreaSqM > roundedPlotArea) return true;

    // Rule 2: Cumulative Ground Coverage (Ground Floor + Open Space) cannot exceed Total Plot Area (applies to Ground Floor ONLY)
    if (isEditingGroundFloor && grandTotalGroundUtilizedAreaSqM > roundedPlotArea) return true;

    return false;
  }, [isApartment, selectedFloorType, selectedFloor, isAddingNewFloor, isEditingGroundFloor, plotAreaSqM, enteredConstructionAreaSqM, grandTotalGroundUtilizedAreaSqM]);

  // 12. Open Space Validation: Open Space Area + Ground Floor Area ("G - तळमजला") ≤ Total Plot Area
  const isOpenSpaceAreaExceeded = useMemo(() => {
    if (isApartment) return false;
    if (selectedFloorType !== 'OpenPlot') return false;
    if (!selectedFloor && !isAddingNewFloor) return false;

    const roundedPlotArea = Math.round(plotAreaSqM * 10000) / 10000;
    if (roundedPlotArea <= 0) return true;
    if (enteredOpenSpaceAreaSqM > roundedPlotArea) return true;
    if (grandTotalGroundUtilizedAreaSqM > roundedPlotArea) return true;

    return false;
  }, [isApartment, selectedFloorType, selectedFloor, isAddingNewFloor, plotAreaSqM, enteredOpenSpaceAreaSqM, grandTotalGroundUtilizedAreaSqM]);

  const isAreaExceeded = useMemo(() => {
    return isFloorAreaExceeded || isOpenSpaceAreaExceeded;
  }, [isFloorAreaExceeded, isOpenSpaceAreaExceeded]);

  const isPlotAreaZeroOrNegative = useMemo(() => {
    if (isApartment) return false;
    return plotAreaSqM <= 0;
  }, [isApartment, plotAreaSqM]);

  return {
    totalConstructionAreaSqM: totalAllFloorsConstructionAreaSqM,
    totalOpenSpaceAreaSqM,
    grandTotalUtilizedAreaSqM: grandTotalGroundUtilizedAreaSqM,
    remainingAvailablePlotAreaSqM,
    availableRemainingOpenSpaceAreaSqM,
    availableRemainingConstructionAreaSqM,
    alreadyUtilizedConstructionAreaSqM: alreadyUtilizedGroundFloorAreaSqM,
    alreadyUtilizedOpenSpaceAreaSqM,
    isOpenSpaceAreaExceeded,
    isFloorAreaExceeded,
    isAreaExceeded,
    isPlotAreaZeroOrNegative,
    enteredFloorAreaSqM: enteredConstructionAreaSqM,
    enteredOpenSpaceAreaSqM,
    currentTotalGroundFloorAreaSqM: totalGroundConstructionAreaSqM,
    isGroundFloorAreaExceeded: isFloorAreaExceeded,
    isOpenSpaceNegative: false,
  };
};
