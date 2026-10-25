import { useCallback } from "react";
import { RoomData, ShapeParameters } from "@/types/room-details.types";
import { OffsetData } from "@/types/offset-details.types";
import { INITIAL_SHAPE_PARAMETERS, INITIAL_ROOM_FORM_STATE } from "@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/constants/room-submission.constants";
import { RoomSubmissionState } from "./useRoomSubmissionState";

export const useRoomEditActions = (state: RoomSubmissionState) => {
  const {
    rooms, setEditingIndex, setIsEditMode, setFormData, setCurrentRoomOffsets,
    setShapeParameters, setFilledParameters, setSelectedRoomForPlan,
    setValidationErrors, setOffsetList, setOffsetData, setSelectedOperation,
    setSelectedShape, setOffsetModalOpen, pendingOffsetModalOpenRef, focusRefs
  } = state;

  const handleEdit = useCallback((index: number, roomData?: RoomData) => {
    const room = roomData || rooms[index];
    if (!room) return;

    setEditingIndex(index);
    setIsEditMode(true);

    const rawParams = (room.shapeParameters || room.shapeParams || {}) as ShapeParameters;

    const params: ShapeParameters = {
      ...INITIAL_SHAPE_PARAMETERS,
      ...rawParams,
      length: String(rawParams.length || room.length || room.lengthMtr || "0"),
      width: String(rawParams.width || room.width || room.widthMtr || "0"),
      radius: String(rawParams.radius || room.radius || room.base1Mtr || "0"),
      base: String(rawParams.base || room.base || room.base1Mtr || "0"),
      height: String(rawParams.height || room.height || room.heightMtr || "0"),
      side: String(rawParams.side || room.side || room.length || room.lengthMtr || "0"),
      base1: String(rawParams.base1 || room.base1 || room.base1Mtr || "0"),
      base2: String(rawParams.base2 || room.base2 || room.base2Mtr || "0"),
    };

    setFormData({
      roomNo: String(room.roomNo || ''),
      length: String(params.length || "0"),
      width: String(params.width || "0"),
      roomCount: String(room.roomCount || room.noOfRooms || "1"),
      offsetMinus: room.offsetMinus === 'Yes' || room.minusYesNo === true ? 'Yes' : 'No',
      outer: room.outer === 'Yes' || room.outerYesNo === true ? 'Yes' : 'No',
      remark: room.remark || "-Select-",
      utilities: (room.utilities || room.roomType || "-Select-") as string,
      shape: (room.shape || "-Select-") as string,
      roomTypeId: room.roomTypeId ? String(room.roomTypeId) : "",
    });

    // Prefer normalized offsets (room.offsets) over legacy roomWiseMinusData
    setCurrentRoomOffsets((room.offsets || room.roomWiseMinusData || []) as OffsetData[]);
    setShapeParameters(params);
    setFilledParameters(Object.entries(params)
      .filter(([_, v]) => v && v !== "0" && v !== 0)
      .map(([k]) => k));
    setSelectedRoomForPlan(room);
    setValidationErrors({});

    setTimeout(() => {
      if (focusRefs.current['roomNo']) {
        focusRefs.current['roomNo'].focus();
      } else {
        focusRefs.current['roomType']?.focus();
        if (focusRefs.current['roomType'] && 'click' in focusRefs.current['roomType']) {
          (focusRefs.current['roomType'] as HTMLElement).click();
        }
      }

      if (pendingOffsetModalOpenRef.current) {
        pendingOffsetModalOpenRef.current = false;
        setOffsetList([...(room.offsets || [])]);
        setOffsetData({
          length: "", width: "", radius: "", base: "", height: "", side: "", base1: "", base2: "", area: 0,
          shape: "Rectangle", operation: "subtract", shapeType: "Rectangle"
        });
        setSelectedOperation("subtract");
        setSelectedShape("Rectangle");
        setOffsetModalOpen(true);
      }
    }, 100);
  }, [rooms, setEditingIndex, setIsEditMode, setFormData, setCurrentRoomOffsets, setShapeParameters, setFilledParameters, setSelectedRoomForPlan, setValidationErrors, setOffsetList, setOffsetData, setSelectedOperation, setSelectedShape, setOffsetModalOpen, pendingOffsetModalOpenRef, focusRefs]);

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingIndex(null);
    setFormData(INITIAL_ROOM_FORM_STATE);
    setCurrentRoomOffsets([]);
    setShapeParameters(INITIAL_SHAPE_PARAMETERS);
    setFilledParameters([]);
    setSelectedRoomForPlan(null);
    setValidationErrors({});
    setTimeout(() => {
      focusRefs.current['roomNo']?.focus();
    }, 100);
  };

  return { handleEdit, handleCancelEdit };
};
