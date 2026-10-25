import { useEffect, useRef } from "react";
import { RoomData, RoomWiseSubmissionProps, RoomAPIResponse } from "@/types/room-details.types";
import { ShapeParameters } from "@/types/common-details.types";
import {
  convertAreaUnit,
  convertDimension
} from "@/lib/utils/RoomSubmission/room-calculation.util";
import { RoomSubmissionState } from "./useRoomSubmissionState";

import { checkIsUtilityCategory } from "@/lib/utils/floorSubmission/floor-utility-checks";

export const useRoomInitialization = (state: RoomSubmissionState, props: RoomWiseSubmissionProps, actions: { handleEdit: (idx: number, room?: RoomData) => void; handleCancelEdit?: () => void }) => {
  const {
    isOpen, floorNumber, existingRooms, maxRooms
  } = props;
  const {
    setMounted, lastInitializedFloorRef, setRooms,
    rooms, isEditMode, editingIndex, hasAutoActivatedRef,
    setPrevAreaUnit, prevAreaUnit, areaUnit, setShapeParameters, setFormData
  } = state;

  const lastInitializedMaxRoomsRef = useRef<number | null>(null);
  const lastInitializedExistingRoomsRef = useRef<RoomAPIResponse[] | null>(null);

  // 1. Mount Status
  useEffect(() => { setMounted(true); }, [setMounted]);

  // 2. Data Initialization & Sync with maxRooms
  useEffect(() => {
    if (!isOpen) {
      lastInitializedFloorRef.current = null;
      lastInitializedMaxRoomsRef.current = null;
      lastInitializedExistingRoomsRef.current = null;
      return;
    }

    const isUtility = checkIsUtilityCategory(props.floorData?.typeOfUseCategoryId) ||
      props.floorData?.isOpenPlot === true ||
      props.floorData?.selectedFloorType === 'OpenPlot' ||
      String(props.floorData?.conTyp || '').toLowerCase().includes('open plot') ||
      String(props.floorData?.constructionType || '').toLowerCase().includes('open plot') ||
      String(props.floorData?.floor || '').toLowerCase().includes('open plot') ||
      String(props.floorData?.floorDescription || '').toLowerCase().includes('open plot');
    let lastFilledRoomIndex = -1;
    if (Array.isArray(existingRooms)) {
      for (let i = existingRooms.length - 1; i >= 0; i--) {
        const r = existingRooms[i];
        const hasArea = Number(r.area || r.areaSqMtr || r.totalAreaSqMtr || r.total || r.carpetArea || 0) > 0;
        const hasUseOrShape = (r.utilities && r.utilities !== "-Select-") || (r.shape && r.shape !== "-Select-");
        if (hasArea || hasUseOrShape) {
          lastFilledRoomIndex = i;
          break;
        }
      }
    }
    const requiredRoomsCount = lastFilledRoomIndex !== -1 ? lastFilledRoomIndex + 1 : 0;
    const computedRooms = isUtility ? (existingRooms?.length || 0) : Math.max(maxRooms || 0, requiredRoomsCount);
    const safeMaxRooms = isUtility ? computedRooms : Math.min(computedRooms, 100);
    const floorChanged = lastInitializedFloorRef.current !== (floorNumber || null);
    const maxRoomsChanged = lastInitializedMaxRoomsRef.current !== safeMaxRooms;
    const existingRoomsChanged = lastInitializedExistingRoomsRef.current !== (existingRooms || null);

    // Calculate idsMismatch only if references haven't changed but we need verification
    let idsMismatch = false;
    if (!floorChanged && !maxRoomsChanged && !existingRoomsChanged) {
      // Core inputs haven't changed; avoid checking further to optimize performance.
      return;
    } else {
      idsMismatch = !!(existingRooms && existingRooms.slice(0, safeMaxRooms).some((r, i) => {
        const currentRoom = rooms[i];
        if (!currentRoom) return true;
        const apiId = r.roomWiseSubmissionId ?? r.id;
        const stateId = currentRoom.roomWiseSubmissionId ?? currentRoom.id;
        return apiId !== stateId;
      }));
    }

    if (rooms.length !== safeMaxRooms || floorChanged || maxRoomsChanged || idsMismatch) {
      const initializedRooms = Array.from({ length: safeMaxRooms }, (_, i) => {
        if (Array.isArray(existingRooms) && existingRooms[i]) {
          const r = existingRooms[i];
          const offsetsRaw = [
            ...(Array.isArray(r.offsets) ? r.offsets : []),
            ...(Array.isArray(r.roomWiseMinusData) ? r.roomWiseMinusData : []),
            ...(Array.isArray(r.minusRooms) ? r.minusRooms : [])
          ];
          const seen = new Set();
          const offsets = offsetsRaw
            .filter(o => {
              if (!o) return false;
              const markedForDeletion = o.MarkedForDeletion ?? o.markedForDeletion;
              return markedForDeletion !== 1 && markedForDeletion !== true;
            })
            .map(o => ({
              ...o,
              id: o.roomWiseMinusId ?? o.id,
              operation: o.isOffset === true ? 'add' : (o.isOffset === false ? 'subtract' : (o.type || o.operation || 'subtract')),
              area: o.area ?? o.areaSqMtr ?? 0,
              shape: o.shapeType || o.shape || 'Rectangle'
            }))
            .filter(o => {
              const key = o.id || JSON.stringify(o);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          const isOuter = r.outer === 'Yes' || (r.outer as unknown) === true || r.outerYesNo === true || (r as Record<string, unknown>).OuterYesNo === true;
          const isOffset = r.offsetMinus === 'Yes' || r.minusYesNo === true || (r as Record<string, unknown>).MinusYesNo === true || offsets.length > 0;
          return {
            ...r,
            tempId: r.tempId || `init-${Date.now()}-${i}`,
            roomNo: (i + 1).toString(),
            id: r.roomWiseSubmissionId ?? r.id,
            area: Number(r.area || r.areaSqMtr || 0),
            total: Number(r.total || r.totalAreaSqMtr || 0),
            outer: isOuter ? 'Yes' : 'No',
            outerYesNo: isOuter,
            offsetMinus: isOffset ? 'Yes' : 'No',
            offsets
          };
        }
        return {
          tempId: `init-${Date.now()}-${i}`,
          roomNo: (i + 1).toString(),
          length: "0", width: "0", area: 0, roomCount: "1", offsetMinus: "No",
          offsets: [], outer: "No", total: 0, remark: "-Select-",
          utilities: "-Select-", shape: "-Select-", isAutoGenerated: true
        };
      });
      setRooms(initializedRooms);
      if (initializedRooms.length > 0 && !isUtility) {
        const firstEmptyIdx = initializedRooms.findIndex((r) => {
          return !(Number(r.area || 0) > 0 && r.shape && r.shape !== "-Select-");
        });
        if (firstEmptyIdx !== -1) {
          actions.handleEdit(firstEmptyIdx, initializedRooms[firstEmptyIdx]);
        } else {
          actions.handleCancelEdit?.();
        }
      }
    }

    lastInitializedFloorRef.current = floorNumber || null;
    lastInitializedMaxRoomsRef.current = safeMaxRooms;
    lastInitializedExistingRoomsRef.current = existingRooms || null;
  }, [
    isOpen,
    maxRooms,
    existingRooms,
    floorNumber,
    setRooms,
    actions,
    rooms,
    lastInitializedFloorRef,
    props.floorData?.typeOfUseCategoryId,
    props.floorData?.conTyp,
    props.floorData?.constructionType,
    props.floorData?.floor,
    props.floorData?.floorDescription,
    props.floorData?.isOpenPlot,
    props.floorData?.selectedFloorType
  ]);

  // 3. Area Unit Conversion Sync
  useEffect(() => {
    if (prevAreaUnit !== areaUnit) {
      const newUnit = areaUnit;
      const targetDimUnit = newUnit === "sq.ft" ? "ft" : "m";
      const oldUnit = newUnit === "sq.ft" ? "sq.m" : "sq.ft";

      setShapeParameters(prev => {
        const next: Partial<ShapeParameters> = {};
        (Object.keys(prev) as Array<keyof ShapeParameters>).forEach(k => {
          const val = prev[k];
          if (typeof val === 'string') next[k] = convertDimension(val, targetDimUnit);
        });
        return next as ShapeParameters;
      });

      setFormData(prev => {
        const isManualArea = !prev.shape || prev.shape === '-Select-';
        return {
          ...prev,
          length: isManualArea
            ? convertAreaUnit(parseFloat(prev.length || "0"), oldUnit, newUnit).toString()
            : convertDimension(prev.length || "", targetDimUnit),
          width: isManualArea ? (prev.width || "") : convertDimension(prev.width || "", targetDimUnit)
        };
      });

      setRooms(prevRooms => prevRooms.map(room => {
        const isManualArea = !room.shape || room.shape === '-Select-';
        return {
          ...room,
          area: convertAreaUnit(Number(room.area || 0), oldUnit, newUnit),
          total: convertAreaUnit(Number(room.total || 0), oldUnit, newUnit),
          carpetArea: room.carpetArea !== undefined ? convertAreaUnit(Number(room.carpetArea || 0), oldUnit, newUnit) : undefined,
          length: isManualArea
            ? (room.length ? convertAreaUnit(parseFloat(String(room.length)), oldUnit, newUnit).toString() : "")
            : (room.length ? convertDimension(String(room.length), targetDimUnit) : ""),
          width: isManualArea ? (room.width || "") : (room.width ? convertDimension(String(room.width), targetDimUnit) : ""),
          offsets: (room.offsets || []).map(o => ({
            ...o, area: convertAreaUnit(o.area, oldUnit, newUnit),
            length: o.length ? convertDimension(o.length, targetDimUnit) : undefined,
            width: o.width ? convertDimension(o.width, targetDimUnit) : undefined,
          }))
        };
      }));

      setPrevAreaUnit(areaUnit);
    }
  }, [areaUnit, prevAreaUnit, setShapeParameters, setFormData, setRooms, setPrevAreaUnit]);

  // 4. Auto-edit Next Empty Room
  useEffect(() => {
    const isUtility = checkIsUtilityCategory(props.floorData?.typeOfUseCategoryId) ||
      props.floorData?.isOpenPlot === true ||
      props.floorData?.selectedFloorType === 'OpenPlot' ||
      String(props.floorData?.conTyp || '').toLowerCase().includes('open plot') ||
      String(props.floorData?.constructionType || '').toLowerCase().includes('open plot') ||
      String(props.floorData?.floor || '').toLowerCase().includes('open plot') ||
      String(props.floorData?.floorDescription || '').toLowerCase().includes('open plot');
    if (isUtility || !isOpen || !maxRooms || maxRooms < 2 || isEditMode || editingIndex !== null || rooms.length === 0 || hasAutoActivatedRef.current) return;

    const isRoomFilled = (r: RoomData) => Number(r.area || 0) > 0 && Number(r.total || 0) > 0 && r.shape && r.shape !== "-Select-";
    const lastFilled = [...rooms].reverse().findIndex(isRoomFilled);
    if (lastFilled === -1) return;

    const lastFilledIdx = rooms.length - 1 - lastFilled;
    const nextEmptyIdx = rooms.slice(lastFilledIdx + 1).findIndex(r => !isRoomFilled(r));

    if (nextEmptyIdx !== -1) {
      const targetIdx = lastFilledIdx + 1 + nextEmptyIdx;
      hasAutoActivatedRef.current = true;
      setTimeout(() => actions.handleEdit(targetIdx), 200);
    }
  }, [
    rooms,
    isOpen,
    maxRooms,
    isEditMode,
    editingIndex,
    actions,
    hasAutoActivatedRef,
    props.floorData?.typeOfUseCategoryId,
    props.floorData?.conTyp,
    props.floorData?.constructionType,
    props.floorData?.floor,
    props.floorData?.floorDescription,
    props.floorData?.isOpenPlot,
    props.floorData?.selectedFloorType
  ]);
};
