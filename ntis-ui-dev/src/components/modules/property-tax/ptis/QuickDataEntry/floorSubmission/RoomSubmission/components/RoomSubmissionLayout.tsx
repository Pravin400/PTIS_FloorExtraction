import React from "react";
import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { InputBox } from "../InputBox";
import { FloorPlanExtractionBanner } from "./FloorPlanExtractionBanner";
import { RoomDataTable } from "../RoomDataTable";
import { RoomPreview } from "../RoomPreview";
import { RoomSubmissionState } from "@/hooks/ptis/RoomSubmission/useRoomSubmissionState";
import { RoomWiseSubmissionProps, FloorData, RoomActions, OffsetActions } from "@/types/room-details.types";
import { OffsetData } from "@/types/offset-details.types";

interface RoomSubmissionLayoutProps {
  displayMode: 'modal' | 'dialog' | 'inline';
  state: RoomSubmissionState;
  actions: { addNewRow: () => void };
  roomActions: RoomActions;
  offsetActions: OffsetActions;
  props: RoomWiseSubmissionProps & { floorData?: FloorData };
  InlineError: React.FC<{ message: string }>;
  calculateArea: () => number;
  calculateTotal: (area: number, roomCount: string | number, offsets: OffsetData[], outer?: string | boolean) => number;
  isUtilityCategory?: boolean;
}

export const RoomSubmissionLayout: React.FC<RoomSubmissionLayoutProps> = ({
  displayMode, state, actions, roomActions, offsetActions, props, InlineError, calculateArea, calculateTotal, isUtilityCategory
}) => {
  const t = useTranslations("quickDataEntry");
  const {
    formData, rooms, isEditMode, validationErrors, offsetModalOpen, currentRoomOffsets,
    editingIndex, areaUnit, selectedRoomForPlan, filledParameters, shapeParameters,
    inlineEditingCell, setRooms, setInlineEditingCell, setSelectedRoomForPlan, setFilledParameters,
    setFormData, setShapeParameters, setOffsetModalOpen, setOffsetList, setOffsetData,
    setSelectedOperation, setCurrentRoomOffsets, setSelectedShape
  } = state;

  return (
    <div className="flex flex-col lg:flex-row overflow-y-auto lg:overflow-visible"
      style={{ maxHeight: displayMode === 'modal' ? 'calc(95vh - 50px)' : 'none' }}>

      {/* Left Column: Form and Table */}
      <div className="flex-1 flex flex-col p-1 border-b lg:border-r lg:border-b-0 border-gray-200 min-w-0">
        <div className={`pr-2 pb-4 ${displayMode === 'modal' ? 'overflow-visible' : ''}`}
          style={{ maxHeight: displayMode === 'modal' ? 'calc(95vh - 150px)' : 'none' }}>

          <FloorPlanExtractionBanner
            propertyId={props.initialPropertyID || props.floorData?.propertyId || props.floorData?.ownerID}
            wardNo={props.wardNo}
            propertyNo={props.propertyNo}
            partitionNo={props.partitionNo}
            floorNumber={props.floorNumber}
            areaUnit={areaUnit}
            roomTypeData={props.roomTypeData}
            isUtilityCategory={isUtilityCategory}
            onRoomsExtracted={(extractedRooms) => {
              setRooms(extractedRooms);
              if (extractedRooms.length > 0) {
                roomActions.handleEdit(0, extractedRooms[0]);
              }
            }}
          />

          <InputBox
            formData={formData}
            handleInputChange={roomActions.handleInputChange}
            rooms={rooms}
            handleEdit={roomActions.handleEdit}
            isEditMode={isEditMode}
            validationErrors={validationErrors}
            InlineError={InlineError}
            calculateArea={calculateArea}
            setOffsetModalOpen={setOffsetModalOpen}
            currentRoomOffsets={currentRoomOffsets}
            setOffsetList={setOffsetList}
            setOffsetData={setOffsetData}
            setSelectedOperation={setSelectedOperation}
            setCurrentRoomOffsets={setCurrentRoomOffsets}
            handleUpdateRoom={roomActions.handleUpdateRoom}
            handleAddRoom={roomActions.handleAddRoom}
            calculateTotal={calculateTotal}
            maxRooms={isUtilityCategory ? (props.existingRooms?.length ?? 0) : rooms.length}
            availableRooms={state.availableRooms}
            setSelectedShape={setSelectedShape}
            offsetModalOpen={offsetModalOpen}
            editingIndex={editingIndex}
            areaUnit={areaUnit}
            floorData={props.floorData}
            focusRefs={state.focusRefs}
            roomTypeData={props.roomTypeData}
            isUtilityCategory={isUtilityCategory}
          />

          {rooms.length > 0 ? (
            <RoomDataTable
              rooms={rooms}
              setRooms={setRooms}
              handleEdit={roomActions.handleEdit}
              handleDelete={roomActions.handleDelete}
              handleCancelEdit={roomActions.handleCancelEdit}
              editingIndex={editingIndex}
              areaUnit={areaUnit}
              addNewRow={actions.addNewRow}
              grandTotal={state.grandTotal}
              builtupGrandTotal={state.builtupGrandTotal}
              inlineEditingCell={inlineEditingCell}
              setInlineEditingCell={setInlineEditingCell}
              setSelectedRoomForPlan={setSelectedRoomForPlan}
              setFilledParameters={setFilledParameters}
              selectedRoomForPlan={selectedRoomForPlan}
              onOpenOffset={offsetActions.handleOpenOffset}
              floorData={props.floorData}
              roomTypeData={props.roomTypeData}
              isUtilityCategory={isUtilityCategory}
            />
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t("roomSubmission.noRooms")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Preview */}
      <RoomPreview
        selectedRoomForPlan={selectedRoomForPlan}
        filledParameters={filledParameters}
        setFormData={setFormData}
        shapeParameters={shapeParameters}
        setShapeParameters={setShapeParameters}
        setFilledParameters={setFilledParameters}
        setSelectedRoomForPlan={setSelectedRoomForPlan}
        areaUnit={areaUnit}
      />
    </div>
  );
};
