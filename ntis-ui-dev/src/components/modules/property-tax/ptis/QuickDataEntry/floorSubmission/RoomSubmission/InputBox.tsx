'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { InputBoxProps } from '@/types/room-details.types';
import { COLUMN_WIDTHS } from './RoomTableConfig';
import { RoomTypeShapeFields } from './components/RoomInputBox/RoomTypeShapeFields';
import { DimensionAreaFields } from './components/RoomInputBox/DimensionAreaFields';
import { OffsetOuterFields } from './components/RoomInputBox/OffsetOuterFields';
import { TotalActionFields } from './components/RoomInputBox/TotalActionFields';
import { isRecordOpenPlot } from '@/hooks/ptis/floorSubmission/useFloorAreaValidation';

export const InputBox: React.FC<InputBoxProps & { focusRefs: React.MutableRefObject<Record<string, HTMLElement | null>>; isUtilityCategory?: boolean }> = ({
  formData,
  handleInputChange,
  rooms,
  isEditMode,
  validationErrors,
  calculateArea,
  setOffsetModalOpen,
  currentRoomOffsets,
  setOffsetList,
  setOffsetData,
  setSelectedOperation,
  setCurrentRoomOffsets,
  handleUpdateRoom,
  handleAddRoom,
  calculateTotal,
  maxRooms,
  availableRooms,
  setSelectedShape,
  offsetModalOpen,
  editingIndex,
  areaUnit,
  focusRefs,
  roomTypeData,
  isUtilityCategory,
  floorData,
}) => {
  const t = useTranslations('quickDataEntry');

  const isInputEnabled = isUtilityCategory ? true : isEditMode;

  React.useEffect(() => {
    if (isUtilityCategory && formData.roomCount !== '1') {
      handleInputChange('roomCount', '1');
    }
  }, [isUtilityCategory, formData.roomCount, handleInputChange]);

  const isActualUpdate =
    Boolean(isEditMode &&
      editingIndex !== null && editingIndex !== undefined && rooms[editingIndex] &&
      (Number(rooms[editingIndex].area || 0) > 0 || (rooms[editingIndex].utilities && rooms[editingIndex].utilities !== '-Select-')));

  const calculatedArea = useMemo(() => calculateArea(), [calculateArea]);
  const adjustedArea = useMemo(() => formData.outer === 'Yes' ? calculatedArea * 0.8 : calculatedArea, [formData.outer, calculatedArea]);

  const totalAreaValue = useMemo(() => calculateTotal(
    calculatedArea,
    parseInt(formData.roomCount) || 1,
    currentRoomOffsets,
    formData.outer
  ), [calculateTotal, calculatedArea, formData.roomCount, currentRoomOffsets, formData.outer]);

  const isOpenSpace = isRecordOpenPlot(floorData);

  return (
    <div className="relative z-30 mb-2 overflow-visible rounded-lg border border-gray-300 shadow-lg animate-fade-slide-up">
      <div className="w-full overflow-visible rounded-b-lg">
        <div className="min-w-[800px]">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-sm">
            <div className="flex w-full gap-0 bg-blue-600/10 py-2 text-center text-xs font-bold uppercase tracking-wider">
              {/* Table Headers */}
              <div className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20" style={{ width: COLUMN_WIDTHS.roomNo }}>
                {isUtilityCategory ? t('roomSubmission.table.utilityRoomNo') : t('roomSubmission.table.roomNo')}
              </div>
              {!isOpenSpace && (
                <div className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20" style={{ width: COLUMN_WIDTHS.roomType }}>
                  {isUtilityCategory ? t('roomSubmission.table.utilityRoomType') : t('roomSubmission.table.roomType')}
                </div>
              )}
              <div className="flex items-center justify-center flex-1 min-w-[120px] px-2 font-semibold border-r border-white/20">
                {t('roomSubmission.table.shape')}
              </div>
              <div className="flex flex-col items-center justify-center flex-shrink-0 px-2 font-semibold leading-tight border-r border-white/20" style={{ width: COLUMN_WIDTHS.area }}>
                {t('roomSubmission.table.area')} <span className="text-[10px] uppercase opacity-80">({areaUnit})</span>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20" style={{ width: COLUMN_WIDTHS.roomCount }}>
                {isUtilityCategory ? "COUNT" : t('roomSubmission.table.roomCount')}
              </div>
              <div className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20" style={{ width: COLUMN_WIDTHS.offset }}>
                {t('roomSubmission.table.offset')}
              </div>
              {!isOpenSpace && (
                <div className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20" style={{ width: COLUMN_WIDTHS.outer }}>
                  {t('roomSubmission.table.outer')}
                </div>
              )}
              <div className="flex flex-col items-center justify-center flex-shrink-0 px-2 font-semibold leading-tight border-r border-white/20" style={{ width: COLUMN_WIDTHS.total }}>
                {t('roomSubmission.table.total')} <span className="text-[10px] uppercase opacity-80">({areaUnit})</span>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 px-2 font-semibold" style={{ width: COLUMN_WIDTHS.action }}>
                {t('roomSubmission.table.action')}
              </div>
            </div>
          </div>
        </div>

        <div className="items-start w-full p-2 bg-white border-t border-gray-200">
          <div className="flex gap-0">
            <RoomTypeShapeFields
              formData={formData}
              handleInputChange={handleInputChange}
              isEditMode={isInputEnabled}
              validationErrors={validationErrors}
              focusRefs={focusRefs!}
              t={t}
              roomTypeData={roomTypeData}
              isUtilityCategory={isUtilityCategory}
              floorData={floorData}
            />

            <DimensionAreaFields
              formData={formData}
              handleInputChange={handleInputChange}
              isEditMode={isInputEnabled}
              validationErrors={validationErrors}
              focusRefs={focusRefs!}
              t={t}
              areaUnit={areaUnit}
              calculatedArea={calculatedArea}
              adjustedArea={adjustedArea}
              isUtilityCategory={isUtilityCategory}
            />

            <OffsetOuterFields
              formData={formData}
              handleInputChange={handleInputChange}
              isEditMode={isInputEnabled}
              focusRefs={focusRefs!}
              t={t}
              offsetModalOpen={Boolean(offsetModalOpen)}
              setOffsetModalOpen={setOffsetModalOpen}
              setOffsetList={setOffsetList}
              setOffsetData={setOffsetData}
              setSelectedOperation={setSelectedOperation}
              setSelectedShape={setSelectedShape}
              currentRoomOffsets={currentRoomOffsets}
              setCurrentRoomOffsets={setCurrentRoomOffsets}
              calculatedArea={calculatedArea}
              floorData={floorData}
            />

            <TotalActionFields
              isEditMode={isInputEnabled}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              t={t as any}
              totalAreaValue={totalAreaValue}
              isActualUpdate={isActualUpdate}
              handleUpdateRoom={handleUpdateRoom}
              handleAddRoom={handleAddRoom}
              maxRooms={maxRooms}
              availableRooms={availableRooms}
              rooms={rooms}
              isUtilityCategory={isUtilityCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
