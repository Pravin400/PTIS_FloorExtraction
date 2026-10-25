import React from 'react';
import { Input, SearchSelect } from '@/components/common';
import { COLUMN_WIDTHS } from '../../RoomTableConfig';
import { RoomFormData } from '@/types/common-details.types';
import { RoomTypeResponse } from '@/types/room-details.types';
import { RoomTypeSelect } from '../RoomTypeSelect';
import { isRecordOpenPlot } from '@/hooks/ptis/floorSubmission/useFloorAreaValidation';

interface RoomTypeShapeFieldsProps {
  formData: RoomFormData;
  handleInputChange: (field: string, value: string) => void;
  isEditMode: boolean;
  validationErrors: Record<string, string>;
  focusRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  t: (key: string) => string;
  roomTypeData?: RoomTypeResponse[];
  isUtilityCategory?: boolean;
}

export const RoomTypeShapeFields: React.FC<RoomTypeShapeFieldsProps & { floorData?: Record<string, unknown> }> = ({
  formData,
  handleInputChange,
  isEditMode,
  focusRefs,
  t,
  roomTypeData,
  isUtilityCategory: _isUtilityCategory,
  floorData,
}) => {
  const setRoomNoRef = (el: HTMLElement | null) => {
    if (focusRefs.current) {
      // eslint-disable-next-line react-hooks/immutability
      focusRefs.current['roomNo'] = el;
    }
  };

  const isOpenSpace = isRecordOpenPlot(floorData);

  return (
    <>
      {/* Room No */}
      <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.roomNo }}>
        <Input
          ref={setRoomNoRef}
          id="room-no-input"
          type="text"
          fullWidth
          value={formData.roomNo}
          maxLength={2}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            let value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
            if (value && (value === '0' || parseFloat(value) < 1)) value = '';
            handleInputChange('roomNo', value);
          }}
          readOnly={true}
          className="text-center h-[40px] bg-gray-100 text-gray-900 font-bold cursor-not-allowed outline-none select-none"
          placeholder={t('roomSubmission.input.placeholders.auto')}
          error={undefined}
        />
      </div>

      {/* Room Type */}
      {!isOpenSpace && (
        <div className="flex flex-col justify-center flex-shrink-0 px-1" style={{ width: COLUMN_WIDTHS.roomType }}>
          <RoomTypeSelect
            value={formData.utilities}
            roomTypeData={roomTypeData}
            onChange={(value, id) => {
              handleInputChange('utilities', value);
              if (id) {
                handleInputChange('roomTypeId', String(id));
              } else {
                handleInputChange('roomTypeId', '');
              }
              setTimeout(() => { focusRefs?.current['shape']?.focus(); (focusRefs?.current['shape'] as HTMLElement)?.click(); }, 100);
            }}
            disabled={!isEditMode}
            className="w-full h-[40px]"
          />
        </div>
      )}

      <div
        className="flex flex-col justify-center flex-1 min-w-[120px] px-1"
        style={{ minWidth: '110px' }}
        onKeyDownCapture={(e) => {
          if (e.key === 'Tab' && !e.shiftKey) {
            const selectBtn = e.currentTarget.querySelector('input[role="combobox"]');
            if (document.activeElement === selectBtn) {
              const hasShape = formData.shape && formData.shape !== '-Select-';
              if (hasShape) {
                e.preventDefault();
                setTimeout(() => {
                  const targetInput = (document.querySelector('[id^="param-"]') as HTMLInputElement | null)
                    || (focusRefs?.current?.['roomCount'] as HTMLInputElement | null);
                  if (targetInput) {
                    targetInput.focus();
                    if (typeof targetInput.select === 'function') targetInput.select();
                  }
                }, 100);
              }
            }
          }
        }}
      >
        <SearchSelect
          id="room-shape-select"
          name="shape"
          options={[
            { label: t('roomSubmission.input.shapes.select'), value: '-Select-' },
            { label: t('roomSubmission.input.shapes.rectangle'), value: 'Rectangle' },
            { label: t('roomSubmission.input.shapes.square'), value: 'Square' },
            { label: t('roomSubmission.input.shapes.triangle'), value: 'Triangle' },
            { label: t('roomSubmission.input.shapes.trapezoid'), value: 'Trapezoid' },
            { label: t('roomSubmission.input.shapes.circle'), value: 'Circle' },
            { label: t('roomSubmission.input.shapes.semiCircle'), value: 'Semi Circle' },
            { label: t('roomSubmission.input.shapes.quarterCircle'), value: 'Quarter Circle' },
          ]}
          value={formData.shape || '-Select-'}
          onChange={(_, value) => {
            handleInputChange('shape', value);
            const hasNewShape = value && value !== '-Select-';
            if (hasNewShape) {
              setTimeout(() => {
                const targetInput = (document.querySelector('[id^="param-"]') as HTMLInputElement | null)
                  || (focusRefs?.current?.['roomCount'] as HTMLInputElement | null);
                if (targetInput) {
                  targetInput.focus();
                  if (typeof targetInput.select === 'function') targetInput.select();
                }
              }, 100);
            } else {
              setTimeout(() => {
                const roomCountInput = focusRefs?.current?.['roomCount'] as HTMLInputElement | null;
                if (roomCountInput) {
                  roomCountInput.focus();
                  roomCountInput.select();
                }
              }, 100);
            }
          }}
          disabled={!isEditMode}
          required={isEditMode}
          error={undefined}
          className="w-full h-[40px]"
          disableSearch={true}
        />
      </div>
    </>
  );
};
