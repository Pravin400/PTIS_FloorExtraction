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
import { RoomSubmissionState } from "../ptis/RoomSubmission/useRoomSubmissionState";

const isPersistedId = (id?: string | number): id is string | number => {
  if (!id) return false;
  if (typeof id === 'string') {
    if (id.startsWith('temp-')) return false;
    const n = Number(id);
    return Number.isFinite(n) && n > 0;
  }
  return typeof id === 'number' && Number.isFinite(id) && id > 0;
};

export const useApartmentQCOffsetActions = (state: RoomSubmissionState, handleEdit: (idx: number, room?: RoomData) => void) => {
  const { confirm } = useConfirm();
  const t = useTranslations("quickDataEntry");
  const {
    offsetList, setOffsetList, offsetData, setOffsetData,
    selectedOperation, setSelectedOperation, setIsShakingSubtract,
    setOffsetValidationError, selectedShape, setSelectedShape,
    setOffsetModalOpen, setCurrentRoomOffsets, currentRoomOffsets,
    setFormData,
    rooms, setRooms, editingIndex, pendingOffsetModalOpenRef, formData, shapeParameters,
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

  const handleAddClick = () => {
    setOffsetValidationError("");
    setSelectedOperation(OFFSET_OPERATIONS.ADD);
  };

  const handleOffsetInputChange = (field: keyof OffsetData, value: string) => {
    setOffsetData((prev: OffsetData) => {
      const updated = { ...prev, [field]: value };
      updated.area = calculateSingleShapeArea(selectedShape, updated as unknown as ShapeParameters);
      setOffsetValidationError("");
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
  };

  const handleOffsetOk = () => {
    const currentList = [...offsetList];
    if (isOffsetValid(offsetData, selectedShape) && selectedOperation) {
      if (!(selectedOperation === OFFSET_OPERATIONS.SUBTRACT && calculateAdjustedRoomTotal() - offsetData.area < 0)) {
        currentList.push({ ...offsetData, shapeType: selectedShape, operation: selectedOperation });
      }
    }
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
          roomWiseMinusData: currentList
        };
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
  };

  const handleOffsetClose = useCallback(() => {
    if (!currentRoomOffsets || currentRoomOffsets.length === 0) {
      setFormData(prev => ({ ...prev, offsetMinus: "No" }));
    }
    setOffsetModalOpen(false);
    setOffsetList([]);
    setOffsetData(INITIAL_OFFSET_DATA);
  }, [currentRoomOffsets, setFormData, setOffsetModalOpen, setOffsetList, setOffsetData]);

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

        if (isPersistedId(offsetDbId)) {
          try {
            const { deleteRoomWiseMinusAction } = await import("@/app/[locale]/property-tax/ptis/appartmentQC/action");
            await deleteRoomWiseMinusAction(Number(offsetDbId));
          } catch (error) {
            console.error("Failed to delete offset:", error);
          }
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
              roomWiseMinusData: updated
            };
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

  return {
    handleOpenOffset, handleSubtractClick, handleAddClick, handleOffsetInputChange,
    handleShapeChange, handleAddOffset, handleOffsetOk, handleOffsetClose, handleDeleteOffset,
    calculateAdjustedRoomTotal
  };
};
