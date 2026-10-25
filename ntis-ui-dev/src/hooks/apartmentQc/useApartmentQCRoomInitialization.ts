import { useEffect, useRef } from "react";
import { RoomWiseSubmissionProps, RoomAPIResponse } from "@/types/room-details.types";
import type { OffsetData } from "@/types/offset-details.types";
import { ShapeParameters } from "@/types/common-details.types";
import {
  convertAreaUnit,
  convertDimension,
} from "@/lib/utils/RoomSubmission/room-calculation.util";
import { RoomSubmissionState } from "@/hooks/ptis/RoomSubmission/useRoomSubmissionState";

/**
 * Apartment QC–specific room initialization.
 *
 * Key difference from the shared useRoomInitialization:
 *   - Does NOT pre-allocate empty rows up to maxRooms.
 *   - Only loads the existingRooms passed in from the parent (fetched from API).
 *   - Does NOT auto-activate edit mode — drawer opens in "add" mode.
 */
export const useApartmentQCRoomInitialization = (
  state: RoomSubmissionState,
  props: Pick<
    RoomWiseSubmissionProps,
    "isOpen" | "existingRooms" | "externalAreaUnit" | "selectedFloorRow"
  >
) => {
  const { isOpen, existingRooms } = props;
  const {
    setMounted,
    setRooms,
    setEditingIndex,
    setIsEditMode,
    prevAreaUnit,
    areaUnit,
    setPrevAreaUnit,
    setShapeParameters,
    setFormData,
  } = state;

  const noOfRooms = props.selectedFloorRow?.noOfRooms;

  // 1. Mount flag
  useEffect(() => {
    setMounted(true);
  }, [setMounted]);

  // 2. Load existing rooms (no empty-row padding)
  const isInitialized = useRef(false);
  const prevExistingRoomsLength = useRef(0);
  const prevNoOfRooms = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setRooms([]);
      setEditingIndex(null);
      setIsEditMode(false);
      isInitialized.current = false;
      prevExistingRoomsLength.current = 0;
      prevNoOfRooms.current = 0;
      return;
    }

    const source: RoomAPIResponse[] = existingRooms || [];
    const sourceLength = source.length;
    
    const currentNoOfRooms = Number(noOfRooms) || 0;
    
    // Guard against running multiple times unless the source length or noOfRooms changes
    if (
      isInitialized.current && 
      prevExistingRoomsLength.current === sourceLength &&
      prevNoOfRooms.current === currentNoOfRooms
    ) return;

    isInitialized.current = true;
    prevExistingRoomsLength.current = sourceLength;
    prevNoOfRooms.current = currentNoOfRooms;

    const targetCount = currentNoOfRooms;

    setRooms((prevRooms) => {
      const loaded = Array.from({ length: targetCount }).map((_, i) => {
        const r = source[i];
        if (r) {
        // Merge offsets from all possible sources
        const offsetsRaw = [
          ...(Array.isArray(r.offsets) ? r.offsets : []),
          ...(Array.isArray(r.roomWiseMinusData) ? r.roomWiseMinusData : []),
          ...(Array.isArray(r.minusRooms) ? r.minusRooms : []),
        ];

        // Deduplicate by id and filter out marked for deletion
        const seen = new Set<unknown>();
        const offsets = offsetsRaw
          .filter((o) => {
            const markedForDeletion = (o as Record<string, unknown>).MarkedForDeletion ?? (o as Record<string, unknown>).markedForDeletion;
            return markedForDeletion !== 1 && markedForDeletion !== true;
          })
          .map((o) => ({
            ...o,
            id: (o as Record<string, unknown>).roomWiseMinusId ?? o.id,
            operation:
              (o as Record<string, unknown>).isOffset === true
                ? "add"
                : (o as Record<string, unknown>).isOffset === false
                ? "subtract"
                : ((o as Record<string, unknown>).type as string) ||
                  (o as Record<string, unknown>).operation as string ||
                  "subtract",
            area:
              (o as Record<string, unknown>).area ??
              (o as Record<string, unknown>).areaSqMtr ??
              0,
            shape:
              (o as Record<string, unknown>).shapeType as string ||
              (o as Record<string, unknown>).shape as string ||
              "Rectangle",
          }))
          .filter((o) => {
            const key = o.id || JSON.stringify(o);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        const sp = r.shapeParameters || {};
        return {
          id: r.id,
          roomWiseSubmissionId: r.roomWiseSubmissionId || r.id,
          tempId: `aqc-db-${r.id}-${i}`,
          roomNo: String(r.roomNo || i + 1),
          length: r.lengthMtr?.toString() || sp.length || "",
          width: r.widthMtr?.toString() || sp.width || "",
          area: Number(r.areaSqMtr || r.area || 0),
          mainArea: Number(r.areaSqMtr || r.area || 0),
          carpetArea: Number(r.totalAreaSqMtr || r.total || 0),
          builtUpArea: Number(r.totalAreaSqMtr || r.total || 0), // Fallback if API lacks built-up area
          roomCount: r.noOfRooms?.toString() || "1",
          offsetMinus: r.minusYesNo ? "Yes" : "No",
          offsets: offsets as OffsetData[],
          roomWiseMinusData: r.roomWiseMinusData || [],
          outer: r.outerYesNo ? "Yes" : "No",
          total: Number(r.totalAreaSqMtr || r.total || 0),
          areaSqMtr: Number(r.areaSqMtr || r.area || 0),
          totalAreaSqMtr: Number(r.totalAreaSqMtr || r.total || 0),
          remark: r.remark || "-Select-",
          utilities: r.roomType || "-Select-",
          roomType: r.roomType || "",
          roomTypeId: r.roomTypeId,
          shape: r.shape || "-Select-",
          shapeParams: sp,
          shapeParameters: sp,
          isAutoGenerated: false,
        };
      }

      // Preserve locally added/edited rooms if they exist at this index
      const existingLocalRoom = prevRooms[i];
      if (existingLocalRoom && !existingLocalRoom.isAutoGenerated) {
        return existingLocalRoom;
      }

      // Empty row padding
      return {
        tempId: `aqc-init-empty-${Date.now()}-${i}`,
        roomNo: (i + 1).toString(),
        length: "0",
        width: "0",
        area: 0,
        roomCount: "1",
        offsetMinus: "No",
        offsets: [],
        outer: "No",
        total: 0,
        remark: "-Select-",
        utilities: "-Select-",
        shape: "-Select-",
        isAutoGenerated: true,
      };
    });

    return loaded;
    });
    // Intentionally NOT calling handleEdit — start in add mode.
  }, [isOpen, existingRooms, setRooms, setEditingIndex, setIsEditMode, noOfRooms]);

  // 3. Area-unit conversion sync (same logic as useRoomInitialization)
  useEffect(() => {
    if (prevAreaUnit === areaUnit) return;

    const targetDimUnit = areaUnit === "sq.ft" ? "ft" : "m";
    const oldUnit = areaUnit === "sq.ft" ? "sq.m" : "sq.ft";

    setShapeParameters((prev: ShapeParameters) => {
      const next: Partial<ShapeParameters> = {};
      (Object.keys(prev) as Array<keyof ShapeParameters>).forEach((k) => {
        const val = prev[k];
        if (typeof val === "string") next[k] = convertDimension(val, targetDimUnit);
      });
      return next as ShapeParameters;
    });

    setFormData((prev) => {
      const isManualArea = !prev.shape || prev.shape === "-Select-";
      return {
        ...prev,
        length: isManualArea
          ? convertAreaUnit(
              parseFloat(prev.length || "0"),
              oldUnit,
              areaUnit
            ).toString()
          : convertDimension(prev.length || "", targetDimUnit),
        width: isManualArea
          ? prev.width || ""
          : convertDimension(prev.width || "", targetDimUnit),
      };
    });

    state.setRooms((prevRooms) =>
      prevRooms.map((room) => {
        const isManualArea = !room.shape || room.shape === "-Select-";
        return {
          ...room,
          area: convertAreaUnit(Number(room.area || 0), oldUnit, areaUnit),
          total: convertAreaUnit(Number(room.total || 0), oldUnit, areaUnit),
          carpetArea: room.carpetArea ? convertAreaUnit(Number(room.carpetArea), oldUnit, areaUnit) : undefined,
          builtUpArea: room.builtUpArea ? convertAreaUnit(Number(room.builtUpArea), oldUnit, areaUnit) : undefined,
          mainArea: room.mainArea ? convertAreaUnit(Number(room.mainArea), oldUnit, areaUnit) : undefined,
          length: isManualArea
            ? room.length
              ? convertAreaUnit(
                  parseFloat(String(room.length)),
                  oldUnit,
                  areaUnit
                ).toString()
              : ""
            : room.length
            ? convertDimension(String(room.length), targetDimUnit)
            : "",
          width: isManualArea
            ? room.width || ""
            : room.width
            ? convertDimension(String(room.width), targetDimUnit)
            : "",
          offsets: (room.offsets || []).map((o) => ({
            ...o,
            area: convertAreaUnit(o.area, oldUnit, areaUnit),
            length: o.length
              ? convertDimension(o.length as string, targetDimUnit)
              : undefined,
            width: o.width
              ? convertDimension(o.width as string, targetDimUnit)
              : undefined,
          })),
        };
      })
    );

    setPrevAreaUnit(areaUnit);
  }, [
    areaUnit,
    prevAreaUnit,
    setShapeParameters,
    setFormData,
    state,
    setPrevAreaUnit,
  ]);
};
