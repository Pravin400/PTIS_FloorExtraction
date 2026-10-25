'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { InputBoxProps } from '@/types/room-details.types';
import { COLUMN_WIDTHS } from '../../QuickDataEntry/floorSubmission/RoomSubmission/RoomTableConfig';

// Apartment QC sub-components — all have disabled={false}, no isEditMode restrictions
import { RoomTypeShapeFields } from './components/roomInputBox/RoomTypeShapeFields';
import { DimensionAreaFields } from './components/roomInputBox/DimensionAreaFields';
import { OffsetOuterFields } from './components/roomInputBox/OffsetOuterFields';
import { TotalActionFields } from './components/roomInputBox/TotalActionFields';

/**
 * Apartment QC InputBox.
 *
 * Drop-in replacement for the QuickDataEntry InputBox. The key difference:
 * apartment QC sub-components have `disabled={false}` for ALL fields and
 * deliberately ignore `isEditMode`, so the form is always interactive
 * regardless of whether the drawer is in add-mode or edit-mode.
 *
 * `isActualUpdate` drives the ADD ↔ UPDATE button label:
 *   - ADD  when isEditMode=false  (no row selected — user is adding a new room)
 *   - UPDATE when isEditMode=true and the selected room already has area or a DB id
 */
export const ApartmentQCInputBox: React.FC<
  InputBoxProps & {
    focusRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
    setSelectedShape: (shape: string) => void;
  }
> = ({
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
}) => {
    const tRaw = useTranslations('quickDataEntry');
    // Narrow the translator to the simpler signature expected by sub-components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (key: string, options?: Record<string, unknown>) => tRaw(key as any, options as any);

    // Show UPDATE when a row is selected for editing, even if it's an empty/placeholder row.
    const isActualUpdate = Boolean(
      isEditMode &&
      editingIndex !== null &&
      editingIndex !== undefined &&
      rooms[editingIndex]
    );

    const calculatedArea = useMemo(() => calculateArea(), [calculateArea]);
    const adjustedArea = useMemo(
      () => (formData.outer === 'Yes' ? calculatedArea * 0.8 : calculatedArea),
      [formData.outer, calculatedArea]
    );
    const totalAreaValue = useMemo(
      () =>
        calculateTotal(
          adjustedArea,
          parseInt(formData.roomCount) || 1,
          currentRoomOffsets
        ),
      [calculateTotal, adjustedArea, formData.roomCount, currentRoomOffsets]
    );

    return (
      <div className="relative z-30 mb-2 overflow-visible rounded-lg border border-gray-300 shadow-lg animate-fade-slide-up">
        <div className="w-full overflow-visible rounded-b-lg">
          <div className="min-w-[800px]">
            {/* Column header row — same blue gradient as QuickDataEntry */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-sm">
              <div className="flex w-full gap-0 bg-blue-600/10 py-2 text-center text-xs font-bold uppercase tracking-wider">
                <div
                  className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.roomNo }}
                >
                  {t('roomSubmission.table.roomNo')}
                </div>
                <div
                  className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.roomType }}
                >
                  {t('roomSubmission.table.roomType')}
                </div>
                <div
                  className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.shape }}
                >
                  {t('roomSubmission.table.shape')}
                </div>
                <div
                  className="flex flex-col items-center justify-center flex-shrink-0 px-2 font-semibold leading-tight border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.area }}
                >
                  {t('roomSubmission.table.area')}
                  <span className="text-[10px] uppercase opacity-80">
                    ({areaUnit})
                  </span>
                </div>
                <div
                  className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.roomCount }}
                >
                  {t('roomSubmission.table.roomCount')}
                </div>
                <div
                  className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.offset }}
                >
                  {t('roomSubmission.table.offset')}
                </div>
                <div
                  className="flex items-center justify-center flex-shrink-0 px-2 font-semibold border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.outer }}
                >
                  {t('roomSubmission.table.outer')}
                </div>
                <div
                  className="flex flex-col items-center justify-center flex-shrink-0 px-2 font-semibold leading-tight border-r border-white/20"
                  style={{ width: COLUMN_WIDTHS.total }}
                >
                  {t('roomSubmission.table.total')}
                  <span className="text-[10px] uppercase opacity-80">
                    ({areaUnit})
                  </span>
                </div>
                <div
                  className="flex items-center justify-center flex-shrink-0 px-2 font-semibold"
                  style={{ width: COLUMN_WIDTHS.action }}
                >
                  {t('roomSubmission.table.action')}
                </div>
              </div>
            </div>
          </div>

          {/* Form inputs row — apartment QC components, always editable */}
          <div className="items-start w-full p-2 bg-white border-t border-gray-200">
            <div className="flex gap-0">
              {/* Room No + Room Type + Shape */}
              <RoomTypeShapeFields
                formData={formData}
                handleInputChange={handleInputChange}
                isEditMode={isEditMode}
                validationErrors={validationErrors}
                focusRefs={focusRefs}
                t={t}
              />

              {/* Area (editable when no shape) + Room Count */}
              <DimensionAreaFields
                formData={formData}
                handleInputChange={handleInputChange}
                isEditMode={isEditMode}
                validationErrors={validationErrors}
                focusRefs={focusRefs}
                t={t}
                areaUnit={areaUnit}
                calculatedArea={calculatedArea}
                adjustedArea={adjustedArea}
              />

              {/* Offset + Outer */}
              <OffsetOuterFields
                formData={formData}
                handleInputChange={handleInputChange}
                isEditMode={isEditMode}
                focusRefs={focusRefs}
                t={t}
                offsetModalOpen={offsetModalOpen ?? false}
                setOffsetModalOpen={setOffsetModalOpen}
                setOffsetList={setOffsetList}
                setOffsetData={setOffsetData}
                setSelectedOperation={setSelectedOperation}
                setSelectedShape={setSelectedShape}
                currentRoomOffsets={currentRoomOffsets}
                setCurrentRoomOffsets={setCurrentRoomOffsets}
                calculatedArea={calculatedArea}
              />

              {/* Total (computed) + ADD / UPDATE button */}
              <TotalActionFields
                isEditMode={isEditMode}
                t={t}
                totalAreaValue={totalAreaValue}
                isActualUpdate={isActualUpdate}
                handleUpdateRoom={handleUpdateRoom}
                handleAddRoom={handleAddRoom}
                maxRooms={maxRooms ?? null}
                availableRooms={availableRooms ?? null}
                rooms={rooms}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };