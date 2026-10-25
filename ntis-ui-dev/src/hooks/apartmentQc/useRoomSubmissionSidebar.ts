import { useState, useCallback } from 'react';
import { fetchRoomWiseSubmissionsAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import type { RoomAPIResponse } from '@/types/room-details.types';
import type {
  FloorDataRow,
  RoomSubmissionSidebarState,
  RoomSubmissionUpdateData,
  PropertyEditFormCopy,
} from '@/types/propertyEdit.types';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface UseRoomSubmissionSidebarArgs {
  propertyId: number;
  onAreaUpdate: (rowId: string, newArea: string) => void;
  copy: PropertyEditFormCopy;
}

/**
 * Hook for managing room submission sidebar
 * 
 * Handles:
 * - Opening/closing sidebar
 * - Fetching room data for selected floor
 * - Area unit toggle
 * - Updating floor area after room changes
 */
export function useRoomSubmissionSidebar({
  propertyId,
  onAreaUpdate,
  copy,
}: UseRoomSubmissionSidebarArgs) {
  const [state, setState] = useState<RoomSubmissionSidebarState>({
    isOpen: false,
    selectedFloorRow: null,
    areaUnit: 'sq.m',
    isLoading: false,
    existingRooms: [],
  });

  /**
   * Opens the room submission sidebar for a floor row
   */
  const handleOpen = useCallback(async (row: FloorDataRow) => {
    if (!row.pdnId) {
      toast.error(copy.messages.cannotOpenRoomSubmission);
      return;
    }

    setState(prev => ({
      ...prev,
      isOpen: true,
      selectedFloorRow: row,
      isLoading: true,
      existingRooms: [],
    }));

    try {
      const result = await fetchRoomWiseSubmissionsAction({
        propertyId,
        propertyDetailsId: row.pdnId,
      });

      if (result.success && result.data) {
        const rooms = Array.isArray(result.data) ? result.data : [];
        
        const mapped: RoomAPIResponse[] = (rooms as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => ({
          id: (r.id || r.roomWiseSubmissionId) as number,
          roomWiseSubmissionId: (r.id || r.roomWiseSubmissionId) as number,
          roomNo: String(r.roomNo || ''),
          lengthMtr: (r.lengthMtr as number) || 0,
          widthMtr: (r.widthMtr as number) || 0,
          heightMtr: (r.heightMtr as number) || 0,
          areaSqMtr: (r.areaSqMtr as number) || 0,
          noOfRooms: (r.noOfRooms as number) || 1,
          totalAreaSqMtr: (r.totalAreaSqMtr as number) || 0,
          roomType: (r.roomType as string) || '',
          roomTypeId: r.roomTypeId as number,
          shape: (r.shape as string) || 'Rectangle',
          outerYesNo: (r.outerYesNo as boolean) || false,
          minusYesNo: (r.minusYesNo as boolean) || false,
          submissionType: (r.submissionType as string) || 'room',
          base1Mtr: (r.base1Mtr as number) || 0,
          base2Mtr: (r.base2Mtr as number) || 0,
          roomWiseMinusData: (r.roomWiseMinusData as Record<string, unknown>[]) || [],
        }));

        setState(prev => ({
          ...prev,
          isLoading: false,
          existingRooms: mapped,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          existingRooms: [],
        }));
      }
    } catch (error) {
      logger.error('[RoomSubmissionSidebar] Failed to fetch rooms', { error: error as Error });
      toast.error(copy.messages.failedToLoadRooms);
      setState(prev => ({
        ...prev,
        isLoading: false,
        existingRooms: [],
      }));
    }
  }, [propertyId, copy.messages]);

  /**
   * Closes the room submission sidebar
   */
  const handleClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      selectedFloorRow: null,
    }));
  }, []);

  /**
   * Updates the floor area after room submission changes, then asks the
   * backend to recompute room aggregates for this floor (sync-rooms).
   */
  const handleUpdate = useCallback(async (data: RoomSubmissionUpdateData) => {
    const { selectedFloorRow } = state;
    if (!selectedFloorRow) return;

    // Update the floor row area (existing behavior)
    onAreaUpdate(selectedFloorRow.id, data.totalAreaSqM.toFixed(2));
    toast.success(copy.messages.roomDataUpdated);

    // Follow-up: trigger backend room-aggregate sync for this floor's
    // property-details ID (= roomPdnId). The PUT save has already succeeded
    // by the time this callback runs; sync failure should not undo the area
    // update, so we surface its error via a separate toast.
    if (selectedFloorRow.pdnId && propertyId) {
      try {
        const { syncRoomsForPropertyDetailsAction } =
          await import("@/app/[locale]/property-tax/ptis/appartmentQC/action");
        const result = await syncRoomsForPropertyDetailsAction(propertyId, selectedFloorRow.pdnId);
        if (!result.success) {
          toast.error(result.error || "Failed to sync rooms");
        }
      } catch {
        toast.error("Failed to sync rooms");
      }
    }
  }, [state, propertyId, onAreaUpdate, copy.messages]);

  /**
   * Toggles the area unit between sq.m and sq.ft
   */
  const handleToggleUnit = useCallback(() => {
    setState(prev => ({
      ...prev,
      areaUnit: prev.areaUnit === 'sq.m' ? 'sq.ft' : 'sq.m',
    }));
  }, []);

  return {
    state,
    handleOpen,
    handleClose,
    handleUpdate,
    handleToggleUnit,
  };
}
