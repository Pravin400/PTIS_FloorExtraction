'use client';

import React from "react";

import { RoomWiseSubmissionProps } from "@/types/room-details.types";
import { FullOffSetFormProps } from "@/types/offset-details.types";
import type { DrawerFloorDataRow } from "@/types/propertyEditScreenDrawer.types";
import { OffSetSidebar } from "../floorSubmission/offset/OffSetSidebar";

// ── Reused state & pure-logic hooks (no Quick Data Entry–specific API calls) ──
import { useRoomSubmissionState } from "@/hooks/ptis/RoomSubmission/useRoomSubmissionState";
import { useRoomInputActions } from "@/hooks/ptis/RoomSubmission/useRoomInputActions";
import { useRoomEditActions } from "@/hooks/ptis/RoomSubmission/useRoomEditActions";
import { useApartmentQCOffsetActions } from "@/hooks/apartmentQc/useApartmentQCOffsetActions";

// ── Apartment QC–specific hooks (separated from QuickDataEntry) ──────────────
import { useApartmentQCRoomInitialization } from "@/hooks/apartmentQc/useApartmentQCRoomInitialization";
import { useApartmentQCRoomListActions } from "@/hooks/apartmentQc/useApartmentQCRoomListActions";
import { useApartmentQCRoomPersistenceActions } from "@/hooks/apartmentQc/useApartmentQCRoomPersistenceActions";
import { useEnterKeyNavigation } from "@/hooks/apartmentQc/useEnterKeyNavigation";

// ── Shared UI components (unchanged) ─────────────────────────────────────────
import { ApartmentQCRoomLayout } from "./ApartmentQCRoomLayout";
import { RoomSubmissionFooter } from "../../QuickDataEntry/floorSubmission/RoomSubmission/components/RoomSubmissionFooter";
import { InlineError } from "../../QuickDataEntry/floorSubmission/RoomSubmission/components/InlineError";

// ── Calculation utils (unchanged) ─────────────────────────────────────────────
import {
  calculateRoomArea,
  calculateRoomTotal,
  getDimensionsString,
  isOffsetValid,
} from "@/lib/utils/RoomSubmission/room-submission.utils";
import { MasterTable, Tooltip, Drawer, Button } from "@/components/common";
import { createPortal } from "react-dom";
import { Layers } from "lucide-react";


export const RoomWiseSubmission: React.FC<
  RoomWiseSubmissionProps & {
    externalAreaUnit?: "sq.m" | "sq.ft";
    onExternalToggleUnit?: () => void;
  }
> = (props) => {
  const { isOpen, onClose, displayMode = "inline" } = props;

  // ── State bag (shared – no changes needed) ──────────────────────────────
  // Pass maxRooms=undefined so availableRooms stays null (no artificial cap).
  const state = useRoomSubmissionState(undefined, props.externalAreaUnit);

  // ── Pure-logic hooks (reused) ────────────────────────────────────────────
  const { handleEdit, handleCancelEdit } = useRoomEditActions(state);
  const { handleInputChange } = useRoomInputActions(state, null);
  const offsetActions = useApartmentQCOffsetActions(state, handleEdit);

  // ── Apartment QC initialization (no empty rows) ──────────────────────────
  useApartmentQCRoomInitialization(state, props);

  // ── Apartment QC CRUD (calls API immediately on each action) ─────────────
  const { handleAddRoom, handleUpdateRoom, handleDelete } =
    useApartmentQCRoomListActions(state, props, handleCancelEdit);

  // ── Apartment QC persistence (sync + close) ──────────────────────────────
  const { handleSaveData } = useApartmentQCRoomPersistenceActions(state, props);

  // ── Compose roomActions (satisfies RoomActions interface) ─────────────────
  const roomActions = {
    handleInputChange,
    handleEdit,
    handleCancelEdit,
    handleAddRoom,
    handleUpdateRoom,
    handleDelete,
    handleUpdate: handleSaveData, // "SAVE DATA" button
  };

  // ── Track if there are changes ─────────────────────────────────────────────
  const initialRoomsString = React.useRef<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      initialRoomsString.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDirty(false);
    } else {
      if (state.rooms.length > 0 && initialRoomsString.current === null && state.mounted) {
        initialRoomsString.current = JSON.stringify(state.rooms);
      }
      setIsDirty(
        initialRoomsString.current !== null &&
        JSON.stringify(state.rooms) !== initialRoomsString.current
      );
    }
  }, [isOpen, state.rooms, state.mounted]);

  // ── Unit-toggle handler ────────────────────────────────────────────────────
  const handleToggleUnit = () => {
    if (props.onExternalToggleUnit) {
      props.onExternalToggleUnit();
    } else {
      state.setInternalAreaUnit((prev) =>
        prev === "sq.m" ? "sq.ft" : "sq.m"
      );
    }
  };

  // ── Drawer close: reset local state ───────────────────────────────────────
  const handleClose = () => {
    state.setValidationErrors({});
    state.setRooms([]);
    state.setEditingIndex(null);
    state.setIsEditMode(false);
    state.setOffsetModalOpen(false);
    onClose();
  };

  // ── Auto-Focus First Element ──────────────────────────────────────────────
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        const form = document.getElementById('room-wise-submission-form');
        if (form) {
          // Find the first editable input, select, or button (combobox for Select)
          const firstFocusable = form.querySelector(
            'input:not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), button:not([disabled])'
          ) as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 300); // Wait for drawer animation to finish
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  // ── Enter Key Navigation ──────────────────────────────────────────────────
  // TO REMOVE ENTER KEY FUNCTIONALITY: 
  // 1. Remove this line and the `useEnterKeyNavigation` import at the top.
  // 2. Remove the `onKeyDownCapture={handleKeyDown}` prop from the `<form>` element in the render method below.
  const handleKeyDown = useEnterKeyNavigation();

  // ── Offset sidebar props (unchanged) ──────────────────────────────────────
  const fullOffSetProps: FullOffSetFormProps = {
    offsetModalOpen: state.offsetModalOpen,
    formData: state.formData,
    calculateAdjustedRoomTotal: offsetActions.calculateAdjustedRoomTotal,
    handleSubtractClick: offsetActions.handleSubtractClick,
    handleAddClick: offsetActions.handleAddClick,
    selectedOperation: state.selectedOperation,
    isShakingSubtract: state.isShakingSubtract,
    offsetData: state.offsetData,
    setOffsetValidationError: state.setOffsetValidationError,
    setSelectedOperation: state.setSelectedOperation,
    offsetValidationError: state.offsetValidationError,
    selectedShape: state.selectedShape,
    handleShapeChange: offsetActions.handleShapeChange,
    handleOffsetInputChange: offsetActions.handleOffsetInputChange,
    offsetList: state.offsetList,
    getDimensionsString,
    handleDeleteOffset: offsetActions.handleDeleteOffset,
    handleAddOffset: offsetActions.handleAddOffset,
    isOffsetDataValid: () => isOffsetValid(state.offsetData, state.selectedShape),
    handleOffsetOk: offsetActions.handleOffsetOk,
    handleOffsetClose: offsetActions.handleOffsetClose,
    areaUnit: state.areaUnit,
    shouldShake: state.shouldShake,
    deletingOffsetIndex: state.deletingOffsetIndex,
  };

  if (!state.mounted || !isOpen) return null;

  const content = (
    <div
      className={`w-full p-0 flex flex-col bg-white overflow-visible z-[112] ${displayMode === "modal" ? "" : "mb-6"
        }`}
    >
      <form id="room-wise-submission-form" onSubmit={(e) => e.preventDefault()} onKeyDownCapture={handleKeyDown}>
        <div className="bg-white flex flex-col rounded-lg shadow-md border border-gray-200 overflow-visible">

          {/* Selected floor row from Floor QC table */}
          {props.selectedFloorRow && (
            <div className="mb-4 p-1 animate-in fade-in slide-in-from-top-4 duration-500">
              <MasterTable<DrawerFloorDataRow>
                columns={[
                  {
                    key: "floorId",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.floor`) || "Floor"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.floor") || "Floor"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (_: unknown, row: DrawerFloorDataRow) => {
                      const id = row.floorId;
                      const lookup = props.floorLookup || [];
                      const item = lookup.find((i) => String(i.value) === String(id));
                      return item ? item.label : (id || "-");
                    },
                    headerClassName: "text-center",
                    cellClassName: "text-center font-bold text-slate-700"
                  },
                  {
                    key: "conYear",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.conYear`) || "Construction Year"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.conYear") || "Con. Year"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (val: unknown) => (val as string | number) || "-",
                    headerClassName: "text-center",
                    cellClassName: "text-center font-semibold"
                  },
                  {
                    key: "asstYear",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.asstYear`) || "Assessment Year"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.asstYear") || "Asst. Year"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (val: unknown) => (val as string | number) || "-",
                    headerClassName: "text-center",
                    cellClassName: "text-center font-semibold"
                  },
                  {
                    key: "constructionTypeId",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.conType`) || "Construction Type"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.conType") || "Construction Type"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (_: unknown, row: DrawerFloorDataRow) => {
                      const id = row.constructionTypeId;
                      const lookup = props.constructionLookup || [];
                      const item = lookup.find((i) => String(i.value) === String(id));
                      return item ? item.label : (id || "-");
                    },
                    headerClassName: "text-center",
                    cellClassName: "text-center font-semibold"
                  },
                  {
                    key: "typeOfUseId",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.use`) || "Type of Use"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.use") || "Type of Use"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (_: unknown, row: DrawerFloorDataRow) => {
                      const id = row.typeOfUseId;
                      const lookup = props.useLookup || [];
                      const item = lookup.find((i) => String(i.value) === String(id));
                      return item ? item.label : (id || "-");
                    },
                    headerClassName: "text-center",
                    cellClassName: "text-center font-semibold"
                  },
                  {
                    key: "subTypeOfUseId",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.subTypeOfUse`) || "Sub Type of Use"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.subTypeOfUse") || "Sub Type"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (_: unknown, row: DrawerFloorDataRow) => {
                      const id = row.subTypeOfUseId;
                      const lookup = props.subTypeLookup || [];
                      const item = lookup.find((i) => String(i.value) === String(id));
                      return item ? item.label : (id || "-");
                    },
                    headerClassName: "text-center",
                    cellClassName: "text-center font-semibold"
                  },
                  {
                    key: "noOfRooms",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.noOfRooms`) || "Number of Rooms"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.noOfRooms") || "Rooms"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (val: unknown) => (val as string | number) ?? "-",
                    headerClassName: "text-center",
                    cellClassName: "text-center font-semibold"
                  },
                  {
                    key: "area",
                    label: (
                      <Tooltip
                        content={<div className="text-xs max-w-xs whitespace-normal break-words">{props.t?.(`floorQC.toolTipFloorQC.tooltips.area`) || "Floor Area"}</div>}
                        placement="top"
                      >
                        <span className=" font-semibold text-gray-900">
                          {props.t?.("floorQC.columns.area") || "Area"}
                        </span>
                      </Tooltip>
                    ) as unknown as string,
                    render: (val: unknown) => (val as string | number) ?? "-",
                    headerClassName: "text-center",
                    cellClassName: "text-center font-bold text-slate-800"
                  }
                ]}
                data={[props.selectedFloorRow]}
                containerClassName="rounded-xl overflow-hidden shadow-sm pt-0"
                tableClassName="text-xs"
              />
            </div>
          )}

          {/* Apartment QC layout — uses always-editable InputBox and no empty-slot addNewRow */}
          <ApartmentQCRoomLayout
            displayMode={displayMode}
            state={state}
            actions={{ addNewRow: () => { } }}
            roomActions={roomActions}
            offsetActions={offsetActions}
            props={props}
            InlineError={InlineError}
            calculateArea={() => calculateRoomArea(state.formData, state.shapeParameters)}
            calculateTotal={calculateRoomTotal}
          />

          <RoomSubmissionFooter
            onSave={handleSaveData}
            onClose={handleClose}
            isSaving={state.isUpdating}
            canSave={
              state.grandTotal > 0 &&
              isDirty &&
              !state.rooms.some(
                (r) => r.isAutoGenerated || !r.roomTypeId || Number(r.area) === 0
              )
            }
          />

        </div>
      </form>
      <OffSetSidebar {...fullOffSetProps} />
    </div>
  );

  if (displayMode === "modal") {
    if (typeof window === "undefined") return null;
    return createPortal(
      <Drawer open={isOpen}
        onClose={onClose} width="xl" hideHeader={false}
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-blue-900">
                <Layers className="w-4 h-4 text-blue-600" />
                {props.t?.('drawer.roomWiseSubmission') || 'Room Wise Submission'}
                ({state.areaUnit === 'sq.m' ? (props.t?.('drawer.units.sqM') || 'Sq.m') : (props.t?.('drawer.units.sqFt') || 'Sq.ft')})
              </h2>

              <div className="flex items-center bg-blue-50/50 rounded-full p-0.5 border border-blue-100 shadow-inner ml-2">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => state.areaUnit === 'sq.ft' && handleToggleUnit()}
                  className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${state.areaUnit === 'sq.m'
                    ? 'bg-white text-blue-600 shadow-sm scale-105'
                    : 'text-blue-400/70 hover:text-blue-600'
                    }`}
                >
                  {props.t?.('drawer.units.sqM') || 'Sq.m'}
                </Button>

                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => state.areaUnit === 'sq.m' && handleToggleUnit()}
                  className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${state.areaUnit === 'sq.ft'
                    ? 'bg-white text-blue-600 shadow-sm scale-105'
                    : 'text-blue-400/70 hover:text-blue-600'
                    }`}
                >
                  {props.t?.('drawer.units.sqFt') || 'Sq.ft'}
                </Button>
              </div>
            </div>
          </div>
        }
      >
        {content}
      </Drawer>,
      document.body
    );
  }

  return content;
};

export default RoomWiseSubmission;
