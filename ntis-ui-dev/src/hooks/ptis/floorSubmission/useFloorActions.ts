'use client';

import { useCallback } from 'react';
import { FloorData } from '@/types/room-details.types';

/**
 * Hook for floor action handlers (Add, Reset, Lazy Loading)
 * Extracted from useFloorSubmission to reduce file size
 */
export const useFloorActions = (params: {
  setEditingFloorForm: React.Dispatch<React.SetStateAction<FloorData>>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedFloor: (val: FloorData | null) => void;
  setShowRoomSubmission: (val: boolean) => void;
  setIsAddingNewFloor: (val: boolean) => void;
  updateUrlParams: (params: Record<string, string | null>) => void;
  searchParams: URLSearchParams;
  startTransition: React.TransitionStartFunction;
  INITIAL_FORM_STATE: FloorData;
  floorData: unknown[];
}) => {
  const {
    setEditingFloorForm,
    setFormErrors,
    setSelectedFloor,
    setShowRoomSubmission,
    setIsAddingNewFloor,
    updateUrlParams: _updateUrlParams,
    searchParams,
    startTransition: _startTransition,
    INITIAL_FORM_STATE,
    floorData,
  } = params;

  // Lazy Loading Handlers - no-op for URL mutation to prevent server re-renders
  const handleOpenDropdown = useCallback(
    (_key: 'loadFloor' | 'loadSubFloor' | 'loadConstruction' | 'loadUsage' | 'loadSubType' | 'loadOpenPlotCategory') => {
      // Kept for backward compatibility without forcing server re-renders
    },
    []
  );

  const resetForm = useCallback(() => {
    setEditingFloorForm(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsAddingNewFloor(false);
    setSelectedFloor(null);
    setShowRoomSubmission(false);

    // Clear session storage
    try {
      const floorIdToClear = searchParams.get('floorId') || 'new';
      sessionStorage.removeItem(`renter_data_${floorIdToClear}`);
      sessionStorage.removeItem('renter_data_new');
      sessionStorage.removeItem('editingFloorForm');
    } catch (_e) { }
  }, [
    setEditingFloorForm,
    setFormErrors,
    setIsAddingNewFloor,
    setSelectedFloor,
    setShowRoomSubmission,
    INITIAL_FORM_STATE,
    searchParams,
  ]);

  const handleAddFloor = useCallback(() => {
    setEditingFloorForm(INITIAL_FORM_STATE);
    setFormErrors({});
    setSelectedFloor(null);
    setShowRoomSubmission(false);
    setIsAddingNewFloor(true);

    const gFloor = (floorData as { floorCode?: string; floorId?: number; description?: string }[]).find(
      (f) => f.floorCode === 'G' || f.description?.startsWith('G -') || f.description?.startsWith('G-')
    );
    if (gFloor) {
      setEditingFloorForm((prev) => ({
        ...prev,
        floorId: String(gFloor.floorId || gFloor.floorCode || ''),
        floor: gFloor.description || 'G - तळमजला',
        floorDescription: gFloor.description || 'G - तळमजला',
        rooms: '0',
      }));
    }
  }, [
    setEditingFloorForm,
    setFormErrors,
    setSelectedFloor,
    setShowRoomSubmission,
    setIsAddingNewFloor,
    INITIAL_FORM_STATE,
    floorData,
  ]);

  return {
    handleOpenDropdown,
    resetForm,
    handleAddFloor,
  };
};
