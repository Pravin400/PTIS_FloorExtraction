import { useState, useRef, useMemo } from "react";
import {
  RoomFormData,
  ShapeParameters
} from "@/types/common-details.types";
import { RoomData } from "@/types/room-details.types";
import { OffsetData } from "@/types/offset-details.types";
import {
  INITIAL_ROOM_FORM_STATE,
  INITIAL_SHAPE_PARAMETERS,
  INITIAL_OFFSET_DATA
} from "@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/RoomSubmission/constants/room-submission.constants";
import { calculateRoomWiseTotals } from "@/lib/utils/RoomSubmission/room-calculation.util";

export const useRoomSubmissionState = (maxRooms: number | undefined, externalAreaUnit: "sq.m" | "sq.ft" | undefined) => {
  const [formData, setFormData] = useState<RoomFormData>(INITIAL_ROOM_FORM_STATE);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [internalAreaUnit, setInternalAreaUnit] = useState<"sq.m" | "sq.ft">("sq.m");
  const areaUnit = externalAreaUnit || internalAreaUnit;
  const [prevAreaUnit, setPrevAreaUnit] = useState(areaUnit);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [inlineEditingCell, setInlineEditingCell] = useState<{ rowIndex: number; field: string } | null>(null);

  const [selectedRoomForPlan, setSelectedRoomForPlan] = useState<RoomData | null>(null);
  const [shapeParameters, setShapeParameters] = useState<ShapeParameters>(INITIAL_SHAPE_PARAMETERS);
  const [filledParameters, setFilledParameters] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [isUpdating, setIsUpdating] = useState(false);
  const [offsetModalOpen, setOffsetModalOpen] = useState(false);
  const [currentRoomOffsets, setCurrentRoomOffsets] = useState<OffsetData[]>([]);

  const [offsetData, setOffsetData] = useState<OffsetData>(INITIAL_OFFSET_DATA);
  const [offsetList, setOffsetList] = useState<OffsetData[]>([]);
  const [offsetValidationError, setOffsetValidationError] = useState("");
  const [shouldShake, setShouldShake] = useState(false);
  const [isShakingSubtract, setIsShakingSubtract] = useState(false);
  const [selectedShape, setSelectedShape] = useState("Rectangle");
  const [selectedOperation, setSelectedOperation] = useState<"add" | "subtract" | null>("subtract");
  const [deletingOffsetIndex, setDeletingOffsetIndex] = useState<number | null>(null);
  const [pendingDeletions, setPendingDeletions] = useState<{
    rooms: (string | number)[];
    offsets: (string | number)[];
  }>({ rooms: [], offsets: [] });

  const [mounted, setMounted] = useState(false);

  // Logic-only refs
  const pendingOffsetModalOpenRef = useRef(false);
  const hasAutoActivatedRef = useRef(false);
  const lastInitializedFloorRef = useRef<string | null>(null);
  const focusRefs = useRef<Record<string, HTMLInputElement | HTMLButtonElement | null>>({});

  // Derived State
  const { grandTotal, builtupGrandTotal, roomsConsumed } = useMemo(
    () => calculateRoomWiseTotals(rooms, isEditMode ? editingIndex : null),
    [rooms, isEditMode, editingIndex]
  );

  const availableRooms = maxRooms ? maxRooms - roomsConsumed : null;

  return {
    formData, setFormData,
    rooms, setRooms,
    internalAreaUnit, setInternalAreaUnit,
    areaUnit,
    prevAreaUnit, setPrevAreaUnit,
    editingIndex, setEditingIndex,
    isEditMode, setIsEditMode,
    inlineEditingCell, setInlineEditingCell,
    selectedRoomForPlan, setSelectedRoomForPlan,
    shapeParameters, setShapeParameters,
    filledParameters, setFilledParameters,
    validationErrors, setValidationErrors,
    isUpdating, setIsUpdating,
    offsetModalOpen, setOffsetModalOpen,
    currentRoomOffsets, setCurrentRoomOffsets,
    offsetData, setOffsetData,
    offsetList, setOffsetList,
    offsetValidationError, setOffsetValidationError,
    shouldShake, setShouldShake,
    isShakingSubtract, setIsShakingSubtract,
    selectedShape, setSelectedShape,
    selectedOperation, setSelectedOperation,
    deletingOffsetIndex, setDeletingOffsetIndex,
    pendingDeletions, setPendingDeletions,
    mounted, setMounted,
    pendingOffsetModalOpenRef,
    hasAutoActivatedRef,
    lastInitializedFloorRef,
    focusRefs,
    grandTotal, builtupGrandTotal, roomsConsumed, availableRooms
  };
};

export type RoomSubmissionState = ReturnType<typeof useRoomSubmissionState>;
