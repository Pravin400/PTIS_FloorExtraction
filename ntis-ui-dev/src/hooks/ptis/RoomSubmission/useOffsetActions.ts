import { useCallback } from "react";
import { useConfirm } from "@/components/common";
import { useTranslations } from "next-intl";
import { OffsetData } from "@/types/offset-details.types";
import { ShapeParameters } from "@/types/common-details.types";
import { RoomData } from "@/types/room-details.types";
import {
  INITIAL_OFFSET_DATA,
  OFFSET_OPERATIONS
} from "@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/constants/room-submission.constants";
import {
  isOffsetValid,
  calculateRoomArea
} from "@/lib/utils/RoomSubmission/room-submission.utils";
import {
  calculateSingleShapeArea,
  calculateNetAdjustment,
  calculateRoomAreas
} from "@/lib/utils/RoomSubmission/room-calculation.util";
import { RoomSubmissionState } from "./useRoomSubmissionState";
import { focusAndOpenOuterField, focusOffsetShapeSelect } from "@/lib/utils/floorSubmission/focus-helpers";

const isPersistedId = (id?: string | number): id is string | number => {
  if (!id) return false;
  // Exclude temp IDs by prefix (e.g., 'temp-')
  if (typeof id === 'string') {
    if (id.startsWith('temp-')) return false;
    // Accept numeric strings as valid DB IDs
    const n = Number(id);
    return Number.isFinite(n) && n > 0;
  }
  return typeof id === 'number' && Number.isFinite(id) && id > 0;
};

export const useOffsetActions = (state: RoomSubmissionState, handleEdit: (idx: number, room?: RoomData) => void) => {
  const { confirm } = useConfirm();
  const t = useTranslations("quickDataEntry");
  const {
    offsetList, setOffsetList, offsetData, setOffsetData,
    selectedOperation, setSelectedOperation, setIsShakingSubtract,
    setOffsetValidationError, selectedShape, setSelectedShape,
    setOffsetModalOpen, setCurrentRoomOffsets, setFormData,
    rooms, setRooms, editingIndex, pendingOffsetModalOpenRef, formData, shapeParameters,
    focusRefs
  } = state;

  const calculateAdjustedRoomTotal = useCallback((): number => {
    const baseArea = calculateRoomArea(formData, shapeParameters);
    return baseArea + calculateNetAdjustment(offsetList);
  }, [formData, shapeParameters, offsetList]);

  const handleOpenOffset = useCallback((index: number) => {
    const room = rooms[index];
    if (!room) return;
    pendingOffsetModalOpenRef.current = true;
    handleEdit(index, room);
  }, [rooms, handleEdit, pendingOffsetModalOpenRef]);

  const handleSubtractClick = () => {
    if (offsetData.area > 0) {
      if (calculateAdjustedRoomTotal() - offsetData.area < 0) {
        setOffsetValidationError(t("offsetValidation.negative"));
        setIsShakingSubtract(true);
        setTimeout(() => setIsShakingSubtract(false), 300);
        return;
      }
    }
    setOffsetValidationError("");
    setSelectedOperation(OFFSET_OPERATIONS.SUBTRACT);
  };

  // Switches the active offset operation to "add" (positive area adjustment).
  // No negative-balance check needed — adding area cannot underflow.
  const handleAddClick = () => {
    setOffsetValidationError("");
    setSelectedOperation(OFFSET_OPERATIONS.ADD);
  };

  const handleOffsetInputChange = (field: keyof OffsetData, value: string) => {
    setOffsetData((prev: OffsetData) => {
      const updated = { ...prev, [field]: value };
      updated.area = calculateSingleShapeArea(selectedShape, updated as unknown as ShapeParameters);
      setOffsetValidationError(""); // Reset error on change
      return updated;
    });
  };

  const handleShapeChange = (shape: string) => {
    setSelectedShape(shape);
    setOffsetData({ ...INITIAL_OFFSET_DATA, shapeType: shape, shape: shape, operation: selectedOperation || OFFSET_OPERATIONS.SUBTRACT });
    setOffsetValidationError("");
  };

  const handleAddOffset = () => {
    if (!isOffsetValid(offsetData, selectedShape) || !selectedOperation) return;
    if (selectedOperation === OFFSET_OPERATIONS.SUBTRACT && calculateAdjustedRoomTotal() - offsetData.area < 0) {
      setOffsetValidationError(t("offsetValidation.negative"));
      setIsShakingSubtract(true);
      setTimeout(() => setIsShakingSubtract(false), 300);
      return;
    }
    setOffsetList((prev) => [...prev, { ...offsetData, shapeType: selectedShape, operation: selectedOperation }]);
    setOffsetData({ ...INITIAL_OFFSET_DATA, shapeType: selectedShape, shape: selectedShape, operation: selectedOperation });
    setOffsetValidationError("");
    setTimeout(() => {
      focusOffsetShapeSelect(true);
    }, 50);
  };

  const handleOffsetOk = () => {
    const currentList = [...offsetList];
    setCurrentRoomOffsets(currentList);
    setFormData(prev => ({ ...prev, offsetMinus: currentList.length > 0 ? "Yes" : "No" }));
    setOffsetModalOpen(false);
    setOffsetList([]);
    setOffsetData(INITIAL_OFFSET_DATA);

    if (editingIndex !== null && rooms[editingIndex]) {
      setRooms(prev => {
        const updated = [...prev];
        const room = {
          ...updated[editingIndex],
          offsets: currentList,
          roomWiseMinusData: currentList // Sync for API mapper
        };
        // Use calculateRoomAreas for consistent total (outer, offset, etc)
        const mainArea = Number(room.area || 0);
        const offsetArea = currentList.reduce((sum, o) => sum + (o.operation === 'subtract' ? Number(o.area || 0) : 0), 0);
        const { carpetArea, builtUpArea } = calculateRoomAreas(
          mainArea,
          currentList.length > 0 ? 'Yes' : 'No',
          offsetArea,
          room.outer
        );
        room.total = carpetArea;
        room.carpetArea = carpetArea;
        room.builtUpArea = builtUpArea;
        updated[editingIndex] = room;
        return updated;
      });
    }

    setTimeout(() => {
      focusAndOpenOuterField(focusRefs);
    }, 150);
  };

  const handleDeleteOffset = (idx: number) => {
    confirm({
      variant: 'delete',
      title: t('offset.deleteConfirm.title'),
      description: t('offset.deleteConfirm.message'),
      confirmText: t('offset.deleteConfirm.delete'),
      cancelText: t('offset.deleteConfirm.cancel'),
      onConfirm: async () => {
        const offsetToDelete = offsetList[idx];
        const offsetDbId = offsetToDelete?.id || offsetToDelete?.roomWiseMinusId;

        // Stage for deletion on final save instead of immediate delete
        if (isPersistedId(offsetDbId)) {
          state.setPendingDeletions(prev => ({
            ...prev,
            offsets: [...prev.offsets, offsetDbId]
          }));
        }

        const updated = offsetList.filter((_, i) => i !== idx);
        setOffsetList(updated);
        setCurrentRoomOffsets(updated);

        if (editingIndex !== null && rooms[editingIndex]) {
          setRooms(prev => {
            const updatedRooms = [...prev];
            const room = {
              ...updatedRooms[editingIndex],
              offsets: updated,
              roomWiseMinusData: updated // Sync for API mapper
            };
            // Use calculateRoomAreas for consistent total (outer, offset, etc)
            const mainArea = Number(room.area || 0);
            const offsetArea = updated.reduce((sum, o) => sum + (o.operation === 'subtract' ? Number(o.area || 0) : 0), 0);
            const { carpetArea, builtUpArea } = calculateRoomAreas(
              mainArea,
              updated.length > 0 ? 'Yes' : 'No',
              offsetArea,
              room.outer
            );
            room.total = carpetArea;
            room.carpetArea = carpetArea;
            room.builtUpArea = builtUpArea;
            updatedRooms[editingIndex] = room;
            return updatedRooms;
          });
        }
      }
    });
  };

  const handleOffsetClose = useCallback(() => {
    // If no offset data was saved (currentRoomOffsets is empty), revert offsetMinus to "No"
    if (state.currentRoomOffsets.length === 0) {
      setFormData(prev => ({ ...prev, offsetMinus: "No" }));
    }
    setOffsetModalOpen(false);
    setOffsetList([]);
    setOffsetData(INITIAL_OFFSET_DATA);

    setTimeout(() => {
      focusAndOpenOuterField(focusRefs);
    }, 150);
  }, [state.currentRoomOffsets, setFormData, setOffsetModalOpen, setOffsetList, setOffsetData, focusRefs]);

  return {
    handleOpenOffset, handleSubtractClick, handleAddClick, handleOffsetInputChange,
    handleShapeChange, handleAddOffset, handleOffsetOk, handleDeleteOffset, handleOffsetClose,
    calculateAdjustedRoomTotal
  };
};
