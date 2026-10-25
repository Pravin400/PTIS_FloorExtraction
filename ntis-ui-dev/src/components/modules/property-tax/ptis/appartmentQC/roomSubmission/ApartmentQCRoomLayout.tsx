'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ApartmentQCInputBox } from './ApartmentQCInputBox';
import { RoomDataTable } from '../../QuickDataEntry/floorSubmission/RoomSubmission/RoomDataTable';
import { RoomPreview } from '../../QuickDataEntry/floorSubmission/RoomSubmission/RoomPreview';
import { RoomSubmissionState } from '@/hooks/ptis/RoomSubmission/useRoomSubmissionState';
import { RoomWiseSubmissionProps, FloorData, RoomActions, OffsetActions } from '@/types/room-details.types';
import { OffsetData } from '@/types/offset-details.types';

interface ApartmentQCRoomLayoutProps {
  displayMode: 'modal' | 'dialog' | 'inline';
  state: RoomSubmissionState;
  actions: { addNewRow: () => void };
  roomActions: RoomActions;
  offsetActions: OffsetActions;
  props: RoomWiseSubmissionProps & { floorData?: FloorData };
  InlineError: React.FC<{ message: string }>;
  calculateArea: () => number;
  calculateTotal: (area: number, roomCount: string | number, offsets: OffsetData[]) => number;
}

/**
 * Apartment QC–specific room layout.
 *
 * Mirrors QuickDataEntry's RoomSubmissionLayout exactly — except it renders
 * ApartmentQCInputBox (always-editable) instead of the QuickDataEntry InputBox
 * (which disables fields when isEditMode=false).
 *
 * RoomDataTable and RoomPreview are reused from QuickDataEntry unchanged.
 */
export const ApartmentQCRoomLayout: React.FC<ApartmentQCRoomLayoutProps> = ({
  displayMode,
  state,
  actions,
  roomActions,
  offsetActions,
  props,
  calculateArea,
  calculateTotal,
}) => {
  const t = useTranslations('quickDataEntry');

  const {
    formData,
    rooms,
    isEditMode,
    validationErrors,
    offsetModalOpen,
    currentRoomOffsets,
    editingIndex,
    areaUnit,
    selectedRoomForPlan,
    filledParameters,
    shapeParameters,
    inlineEditingCell,
    setRooms,
    setInlineEditingCell,
    setSelectedRoomForPlan,
    setFilledParameters,
    setFormData,
    setShapeParameters,
    setOffsetModalOpen,
    setOffsetList,
    setOffsetData,
    setSelectedOperation,
    setCurrentRoomOffsets,
    setSelectedShape,
    focusRefs,
  } = state;

  return (
    <div
      className="flex flex-col lg:flex-row overflow-y-auto lg:overflow-visible"
      style={{ maxHeight: displayMode === 'modal' ? 'calc(95vh - 50px)' : 'none' }}
    >
      {/* Left Column: Input form + rooms list */}
      <div className="flex-1 flex flex-col p-1 border-b lg:border-r lg:border-b-0 border-gray-200 min-w-0">
        <div
          className={`pr-2 pb-4 ${displayMode === 'modal' ? 'overflow-visible' : ''}`}
          style={{ maxHeight: displayMode === 'modal' ? 'calc(95vh - 150px)' : 'none' }}
        >
          {/* Always-editable InputBox */}
          <ApartmentQCInputBox
            formData={formData}
            handleInputChange={roomActions.handleInputChange}
            rooms={rooms}
            handleEdit={roomActions.handleEdit}
            isEditMode={isEditMode}
            validationErrors={validationErrors}
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
            maxRooms={props.maxRooms ?? null}
            availableRooms={state.availableRooms}
            setSelectedShape={setSelectedShape}
            offsetModalOpen={offsetModalOpen}
            editingIndex={editingIndex}
            areaUnit={areaUnit}
            floorData={props.floorData}
            focusRefs={focusRefs}
          />

          {/* Rooms list */}
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
            />
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t('roomSubmission.noRooms')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Shape preview panel */}
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
